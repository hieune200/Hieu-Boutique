(async ()=>{
  const urls = ['http://localhost:5173/','http://localhost:5173/src/main.jsx','http://localhost:5173/@vite/client']
  for (const u of urls){
    try{
      const res = await fetch(u)
      console.log('\n---', u, 'status=', res.status)
      const text = await res.text()
      console.log('len=', text.length)
      console.log(text.slice(0,500))
    }catch(e){ console.error('fetch-error', u, e && e.message) }
  }
})()
