import { ensureConnected, getCouponsCollection, getAccountsCollection } from '../models/mongoClient.model.js'

// Note: this controller will try to use a `coupons` collection if available.
// Coupon document schema (recommended):
// { code: String, title: String, sub: String, expiry: String, remaining: Number, discount: Number, freeShipping: Boolean, shipDiscount: Number, onePerUser: Boolean, usedBy: [userIdString] }

export const getCoupons = async (req, res) => {
  try{
    await ensureConnected()
    const couponsCol = getCouponsCollection()
    if (!couponsCol) {
      // fallback to empty list if DB not available
      return res.json([])
    }
    const list = await couponsCol.find({}).toArray()
    // don't leak usedBy list
    const out = list.map(c => ({ id: c._id?.toString() || c.code, code: c.code, title: c.title, sub: c.sub, expiry: c.expiry, remaining: c.remaining, discount: c.discount, freeShipping: !!c.freeShipping, shipDiscount: c.shipDiscount || 0 }))
    return res.json(out)
  }
  catch(err){
    console.error('getCoupons error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const applyCoupon = async (req, res) => {
  try{
    const { code } = req.body || {}
    // Prefer user-id header (client uses this pattern elsewhere)
    const subtotal = req.body && (req.body.subtotal || req.body.cartSubtotal || req.body.total || req.body.amount)
    const userId = req.headers['user-id'] || (req.body && req.body.userId)
    if (!code) return res.status(400).json({ error: 'Missing code' })

    await ensureConnected()
    const couponsCol = getCouponsCollection()
    const accountsCol = getAccountsCollection()

    if (!couponsCol){
      // DB not available — simple in-memory fallback not supported here
      return res.status(503).json({ error: 'Coupons service unavailable' })
    }

    const found = await couponsCol.findOne({ code: { $regex: `^${String(code)}$`, $options: 'i' } })
    if (!found) return res.status(404).json({ error: 'Coupon not found' })

    // Check expiry / start date if provided
    try{
      const now = new Date()
      if (found.expiry){
        const exp = new Date(found.expiry)
        if (!isNaN(exp.getTime()) && now > exp){
          return res.status(410).json({ error: 'Coupon expired' })
        }
      }
      if (found.startDate){
        const st = new Date(found.startDate)
        if (!isNaN(st.getTime()) && now < st){
          return res.status(400).json({ error: 'Coupon not yet valid' })
        }
      }
    }catch(e){ /* ignore parse errors and continue */ }

    // If coupon has a minimum order amount, require subtotal to be provided and valid
    if (typeof found.minOrder === 'number'){
      if (typeof subtotal !== 'number'){
        return res.status(400).json({ error: 'Missing order subtotal for coupon validation' })
      }
      if (subtotal < found.minOrder){
        return res.status(400).json({ error: `Coupon requires minimum order of ${found.minOrder}` })
      }
    }

    // If coupon is limited to one use per account, enforce that
    if (found.onePerUser && userId){
      if (Array.isArray(found.usedBy) && found.usedBy.includes(String(userId))){
        return res.status(400).json({ error: 'Coupon already used by this account' })
      }
      // also check user record (defensive)
      if (accountsCol){
        try{
          const user = await accountsCol.findOne({ _id: new (require('mongodb').ObjectId)(String(userId)) })
          if (user && Array.isArray(user.usedCoupons) && user.usedCoupons.includes(found.code)){
            return res.status(400).json({ error: 'Coupon already used by this account' })
          }
        }catch(e){ /* ignore */ }
      }
    }

    // Build atomic filter and update to avoid races
    const filter = { _id: found._id, remaining: { $gt: 0 } }
    if (found.onePerUser && userId){
      filter.usedBy = { $ne: String(userId) }
    }
    const updateOps = { $inc: { remaining: -1 } }
    if (userId && found.onePerUser){
      updateOps.$addToSet = { usedBy: String(userId) }
    }

    const result = await couponsCol.findOneAndUpdate(filter, updateOps, { returnDocument: 'after' })
    if (!result.value){
      // Either exhausted or already used (race)
      // Re-fetch to craft better message
      const fresh = await couponsCol.findOne({ _id: found._id })
      if (!fresh || fresh.remaining <= 0) return res.status(410).json({ error: 'Coupon exhausted' })
      return res.status(400).json({ error: 'Coupon cannot be applied (already used or invalid for this account)' })
    }

    // If accounts collection exists and userId provided, add to user's usedCoupons
    if (userId && accountsCol && found.onePerUser){
      try{
        const ObjectId = require('mongodb').ObjectId
        await accountsCol.updateOne({ _id: new ObjectId(String(userId)) }, { $addToSet: { usedCoupons: found.code } })
      }catch(e){ /* non-fatal */ }
    }

    // return relevant coupon details
    const applied = result.value
    return res.json({ id: applied._id.toString(), code: applied.code, discount: applied.discount || 0, title: applied.title, expiry: applied.expiry, freeShipping: !!applied.freeShipping, shipDiscount: applied.shipDiscount || 0 })
  }
  catch(err){
    console.error('applyCoupon error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
