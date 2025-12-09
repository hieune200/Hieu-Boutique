import { productsCollection as sharedProductsCollection, client as sharedClient } from '../src/models/mongoClient.model.js'
import mongodb from 'mongodb'

async function run(){
  let localClient = null
  try{
    let productsCol = sharedProductsCollection
    // fallback: create own client if shared not available
    if (!productsCol){
      const uri = process.env.MONGO_URI || 'mongodb+srv://root:123@cluster0.4r3jmya.mongodb.net/?appName=Cluster0'
      localClient = new mongodb.MongoClient(uri)
      await localClient.connect()
      const db = localClient.db(process.env.MONGO_DB || 'Hieu-boutique')
      productsCol = db.collection('products')
    }
    const res = await productsCol.updateMany({}, { $unset: { highlight: "", highlights: "" } })
    console.log('Matched:', res.matchedCount, 'Modified:', res.modifiedCount)
  }catch(err){
    console.error('Error removing highlights', err)
  }finally{
    if (localClient) await localClient.close()
    if (sharedClient) await sharedClient.close()
    process.exit(0)
  }
}

run()
