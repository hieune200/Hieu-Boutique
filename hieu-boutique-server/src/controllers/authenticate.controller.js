import { ObjectId } from "mongodb"
import bcrypt from "bcrypt"

import { ensureConnected, getAccountsCollection, getProductsCollection, getCouponsCollection, getGuestOrdersCollection } from "../models/mongoClient.model.js"
import { userSchema } from "../models/mongoSchema.model.js"
import JWT from 'jsonwebtoken'
import { makeServerError, makeServerErrorDirect } from "../utils/errorHelper.js"
import { sendOrderConfirmationEmail, notifyAdminOfOrder } from "../utils/mailer.js"
import logger from "../utils/logger.js"

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);


async function registerNewUser (req, res, next) {
    try{
        await ensureConnected()
        const accountsCollection = getAccountsCollection()
        if (!accountsCollection) throw new Error('Accounts collection unavailable')
        let data = req.body
        if (await accountsCollection.findOne({username: data.username})) {
            req.data = {
                status: "409",
                message: "Tên đăng nhập đã tồn tại"
            }
            next()
        }
        userSchema.username = data.username
        userSchema.password = bcrypt.hashSync(data.password, salt)
        userSchema.birthday = data.birthday
        userSchema.email = data.email
        userSchema.phoneNumber = data.phoneNumber
        userSchema.address = data.address
        userSchema.avatar = data.avatar || '/ava.svg'
        await accountsCollection.insertOne(userSchema)
        req.data = {
            status: "201",
            message: "Tài khoản đã được tạo thành công",
        }
    }
    catch(err){
        req.data = makeServerError(req, err)
    }
    next()
}

async function checkLogin (req, res, next){
    try{
        const username = req.body.username
        const password = req.body.password
        await ensureConnected()
        const accountsCollection = getAccountsCollection()
        if (!accountsCollection) throw new Error('Accounts collection unavailable')
        const getInfor = await accountsCollection.findOne({username: username})
        if (!getInfor){
            req.data = {
                status: "409",
                message: "Tên đăng nhập không tồn tại"
            }
            next()
        }
        if (bcrypt.compareSync(password, getInfor.password)){
            // sign token with user id and username
            const token = JWT.sign({ id: getInfor._id.toString(), username: getInfor.username }, JWT_SECRET, { expiresIn: '7d' })
            req.data = {
                status: "201",
                message: "Đăng nhập thành công",
                ObjectId: getInfor._id,
                token
            }
            next()
            return
        }
        req.data = {
            status: "409",
            message: "Mật khẩu không đúng"
        }
        next()
    }
    catch(err){
        req.data = makeServerError(req, err)
        next()
    }
}

async function getUserInfor (req, res, next){
    try{
        const id = req.params.id
        await ensureConnected()
        const accountsCollection = getAccountsCollection()
        if (!accountsCollection) throw new Error('Accounts collection unavailable')
        const getInfor = await accountsCollection.findOne({_id: new ObjectId(id)})
        let data = {
            username: getInfor?.username,
            name: getInfor?.name,
            birthday: getInfor?.birthday,
            email: getInfor?.email,
            phoneNumber: getInfor?.phoneNumber,
            address: getInfor?.address,
            sex: getInfor?.sex,
            avatar: getInfor?.avatar || '/ava.svg',
            usedCoupons: Array.isArray(getInfor?.usedCoupons) ? getInfor.usedCoupons : []
        }
        req.data = {
            status: "201",
            message: "Lấy thông tin người dùng thành công",
            data: data
        }
    }
    catch(err){
        req.data = makeServerError(req, err)
    }
    next()
}

