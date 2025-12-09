import express from 'express';

import { registerNewUser, checkLogin, getUserInfor, updateUserInfor, addNewOrder, getOrderList, socialLogin, createSocialPlaceholder, linkSocialAccount } from '../controllers/authenticate.controller.js';
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