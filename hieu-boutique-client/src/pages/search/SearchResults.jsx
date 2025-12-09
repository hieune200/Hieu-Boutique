import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchProducts } from '../../services/products.api'
import Productcard from '../../components/ProductCard'
import '../../pages/productpage/productpage.scss'

const SearchResults = ()=>{
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  useEffect(()=>{
    let mounted = true
    async function run(){
      const keyword = (q || '').trim()
      if (!keyword) {
        setResults([])
        return
      }
      setLoading(true)
      try{
        const res = await searchProducts(keyword)
        const data = (res && res.data) ? res.data : (Array.isArray(res) ? res : [])
        if (!mounted) return
        setResults(data)
      }catch(e){
        if (!mounted) return
        setResults([])
      }finally{ if (mounted) setLoading(false) }
    }
    run()
    return ()=> { mounted = false }
  },[q])

  return (
    <main className="static-page container">
      <section style={{margin: '18px 0'}}>
        <h1>Tìm kiếm: "{q}"</h1>
        <p style={{color:'#666'}}>Kết quả tìm kiếm sản phẩm khớp với từ khóa bạn nhập.</p>
      </section>

      <section className="shoppage_product-list">
        {loading && <div style={{padding:24,color:'#666'}}>Đang tìm kiếm...</div>}
        {!loading && results.length === 0 && <div style={{padding:24,color:'#666'}}>Không tìm thấy sản phẩm phù hợp.</div>}
        {
          !loading && results.length > 0 && results.map((p, idx) => {
            const pid = (p && (p._id || p.id)) ? String(p._id || p.id) : String(idx)
            return <Productcard id={pid} key={pid} />
          })
        }
      </section>
    </main>
  )
}

export default SearchResults
