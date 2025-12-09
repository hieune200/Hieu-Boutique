#!/usr/bin/env node
import { ensureConnected, getProductsCollection, getAccountsCollection } from '../src/models/mongoClient.model.js'
import { ObjectId } from 'mongodb'

async function run(){
    try{
        await ensureConnected()
        const productsCollection = getProductsCollection()
        const accountsCollection = getAccountsCollection()
        if (!productsCollection) throw new Error('Products collection unavailable')
        if (!accountsCollection) throw new Error('Accounts collection unavailable')

        const cursor = productsCollection.find({ reviews: { $exists: true, $ne: [] } })
        let updated = 0
        while (await cursor.hasNext()){
            const doc = await cursor.next()
            const prodId = doc._id
            const reviews = Array.isArray(doc.reviews) ? doc.reviews : []
            const ops = []
            for (let i=0;i<reviews.length;i++){
                const r = reviews[i]
                if (r.userId) continue // already has owner
                if (!r.phone) continue
                // try to find account by phoneNumber
                const acc = await accountsCollection.findOne({ phoneNumber: r.phone })
                if (acc && acc._id){
                    // set review.userId in-place using positional filtered update
                    ops.push({ reviewId: r._id, userId: acc._id.toString() })
                }
            }
            if (ops.length){
                // perform update for each found mapping
                for (const op of ops){
                    await productsCollection.updateOne({ _id: prodId, 'reviews._id': new ObjectId(op.reviewId) }, { $set: { 'reviews.$.userId': op.userId } })
                    updated++
                }
            }
        }
        console.log('Migration complete. Reviews updated:', updated)
        process.exit(0)
    }catch(e){
        console.error('Migration error', e)
        process.exit(2)
    }
}

run()
