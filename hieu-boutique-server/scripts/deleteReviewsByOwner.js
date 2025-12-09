#!/usr/bin/env node
/*
  Safe script to remove reviews by owner identifier.
  Usage (PowerShell):
    $env:MONGO_URI = 'mongodb://localhost:27017/hieu-boutique';
    node .\scripts\deleteReviewsByOwner.js --phone=089xxxxxxx --dry
    node .\scripts\deleteReviewsByOwner.js --phone=089xxxxxxx
    node .\scripts\deleteReviewsByOwner.js --userId=64f... --dry

  The script supports --dry to only report what would be removed.
  It requires the `MONGO_URI` environment variable (or will default to mongodb://localhost:27017).
*/

const { MongoClient, ObjectId } = require('mongodb');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dry: false };
  args.forEach(a => {
    if (a === '--dry') out.dry = true;
    if (a.startsWith('--phone=')) out.phone = a.split('=')[1];
    if (a.startsWith('--userId=')) out.userId = a.split('=')[1];
  });
  return out;
}

async function main() {
  const { phone, userId, dry } = parseArgs();
  if (!phone && !userId) {
    console.error('ERROR: Please pass --phone=<value> or --userId=<value>');
    process.exit(2);
  }

  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGO_DB || 'hieu-boutique';

  const client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);
  const products = db.collection('products');

  try {
    if (phone) {
      console.log(`Searching reviews with phone='${phone}' ...`);
      const prods = await products.find({ 'reviews.phone': phone }).project({ _id: 1, title: 1, reviews: 1 }).toArray();
      if (!prods.length) {
        console.log('No matching reviews found.');
        return;
      }

      let totalFound = 0;
      for (const p of prods) {
        const matches = (p.reviews || []).filter(r => r.phone === phone);
        if (!matches.length) continue;
        totalFound += matches.length;
        console.log(`- Product ${p._id} (${p.title || 'unknown'}) -> ${matches.length} review(s)`);
        matches.forEach(r => console.log(`   reviewId: ${r._id} | rating: ${r.rating} | date: ${r.date || r.createdAt || 'N/A'}`));

        if (!dry) {
          const res = await products.updateOne({ _id: p._id }, { $pull: { reviews: { phone } } });
          console.log(`   Removed from product ${p._id} (matched: ${res.matchedCount}, modified: ${res.modifiedCount})`);
        }
      }
      console.log(`Total reviews ${dry ? 'found' : 'removed'}: ${totalFound}`);
    }

    if (userId) {
      // allow string or ObjectId-like
      const uid = userId;
      console.log(`Searching reviews with userId='${uid}' ...`);
      const prods = await products.find({ 'reviews.userId': uid }).project({ _id: 1, title: 1, reviews: 1 }).toArray();
      if (!prods.length) {
        console.log('No matching reviews found.');
        return;
      }
      let totalFound = 0;
      for (const p of prods) {
        const matches = (p.reviews || []).filter(r => String(r.userId) === String(uid));
        if (!matches.length) continue;
        totalFound += matches.length;
        console.log(`- Product ${p._id} (${p.title || 'unknown'}) -> ${matches.length} review(s)`);
        matches.forEach(r => console.log(`   reviewId: ${r._id} | rating: ${r.rating} | phone: ${r.phone || 'N/A'} | date: ${r.date || r.createdAt || 'N/A'}`));

        if (!dry) {
          const res = await products.updateOne({ _id: p._id }, { $pull: { reviews: { userId: uid } } });
          console.log(`   Removed from product ${p._id} (matched: ${res.matchedCount}, modified: ${res.modifiedCount})`);
        }
      }
      console.log(`Total reviews ${dry ? 'found' : 'removed'}: ${totalFound}`);
    }

  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