async function updateUserInfor (req, res, next){
    try{
        const newInfor = new Object(req.body)
        const filter = {username: newInfor.username}
        delete newInfor.username
        const updateDoc = {
            $set: {
                ...newInfor
            }
        }
        await ensureConnected()
        const accountsCollection = getAccountsCollection()
        if (!accountsCollection) throw new Error('Accounts collection unavailable')
        let dbres = await accountsCollection.updateOne(filter, updateDoc)
        if (dbres.matchedCount == 0){
            req.data = {
                status : "409",
                message: "Cập nhập thông tin người dùng không thành công"
            }
            next()
        }
        req.data = {
            status : "201",
            message: "Cập nhập thông tin người dùng thành công"
        }
    }
    catch(err){
        req.data = makeServerError(req, err)
    }
    next()
}

async function addNewOrder (req, res, next){
    try{
        const rawId = req.headers['user-id']
        let id = null
        if (rawId){
            try{ id = new ObjectId(rawId) }catch(e){ id = null }
        }
        const data = req.body
        await ensureConnected()
        const accountsCollection = getAccountsCollection()
        if (!accountsCollection) throw new Error('Accounts collection unavailable')
        // ensure product stock and decrement warehouse accordingly
        const productsCollection = getProductsCollection()
        const couponsCollection = getCouponsCollection && getCouponsCollection()
        const guestOrdersCollection = getGuestOrdersCollection && getGuestOrdersCollection()

        // orderList expected: [{ id, quantity, ... }, ...]
        const items = Array.isArray(data.orderList) ? data.orderList : []

        if (!productsCollection) throw new Error('Products collection unavailable')

        // gather product ids
        const ids = items.map(it => {
            try{ return new ObjectId(String(it.id)) }catch(e){ return null }
        }).filter(Boolean)

        // fetch products to ensure they exist (do not rely on their warehouse field here)
        const products = await productsCollection.find({ _id: { $in: ids } }).toArray()
        const prodMap = {}
        products.forEach(p => { prodMap[p._id.toString()] = p })

        // basic validation: quantities and existence only
        for (const it of items){
            const pid = String(it.id || '')
            const qty = Math.max(0, Number(it.quantity) || 0)
            if (qty <= 0) {
                req.data = { status: '400', message: 'Số lượng sản phẩm không hợp lệ' }
                return next()
            }
            const prod = prodMap[pid]
            if (!prod){
                req.data = { status: '404', message: `Sản phẩm không tồn tại: ${pid}` }
                return next()
            }
        }

        // All items available, perform atomic updates per product
        const updates = []
        try{
            for (const it of items){
                const pid = String(it.id)
                const qty = Math.max(0, Number(it.quantity) || 0)

                // Retry a few times in case of transient race conditions
                let attempts = 0
                const maxAttempts = 3
                let success = false
                let lastUpd = null

                while (attempts < maxAttempts && !success) {
                    try {
                        // use updateOne for atomic check+decrement (compatible with driver versions)
                        lastUpd = await productsCollection.updateOne(
                            { _id: new ObjectId(pid), warehouse: { $gte: qty } },
                            { $inc: { warehouse: -qty, sold: qty } }
                        )
                    } catch (e) {
                        // unexpected DB error
                        logger.error('findOneAndUpdate failed', { err: e && (e.message || e), pid, qty, attempt: attempts })
                        lastUpd = null
                    }

                    // for updateOne, check modifiedCount to determine success
                    if (lastUpd && (lastUpd.modifiedCount === 1 || lastUpd.matchedCount === 1 && lastUpd.modifiedCount === 1)) {
                        success = true
                        updates.push({ id: pid, qty })
                        break
                    }

                    // if update failed, check current warehouse to decide whether to retry
                    try {
                        const cur = await productsCollection.findOne({ _id: new ObjectId(pid) })
                        const curQty = Number(cur?.warehouse || 0)
                        if (cur == null) {
                            // product vanished while processing: rollback and error
                            for (const u of updates){ try{ await productsCollection.updateOne({ _id: new ObjectId(u.id) }, { $inc: { warehouse: u.qty, sold: -u.qty } }) }catch(e){} }
                            req.data = { status: '404', message: `Sản phẩm không tồn tại: ${pid}` }
                            return next()
                        }
                        // if available now, try again (transient), otherwise break and return out-of-stock
                        if (curQty >= qty) {
                            attempts++
                            logger.info('retrying atomic product update', { pid, qty, attempt: attempts })
                            // small backoff
                            await new Promise(r => setTimeout(r, 50))
                            continue
                        } else {
                            // not enough stock
                            for (const u of updates){ try{ await productsCollection.updateOne({ _id: new ObjectId(u.id) }, { $inc: { warehouse: u.qty, sold: -u.qty } }) }catch(e){} }
                            logger.warn('product out of stock during checkout processing', { pid, requested: qty, available: curQty })
                            req.data = { status: '409', message: 'Một số sản phẩm không đủ kho khi xử lý đơn hàng. Vui lòng thử lại.' }
                            return next()
                        }
                    } catch (e) {
                        // if checking fails, treat as transient and retry a bit
                        attempts++
                        logger.warn('failed to inspect product after failed update, retrying', { pid, err: e && (e.message || e), attempt: attempts })
                        await new Promise(r => setTimeout(r, 50))
                        continue
                    }
                }

                if (!success) {
                    // rollback previous successful updates
                    for (const u of updates){ try{ await productsCollection.updateOne({ _id: new ObjectId(u.id) }, { $inc: { warehouse: u.qty, sold: -u.qty } }) }catch(e){} }
                    logger.error('failed to reserve product after retries', { pid, qty, attempts: maxAttempts })
                    req.data = { status: '409', message: 'Một số sản phẩm không đủ kho khi xử lý đơn hàng. Vui lòng thử lại.' }
                    return next()
                }
            }
        } catch (prodErr) {
            // attempt rollback if any updates applied
            for (const u of updates) { try { await productsCollection.updateOne({ _id: new ObjectId(u.id) }, { $inc: { warehouse: u.qty, sold: -u.qty } }) } catch (e) { } }
            logger.error('product update error during checkout', { err: prodErr && (prodErr.message || prodErr), items })
            // fallback to guest order if possible
            try {
                if (guestOrdersCollection) {
                    await guestOrdersCollection.insertOne({ order: data, createdAt: new Date(), guestIdentifier: (data.shipping && data.shipping.email) ? data.shipping.email : null, errorFallback: true })
                    req.data = { status: '201', message: 'Thanh toán thành công (lưu trữ tạm do lỗi xử lý kho)' }
                    // try to notify customer/admin even in fallback path
                    try { const email = data.shipping && data.shipping.email; if (email) { sendOrderConfirmationEmail(email, data).catch(err => logger.error('sendOrderConfirmationEmail failed (fallback)', err)); notifyAdminOfOrder(data).catch(err => logger.error('notifyAdminOfOrder failed (fallback)', err)) } } catch (e) { logger.error('fallback email attempt failed', e) }
                    return next()
                }
            } catch (e) { /* ignore */ }
            return next(makeServerError(req, prodErr, 'product update error'))
        }

        // if a coupon code is included in the order payload, mark it used (defensive)
        if (data.couponCode && couponsCollection){
            try{
                const c = await couponsCollection.findOne({ code: { $regex: `^${String(data.couponCode)}$`, $options: 'i' } })
                if (c){
                    const usedByMarker = id ? id.toString() : `guest:${(data.shipping && data.shipping.email) ? data.shipping.email : Date.now()}`
                    // decrement remaining and add usedBy
                    await couponsCollection.updateOne({ _id: c._id }, { $inc: { remaining: -1 }, $addToSet: { usedBy: usedByMarker } })
                    // also add to user's usedCoupons if we have a logged-in user
                    if (id) await accountsCollection.updateOne({ _id: id }, { $addToSet: { usedCoupons: c.code } })
                }
            }catch(e){ console.error('coupon marking failed', e) }
        }

        // persist order: if user logged in, push into their account; otherwise create a placeholder account or save to guestOrders
        if (id){
            // attach userId to the saved order for clarity
            try{ data.userId = id.toString() }catch(e){}
            const bdres = await accountsCollection.findOneAndUpdate(
                { _id: id },
                { $push: { orders: data } },
                { returnDocument: 'after' }
            )
            if (bdres){
                // also push an in-app notification to the user
                try{
                    const note = {
                        type: 'order',
                        message: `Đơn hàng ${data.orderCode || ''} đã được đặt thành công`,
                        orderCode: data.orderCode || null,
                        read: false,
                        createdAt: new Date()
                    }
                    await accountsCollection.updateOne({ _id: id }, { $push: { notifications: note } })
                }catch(e){ console.error('failed to push notification to user', e) }
                // best-effort: send order confirmation email to customer and notify admin
                try{
                    const userDoc = bdres.value || await accountsCollection.findOne({_id: id})
                    const email = (userDoc && userDoc.email) ? userDoc.email : (data.shipping && data.shipping.email)
                    if (email){
                        sendOrderConfirmationEmail(email, data).catch(err => logger.error('sendOrderConfirmationEmail failed', err))
                        notifyAdminOfOrder(data).catch(err => logger.error('notifyAdminOfOrder failed', err))
                    }
                }catch(mailErr){ logger.error('order email attempt failed', mailErr) }

                req.data = {
                    status: "201",
                    message: "Thanh toán thành công",
                    ObjectId: id.toString()
                }
                return next()
            }
        } else {
            // Try creating a placeholder user account so order is attached to an account id
            try{
                const placeholder = {
                    username: `guest_${Date.now().toString().slice(-6)}`,
                    password: '',
                    name: data.shipping?.name || 'Khách vãng lai',
                    email: data.shipping?.email || '',
                    phoneNumber: data.shipping?.phoneNumber || '',
                    address: data.shipping?.address || '',
                    avatar: '/ava.svg',
                    orders: [ data ],
                    createdAt: new Date()
                }
                const insertRes = await accountsCollection.insertOne(placeholder)
                if (insertRes && insertRes.insertedId){
                    data.userId = insertRes.insertedId.toString()
                    try{
                        const email = data.shipping && data.shipping.email
                        if (email){ sendOrderConfirmationEmail(email, data).catch(err=> logger.error('sendOrderConfirmationEmail failed for placeholder', err)); notifyAdminOfOrder(data).catch(err=> logger.error('notifyAdminOfOrder failed', err)) }
                    }catch(e){ logger.error('placeholder email attempt failed', e) }
                    req.data = { status: '201', message: 'Thanh toán thành công (khách hàng tạm được tạo)', ObjectId: insertRes.insertedId.toString() }
                    return next()
                }
            }catch(e){ console.error('placeholder account create failed', e) }

            // fallback to guestOrders collection
            try{
                if (!guestOrdersCollection) throw new Error('Guest orders collection unavailable')
                await guestOrdersCollection.insertOne({ order: data, createdAt: new Date(), guestIdentifier: (data.shipping && data.shipping.email) ? data.shipping.email : null })
                try{ const email = data.shipping && data.shipping.email; if (email) { sendOrderConfirmationEmail(email, data).catch(err=> logger.error('sendOrderConfirmationEmail failed for guest', err)); notifyAdminOfOrder(data).catch(err=> logger.error('notifyAdminOfOrder failed', err)) } }catch(e){ logger.error('guest order email attempt failed', e) }
                req.data = { status: '201', message: 'Thanh toán thành công' }
                return next()
            }catch(e){ console.error('guest order persist failed', e) }
        }
    }
    catch(err){
        req.data = makeServerError(req, err, 'addNewOrder error')
    }
    next()
}

