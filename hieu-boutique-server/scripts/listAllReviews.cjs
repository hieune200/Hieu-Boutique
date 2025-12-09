#!/usr/bin/env node
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'Hieu-boutique';

async function main() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);
  const products = db.collection('products');

  try {
    const cursor = products.find({ 'reviews.0': { $exists: true } }).project({ title:1, reviews:1 }).limit(100);
    const rows = await cursor.toArray();
    if (!rows.length) {
      console.log('No products with reviews found.');
      return;
    }
    console.log(`Found ${rows.length} products with reviews (showing up to 100):`);
    for (const p of rows) {
      console.log(`\nProduct ${p._id} | title: ${p.title || 'N/A'} | reviews: ${ (p.reviews||[]).length }`);
      (p.reviews || []).slice(0,5).forEach(r => {
        console.log(`  - reviewId: ${r._id} | rating:${r.rating} | phone:${r.phone||'N/A'} | userId:${r.userId||'N/A'} | date:${r.date||r.createdAt||'N/A'}`);
      });
    }
  } finally {
    await client.close();
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });
