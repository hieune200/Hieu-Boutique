// Auto-generated map of local JPG/PNG product assets to URLs
// ProductCard will try to match product title/category tokens to these names
const assets = [
  'aobomber1.jpg','aobomber2.jpg','aobomber3.jpg','aobomber4.jpg',
  'aothunbetrai1.jpg','aothunbetrai2.jpg','aothunbetrai3.jpg','aothunbetrai4.jpg',
  'aopolonambasic.jpg','aopolonambasic2.jpg','aopolonambasic3.jpg','aopolonambasic4.jpg',
  'bobodysosinhnu1.jpg','bobodysosinhnu2.jpg','bobodysosinhnu3.jpg','bobodysosinhnu4.jpg',
  'damxoehoanhi1.jpg','damxoehoanhi2.jpg','damxoehoanhi3.jpg','damxoehoanhi4.jpg',
  'quanshortjeannu1.jpg','quanshortjeannu2.jpg','quanshortjeannu3.jpg','quanshortjeannu4.jpg',
  'quanjeanongsuongnu1.jpg','quanjeanongsuongnu2.jpg','quanjeanongsuongnu3.jpg'
]

const map = assets.map(name => ({ name, url: new URL(`./${name}`, import.meta.url).href }))

export default map