async function getOrderList (req, res, next){
    try{
        const id = req.params.id
        await ensureConnected()
        const accountsCollection = getAccountsCollection()
        if (!accountsCollection) throw new Error('Accounts collection unavailable')
        const data = await accountsCollection.find({_id: new ObjectId(id)}).project({_id: 0, orders: 1}).toArray().then(res => res[0].orders)
        req.data = {
            status: "201",
            message: "Lấy danh sách đơn hàng thành công",
            data: data
        }
    }
    catch(err){
        req.data = makeServerError(req, err)
    }
    next()
}

// exports consolidated at the end of this file
async function socialLogin (req, res, next) {
    try {
        const { provider, providerId, email, name, avatar } = req.body;
        if (!provider || !providerId) {
            req.data = { status: '400', message: 'Provider and providerId required' };
            return next();
        }
        await ensureConnected();
        const accountsCollection = getAccountsCollection();
        if (!accountsCollection) throw new Error('Accounts collection unavailable');

        // Try to find existing account by social id or email
        let account = await accountsCollection.findOne({ $or: [ { ['social.'+provider]: providerId }, { email } ] });
        if (!account) {
            // create new account
            const newUser = { ...userSchema };
            // generate a unique username
            const base = (name || email || 'user').toString().split('@')[0].replace(/[^a-zA-Z0-9]/g,'');
            const rand = Math.random().toString(36).slice(2,8);
            newUser.username = `${provider}_${base}_${rand}`;
            newUser.password = ''; // no password for social signups
            newUser.name = name || base;
            newUser.email = email || '';
            newUser.avatar = avatar || '/ava.svg';
            newUser.social = { [provider]: providerId };
            const insertRes = await accountsCollection.insertOne(newUser);
            account = await accountsCollection.findOne({ _id: insertRes.insertedId });
        }

        // sign token
        const token = JWT.sign({ id: account._id.toString(), username: account.username }, JWT_SECRET, { expiresIn: '7d' });
        req.data = {
            status: '201',
            message: 'Đăng nhập bằng social thành công',
            ObjectId: account._id,
            token
        };
    }
    catch (err) {
        req.data = makeServerError(req, err, 'socialLogin error')
    }
    next();
}

