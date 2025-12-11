import 'dotenv/config';
import logger from './src/utils/logger.js'
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
// Configure CORS to reflect the request origin and allow credentials
// When the client sends credentials (cookies), the server must not return '*'
const corsOptions = {
    origin: true, // reflect request origin
    credentials: true,
    // allow the custom `user-id` header used by the client along with common headers
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'user-id']
}
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

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
        logger.info('MongoDB connected — server starting')
    }
    catch(err){
        logger.warn('Warning: MongoDB initialization failed. Server will start without DB.', { message: err && err.message ? err.message : err })
    }

    // attempt to listen on PORT, but if it's in use try next available ports up to a limit
    async function listenWithRetry(startPort, maxAttempts = 10){
        let port = startPort
        for (let i = 0; i < maxAttempts; i++){
            try{
                const server = app.listen(port)
                await new Promise((resolve, reject) => {
                    server.once('listening', () => resolve())
                    server.once('error', (err) => reject(err))
                })
                logger.info(`Server listening on http://localhost:${port}`)
                // attach an error listener to log unexpected runtime errors
                server.on('error', (err) => {
                    logger.error('Server runtime error', { message: err && err.message ? err.message : err, code: err && err.code ? err.code : undefined })
                })
                return server
            }catch(err){
                if (err && err.code === 'EADDRINUSE'){
                    logger.warn(`Port ${port} is already in use, trying next port...`) 
                    port = port + 1
                    // continue to next attempt
                    await new Promise(r => setTimeout(r, 200))
                    continue
                }
                logger.error('Failed to start server', { message: err && err.message ? err.message : err })
                throw err
            }
        }
        throw new Error(`No available ports after ${maxAttempts} attempts starting from ${startPort}`)
    }

    try{
        await listenWithRetry(PORT, 20)
    }catch(err){
        logger.error('Unable to bind to any port; exiting', { message: err && err.message ? err.message : err })
        process.exit(1)
    }

    // Keep attempting to connect in background if initial connection failed
    // connectWithRetry is already running in the model; nothing else to do here.
})()

// Route console.* to logger so existing console.error calls still get captured to files
try{
    console.error = (...args) => { logger.error(args.map(a=> (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')) }
    console.warn = (...args) => { logger.warn(args.map(a=> (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')) }
    console.log = (...args) => { logger.info(args.map(a=> (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')) }
}catch(e){ /* ignore if mapping fails */ }

// Global handlers to make sure unexpected errors are logged with stack traces
process.on('uncaughtException', (err) => {
    try{ logger.error('uncaughtException', { message: err && err.message ? err.message : String(err), stack: err && err.stack ? err.stack : null }) }catch(e){ try{ console.error('uncaughtException', err) }catch(_){} }
})

process.on('unhandledRejection', (reason) => {
    try{ logger.error('unhandledRejection', { reason: reason && (reason.message || reason.stack) ? (reason.message || reason.stack) : String(reason) }) }catch(e){ try{ console.error('unhandledRejection', reason) }catch(_){} }
})