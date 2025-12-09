import express from 'express';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let multer
try{
    // try to require multer if installed
    multer = require('multer')
}catch(e){
    multer = null
}
import { productListID, productNewListID, productDetail, suggestListID, hotProductListID, searchListID, collectionProductsID, collectionInfo, updateProductHighlight, updateProductDetails, addProductReview, removeProductReview, catalogInfo, catalogMenu, createProduct } from '../controllers/products.controller.js';
import { purchaseProduct, adjustProductSold } from '../controllers/products.controller.js';
import { authenticateJWT, requireAdmin } from '../middlewares/JWTAction.middleware.js'

const products = express.Router();

products.get('/hot-products', hotProductListID, (req, res, next)=>{
    res.json(req.data)
})

products.get('/category/new', productNewListID, (req, res, next)=>{
    res.json(req.data)
})

products.get('/category/:category',productListID, (req, res)=>{
    res.json(req.data)
})

products.get('/product/:id', productDetail,(req, res, next)=>{
    res.json(req.data)
})

products.get('/collection/:slug', collectionProductsID, (req, res, next)=>{
    res.json(req.data)
})

products.get('/collection/info/:slug', collectionInfo, (req, res, next)=>{
    res.json(req.data)
})

// catalog: categories + collections present in DB
products.get('/catalog', catalogInfo, (req, res, next)=>{
    res.json(req.data)
})

// menu for header: categories + their collections
products.get('/catalog/menu', catalogMenu, (req, res, next)=>{
    res.json(req.data)
})

products.get('/suggest/:category/:id', suggestListID, (req, res, next)=>{
    res.json(req.data)
})

// admin: update highlight(s) for a product
products.patch('/product/:id/highlight', updateProductHighlight, (req, res, next)=>{
    res.json(req.data)
})

// admin: update structured product details (size, material, colors, care)
products.patch('/product/:id/details', updateProductDetails, (req, res, next)=>{
    res.json(req.data)
})

products.get('/search/:keyword', searchListID , (req, res, next)=>{
    res.json(req.data)
})

// prepare multer storage for review uploads (fallback if multer not installed)
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'reviews')
try{ fs.mkdirSync(uploadsDir, { recursive: true }) } catch(e) { /* ignore */ }
let upload
if (multer){
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadsDir),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname)
            const name = `${Date.now()}-${Math.random().toString(36).slice(2,9)}${ext}`
            cb(null, name)
        }
    })
    upload = multer({ storage, limits: { files: 5, fileSize: 5 * 1024 * 1024 } })
}else{
    // fallback no-op upload middleware: ensure req.files exists
    upload = {
        array: (fieldName, max)=> (req, res, next)=>{ req.files = []; next() }
    }
}

// client: submit a review (with optional images/videos)
// require JWT auth to post reviews
products.post('/product/:id/reviews', authenticateJWT, upload.array('images', 5), addProductReview, (req, res, next)=>{
    res.json(req.data)
})

// client: purchase action (decrement warehouse immediately)
// protect purchase route so only authenticated users can reserve/purchase
products.post('/product/:id/purchase', authenticateJWT, express.json(), purchaseProduct, (req, res, next)=>{
    res.json(req.data)
})

// admin: create new product (protected)
// create product: require authentication + admin role
products.post('/product', authenticateJWT, requireAdmin, express.json(), createProduct, (req, res, next) => {
    res.json(req.data)
})

// admin: adjust sold/warehouse atomically (protected)
products.patch('/product/:id/adjust-sold', authenticateJWT, requireAdmin, express.json(), adjustProductSold, (req, res, next) => {
    res.json(req.data)
})

// delete a review — client must pass the user id in body or x-user-id header for ownership check
// require JWT auth to delete reviews
products.delete('/product/:id/reviews/:rid', authenticateJWT, express.json(), removeProductReview, (req, res, next)=>{
    res.json(req.data)
})

export default products;