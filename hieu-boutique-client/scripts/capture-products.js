import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import net from 'net';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function portIsOpen(port){
  return new Promise(resolve => {
    const socket = new net.Socket();
    socket.setTimeout(1200);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { resolve(false); });
    socket.connect(port, '127.0.0.1');
  });
}

async function findServer(){
  const ports = [5173,5174,5175,5176,5177,5178];
  for (const p of ports){
    // try http
     
    if (await portIsOpen(p)) return p;
  }
  throw new Error('No local dev server detected on ports ' + ports.join(','));
}

(async ()=>{
  try{
    const forced = process.env.DEV_SERVER_PORT || process.env.PORT || null;
    const port = forced ? Number(forced) : await findServer();
    const base = `http://localhost:${port}`;
    console.log('Using dev server at', base);

    const outDir = path.resolve(__dirname, '..', 'screenshots');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const browser = await puppeteer.launch({args: ['--no-sandbox','--disable-setuid-sandbox']});
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    await page.goto(base, { waitUntil: 'networkidle2', timeout: 60000 });
    // wait for product cards
    await page.waitForSelector('.productcard', { timeout: 15000 });
    const cards = await page.$$('.productcard');
    console.log('Found', cards.length, 'product cards');

    for (let i=0;i<cards.length;i++){
      const el = cards[i];
      // try to extract title
      const title = await el.$eval('.title', node => node.innerText.trim()).catch(()=>`product-${i+1}`);
      const safe = title.replace(/[^a-z0-9-]/gi,'_').slice(0,60);
      const file = path.join(outDir, `${i+1}_${safe}.png`);
      const bbox = await el.boundingBox();
      if (!bbox){
        console.warn('No bounding box for card', i);
        continue;
      }
      await page.screenshot({ path: file, clip: { x: Math.max(0,bbox.x-6), y: Math.max(0,bbox.y-6), width: Math.min(bbox.width+12,1200), height: Math.min(bbox.height+12,900) } });
      console.log('Saved', file);
    }

    await browser.close();
    console.log('Done. Screenshots in', outDir);
    process.exit(0);
  }catch(err){
    console.error('Capture error', err);
    process.exit(1);
  }
})();
