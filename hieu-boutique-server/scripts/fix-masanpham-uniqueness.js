import mongodb from 'mongodb'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import path from 'path'

// Usage:
// set MONGO_URI and optionally MONGO_DB then run:
// node scripts/fix-masanpham-uniqueness.js

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017'
const dbName = process.env.MONGO_DB || 'Hieu-boutique'

function generateMasanpham(){
  try{
    return `HB-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
  }catch(e){
    return `HB-${new mongodb.ObjectId().toString().slice(0,8).toUpperCase()}`
  }
}

async function run(){
  const client = new mongodb.MongoClient(uri, { useUnifiedTopology: true })
  try{
    await client.connect()
    console.log('Connected to Mongo at', uri)
    const db = client.db(dbName)
    const products = db.collection('products')

    const cursor = products.find({})
    let total = 0
    let updated = 0
    const seen = new Set()

    const all = await cursor.toArray()
    total = all.length
    console.log(`Found ${total} products`) 

    for (const doc of all){
      let cur = doc.masanpham
      if (cur) cur = String(cur).trim()
      if (!cur || seen.has(cur)){
        // generate new unique code
        let newCode
        let attempts = 0
        do{
          newCode = await generateMasanpham()
          attempts++
          if (attempts > 20) throw new Error('Unable to generate unique masanpham after many attempts')
        } while(seen.has(newCode))
        // update DB
        await products.updateOne({ _id: doc._id }, { $set: { masanpham: newCode } })
        seen.add(newCode)
        updated++
        console.log(`Updated product ${doc._id.toString()} -> ${newCode}`)
      } else {
        seen.add(cur)
      }
    }

    console.log(`Updated ${updated} products. Now creating unique index on masanpham...`)
    try{
      await products.createIndex({ masanpham: 1 }, { unique: true })
      console.log('Created unique index on masanpham')
    }catch(e){
      console.error('Failed to create unique index:', e.message)
    }

    console.log('Done')
  }catch(err){
    console.error('Error', err)
  }finally{
    await client.close()
    process.exit(0)
  }
}

run()
