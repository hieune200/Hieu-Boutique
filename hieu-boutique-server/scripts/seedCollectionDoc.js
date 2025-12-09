import 'dotenv/config';
import mongodb from 'mongodb';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI not set. Aborting.');
  process.exit(1);
}

const client = new mongodb.MongoClient(uri);

// Product IDs to reference in the collection (use the unique ones we created)
const featured = [
  '6926cb3262680f418ceec3d9',
  '6926cb3262680f418ceec3da',
  '6926cb3262680f418ceec3db',
  '6926cb3262680f418ceec3dc'
];

const doc = {
  slug: 'thu-dong-2025',
  title: 'BST THU ĐÔNG 2025',
  description: 'Bộ sưu tập Thu Đông 2025 - lựa chọn thời trang ấm áp, thanh lịch.',
  banner: 'Banner/banner1.jpg',
  featured: featured,
  createdAt: new Date()
}

async function run(){
  try{
    await client.connect();
    const db = client.db(process.env.MONGO_DB || 'Hieu-boutique');
    const col = db.collection('collections');
    const res = await col.updateOne({ slug: doc.slug }, { $set: doc }, { upsert: true });
    if (res.upsertedId) {
      const up = res.upsertedId._id ? res.upsertedId._id : res.upsertedId;
      console.log('Inserted collection doc ->', up.toString());
    } else console.log('Updated collection doc slug=', doc.slug);
  } catch(err){
    console.error('Error seeding collection doc', err);
  } finally{
    await client.close();
  }
}

run();