// exports consolidated at the end of this file

// OAuth helpers: redirect and callback
async function oauthRedirect (req, res, next) {
    try {
        const provider = req.params.provider;
        const clientHost = process.env.CLIENT_HOST || 'http://localhost:5173';
        if (provider === 'google') {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const redirectUri = `${process.env.SERVER_BASE_URL || 'http://localhost:3000'}/auth/oauth/google/callback`;
            if (clientId) {
                const scope = encodeURIComponent('openid profile email');
                const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
                return res.redirect(url);
            }
            // fallback: open Google sign-in page so user can enter credentials visually
            return res.redirect('https://accounts.google.com/signin');
        }
        if (provider === 'facebook' || provider === 'instagram') {
            // scaffold: require env vars FACEBOOK_CLIENT_ID / INSTAGRAM_CLIENT_ID
            const clientId = provider === 'facebook' ? process.env.FACEBOOK_CLIENT_ID : process.env.INSTAGRAM_CLIENT_ID;
            const redirectUri = `${process.env.SERVER_BASE_URL || 'http://localhost:3000'}/auth/oauth/${provider}/callback`;
            if (clientId) {
                // provider-specific auth endpoints differ; for now redirect user to provider auth URL
                const url = provider === 'facebook'
                    ? `https://www.facebook.com/v12.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile`
                    : `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code`;
                return res.redirect(url);
            }
            // fallback: open provider's login page so user can type credentials
            const fallback = provider === 'facebook' ? 'https://www.facebook.com/login.php' : 'https://www.instagram.com/accounts/login/';
            return res.redirect(fallback);
        }
        return res.status(404).send('Provider not supported');
    }
    catch (err) {
        return makeServerErrorDirect(res, req, err, 'oauthRedirect error')
    }
}

