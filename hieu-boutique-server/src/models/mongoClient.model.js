import mongodb from 'mongodb';

// Use a single MONGO_URI environment variable. Do not keep plaintext credentials in source.
const uri = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB || 'Hieu-boutique';

let client = null;
let _collections = {
    products: null,
    accounts: null,
    coupons: null,
    hotProducts: null,
    collections: null,
    comments: null,
};

async function connectWithRetry(maxRetries = 5, baseDelay = 500) {
    if (!uri) {
        console.error('MONGO_URI is not set. Skipping MongoDB connection. Set MONGO_URI in your environment.');
        return;
    }

    client = new mongodb.MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            await client.connect();
            const db = client.db(MONGO_DB);
            _collections.products = db.collection('products');
            _collections.accounts = db.collection('accounts');
            _collections.coupons = db.collection('coupons');
            _collections.hotProducts = db.collection('hotProducts');
            _collections.collections = db.collection('collections');
            _collections.comments = db.collection('comments');
            // ensure a unique index on masanpham to prevent duplicates (idempotent)
            try{
                _collections.products.createIndex({ masanpham: 1 }, { unique: true, sparse: true }).then(()=>{
                    console.log('Ensured unique index on products.masanpham')
                }).catch(err => {
                    console.warn('Could not create unique index on masanpham:', err && err.message ? err.message : err)
                })
            }catch(e){
                console.warn('Index creation check failed', e && e.message ? e.message : e)
            }
            console.log('Connected to MongoDB');

            // Monitor topology close events and attempt reconnects
            try {
                client.on && client.on('close', () => {
                    console.warn('MongoDB connection closed. Will attempt to reconnect...');
                    // try reconnect in background
                    connectWithRetry(maxRetries, baseDelay).catch(e => console.error(e));
                });
            } catch (e) {
                // client may not support on in some driver contexts; ignore
            }

            return; // success
        } catch (err) {
            const wait = baseDelay * Math.pow(2, attempt);
            console.error(`MongoDB connect attempt ${attempt + 1} failed:`, err && err.message ? err.message : err);
            if (attempt < maxRetries - 1) {
                console.log(`Retrying in ${wait}ms...`);
                await new Promise(res => setTimeout(res, wait));
            } else {
                console.error('Exceeded max MongoDB connection attempts. Collections will be unavailable until connection is restored.');
            }
        }
    }
}

// Initiate connection in background, but allow callers to await via ensureConnected
const connecting = connectWithRetry(6, 500);

async function ensureConnected() {
    // If collections already set, assume connection is ready
    if (_collections.products) return;
    // Wait for initial connecting attempt to finish
    try {
        await connecting;
    } catch (e) {
        // connectWithRetry already logged error
    }
    // If still not connected, attempt a fresh connect synchronously
    if (!_collections.products) {
        await connectWithRetry(6, 500);
    }
}

// explicit initializer (optional) — returns true when connected
async function initMongo(){
    await ensureConnected()
    return !!_collections.products
}

function getProductsCollection() { return _collections.products; }
function getAccountsCollection() { return _collections.accounts; }
function getCouponsCollection() { return _collections.coupons; }
function getHotProductsCollection() { return _collections.hotProducts; }
function getCollectionsCollection() { return _collections.collections; }
function getCommentsCollection() { return _collections.comments }

export { client, ensureConnected, getProductsCollection, getAccountsCollection, getCouponsCollection, getHotProductsCollection, getCollectionsCollection, getCommentsCollection };
