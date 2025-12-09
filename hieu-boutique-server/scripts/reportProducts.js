import mongodb from 'mongodb';
const uri = process.env.MONGO_URI || 'mongodb+srv://root:123@cluster0.4r3jmya.mongodb.net/?appName=Cluster0';
const client = new mongodb.MongoClient(uri);
(async function(){
  try{
    await client.connect();
    const db = client.db(process.env.MONGO_DB || 'Hieu-boutique');
    const products = await db.collection('products').find({}).toArray();
    console.log('Products in DB:', products.length);
    products.forEach(p => {
      const imgCount = Array.isArray(p.img) ? p.img.length : 0;
      console.log(`- ${p.title} | id=${p._id} | images=${imgCount}`);
      if (imgCount && imgCount < 4){
        console.log('  -> images list:', p.img);
      }
    });
  }catch(e){
    console.error('Report error', e);
  }finally{
    await client.close();
    process.exit(0);
  }
})();
