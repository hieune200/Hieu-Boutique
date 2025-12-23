import { ObjectId } from "mongodb"
import crypto from 'crypto'
import { ensureConnected, getProductsCollection, getHotProductsCollection, getCollectionsCollection, getAccountsCollection } from "../models/mongoClient.model.js"
import { makeServerError } from "../utils/errorHelper.js"

// Local fallback data used when MongoDB collections are unavailable.
function makeFallbackIds(prefix = 'fallback-p', count = 12){
    return Array.from({length: count}).map((_,i)=> `${prefix}-${i+1}`)
}

function makeFallbackProduct(id){
    return {
        _id: id,
        title: 'Sample Fallback Product',
        img: [],
        price: 199000,
        warehouse: 20,
        sold: 0,
        category: 'all'
    }
}
// Helper: compute aggregates (counts, average, ratingCount, hasImagesCount) from reviews array
function computeReviewAggregates(reviews){
    const arr = Array.isArray(reviews) ? reviews : []
    const counts = { _1:0,_2:0,_3:0,_4:0,_5:0 }
    let total = 0
    let hasImagesCount = 0
    arr.forEach(r => {
        const rt = Number(r.rating) || 0
        if (rt >=1 && rt <=5) counts[`_${rt}`] = (counts[`_${rt}`] || 0) + 1
        if (Array.isArray(r.images) && r.images.length) hasImagesCount++
        total += rt
    })
    const ratingCount = arr.length
    const ratingAverage = ratingCount ? Math.round((total / ratingCount) * 10) / 10 : 5
    return { ratingCount, ratingAverage, hasImagesCount, _1Count: counts._1, _2Count: counts._2, _3Count: counts._3, _4Count: counts._4, _5Count: counts._5 }
}

// generate a short product code (masanpham) for DB records (crypto-based)
function generateMasanpham(prefix = 'HB'){
        try{
                const code = crypto.randomBytes(4).toString('hex').toUpperCase()
                return `${prefix}-${code}`
        }catch(e){
                try{ return `${prefix}-${new ObjectId().toString().slice(0,8).toUpperCase()}` }catch(err){ return `${prefix}-${Date.now().toString().slice(-8)}` }
        }
}

