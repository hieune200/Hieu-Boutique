import express from 'express'
import newsletterController from '../controllers/newsletter.controller.js'

const router = express.Router()

router.post('/subscribe', newsletterController.addSubscriber)

export default router
