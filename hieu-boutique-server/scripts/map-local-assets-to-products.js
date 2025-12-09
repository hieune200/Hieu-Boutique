#!/usr/bin/env node
/**
 * map-local-assets-to-products.js
 *
 * Scans client asset images under ../hieu-boutique-client/src/assets/imgs/anhsanpham/
 * and attempts to match them to products in the database by tokenizing
 * product titles and filename tokens. When a good match is found, the script
 * converts the image to a data URL and updates the product's `img` field
 * (replacing it or prepending) so the product pages will show the local
 * asset without further hosting setup.
 *
 * Usage:
 *  $env:MONGO_URI = 'mongodb://localhost:27017'; $env:MONGO_DB='Hieu-boutique'
 *  node .\scripts\map-local-assets-to-products.js
 *
 * NOTE: This makes irreversible updates to product documents. Back up your
 * database or run on a staging copy first. The script will print a summary
 * of updates it would make and will prompt for confirmation before writing
 * unless you pass `--yes`.
 */

const fs = require('fs').promises
const path = require('path')
const { MongoClient } = require('mongodb')

const ASSET_DIR = path.resolve(__dirname, '..', '..', 'hieu-boutique-client', 'src', 'assets', 'imgs', 'anhsanpham')
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017'
const MONGO_DB = process.env.MONGO_DB || 'Hieu-boutique'
const CONFIRM_FLAG = process.argv.includes('--yes') || process.argv.includes('-y')

function toDataURL(filePath){
    return fs.readFile(filePath).then(buf => {
        const ext = path.extname(filePath).toLowerCase().replace('.', '')
        const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'application/octet-stream')
        // use base64 for non-svg for safety; svg keep utf8
        if (ext === 'svg'){
            return `data:${mime};utf8,${encodeURIComponent(buf.toString('utf8'))}`
        }
        return `data:${mime};base64,${buf.toString('base64')}`
    })
}

function tokenize(s){
    return String(s || '').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(Boolean)
}

async function main(){
    console.log('Scanning asset folder:', ASSET_DIR)
    const files = await fs.readdir(ASSET_DIR)
    const assetFiles = files.filter(f => /\.(png|jpg|jpeg|svg)$/i.test(f)).map(f=> path.join(ASSET_DIR,f))
    if (!assetFiles.length) {
        console.error('No image assets found in', ASSET_DIR)
        process.exit(1)
    }

    const client = new MongoClient(MONGO_URI, { useUnifiedTopology:true })
    await client.connect()
    const db = client.db(MONGO_DB)
    const products = db.collection('products')

    const cursor = products.find({}, { projection: { title:1, category:1, img:1 } })
    const planned = []

    while (await cursor.hasNext()){
        const doc = await cursor.next()
        const title = doc.title || ''
        const cat = doc.category || ''
        const tokens = tokenize(title + ' ' + cat)
        // Score assets by matching filename tokens
        const scores = assetFiles.map(f => {
            const name = path.basename(f).toLowerCase()
            let score = 0
            tokens.forEach(t => { if (name.includes(t)) score += 1 })
            // small boost for exact category match
            if (cat && name.includes(String(cat).toLowerCase())) score += 1
            return { file: f, score }
        }).sort((a,b) => b.score - a.score)

        const best = scores[0]
        if (best && best.score > 0){
            planned.push({ _id: doc._id, title, file: best.file, score: best.score, existingImgCount: Array.isArray(doc.img)? doc.img.length : (doc.img?1:0) })
        }
    }

    if (!planned.length){
        console.log('No candidate matches found between products and local assets.')
        await client.close()
        return
    }

    console.log('Planned updates (sample 20):')
    console.table(planned.slice(0,20).map(p => ({ _id: String(p._id), title: p.title, file: path.basename(p.file), score: p.score, existingImgCount: p.existingImgCount })))

    if (!CONFIRM_FLAG){
        console.log('\nThis will update the `img` field of the listed products to use the matched local image as a data-url.\nRun again with `--yes` to apply changes.')
        await client.close()
        return
    }

    console.log('Applying updates...')
    let updated = 0
    for (const p of planned){
        try{
            const dataUrl = await toDataURL(p.file)
            // Replace the img field with the dataUrl as the first image
            await products.updateOne({ _id: p._id }, { $set: { img: [dataUrl] } })
            updated++
        }catch(err){
            console.error('Failed to update', p._id, err && err.message)
        }
    }

    console.log('Done. Updated', updated, 'products.')
    await client.close()
}

main().catch(err => { console.error(err); process.exit(1) })