async function productListID (req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        const category = req.params.category
            // Build filter from query params (price, discount, colors, size, material)
            const q = req.query || {}
            const filter = {}
            if (category !== 'all') filter.category = category

            // price range: priceMin, priceMax
            const priceMin = Number(q.priceMin) || null
            const priceMax = Number(q.priceMax) || null
            if (priceMin !== null && !isNaN(priceMin)) filter.price = Object.assign({}, filter.price, { $gte: priceMin })
            if (priceMax !== null && !isNaN(priceMax)) filter.price = Object.assign({}, filter.price, { $lte: priceMax })

            // discount: discountMin, discountMax (assumes product.discount is a number 0-100)
            const discountMin = Number(q.discountMin) || null
            const discountMax = Number(q.discountMax) || null
            if (discountMin !== null && !isNaN(discountMin)) {
                // support discount field OR implicit discount computed from oldPrice vs price
                // use $or so documents with a numeric `discount` or those with oldPrice>price meeting the percent threshold match
                filter.$or = filter.$or || []
                filter.$or.push({ discount: { $gte: discountMin } })
                // $expr to compute percentage = ((oldPrice - price) / oldPrice) * 100
                filter.$or.push({ $expr: { $gte: [ { $multiply: [ { $cond: [ { $and: [ { $gt: ["$oldPrice", 0] }, { $gt: ["$price", 0] } ] }, { $multiply: [ { $divide: [ { $subtract: ["$oldPrice", "$price"] }, "$oldPrice" ] }, 100 ] }, 0 ] }, 1 ] }, discountMin ] } })
            }
            if (discountMax !== null && !isNaN(discountMax)) filter.discount = Object.assign({}, filter.discount, { $lte: discountMax })

            // colors: comma separated list -> match any
            if (q.colors){
                const colors = String(q.colors).split(',').map(s=> s.trim()).filter(Boolean)
                if (colors.length) filter.colors = { $in: colors }
            }

            // size: comma separated list -> match any
            if (q.sizes){
                const sizes = String(q.sizes).split(',').map(s=> s.trim()).filter(Boolean)
                if (sizes.length) filter.size = { $in: sizes }
            }

            // material: single or comma separated
            if (q.materials){
                const materials = String(q.materials).split(',').map(s=> s.trim()).filter(Boolean)
                if (materials.length) filter.material = { $in: materials }
            }

            // collections: comma separated (product.collections array contains values)
            if (q.collections){
                const cols = String(q.collections).split(',').map(s=> s.trim()).filter(Boolean)
                if (cols.length) filter.collections = { $in: cols }
            }

            // perform query with optional pagination
            let cursor = productsCollection.find(filter).project({_id: 1})
            const page = Math.max(1, Number(req.query.page) || 1)
            const limit = Math.max(1, Number(req.query.limit) || 24)
            const skip = (page - 1) * limit
            // if no filters and category === 'all' and client did not request page, cap results
            if (category === 'all' && Object.keys(req.query || {}).length === 0) {
                cursor = cursor.limit(200)
            } else {
                cursor = cursor.skip(skip).limit(limit)
            }
            // compute total matching documents for pagination metadata
            const total = await productsCollection.countDocuments(filter)
            const list = await cursor.toArray().then(res => res.map((product)=> product._id.toString()))
            const totalPages = Math.max(1, Math.ceil(total / limit))
            const data = {
                page,
                limit,
                total,
                totalPages,
                items: list
            }
        req.data = {
            status: "201",
            message: "Lấy danh sách sản phẩm thành công",
            data: data
        }
    } 
    catch(err){
        // If DB unavailable, provide a lightweight fallback so frontend can render.
        if (String(err && err.message || '').toLowerCase().includes('products collection unavailable')){
            const page = Math.max(1, Number(req.query.page) || 1)
            const limit = Math.max(1, Number(req.query.limit) || 24)
            const all = makeFallbackIds('fallback', 48)
            const skip = (page - 1) * limit
            const items = all.slice(skip, skip + limit)
            const total = all.length
            const totalPages = Math.max(1, Math.ceil(total / limit))
            req.data = { status: '201', message: 'Fallback products (DB unavailable)', data: { page, limit, total, totalPages, items } }
        } else {
            req.data = makeServerError(req, err)
        }
    }
    next()
}

async function productNewListID (req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        let quan = await productsCollection.find({category: "quan"}).limit(3).project({_id: 1}).toArray()
        let ao = await productsCollection.find({category: "ao"}).limit(3).project({_id: 1}).toArray()
        let dam = await productsCollection.find({category: "dam"}).limit(3).project({_id: 1}).toArray()
        let phukien = await productsCollection.find({category: "phukien"}).limit(3).project({_id: 1}).toArray()
        let chanvay = await productsCollection.find({category: "chanvay"}).limit(3).project({_id: 1}).toArray()
        let data = [quan.map(item=> item._id.toString()), ao.map(item=> item._id.toString()), dam.map(item=> item._id.toString()), phukien.map(item=> item._id.toString()), chanvay.map(item=> item._id.toString())]
        req.data = {
            status: "201",
            message: "Lấy danh sách sản phẩm mới thành công",
            data: data
        }
    } 
    catch(err){
        if (String(err && err.message || '').toLowerCase().includes('products collection unavailable')){
            req.data = { status: '201', message: 'Fallback new product groups', data: [makeFallbackIds('quan',3), makeFallbackIds('ao',3), makeFallbackIds('dam',3), makeFallbackIds('phukien',3), makeFallbackIds('chanvay',3)] }
        } else {
            req.data = makeServerError(req, err)
        }
    }
    next()
}

async function productDetail (req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        const id = req.params.id
        let data = await productsCollection.findOne({_id: new ObjectId(id)})
        if (data && data._id) data._id = data._id.toString()
        req.data = {
            status: "201",
            message: "Lấy chi tiết sản phẩm thành công",
            data: data
        }
    }
    catch(err){
        if (String(err && err.message || '').toLowerCase().includes('products collection unavailable')){
            req.data = { status: '201', message: 'Fallback product detail', data: makeFallbackProduct(req.params.id || 'fallback-1') }
        } else {
            req.data = makeServerError(req, err)
        }
    }
    next()
}

