import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import cors from "cors"
import path from 'path'

import authenticate from "./src/routers/authenticate.route.js";
import products from "./src/routers/products.route.js";
import chatbot from "./src/routers/chatbot.route.js";
import newsletter from "./src/routers/newsletter.route.js";
import coupons from "./src/routers/coupons.route.js";
import comments from "./src/routers/comments.route.js";
import { ensureConnected } from './src/models/mongoClient.model.js'

const app = express();
// const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ limit: "2mb" }))
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" })); 
app.use(cors())
app.options('*', cors())

// serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')))

app.get('/', (req, res)=>{
    res.send('<h1>Server của Hieu-boutique</h1>')
})

app.use('/products/',products)
app.use('/auth/', authenticate)
app.use('/chatbot/', chatbot)
app.use('/newsletter/', newsletter)
app.use('/coupons/', coupons)
app.use('/comments/', comments)
// Use a single fixed port for the backend. If it's unavailable, exit with a clear error
const PORT = Number(process.env.PORT) || 3000

// Ensure DB is connected before listening — fail fast when DB is unavailable
;(async ()=>{
    try{
        await ensureConnected()
        console.log('MongoDB connected — server starting')
    }
    catch(err){
        console.warn('Warning: MongoDB initialization failed. Server will start without DB. Error:', err && err.message ? err.message : err)
    }

    const server = app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`)
    })

    server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. To keep the backend on port ${PORT}, stop the process currently using that port or change the PORT environment variable.`)
            process.exit(1)
        }
        console.error('Server failed to start:', err && err.message ? err.message : err)
        process.exit(1)
    })

    // Keep attempting to connect in background if initial connection failed
    // connectWithRetry is already running in the model; nothing else to do here.
})()