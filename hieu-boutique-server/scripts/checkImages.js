import mongodb from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb+srv://root:123@cluster0.4r3jmya.mongodb.net/?appName=Cluster0';
const client = new mongodb.MongoClient(uri);

async function run(){
  try{
    await client.connect();
    const db = client.db(process.env.MONGO_DB || 'Hieu-boutique');
    const col = db.collection('products');
    const docs = await col.find({}).toArray();
    console.log('Found', docs.length, 'products');
    docs.forEach((d, i) => {
      console.log('--- Product', i, '---');
      console.log('title:', d.title);
      if (!d.img) { console.log('img: MISSING'); return }
      console.log('img type:', Array.isArray(d.img) ? 'array' : typeof d.img);
      if (Array.isArray(d.img)){
        console.log('img count:', d.img.length);
        d.img.forEach((s, idx) => {
          if (!s) console.log('  img', idx, ': null');
          else console.log('  img', idx, ':', (typeof s === 'string' ? s.slice(0,60) : '[non-string]'));
        })
      } else {
        console.log('img value:', typeof d.img === 'string' ? d.img.slice(0,60) : '[non-string]')
      }
    })
  }
  catch(err){
    console.error('check error', err)
  }
  finally{
    await client.close();
    process.exit(0);
  }
}

run();