async function suggestListID (req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        const category = req.params.category
        const id = req.params.id
        let ProductList = await productsCollection.find({category: category}).project({_id: 1}).toArray()
        let data = []
        // compare string ids
        let index = ProductList.findIndex(product => product._id.toString() == id)
        while (data.length < 4){
            if (index == ProductList.length - 1) index = 0
            else index++
            data.push(ProductList[index]._id)
        }
        req.data = {
            status: "201",
            message: "Lấy danh sách gợi ý thành công",
            data: data
        }
    }
    catch(err){
        if (String(err && err.message || '').toLowerCase().includes('products collection unavailable')){
            req.data = { status: '201', message: 'Fallback suggest list', data: makeFallbackIds('suggest',4) }
        } else {
            req.data = makeServerError(req, err)
        }
    }
    next()
}

async function hotProductListID (req, res, next){
    try{
        await ensureConnected()
        const hotProductsCollection = getHotProductsCollection()
        if (!hotProductsCollection) throw new Error('HotProducts collection unavailable')
        let data = await hotProductsCollection.find({}).toArray()
        let idList = data.map((product)=> product.productId.toString())
        req.data = {
            status: "201",
            message: "Lấy danh sách sản phẩm hot thành công",
            data: idList
        }
    }
    catch(err){
        if (String(err && err.message || '').toLowerCase().includes('hotproducts collection unavailable')){
            req.data = { status: '201', message: 'Fallback hot products', data: makeFallbackIds('hot',8) }
        } else if (String(err && err.message || '').toLowerCase().includes('products collection unavailable')){
            req.data = { status: '201', message: 'Fallback hot products from products', data: makeFallbackIds('hot',8) }
        } else {
            req.data = makeServerError(req, err)
        }
    }
    next()
}

async function searchListID(req,res,next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        let keyword = req.params.keyword || ''
        keyword = String(keyword).trim()
        // if keyword is empty return empty array to avoid returning all products
        if (!keyword) {
            req.data = {
                status: "200",
                message: "No keyword provided",
                data: []
            }
            return next()
        }
        // escape regex special characters to prevent accidental regex injection
        const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')
        const re = new RegExp(escapeRegex(keyword), 'i')
        let data = await productsCollection
                        .find({ title: { $regex: re } })
                        .project({
                            _id: 1, 
                            category: 1, 
                            title: 1, 
                            warehouse: 1, 
                            sold: 1,
                            "img": {"$slice": [0, 1]}})
                        .toArray()
        // convert ObjectId to string for JSON compatibility
        data = data.map(d => ({...d, _id: d._id.toString()}))
        req.data = {
            status: "201",
            message: "Lấy danh sách sản phẩm tìm kiếm thành công",
            data: data
        }
    }
    catch(err){
        if (String(err && err.message || '').toLowerCase().includes('products collection unavailable')){
            req.data = { status: '201', message: 'Fallback search results', data: [] }
        } else {
            req.data = makeServerError(req, err)
        }
    }
    next()
}

async function collectionProductsID(req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        const slug = req.params.slug
        // find products that contain this collection slug in their `collections` array
        let list = await productsCollection.find({ collections: slug }).project({_id: 1}).toArray()
        const data = list.map(p => p._id.toString())
        req.data = {
            status: "201",
            message: "Lấy danh sách sản phẩm theo bộ sưu tập thành công",
            data: data
        }
    }
    catch(err){
        console.error('collectionProductsID error', err)
        if (String(err && err.message || '').toLowerCase().includes('products collection unavailable')){
            req.data = { status: '201', message: 'Fallback collection products', data: makeFallbackIds('collection',6) }
        } else {
            req.data = makeServerError(req, err)
        }
    }
    next()
}

async function collectionInfo(req, res, next){
    try{
        await ensureConnected()
        const collectionsCollection = getCollectionsCollection()
        if (!collectionsCollection) throw new Error('Collections collection unavailable')
        const slug = req.params.slug
        const doc = await collectionsCollection.findOne({ slug })
        if (doc && doc._id) doc._id = doc._id.toString()
        req.data = {
            status: "201",
            message: "Lấy thông tin bộ sưu tập thành công",
            data: doc || null
        }
    }
    catch(err){
        console.error('collectionInfo error', err)
        if (String(err && err.message || '').toLowerCase().includes('collections collection unavailable') || String(err && err.message || '').toLowerCase().includes('products collection unavailable')){
            req.data = { status: '201', message: 'Fallback collection info', data: null }
        } else {
            req.data = makeServerError(req, err)
        }
    }
    next()
}

