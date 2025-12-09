import mongodb from 'mongodb';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const uri = process.env.MONGO_URI || 'mongodb+srv://root:123@cluster0.4r3jmya.mongodb.net/?appName=Cluster0';
const client = new mongodb.MongoClient(uri);

// locate images directory in the client folder
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
  else if (ext === 'svg') mime = 'image/svg+xml';
  const buf = fs.readFileSync(full);
  // return SVGs as utf8-encoded data URL (not base64) for smaller size and readability
  if (ext === 'svg') return `data:${mime};utf8,${encodeURIComponent(buf.toString('utf8'))}`;
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// generate a simple SVG placeholder data URL when an image file is not present
function escapeXml(unsafe){
  return String(unsafe).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function generatePlaceholderDataURL(label){
  const text = (label || 'Product').toString().replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  const svg = `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'>` +
    `<rect width='100%' height='100%' fill='#f4f4f4'/>` +
    `<g transform='translate(40,120)'>` +
    `<rect x='0' y='0' width='720' height='560' rx='12' fill='#ffffff' stroke='#e0e0e0'/>` +
    `<text x='360' y='280' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='40' fill='#b71c1c'>${escapeXml(text)}</text>` +
    `</g>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// generate a short product code (masanpham) for DB records
function generateMasanpham(prefix = 'HB'){
  try{
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    return `${prefix}-${code}`
  }catch(e){
    try{ return `${prefix}-${new mongodb.ObjectId().toString().slice(0,8).toUpperCase()}` }catch(err){ return `${prefix}-${Date.now().toString().slice(-8)}` }
  }
}

function fileToDataURLWithFallback(filename){
  // try exact filename in primary images dir
  let val = fileToDataURL(filename, imagesDir);
  if (val) return val;
  // try exact filename in alternate dir
  val = fileToDataURL(filename, altImagesDir);
  if (val) return val;

  // if there's a same-basename SVG available (e.g. 'default-demo.svg' for 'default-demo.jpg'), prefer it
  try {
    const base = path.basename(filename, path.extname(filename));
    const svgName = base + '.svg';
    val = fileToDataURL(svgName, imagesDir);
    if (val) return val;
    val = fileToDataURL(svgName, altImagesDir);
    if (val) return val;
  } catch (e) {
    // ignore and continue to placeholder
  }

  // fallback: generate a simple placeholder SVG so demo products still have an image
  return generatePlaceholderDataURL(filename);
}

const sampleProducts = [
  // Women's collection
  {
    category: 'dam',
    title: 'Đầm xòe hoa nhí - Nữ',
    description: 'Đầm xòe nhẹ, hoạ tiết hoa nhí, chất liệu cotton pha polyester, có lớp lót mềm.',
    highlights: [
      { title: 'PHOM DÁNG XÒE', text: 'Form xòe thoáng, tôn eo, phù hợp đi chơi và dạo phố.' },
      { title: 'CHẤT LIỆU MỀM', text: 'Cotton pha polyester, có lớp lót mềm, không gây ngứa.' },
      { title: 'HỌA TIẾT HOA NHÍ', text: 'Hoa nhí thời trang, dễ phối đồ.' },
      { title: 'THIẾT KẾ TỈ MỈ', text: 'Đường may chắc chắn, hoàn thiện tốt.' }
    ],
    img: [fileToDataURLWithFallback('damxoehoanhi1.jpg'), fileToDataURLWithFallback('damxoehoanhi2.jpg'), fileToDataURLWithFallback('damxoehoanhi3.jpg'), fileToDataURLWithFallback('damxoehoanhi4.jpg')].filter(Boolean),
    price: 549000,
    oldPrice: 699000,
    size: ['S','M','L'],
    warehouse: 28
  },
  {
    category: 'ao',
    title: 'Áo blouse nữ tay bồng',
    description: 'Áo blouse form nữ tính, tay bồng, phù hợp mặc đi làm hoặc dạo phố.',
    highlights: [
      { title: 'TAY BỒNG TINH TẾ', text: 'Thiết kế tay bồng nhẹ nhàng, tạo điểm nhấn thanh lịch.' },
      { title: 'CHẤT LIỆU MÁT', text: 'Vải thoáng, phù hợp cả ngày dài.' },
      { title: 'PHOM NỮ TÍNH', text: 'Form dễ mặc, tôn vóc dáng.' }
    ],
    img: [fileToDataURLWithFallback('aosomitrang.jpg'), fileToDataURLWithFallback('aosomitrang1.jpg'), fileToDataURLWithFallback('aosomitrang2.jpg'), fileToDataURLWithFallback('aosomitrang3.jpg')].filter(Boolean),
    price: 279000,
    oldPrice: 349000,
    size: ['S','M','L','XL'],
    warehouse: 45
  },
  {
    category: 'quan',
    title: 'Quần jean ống suông nữ',
    description: 'Jean ống suông cạp cao, chất liệu co giãn nhẹ, phối được với nhiều trang phục.',
    highlights: [
      { title: 'CẠP CAO KHOA HỌC', text: 'Cạp cao tôn eo, phù hợp cho nhiều dáng người và dễ phối đồ.' },
      { title: 'CHẤT LIỆU CO GIÃN', text: 'Denim co giãn nhẹ, vận động thoải mái.' },
      { title: 'ĐA DẠNG PHỐI ĐỒ', text: 'Dễ phối với áo sơ mi hoặc áo phông.' }
    ],
    img: [fileToDataURLWithFallback('quanjeanongsuongnu1.jpg'), fileToDataURLWithFallback('quanjeanongsuongnu2.jpg'), fileToDataURLWithFallback('quanjeanongsuongnu3.jpg'), fileToDataURLWithFallback('quanjeanongsuongnu4.jpg')].filter(Boolean),
    price: 499000,
    oldPrice: 649000,
    size: ['S','M','L','XL'],
    warehouse: 36
  },

  // Men's collection
  {
    category: 'ao',
    title: 'Áo polo nam basic',
    description: 'Áo polo cotton, form regular, phù hợp mặc hàng ngày hoặc đi chơi.',
    highlights: [
      { title: 'FORM REGULAR', text: 'Form regular dễ mặc, phù hợp nhiều hoàn cảnh.' },
      { title: 'COTTON MỀM', text: 'Sợi cotton thoáng mát, thấm hút tốt.' }
    ],
    img: [fileToDataURLWithFallback('aopolonambasic.jpg'), fileToDataURLWithFallback('aopolonambasic2.jpg'), fileToDataURLWithFallback('aopolonambasic3.jpg'), fileToDataURLWithFallback('aopolonambasic4.jpg')].filter(Boolean),
    price: 219000,
    oldPrice: 269000,
    size: ['M','L','XL','XXL'],
    warehouse: 60
  },
  {
    category: 'ao',
    title: 'Áo khoác bomber nam',
    description: 'Áo khoác bomber phong cách, lót nỉ mỏng, phù hợp tiết trời se lạnh.',
    highlights: [
      { title: 'LÓT NỈ ẤM ÁP', text: 'Lót nỉ mỏng giữ ấm mà không cồng kềnh.' },
      { title: 'KIỂU BOMBER', text: 'Phong cách, trẻ trung, dễ phối.' }
    ],
    img: [fileToDataURLWithFallback('aobomber1.jpg'), fileToDataURLWithFallback('aobomber2.jpg'), fileToDataURLWithFallback('aobomber3.jpg'), fileToDataURLWithFallback('aobomber4.jpg')].filter(Boolean),
    price: 799000,
    oldPrice: 999000,
    size: ['M','L','XL'],
    warehouse: 18
  },

  // Kids collection
  {
    category: 'treem',
    title: 'Áo thun bé trai họa tiết',
    description: 'Áo thun 100% cotton dành cho bé trai, in họa tiết an toàn cho da.',
    // prefer a custom image if provided (place file in client imgs/anhsanpham as 'aothunbetrai_custom.jpg')
    img: [
      fileToDataURLWithFallback('aothunbetrai_custom.jpg'),
      fileToDataURLWithFallback('aothunbetrai2.jpg'),
      fileToDataURLWithFallback('aothunbetrai3.jpg'),
      fileToDataURLWithFallback('aothunbetrai4.jpg')
    ].filter(Boolean),
    price: 99000,
    oldPrice: 129000,
    size: ['1Y','2Y','3Y','4Y'],
    warehouse: 80
  },
  {
    category: 'treem',
    title: 'Bộ body sơ sinh - Bé gái',
    description: 'Bộ body mềm mại, dễ mặc, thích hợp cho bé sơ sinh và chăm sóc hàng ngày.',
    img: [fileToDataURLWithFallback('bobodysosinhnu1.jpg'), fileToDataURLWithFallback('bobodysosinhnu2.jpg'), fileToDataURLWithFallback('bobodysosinhnu3.jpg'), fileToDataURLWithFallback('bobodysosinhnu4.jpg')].filter(Boolean),
    price: 129000,
    oldPrice: 169000,
    size: ['0-3M','3-6M'],
    warehouse: 40
  },

  // Accessories / unisex
  {
    category: 'phukien',
    title: 'Túi tote canvas - in chữ',
    description: 'Túi tote vải canvas bền, in chữ phong cách, thích hợp đi học/đi chợ.',
    img: [fileToDataURLWithFallback('tuitote1.jpg'), fileToDataURLWithFallback('tuitote2.jpg'), fileToDataURLWithFallback('tuitote3.jpg'), fileToDataURLWithFallback('tuitote4.jpg')].filter(Boolean),
    price: 89000,
    oldPrice: 119000,
    size: [],
    warehouse: 120
  },

  // Additional womens/seasonal
  {
    category: 'vay',
    title: 'Váy dạo phố họa tiết xanh',
    description: 'Váy nhẹ, hoạ tiết tone xanh dịu, có dây điều chỉnh eo.',
    img: [fileToDataURLWithFallback('vaydaophohoachitiet1.jpg'), fileToDataURLWithFallback('vaydaophohoachitiet2.jpg'), fileToDataURLWithFallback('vaydaophohoachitiet3.jpg'), fileToDataURLWithFallback('vaydaophohoachitiet4.jpg')].filter(Boolean),
    price: 389000,
    oldPrice: 499000,
    size: ['S','M','L'],
    warehouse: 30
  },

  // casual items
  {
    category: 'quan',
    title: 'Quần short jean nữ',
    description: 'Short jean phối rách nhẹ, form ôm vừa phải, dễ phối đồ.',
    img: [fileToDataURLWithFallback('quanshortjeannu1.jpg'), fileToDataURLWithFallback('quanshortjeannu2.jpg'), fileToDataURLWithFallback('quanshortjeannu3.jpg'), fileToDataURLWithFallback('quanshortjeannu4.jpg')].filter(Boolean),
    price: 219000,
    oldPrice: 259000,
    size: ['S','M','L'],
    warehouse: 44
  }
];

// generate additional demo products programmatically to populate categories
function generateDemoProducts(){
  const cats = ['ao','quan','dam','phukien','vay','treem']
  const demos = []
  let counter = 1
  for (let c of cats){
    for (let i = 0; i < 8; i++){
      const title = `${c.toUpperCase()} Demo ${counter}`
      demos.push({
        category: c,
        title,
        description: `Sản phẩm demo ${title}`,
        img: [ fileToDataURLWithFallback('default-demo.jpg') ].filter(Boolean),
        masanpham: generateMasanpham(),
        price: 99000 + (i * 10000),
        oldPrice: 129000 + (i * 10000),
        size: ['S','M','L'],
        warehouse: 50
      })
      counter++
    }
  }
  return demos
}

// Append demo products so DB has a richer catalog for menus
const extraDemoProducts = generateDemoProducts()
Array.prototype.push.apply(sampleProducts, extraDemoProducts)

// Ensure every sample product has a masanpham code before inserting
sampleProducts.forEach((p, idx)=>{
  if (!p.masanpham) p.masanpham = generateMasanpham()
  // ensure sold is present for demo products
  if (typeof p.sold === 'undefined') p.sold = 0
})

async function run(){
  try{
    await client.connect();
    console.log('Connected to Mongo for seeding');
    const db = client.db(process.env.MONGO_DB || 'Hieu-boutique');
    const productsCol = db.collection('products');
    const hotCol = db.collection('hotProducts');

    // Optionally force replace existing data
    const force = process.env.FORCE_SEED === '1' || process.env.FORCE_SEED === 'true'
    const count = await productsCol.countDocuments();
    if (count === 0 || force){
      if (force && count > 0){
        console.log('Force seed enabled — clearing existing product and hotProducts collections');
        await productsCol.deleteMany({});
        await hotCol.deleteMany({});
      }
      const res = await productsCol.insertMany(sampleProducts);
      console.log('Inserted products:', res.insertedCount);
      // Create hot products entries
      const hotDocs = Object.values(res.insertedIds).map(id => ({ productId: id }));
      if (hotDocs.length) await hotCol.insertMany(hotDocs);
      console.log('Inserted hot products:', hotDocs.length);
    } else {
      console.log('Products collection not empty (count=' + count + '), skipping seeding. Use FORCE_SEED=1 to override.');
    }
  }
  catch(err){
    console.error('Seeding error', err);
  }
  finally{
    await client.close();
    process.exit(0);
  }
}

run();
