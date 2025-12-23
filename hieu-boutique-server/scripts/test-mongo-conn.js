import { MongoClient } from 'mongodb';

async function test(){
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(2);
  }

  // try with a few option sets to diagnose
  const attempts = [
    { name: 'default', opts: {} },
    { name: 'tls-insecure', opts: { tls: true, tlsAllowInvalidCertificates: true, tlsAllowInvalidHostnames: true } },
    { name: 'force-authSource-admin', opts: { tls: true, authSource: 'admin' } }
  ];

  for (const a of attempts){
    console.log(`\nAttempt: ${a.name} with opts:`, a.opts);
    try{
      const client = new MongoClient(uri, Object.assign({ serverSelectionTimeoutMS: 5000 }, a.opts));
      await client.connect();
      const info = await client.db('admin').command({ connectionStatus: 1 });
      console.log('Connected ok — user info keys:', Object.keys(info));
      await client.close();
      return process.exit(0);
    }catch(e){
      console.error('Error:', e && e.message ? e.message : e);
    }
  }
  process.exit(1);
}

test().catch(e=>{ console.error('Fatal:', e && e.stack ? e.stack : e); process.exit(3) });