async function oauthCallback (req, res, next) {
    try {
        const provider = req.params.provider;
        const code = req.query.code;
        if (!code) return res.status(400).send('Missing code');
        // helper to exchange code and fetch profile
        let profile = null;
        if (provider === 'google') {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = `${process.env.SERVER_BASE_URL || 'http://localhost:3000'}/auth/oauth/google/callback`;
            if (!clientId || !clientSecret) return res.status(400).send('Google OAuth not configured');
            // exchange code for tokens
            const tokenRes = await (global.fetch || (await import('node-fetch')).default)(
                'https://oauth2.googleapis.com/token',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        code,
                        client_id: clientId,
                        client_secret: clientSecret,
                        redirect_uri: redirectUri,
                        grant_type: 'authorization_code'
                    })
                }
            ).then(r => r.json());
            if (tokenRes.error) {
                console.error('tokenRes error', tokenRes);
                return res.status(400).send('Token exchange failed');
            }
            const accessToken = tokenRes.access_token;
            // fetch userinfo
            profile = await (global.fetch || (await import('node-fetch')).default)('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            }).then(r => r.json());
            // profile contains sub (id), email, name, picture
        }
        else if (provider === 'facebook') {
            const clientId = process.env.FACEBOOK_CLIENT_ID;
            const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
            const redirectUri = `${process.env.SERVER_BASE_URL || 'http://localhost:3000'}/auth/oauth/facebook/callback`;
            if (!clientId || !clientSecret) return res.status(400).send('Facebook OAuth not configured');
            // exchange code for access token
            const tokenRes = await (global.fetch || (await import('node-fetch')).default)(
                `https://graph.facebook.com/v12.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${encodeURIComponent(code)}`
            ).then(r => r.json());
            if (tokenRes.error) { console.error('facebook token error', tokenRes); return res.status(400).send('Token exchange failed'); }
            const accessToken = tokenRes.access_token;
            // fetch basic profile
            profile = await (global.fetch || (await import('node-fetch')).default)(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`).then(r=>r.json());
        }
        else if (provider === 'instagram') {
            // Instagram Basic Display or Graph requires app review; scaffold only
            return res.status(400).send('Instagram OAuth not fully implemented. Configure credentials and implement token exchange.');
        }
        else {
            return res.status(404).send('Provider not supported');
        }

        // map profile to fields expected by socialLogin
        const providerId = profile.sub || profile.id || profile.id_str;
        const email = profile.email || '';
        const name = profile.name || profile.username || '';
        const avatar = (profile.picture && (profile.picture.data?.url || profile.picture)) || profile.picture || profile.pictureUrl || '';

        // We will NOT create or sign a token here yet. Instead return provider profile
        // so the client can ask the user to confirm linking the account.
        const payload = {
            provider,
            providerId,
            name: name || '',
            email: email || '',
            avatar: avatar || ''
        };
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Login success</title></head><body>
        <script>
            try {
                const data = ${JSON.stringify(payload)};
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(data, '${process.env.CLIENT_HOST || 'http://localhost:5173'}');
                    window.close();
                } else {
                    // fallback: redirect to client with profile in fragment
                    const redirect = '${process.env.CLIENT_HOST || 'http://localhost:5173'}/auth/social/callback#name=' + encodeURIComponent(data.name) + '&email=' + encodeURIComponent(data.email) + '&avatar=' + encodeURIComponent(data.avatar) + '&provider=' + encodeURIComponent(data.provider) + '&providerId=' + encodeURIComponent(data.providerId);
                    window.location.href = redirect;
                }
            } catch (e) { document.body.innerText = 'Login successful. You can close this window.' }
        </script>
        </body></html>`;
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    }
    catch (err) {
        return makeServerErrorDirect(res, req, err, 'oauthCallback error')
    }
}

