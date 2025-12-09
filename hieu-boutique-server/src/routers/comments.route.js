import express from 'express'
import * as ctrl from '../controllers/comments.controller.js'

const router = express.Router()

// Get comments for an article
router.get('/article/:articleId', ctrl.getCommentsByArticle)
// Post a comment for an article
router.post('/article/:articleId', ctrl.postComment)
// Delete a comment by id (session in query/body to authorize)
router.delete('/:id', ctrl.deleteComment)
// Report comment
router.post('/report/:id', ctrl.reportComment)

export default router
