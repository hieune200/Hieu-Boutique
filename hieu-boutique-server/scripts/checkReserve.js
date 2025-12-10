import 'dotenv/config'
import { ensureConnected, getProductsCollection } from '../src/models/mongoClient.model.js'

async function main(){
  const id = process.argv[2]
  const qty = Number(process.argv[3] || 1)
  if (!id){
    console.error('Usage: node scripts/checkReserve.js <productId> [qty]')
    process.exit(2)
  }
  await ensureConnected()
  const products = getProductsCollection()
  if (!products){ console.error('Products collection unavailable'); process.exit(1) }
  const { ObjectId } = await import('mongodb')
  const filter = { _id: new ObjectId(id), warehouse: { $gte: qty } }
  const found = await products.findOne(filter)
  console.log('findOne with filter returned:', !!found)
  if (found) console.log('current warehouse', found.warehouse, 'typeof:', typeof found.warehouse)

  console.log('Attempting atomic findOneAndUpdate (reserve)')
  const upd = await products.findOneAndUpdate(filter, { $inc: { warehouse: -qty, sold: qty } }, { returnDocument: 'after' })
  console.log('findOneAndUpdate result value exists:', !!(upd && upd.value))
  if (upd && upd.value){ console.log('after reserve, warehouse:', upd.value.warehouse, 'sold:', upd.value.sold)
    // rollback
    await products.updateOne({ _id: new ObjectId(id) }, { $inc: { warehouse: qty, sold: -qty } })
    console.log('rolled back')
  }
  else {
    console.log('Trying update without warehouse filter to see if update works at all')
    const upd2 = await products.findOneAndUpdate({ _id: new ObjectId(id) }, { $inc: { warehouse: -qty, sold: qty } }, { returnDocument: 'after' })
    console.log('findOneAndUpdate (no warehouse filter) value exists:', !!(upd2 && upd2.value))
    if (upd2 && upd2.value){ console.log('after reserve (no filter), warehouse:', upd2.value.warehouse); await products.updateOne({ _id: new ObjectId(id) }, { $inc: { warehouse: qty, sold: -qty } }); console.log('rolled back') }
  }
    console.log('Trying updateOne to check write behavior')
    const uo = await products.updateOne({ _id: new ObjectId(id) }, { $inc: { warehouse: -qty, sold: qty } })
    console.log('updateOne matchedCount/modifiedCount:', uo.matchedCount, uo.modifiedCount)
    if (uo.modifiedCount === 1){ await products.updateOne({ _id: new ObjectId(id) }, { $inc: { warehouse: qty, sold: -qty } }); console.log('rolled back updateOne') }
  process.exit(0)
}

main().catch(err=>{ console.error(err && err.message ? err.message : err); process.exit(2) })