export { registerNewUser, checkLogin, getUserInfor, updateUserInfor, addNewOrder, getOrderList, socialLogin, oauthRedirect, oauthCallback, createSocialPlaceholder, linkSocialAccount }

// Admin / utility endpoints
async function getGuestOrders(req, res, next){
    try{
        await ensureConnected()
        const guestOrdersCollection = getGuestOrdersCollection()
        if (!guestOrdersCollection) return res.status(503).json({ status: '503', message: 'Guest orders not available' })
        const list = await guestOrdersCollection.find({}).sort({ createdAt: -1 }).limit(500).toArray()
        return res.json({ status: '200', data: list })
    }catch(err){ return makeServerErrorDirect(res, req, err, 'getGuestOrders error') }
}

async function getNotifications(req, res, next){
    try{
        const id = req.params.id
        if (!id) return res.status(400).json({ status: '400', message: 'Missing user id' })
        await ensureConnected()
        const accountsCollection = getAccountsCollection()
        if (!accountsCollection) return res.status(503).json({ status: '503', message: 'Accounts service unavailable' })
        const acc = await accountsCollection.findOne({ _id: new ObjectId(id) }, { projection: { notifications: 1 } })
        return res.json({ status: '200', data: (acc && acc.notifications) ? acc.notifications : [] })
    }catch(err){ return makeServerErrorDirect(res, req, err, 'getNotifications error') }
}

