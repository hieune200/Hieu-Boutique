#!/usr/bin/env node
/*
  resetSoldCounts.js
  Usage:
    node resetSoldCounts.js            # perform reset to 0 (requires MONGO_URI)
    node resetSoldCounts.js --dry-run  # show how many docs would be changed and sample docs
    node resetSoldCounts.js --set 5    # set all sold to 5

  Environment:
    MONGO_URI (required) - Mongo connection string
    MONGO_DB  (optional) - database name (default: Hieu-boutique)

  Note: run from project root or from the `hieu-boutique-server` folder.
*/

import { MongoClient } from 'mongodb'

const argv = process.argv.slice(2)
const opts = {
  dryRun: argv.includes('--dry-run') || argv.includes('-n'),
  setTo: null
}

const idxSet = argv.indexOf('--set')
if (idxSet >= 0 && argv.length > idxSet + 1){
  const v = Number(argv[idxSet+1])
  if (!Number.isNaN(v)) opts.setTo = v
}

// default setTo 0 when not specified
if (opts.setTo === null) opts.setTo = 0

const uri = process.env.MONGO_URI
const dbName = process.env.MONGO_DB || 'Hieu-boutique'

if (!uri){
  console.error('MONGO_URI environment variable is required.')
  process.exit(2)
}

async function run(){
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  try{
    await client.connect()
    console.log('Connected to MongoDB')
    const db = client.db(dbName)
    const products = db.collection('products')

    // count how many docs currently have sold !== setTo (or no sold)
    const query = { $or: [ { sold: { $exists: false } }, { sold: { $ne: opts.setTo } } ] }
    const affected = await products.countDocuments(query)
    console.log(`Products to change: ${affected}`)
    if (opts.dryRun){
      console.log('Dry run mode: sample documents that would be changed:')
      const sample = await products.find(query).project({ _id:1, title:1, sold:1, warehouse:1 }).limit(10).toArray()
      sample.forEach(d => console.log(` - ${d._id.toString()} | sold: ${typeof d.sold === 'undefined' ? '<missing>' : d.sold} | title: ${d.title || '[no title]'}`))
      console.log('Dry run complete. No changes made.')
      return
    }

    if (affected === 0){
      console.log('No documents to update. Exiting.')
      return
    }

    const res = await products.updateMany({}, { $set: { sold: opts.setTo } })
    console.log(`Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`)
    console.log('Reset completed.')
  }catch(err){
    console.error('Error during reset:', err)
    process.exitCode = 1
  }finally{
    await client.close()
  }
}

run()
