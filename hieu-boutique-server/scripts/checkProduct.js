import 'dotenv/config'
import { ensureConnected, getProductsCollection } from '../src/models/mongoClient.model.js'

async function main(){
  const id = process.argv[2]
  if (!id){
    console.error('Usage: node scripts/checkProduct.js <productId>')
    process.exit(2)
  }
  await ensureConnected()
  const products = getProductsCollection()
  if (!products){
    console.error('Products collection unavailable; check MONGO_URI and DB connection')
    process.exit(1)
  }
  const { ObjectId } = await import('mongodb')
  const doc = await products.findOne({ _id: new ObjectId(id) })
  if (!doc){
    console.error('Product not found for id', id)
    process.exit(1)
  }
  console.log('Product:', { id: doc._id.toString(), title: doc.title, warehouse: doc.warehouse, sold: doc.sold, masanpham: doc.masanpham })
  process.exit(0)
}

main().catch(err=>{ console.error(err && err.message ? err.message : err); process.exit(2) })
