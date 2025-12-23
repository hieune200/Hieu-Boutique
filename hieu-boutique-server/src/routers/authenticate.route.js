import express from 'express';

import { registerNewUser, checkLogin, getUserInfor, updateUserInfor, addNewOrder, getOrderList, socialLogin, createSocialPlaceholder, linkSocialAccount, getGuestOrders, getNotifications, markNotificationRead, cancelOrder, confirmReceived, contactSeller, getAdminMetrics, getAdminRecentOrders } from '../controllers/authenticate.controller.js';
import { authenticateJWT, requireAdmin } from '../middlewares/JWTAction.middleware.js'
import { ensureConnected } from '../models/mongoClient.model.js'
import { oauthRedirect, oauthCallback } from '../controllers/authenticate.controller.js';
const authenticate = express.Router();

authenticate.get('/user/:id', getUserInfor, (req, res, next)=>{
    res.json(req.data)
})

authenticate.get('/order/list/:id', getOrderList, (req, res, next)=>{
    res.json(req.data)
})

authenticate.post('/checkout', addNewOrder, (req, res, next)=>{
    res.json(req.data)
})

// Cancel an order (user must supply authenticated user-id header)
authenticate.post('/order/cancel', cancelOrder, (req, res) => {
    res.json(req.data)
})

// Contact seller: saves contact request and optionally emails seller
// Require authentication so only logged-in users can send contact requests
authenticate.post('/order/contact', authenticateJWT, express.json(), contactSeller, (req, res) => {
    res.json(req.data)
})

// Admin: list contact messages
authenticate.get('/contacts', authenticateJWT, requireAdmin, async (req, res) => {
    try{
        await ensureConnected()
        const { client } = await import('../models/mongoClient.model.js')
        const db = client.db()
        const coll = db.collection('contacts')
        const list = await coll.find({}).sort({ createdAt: -1 }).limit(200).toArray()
        res.json({ status: '200', data: list })
    }catch(e){ res.status(500).json({ status: '500', message: 'Unable to load contacts' }) }
})

// Customer confirms they have received the order
authenticate.post('/order/confirm', confirmReceived, (req, res) => {
    res.json(req.data)
})

// Admin: list guest orders (no auth guard currently)
authenticate.get('/guest-orders', async (req, res)=>{
    const { getGuestOrders } = await import('../controllers/authenticate.controller.js')
    return getGuestOrders(req, res)
})

// Admin metrics and recent orders (requires admin)
// Admin metrics and recent-orders: made public so dashboard can display DB-derived numbers even when client is not authenticated.
authenticate.get('/admin/metrics', async (req, res)=>{
    const { getAdminMetrics } = await import('../controllers/authenticate.controller.js')
    return getAdminMetrics(req, res)
})

authenticate.get('/admin/recent-orders', async (req, res)=>{
    const { getAdminRecentOrders } = await import('../controllers/authenticate.controller.js')
    return getAdminRecentOrders(req, res)
})

// Notifications
authenticate.get('/notifications/:id', getNotifications, (req, res)=>{
    res.json(req.data)
})
authenticate.put('/notifications/mark-read', markNotificationRead, (req, res)=>{
    res.json(req.data)
})

authenticate.post('/register', registerNewUser, (req, res, next)=>{
    res.json(req.data)
})

authenticate.put('/login', checkLogin, (req, res)=>{
    res.json(req.data)
})

authenticate.put('/update', updateUserInfor, (req, res, next)=>{
    res.json(req.data)
})

authenticate.post('/social', socialLogin, (req, res)=>{
    res.json(req.data)
})

authenticate.post('/social/placeholder', createSocialPlaceholder, (req, res) => {
    res.json(req.data)
})

authenticate.post('/social/link', linkSocialAccount, (req, res) => {
    res.json(req.data)
})

// OAuth redirect to provider
authenticate.get('/oauth/:provider', oauthRedirect)
// OAuth callback from provider
authenticate.get('/oauth/:provider/callback', oauthCallback)

export default authenticate;