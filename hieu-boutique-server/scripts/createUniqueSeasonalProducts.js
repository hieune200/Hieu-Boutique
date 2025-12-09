import 'dotenv/config';
import mongodb from 'mongodb';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI not set. Aborting.');
  process.exit(1);
}

const client = new mongodb.MongoClient(uri);

function uniqueSuffix(){
  return Date.now().toString().slice(-6);
}

const baseProducts = [
  {
    category: 'ao',
    title: `Áo dạ Hieu ThuDong ${uniqueSuffix()}`,
    description: 'Áo dạ ấm áp, phong cách thu đông 2025 - phiên bản đặc biệt.',
    img: [],
    price: 990000,
    oldPrice: 1299000,
    size: ['S','M','L','XL'],
    warehouse: 30,
    collections: ['thu-dong-2025']
  },
  {
    category: 'vay',
    title: `Váy len Hieu ThuDong ${uniqueSuffix()}`,
    description: 'Váy len midi đan, ấm áp và thanh lịch cho mùa lạnh.',
    img: [],
    price: 650000,
    oldPrice: 850000,
    size: ['S','M','L'],
    warehouse: 25,
    collections: ['thu-dong-2025']
  },
  {
    category: 'dam',
    title: `Đầm dạ Hieu ThuDong ${uniqueSuffix()}`,
    description: 'Đầm công sở vải dạ, form chuẩn, dễ phối.',
    img: [],
    price: 749000,
    oldPrice: 949000,
    size: ['S','M','L'],
    warehouse: 20,
    collections: ['thu-dong-2025']
  },
  {
    category: 'quan',
    title: `Quần dạ Hieu ThuDong ${uniqueSuffix()}`,
    description: 'Quần dạ ống đứng, cạp cao, chất liệu co giãn nhẹ.',
    img: [],
    price: 420000,
    oldPrice: 599000,
    size: ['S','M','L','XL'],
    warehouse: 40,
    collections: ['thu-dong-2025']
  },
  {
    category: 'phukien',
    title: `Túi tote Hieu ThuDong ${uniqueSuffix()}`,
    description: 'Túi tote mùa thu đông, phối da tổng hợp, form cứng.',
    img: [],
    price: 299000,
    oldPrice: 399000,
    size: [],
    warehouse: 80,
    collections: ['thu-dong-2025']
  }
];

async function run(){
  try{
    await client.connect();
    console.log('Connected to Mongo — inserting unique seasonal products');
    const db = client.db(process.env.MONGO_DB || 'Hieu-boutique');
    const productsCol = db.collection('products');

    const res = await productsCol.insertMany(baseProducts);
    console.log('Inserted seasonal products count:', res.insertedCount);
    console.log('Inserted IDs:', Object.values(res.insertedIds).map(id => id.toString()));
  } catch(err){
    console.error('Error inserting seasonal products', err);
    process.exitCode = 2;
  } finally{
    await client.close();
  }
}

run();
