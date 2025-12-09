import express from 'express'
import { getCoupons, applyCoupon } from '../controllers/coupons.controller.js'

const router = express.Router()

router.get('/', getCoupons)
router.post('/apply', applyCoupon)

export default router