export { productListID, productNewListID, productDetail, suggestListID, hotProductListID, searchListID, collectionProductsID, collectionInfo, catalogInfo, catalogMenu }

// create a new product (admin) — automatically assigns `masanpham` if missing
async function createProduct(req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        const payload = req.body || {}
        // ensure masanpham exists (and unique)
        if (!payload.masanpham) payload.masanpham = generateMasanpham()
        else {
            // if client supplied masanpham, make sure it's not already used
            const existing = await productsCollection.findOne({ masanpham: payload.masanpham })
            if (existing){
                req.data = { status: '409', message: 'Mã sản phẩm (masanpham) đã tồn tại' }
                return next()
            }
        }
        // ensure masanpham uniqueness (regenerate if collision)
        let attempts = 0
        while (attempts < 6){
            const conflict = await productsCollection.findOne({ masanpham: payload.masanpham })
            if (!conflict) break
            payload.masanpham = generateMasanpham()
            attempts++
        }
        // if still conflict after retries, abort
        const still = await productsCollection.findOne({ masanpham: payload.masanpham })
        if (still){
            req.data = makeServerError(req, new Error('Cannot generate unique masanpham after retries'), 'createProduct masanpham uniqueness')
            return next()
        }
        // optional: prevent accidental duplicate titles
        if (payload.title){
            const sameTitle = await productsCollection.findOne({ title: payload.title })
            if (sameTitle){
                req.data = { status: '409', message: 'Sản phẩm có tiêu đề trùng lặp đã tồn tại' }
                return next()
            }
        }
        // ensure timestamps
        payload.createdAt = payload.createdAt || new Date()
        payload.updatedAt = new Date()
        // ensure sold count exists (default 0)
        payload.sold = Number(payload.sold) || 0
        // new default fields
        payload.sku = payload.sku || payload.masanpham || ''
        payload.supplier = payload.supplier || ''
        payload.costPrice = typeof payload.costPrice !== 'undefined' ? Number(payload.costPrice) : 0
        payload.margin = typeof payload.margin !== 'undefined' ? Number(payload.margin) : 0
        payload.tags = Array.isArray(payload.tags) ? payload.tags : (typeof payload.tags === 'string' ? payload.tags.split(',').map(s=>s.trim()).filter(Boolean) : (payload.tags ? [payload.tags] : []))
        payload.dimensions = payload.dimensions || { width: null, height: null, depth: null }
        payload.weight = typeof payload.weight !== 'undefined' ? Number(payload.weight) : 0
        payload.active = typeof payload.active !== 'undefined' ? Boolean(payload.active) : true
        payload.featured = typeof payload.featured !== 'undefined' ? Boolean(payload.featured) : false
        const insertRes = await productsCollection.insertOne(payload)
        const insertedId = insertRes.insertedId
        const doc = await productsCollection.findOne({_id: insertedId})
        if (doc && doc._id) doc._id = doc._id.toString()
        req.data = { status: '201', message: 'Tạo sản phẩm thành công', data: doc }
    }catch(err){
        console.error('createProduct error', err)
        req.data = makeServerError(req, err, 'createProduct error')
    }
    next()
}

// return distinct categories and collections present in products collection
async function catalogInfo(req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')

        // distinct categories
        const categories = await productsCollection.distinct('category')

        // distinct collection slugs from `collections` array field
        let collections = []
        try{
            collections = await productsCollection.distinct('collections')
            // filter out falsy values
            collections = Array.isArray(collections) ? collections.filter(Boolean) : []
        }catch(e){
            collections = []
        }

        req.data = {
            status: '200',
            message: 'Lấy catalog (categories + collections) thành công',
            data: { categories, collections }
        }
    }
    catch(err){
        console.error('catalogInfo error', err)
        if (String(err && err.message || '').toLowerCase().includes('products collection unavailable')){
            req.data = { status: '200', message: 'Fallback catalog (categories + collections)', data: { categories: [], collections: [] } }
        } else {
            req.data = makeServerError(req, err)
        }
    }
    next()
}

