import 'dotenv/config';
import mongodb from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI not set in environment. Aborting.');
  process.exit(1);
}

const client = new mongodb.MongoClient(uri);

// Define the canonical seasonal products (images intentionally empty for now)
const seasonalUpdates = [
  {
    category: 'ao',
    title: 'Áo dạ thu đông Hieu - Mã TD2025-A01',
    description: 'Áo dạ dáng dài, vải dạ dày, phối cổ vest, giữ ấm tốt.',
    img: [],
    price: 950000,
    oldPrice: 1250000,
    size: ['S','M','L','XL'],
    warehouse: 50,
    collections: ['thu-dong-2025']
  },
  {
    category: 'vay',
    title: 'Váy len midi Hieu - Mã TD2025-V02',
    description: 'Váy len midi ôm nhẹ, phối đường chỉ tinh tế, ấm áp cho mùa lạnh.',
    img: [],
    price: 650000,
    oldPrice: 850000,
    size: ['S','M','L'],
    warehouse: 40,
    collections: ['thu-dong-2025']
  },
  {
    category: 'dam',
    title: 'Đầm dạ công sở Hieu - Mã TD2025-D03',
    description: 'Đầm dạ form chữ A, thanh lịch, phù hợp môi trường công sở.',
    img: [],
    price: 780000,
    oldPrice: 999000,
    size: ['S','M','L'],
    warehouse: 35,
    collections: ['thu-dong-2025']
  },
  {
    category: 'quan',
    title: 'Quần dạ ống đứng Hieu - Mã TD2025-Q04',
    description: 'Quần dạ ống đứng, cạp cao, phù hợp phối cùng áo dạ hoặc áo len.',
    img: [],
    price: 420000,
    oldPrice: 599000,
    size: ['S','M','L','XL'],
    warehouse: 60,
    collections: ['thu-dong-2025']
  },
  {
    category: 'phukien',
    title: 'Túi tote thu đông Hieu - Mã TD2025-T05',
    description: 'Túi tote chất liệu da tổng hợp, form cứng, phù hợp đi làm và đi chơi.',
    img: [],
    price: 290000,
    oldPrice: 399000,
    size: [],
    warehouse: 120,
    collections: ['thu-dong-2025']
  }
];

async function run(){
  try{
    await client.connect();
    console.log('Connected to MongoDB — upserting seasonal products');
    const db = client.db(process.env.MONGO_DB || 'Hieu-boutique');
    const productsCol = db.collection('products');

    for (const prod of seasonalUpdates){
      const filter = { title: prod.title };
      const update = { $set: prod };
      const res = await productsCol.updateOne(filter, update, { upsert: true });
      if (res.upsertedId) {
        const upId = res.upsertedId._id ? res.upsertedId._id : res.upsertedId;
        console.log('Upserted new product:', prod.title, '->', upId.toString());
      }
      else if (res.matchedCount) console.log('Updated existing product:', prod.title);
      else console.log('Operation completed for:', prod.title);
    }

    console.log('Seasonal upsert complete.');
  } catch(err){
    console.error('Error upserting seasonal products', err);
    process.exitCode = 2;
  } finally{
    await client.close();
  }
}

run();
