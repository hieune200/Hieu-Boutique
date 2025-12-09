#!/usr/bin/env node
const { MongoClient } = require('mongodb');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  args.forEach(a => {
    if (a.startsWith('--rating=')) out.rating = Number(a.split('=')[1]);
    if (a.startsWith('--date=')) out.date = a.split('=')[1];
    if (a.startsWith('--limit=')) out.limit = Number(a.split('=')[1]);
  });
  return out;
}

async function main() {
  const { rating, date, limit = 50 } = parseArgs();
  if (!rating && !date) {
    console.error('Please pass --rating or --date (or both).');
    process.exit(2);
  }

  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGO_DB || 'hieu-boutique';
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);
  const products = db.collection('products');

  try {
    const elemMatch = {};
    if (rating) elemMatch.rating = rating;
    if (date) elemMatch.$or = [{ date: { $regex: date } }, { createdAt: { $regex: date } }];

    const cursor = products.find({ reviews: { $elemMatch: elemMatch } }).limit(limit);
    const results = await cursor.toArray();
    if (!results.length) {
      console.log('No products with matching reviews found.');
      return;
    }

    console.log(`Found ${results.length} product(s) with matching reviews (showing up to ${limit}):`);
    for (const p of results) {
      const matches = (p.reviews || []).filter(r => {
        if (rating && r.rating !== rating) return false;
        if (date) {
          const s1 = String(r.date || '');
          const s2 = String(r.createdAt || '');
          if (s1.includes(date) || s2.includes(date)) return true;
          return false;
        }
        return true;
      });
      if (!matches.length) continue;
      console.log(`\nProduct: ${p._id}  |  title: ${p.title || 'N/A'}  | matches: ${matches.length}`);
      matches.forEach(r => {
        console.log(`  - reviewId: ${r._id} | rating: ${r.rating} | phone: ${r.phone || 'N/A'} | userId: ${r.userId || 'N/A'} | date: ${r.date || r.createdAt || 'N/A'}`);
      });
    }
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