// return categories with their collections (menu structure)
async function catalogMenu(req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')

        const pipeline = [
            { $unwind: { path: "$collections", preserveNullAndEmptyArrays: true } },
            { $group: { _id: "$category", collections: { $addToSet: "$collections" } } },
            { $project: { category: "$_id", collections: 1, _id: 0 } }
        ]
        const agg = await productsCollection.aggregate(pipeline).toArray()
        const data = Array.isArray(agg) ? agg.map(item => ({ category: item.category, collections: Array.isArray(item.collections) ? item.collections.filter(Boolean) : [] })) : []
        req.data = { status: '200', message: 'Lấy menu catalog thành công', data }
    }
    catch(err){
        console.error('catalogMenu error', err)
        if (String(err && err.message || '').toLowerCase().includes('products collection unavailable')){
            req.data = { status: '200', message: 'Fallback catalog menu', data: [] }
        } else {
            req.data = makeServerError(req, err)
        }
    }
    next()
}

async function updateProductHighlight(req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        const id = req.params.id
        const payload = req.body || {}
        const update = {}
        if (payload.highlight) update.highlight = payload.highlight
        if (payload.highlights) update.highlights = payload.highlights
        if (typeof payload.description !== 'undefined') update.description = payload.description
        if (Object.keys(update).length === 0){
            req.data = { status: '400', message: 'No highlight payload provided' }
            return next()
        }
        await productsCollection.updateOne({_id: new ObjectId(id)}, { $set: update })
        const newDoc = await productsCollection.findOne({_id: new ObjectId(id)})
        if (newDoc && newDoc._id) newDoc._id = newDoc._id.toString()
        req.data = { status: '200', message: 'Cập nhật highlight thành công', data: newDoc }
    }
    catch(err){
        console.error('updateProductHighlight error', err)
        req.data = makeServerError(req, err)
    }
    next()
}

// (exports consolidated at the end of the file)

// single export at top of file already includes all handlers

async function updateProductDetails(req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        const id = req.params.id
        const payload = req.body || {}
        const update = {}
        // sizes can be sent as array or comma-separated string
        if (typeof payload.size !== 'undefined'){
            if (Array.isArray(payload.size)) update.size = payload.size
            else if (typeof payload.size === 'string') update.size = payload.size.split(',').map(s=> s.trim()).filter(Boolean)
        }
        if (typeof payload.material !== 'undefined') update.material = payload.material
        if (typeof payload.materials !== 'undefined') update.materials = payload.materials
        if (typeof payload.color !== 'undefined') update.color = payload.color
        if (typeof payload.colors !== 'undefined'){
            if (Array.isArray(payload.colors)) update.colors = payload.colors
            else if (typeof payload.colors === 'string') update.colors = payload.colors.split(',').map(s=> s.trim()).filter(Boolean)
        }
        if (typeof payload.care !== 'undefined') update.care = payload.care
            // allow marking product as store-only (boolean)
            if (typeof payload.storeOnly !== 'undefined') update.storeOnly = Boolean(payload.storeOnly)

        // accept new product editable fields
        if (typeof payload.sku !== 'undefined') update.sku = payload.sku
        if (typeof payload.supplier !== 'undefined') update.supplier = payload.supplier
        if (typeof payload.costPrice !== 'undefined') update.costPrice = Number(payload.costPrice)
        if (typeof payload.margin !== 'undefined') update.margin = Number(payload.margin)
        if (typeof payload.tags !== 'undefined'){
            if (Array.isArray(payload.tags)) update.tags = payload.tags
            else if (typeof payload.tags === 'string') update.tags = payload.tags.split(',').map(s=>s.trim()).filter(Boolean)
        }
        if (typeof payload.dimensions !== 'undefined') update.dimensions = payload.dimensions
        if (typeof payload.weight !== 'undefined') update.weight = Number(payload.weight)
        if (typeof payload.active !== 'undefined') update.active = Boolean(payload.active)
        if (typeof payload.featured !== 'undefined') update.featured = Boolean(payload.featured)

        if (Object.keys(update).length === 0){
            req.data = { status: '400', message: 'No detail payload provided' }
            return next()
        }

        await productsCollection.updateOne({_id: new ObjectId(id)}, { $set: update })
        const newDoc = await productsCollection.findOne({_id: new ObjectId(id)})
        if (newDoc && newDoc._id) newDoc._id = newDoc._id.toString()
        req.data = { status: '200', message: 'Cập nhật chi tiết sản phẩm thành công', data: newDoc }
    }
    catch(err){
        console.error('updateProductDetails error', err)
        req.data = makeServerError(req, err)
    }
    next()
}

export { updateProductHighlight, updateProductDetails }

// purchase endpoint: decrement warehouse atomically and increase sold count
async function purchaseProduct(req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        const id = req.params.id
        const payload = req.body || {}
        const qty = Math.max(0, Number(payload.quantity) || 0)
        if (qty <= 0){
            req.data = { status: '400', message: 'Số lượng mua phải lớn hơn 0' }
            return next()
        }
        // Atomically decrement warehouse if enough stock exists
        const result = await productsCollection.findOneAndUpdate(
            { _id: new ObjectId(id), warehouse: { $gte: qty } },
            { $inc: { warehouse: -qty, sold: qty } },
            { returnDocument: 'after' }
        )
        if (!result.value){
            req.data = { status: '409', message: 'Sản phẩm không đủ trong kho' }
            return next()
        }
        const doc = result.value
        if (doc && doc._id) doc._id = doc._id.toString()
        req.data = { status: '200', message: 'Mua hàng thành công, kho đã được cập nhật', data: doc }
    }catch(err){
        console.error('purchaseProduct error', err)
        req.data = makeServerError(req, err)
    }
    next()
}

// add review to product
async function addProductReview(req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        const id = req.params.id
        const payload = req.body || {}
        const rating = Number(payload.rating) || 0
        const name = payload.name || ''
        const phone = payload.phone || ''
        const comment = payload.comment || ''

        // handle uploaded files (multer puts them on req.files)
        const files = (req.files || []).map(f => {
            // store web-accessible path like /uploads/reviews/<filename>
            const filename = f.filename || (f.path && f.path.split(/[\\/]/).pop())
            return filename ? `/uploads/reviews/${filename}` : ''
        }).filter(Boolean)

        const userId = req.userId || payload.userId || null

        const review = {
            _id: new ObjectId(),
            rating,
            name,
            phone,
            comment,
            images: files,
            userId,
            createdAt: new Date()
        }

        await productsCollection.updateOne({_id: new ObjectId(id)}, { $push: { reviews: review } })

        // recompute and persist simple aggregates on product doc so frontend can read them directly
        const updated = await productsCollection.findOne({_id: new ObjectId(id)})
        const agg = computeReviewAggregates(Array.isArray(updated?.reviews) ? updated.reviews : [])
        await productsCollection.updateOne({_id: new ObjectId(id)}, { $set: {
            ratingCount: agg.ratingCount,
            ratingAverage: agg.ratingAverage,
            hasImagesCount: agg.hasImagesCount,
            _1Count: agg._1Count,
            _2Count: agg._2Count,
            _3Count: agg._3Count,
            _4Count: agg._4Count,
            _5Count: agg._5Count,
            updatedAt: new Date()
        }})

        req.data = { status: '201', message: 'Gửi đánh giá thành công', data: { review } }

        // Push an in-app notification to the submitting user's account (if known)
        try{
            if (userId){
                const accountsCollection = getAccountsCollection()
                if (accountsCollection){
                    let acctFilter = null
                    try{ acctFilter = { _id: new ObjectId(userId) } }catch(e){ acctFilter = { _id: userId } }
                    const note = {
                        _id: new ObjectId(),
                        type: 'review',
                        message: `Cảm ơn bạn đã gửi đánh giá cho sản phẩm`,
                        productId: String(id || ''),
                        reviewId: String(review._id),
                        read: false,
                        createdAt: new Date()
                    }
                    await accountsCollection.updateOne(acctFilter, { $push: { notifications: note } })
                }
            }
        }catch(e){
            console.error('failed to push review notification', e)
        }
    }
    catch(err){
        console.error('addProductReview error', err)
        req.data = makeServerError(req, err, 'addProductReview error')
    }
    next()
}

