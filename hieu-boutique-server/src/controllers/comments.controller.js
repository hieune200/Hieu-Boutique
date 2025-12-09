import { ensureConnected, getCommentsCollection } from '../models/mongoClient.model.js'
import { ObjectId } from 'mongodb'

async function ensure() { await ensureConnected() }

export async function getCommentsByArticle(req, res){
    await ensure()
    const { articleId } = req.params
    try{
        const col = getCommentsCollection()
        if(!col) return res.status(503).json({ error: 'DB not connected' })
        const docs = await col.find({ articleId }).sort({ date: -1 }).toArray()
        return res.json(docs)
    }catch(e){
        console.error(e)
        return res.status(500).json({ error: 'failed' })
    }
}

export async function postComment(req, res){
    await ensure()
    const { articleId } = req.params
    const { name, text, session } = req.body
    if(!text) return res.status(400).json({ error: 'text required' })
    try{
        const col = getCommentsCollection()
        if(!col) return res.status(503).json({ error: 'DB not connected' })
        const doc = { articleId, name: name || 'Khách', text, session: session || null, reported: false, date: new Date() }
        const r = await col.insertOne(doc)
        doc._id = r.insertedId
        return res.status(201).json(doc)
    }catch(e){
        console.error(e)
        return res.status(500).json({ error: 'failed to insert' })
    }
}

export async function deleteComment(req, res){
    await ensure()
    const { id } = req.params
    const session = req.query.session || req.body.session
    if(!id) return res.status(400).json({ error: 'id required' })
    try{
        const col = getCommentsCollection()
        if(!col) return res.status(503).json({ error: 'DB not connected' })
        const doc = await col.findOne({ _id: new ObjectId(id) })
        if(!doc) return res.status(404).json({ error: 'not found' })
        // Only allow delete if session matches or if no session is stored on doc
        if(doc.session && session && doc.session !== session) return res.status(403).json({ error: 'forbidden' })
        await col.deleteOne({ _id: new ObjectId(id) })
        return res.json({ success: true })
    }catch(e){
        console.error(e)
        return res.status(500).json({ error: 'failed' })
    }
}

export async function reportComment(req, res){
    await ensure()
    const { id } = req.params
    try{
        const col = getCommentsCollection()
        if(!col) return res.status(503).json({ error: 'DB not connected' })
        await col.updateOne({ _id: new ObjectId(id) }, { $set: { reported: true }})
        return res.json({ success: true })
    }catch(e){
        console.error(e)
        return res.status(500).json({ error: 'failed' })
    }
}
