(async ()=>{
  try{
    const res = await fetch('http://localhost:3000/products/hot-products')
    const json = await res.json()
    console.log(JSON.stringify(json, null, 2))
  }catch(e){
    console.error('fetch error', e && (e.message||e))
    process.exit(2)
  }
})()