export { addProductReview, removeProductReview }

// export createProduct for router usage
export { createProduct }

// export purchase handler for router
export { purchaseProduct }
// export adjust handler for admin route
export { adjustProductSold }

// remove a review (only allow when user owns the review)
async function removeProductReview(req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        const id = req.params.id
        const rid = req.params.rid

        // try to find product and review
        const product = await productsCollection.findOne({_id: new ObjectId(id)})
        if (!product) { req.data = { status: '404', message: 'Sản phẩm không tồn tại' }; return next() }
        const reviews = Array.isArray(product.reviews) ? product.reviews : []
        const review = reviews.find(r => String(r._id) === String(rid) || (r._id && String(r._id) === String(rid)))
        if (!review){ req.data = { status: '404', message: 'Đánh giá không tồn tại' }; return next() }


        // determine requesting user id (from middleware or body/header fallback)
        const requester = req.userId || (req.body && req.body.userId) || req.headers['x-user-id'] || null
        const isAdmin = (req.user && ((req.user.role && String(req.user.role).toLowerCase() === 'admin') || req.user.isAdmin))

        if (review.userId){
            if (!isAdmin && (!requester || String(requester) !== String(review.userId))){
                req.data = { status: '403', message: 'Bạn không có quyền xóa đánh giá này' }
                return next()
            }
        } else {
            // if review has no owner only admin can remove it
            if (!isAdmin){
                req.data = { status: '403', message: 'Đánh giá không có quyền xóa' }
                return next()
            }
        }

        await productsCollection.updateOne({_id: new ObjectId(id)}, { $pull: { reviews: { _id: review._id } } })

        // recompute aggregates after deletion and persist
        const after = await productsCollection.findOne({_id: new ObjectId(id)})
        const aggAfter = computeReviewAggregates(Array.isArray(after?.reviews) ? after.reviews : [])
        await productsCollection.updateOne({_id: new ObjectId(id)}, { $set: {
            ratingCount: aggAfter.ratingCount,
            ratingAverage: aggAfter.ratingAverage,
            hasImagesCount: aggAfter.hasImagesCount,
            _1Count: aggAfter._1Count,
            _2Count: aggAfter._2Count,
            _3Count: aggAfter._3Count,
            _4Count: aggAfter._4Count,
            _5Count: aggAfter._5Count,
            updatedAt: new Date()
        }})

        req.data = { status: '200', message: 'Xóa đánh giá thành công' }
    }
    catch(err){
        console.error('removeProductReview error', err)
        req.data = makeServerError(req, err, 'removeProductReview error')
    }
    next()
}

// Admin: adjust sold count and warehouse atomically
async function adjustProductSold(req, res, next){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        const id = req.params.id
        const payload = req.body || {}
        const delta = Number(payload.delta) || 0
        if (delta === 0){
            req.data = { status: '400', message: 'Delta must be a non-zero integer' }
            return next()
        }
        // if delta > 0: increase sold by delta (a manual sale or adjustment) -> decrease warehouse by delta
        // require warehouse >= delta
        // if delta < 0: decrease sold by -delta (refund/cancel) -> increase warehouse by -delta
        // require sold >= -delta to avoid negative sold

        const filter = { _id: new ObjectId(id) }
        if (delta > 0) filter.warehouse = { $gte: delta }
        if (delta < 0) filter.sold = { $gte: Math.abs(delta) }

        const update = { $inc: { warehouse: -delta, sold: delta } }

        const opts = { returnDocument: 'after' }
        const result = await productsCollection.findOneAndUpdate(filter, update, opts)
        if (!result.value){
            req.data = { status: '409', message: 'Không thể điều chỉnh: kiểm tra tồn kho / số đã bán' }
            return next()
        }
        const doc = result.value
        if (doc && doc._id) doc._id = doc._id.toString()
        req.data = { status: '200', message: 'Điều chỉnh thành công', data: doc }
    }catch(err){
        console.error('adjustProductSold error', err)
        req.data = makeServerError(req, err, 'adjustProductSold error')
    }
    next()
}