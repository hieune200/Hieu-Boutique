#!/usr/bin/env node
const { MongoClient, ObjectId } = require('mongodb');

const id = process.argv[2];
if (!id) {
  console.error('Usage: node deleteReviewById.cjs <reviewId>');
  process.exit(2);
}

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'Hieu-boutique';

async function main() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);
  const products = db.collection('products');

  try {
    const oid = (() => {
      try { return new ObjectId(id); } catch(e) { return id; }
    })();

    const res = await products.updateMany(
      { 'reviews._id': oid },
      { $pull: { reviews: { _id: oid } } }
    );
    console.log(`Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
  } finally {
    await client.close();
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });
