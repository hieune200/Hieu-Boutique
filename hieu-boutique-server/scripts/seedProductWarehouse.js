import 'dotenv/config'
import { ensureConnected, getProductsCollection } from '../src/models/mongoClient.model.js'

function rand(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min }

async function main(){
    await ensureConnected()
    const products = getProductsCollection()
    if (!products) {
        console.error('Products collection unavailable; check MONGO_URI and DB connection')
        process.exit(1)
    }

    const cursor = products.find({})
    let count = 0
    while (await cursor.hasNext()){
        const doc = await cursor.next()
        const newWarehouse = rand(20, 60)
        const newSold = Math.floor(Math.random() * Math.min(5, Math.max(1, Math.floor(newWarehouse/2))))
        try{
            await products.updateOne({ _id: doc._id }, { $set: { warehouse: newWarehouse, sold: newSold } })
            console.log(`Updated ${doc._id.toString()} -> warehouse=${newWarehouse} sold=${newSold}`)
            count++
        }catch(e){
            console.error('Failed to update', doc._id && doc._id.toString(), e && e.message ? e.message : e)
        }
    }
    console.log(`Updated ${count} products`)
    process.exit(0)
}

main().catch(err=>{ console.error('Script failed', err); process.exit(2) })