async function markNotificationRead(req, res, next){
    try{
        const { userId, createdAt } = req.body || {}
        if (!userId || !createdAt) return res.status(400).json({ status: '400', message: 'Missing userId or createdAt' })
        await ensureConnected()
        const accountsCollection = getAccountsCollection()
        const filter = { _id: new ObjectId(userId), 'notifications.createdAt': new Date(createdAt) }
        const upd = { $set: { 'notifications.$.read': true } }
        const r = await accountsCollection.updateOne(filter, upd)
        if (r && r.matchedCount) return res.json({ status: '200', message: 'Marked read' })
        return res.status(404).json({ status: '404', message: 'Notification not found' })
    }catch(err){ return makeServerErrorDirect(res, req, err, 'markNotificationRead error') }
}

export { getGuestOrders, getNotifications, markNotificationRead }

async function createSocialPlaceholder(req, res, next) {
    try {
        const { provider, email, name, avatar } = req.body || {}
        await ensureConnected()
        const accountsCollection = getAccountsCollection()
        if (!accountsCollection) throw new Error('Accounts collection unavailable')

        // generate unique username
        const base = (name || email || 'user').toString().split('@')[0].replace(/[^a-zA-Z0-9]/g,'')
        const rand = Math.random().toString(36).slice(2,8)
        const newUser = { ...userSchema }
        newUser.username = `${provider || 'guest'}_${base}_${rand}`
        newUser.password = ''
        newUser.name = name || ''
        newUser.email = email || ''
        newUser.avatar = avatar || '/ava.svg'
        if (provider) newUser.social = { [provider]: `placeholder_${Date.now()}` }

        const insertRes = await accountsCollection.insertOne(newUser)
        const account = await accountsCollection.findOne({ _id: insertRes.insertedId })

        const token = JWT.sign({ id: account._id.toString(), username: account.username }, JWT_SECRET, { expiresIn: '7d' })

        req.data = {
            status: '201',
            message: 'Placeholder account created',
            ObjectId: account._id,
            token
        }
    } catch (err) {
        req.data = makeServerError(req, err, 'createSocialPlaceholder error')
    }
    next()
}

// Link a social provider id to an existing user (used for simulation/testing)
async function linkSocialAccount(req, res, next) {
    try {
        const { userId, provider, providerId, email, name, avatar } = req.body || {}
        if (!userId || !provider || !providerId) {
            req.data = { status: '400', message: 'userId, provider and providerId required' }
            next()
            return
        }
        await ensureConnected()
        const accountsCollection = getAccountsCollection()
        const filter = { _id: new ObjectId(userId) }
        const update = { $set: { [`social.${provider}`]: providerId } }
        if (email) update.$set.email = email
        if (name) update.$set.name = name
        if (avatar) update.$set.avatar = avatar

        const dbres = await accountsCollection.updateOne(filter, update)
        if (dbres.matchedCount === 0) {
            req.data = { status: '404', message: 'User not found' }
            next()
            return
        }
        const account = await accountsCollection.findOne(filter)
        const token = JWT.sign({ id: account._id.toString(), username: account.username }, JWT_SECRET, { expiresIn: '7d' })
        req.data = { status: '201', message: 'Linked social account', ObjectId: account._id, token }
    } catch (err) {
        req.data = makeServerError(req, err, 'linkSocialAccount error')
    }
    next()
}