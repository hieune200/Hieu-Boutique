import mongodb from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const uri = process.env.MONGO_URI || 'mongodb+srv://root:123@cluster0.4r3jmya.mongodb.net/?appName=Cluster0';
const client = new mongodb.MongoClient(uri);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.resolve(__dirname, '..', '..', 'hieu-boutique-client', 'src', 'assets', 'imgs', 'anhsanpham');
const altImagesDir = path.resolve(__dirname, '..', '..', 'hieu-boutique-client', 'src', 'assets', 'imgs', 'sanphamnoibat');

function fileToDataURL(filename, dir = imagesDir){
  const full = path.join(dir, filename);
  if (!fs.existsSync(full)) return null;
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  let mime = 'application/octet-stream';
  if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
  else if (ext === 'png') mime = 'image/png';
  else if (ext === 'webp') mime = 'image/webp';
  const buf = fs.readFileSync(full);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function fileToDataURLWithFallback(filename){
  let val = fileToDataURL(filename, imagesDir);
  if (val) return val;
  return fileToDataURL(filename, altImagesDir);
}

// Seasonal products for BST THU ĐÔNG 2025
const seasonalProducts = [
  {
    category: 'ao',
    title: 'Áo khoác dạ thu đông - BST Thu Đông 2025',
    description: 'Áo khoác dạ ấm áp, form ôm nhẹ, phối cúc lớn. Phù hợp tiết trời se lạnh.',
    img: [
      fileToDataURLWithFallback('aobomber1.jpg'),
      fileToDataURLWithFallback('aobomber2.jpg'),
      fileToDataURLWithFallback('aobomber3.jpg'),
      fileToDataURLWithFallback('aobomber4.jpg')
    ].filter(Boolean),
    price: 899000,
    oldPrice: 1199000,
    size: ['S','M','L','XL'],
    warehouse: 25,
    collections: ['thu-dong-2025']
  },
  {
    category: 'vay',
    title: 'Váy len midi thu đông - BST Thu Đông 2025',
    description: 'Váy len midi ấm áp, ôm vừa phải, phối với boot và áo khoác dạ.',
    img: [
      fileToDataURLWithFallback('chanvaymidi1.jpg'),
      fileToDataURLWithFallback('chanvaymidi2.jpg'),
      fileToDataURLWithFallback('chanvaymidi3.jpg'),
      fileToDataURLWithFallback('chanvaymidi4.jpg')
    ].filter(Boolean),
    price: 599000,
    oldPrice: 799000,
    size: ['S','M','L'],
    warehouse: 30,
    collections: ['thu-dong-2025']
  },
  {
    category: 'dam',
    title: 'Đầm công sở dạ - BST Thu Đông 2025',
    description: 'Đầm công sở vải dạ, form thanh lịch, phù hợp đi làm và sự kiện.',
    img: [
      fileToDataURLWithFallback('damcongso1.jpg'),
      fileToDataURLWithFallback('damcongso2.jpg'),
      fileToDataURLWithFallback('damcongso3.jpg'),
      fileToDataURLWithFallback('damcongso4.jpg')
    ].filter(Boolean),
    price: 749000,
    oldPrice: 949000,
    size: ['S','M','L'],
    warehouse: 20,
    collections: ['thu-dong-2025']
  },
  {
    category: 'quan',
    title: 'Quần dạ ống đứng - BST Thu Đông 2025',
    description: 'Quần dạ ống đứng, cạp cao, tạo form thanh lịch cho mùa thu đông.',
    img: [
      fileToDataURLWithFallback('quanjeanbasic1.jpg'),
      fileToDataURLWithFallback('quanjeanbasic2.jpg'),
      fileToDataURLWithFallback('quanjeanbasic3.jpg'),
      fileToDataURLWithFallback('quanjeanbasic4.jpg')
    ].filter(Boolean),
    price: 399000,
    oldPrice: 549000,
    size: ['S','M','L','XL'],
    warehouse: 35,
    collections: ['thu-dong-2025']
  },
  {
    category: 'ao',
    title: 'Áo len cổ lọ nữ - BST Thu Đông 2025',
    description: 'Áo len cổ lọ dày, giữ nhiệt tốt, phối được với nhiều trang phục mùa lạnh.',
    img: [
      fileToDataURLWithFallback('aosomitrang.jpg'),
      fileToDataURLWithFallback('aosomitrang1.jpg'),
      fileToDataURLWithFallback('aosomitrang2.jpg')
    ].filter(Boolean),
    price: 359000,
    oldPrice: 499000,
    size: ['S','M','L'],
    warehouse: 40,
    collections: ['thu-dong-2025']
  },
  {
    category: 'phukien',
    title: 'Túi tote da thu đông - BST Thu Đông 2025',
    description: 'Túi tote da giả cao cấp, kích thước lớn, phù hợp để đi làm hoặc dạo phố.',
    img: [
      fileToDataURLWithFallback('tuitote1.jpg'),
      fileToDataURLWithFallback('tuitote2.jpg'),
      fileToDataURLWithFallback('tuitote3.jpg')
    ].filter(Boolean),
    price: 249000,
    oldPrice: 349000,
    size: [],
    warehouse: 60,
    collections: ['thu-dong-2025']
  }
];

async function run(){
  try{
    await client.connect();
    console.log('Connected to Mongo for seasonal seeding');
    const db = client.db(process.env.MONGO_DB || 'Hieu-boutique');
    const productsCol = db.collection('products');

    const inserted = [];
    for (const prod of seasonalProducts){
      // check by title to avoid duplicates
      const exists = await productsCol.findOne({ title: prod.title });
      if (exists){
        console.log('Skipping existing product:', prod.title);
        continue;
      }
      const res = await productsCol.insertOne(prod);
      console.log('Inserted seasonal product:', prod.title, '->', res.insertedId.toString());
      inserted.push(res.insertedId);
    }

    if (!inserted.length) console.log('No new seasonal products were inserted.');
    else console.log('Inserted seasonal products count:', inserted.length);

  } catch(err){
    console.error('Seasonal seeding error', err);
  } finally{
    await client.close();
    process.exit(0);
  }
}

run();
