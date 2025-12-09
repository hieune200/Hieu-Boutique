import { useState, useEffect, useMemo } from 'react'
import Productcard from '../../components/ProductCard'
import FilterDropdown from '../../components/FilterDropdown'
import { categoryAPIPage, productDetail } from '../../services/products.api'
import '../homepage/homepageStyle/HotProducts.scss'
import SaleCarousel from '../../components/SaleCarousel'
import PromoFeatures from '../homepage/PromoFeatures'

// Sale page: similar layout to Productpage, but only shows high-discount / active-sale products
const SalePage = ()=>{
    const [productList, setProductList] = useState([])
    const [filters, setFilters] = useState({})
    const [colorOptions, setColorOptions] = useState([])
    const [displayProducts, setDisplayProducts] = useState(null)
    const [loadingDisplay, setLoadingDisplay] = useState(false)
    const [sortOption, setSortOption] = useState('default')

    const DISCOUNT_THRESHOLD = 20

    useEffect(()=>{
        let mounted = true
        async function load(){
            // ask backend to only return products with discount >= DISCOUNT_THRESHOLD
            const res = await categoryAPIPage('all', { discountMin: DISCOUNT_THRESHOLD }, 1, 300)
            let list = []
            if (res && res.status && res.data) list = res.data.items || res.data || []
            else if (Array.isArray(res)) list = res

            // normalize: fetch details if items are ids
            let products = []
            const hasObjects = list.length && typeof list[0] === 'object'
            if (hasObjects) products = list
            else {
                const ids = list.slice(0, 300)
                const details = await Promise.all(ids.map(id => productDetail(id).then(r=> r && (r.data || r)).catch(()=>null)))
                products = details.filter(Boolean)
            }

            // keep only sale items
            const now = Date.now()
            function isOnSale(p){
                if (!p) return false
                // price fields
                const price = (typeof p.price === 'number') ? Number(p.price) : (p.price && typeof p.price === 'object' ? Number(p.price.value || p.price.current || p.price.price || 0) : Number(p.price || 0))
                const salePrice = (typeof p.salePrice === 'number') ? Number(p.salePrice) : (p.priceFinal && typeof p.priceFinal === 'number' ? Number(p.priceFinal) : Number(p.salePrice || 0))
                if (price && salePrice && price > salePrice){
                    const percent = Math.round(((price - salePrice) / price) * 100)
                    if (percent >= DISCOUNT_THRESHOLD) return true
                }
                if (typeof p.discountPercent === 'number' && p.discountPercent >= DISCOUNT_THRESHOLD) return true
                if (typeof p.discount === 'number' && p.discount >= DISCOUNT_THRESHOLD) return true
                const started = p.saleStart || p.promoStart || p.sale_from || p.promotionStart
                const ended = p.saleEnd || p.promoEnd || p.sale_to || p.promotionEnd
                try{
                    const s = started ? (new Date(started)).getTime() : null
                    const e = ended ? (new Date(ended)).getTime() : null
                    if (s && e && !isNaN(s) && !isNaN(e) && now >= s && now <= e) return true
                    if (s && !e && !isNaN(s) && now >= s) return true
                }catch(e){ console.warn(e) }
                if (p.isOnSale || p.onSale || p.sale === true) return true
                return false
            }

            let filtered = products.filter(isOnSale)
            // If no sale items found, fall back to showing a few likely-sale products
            if ((!filtered || filtered.length === 0) && Array.isArray(products) && products.length){
                // prefer items that have oldPrice > price (explicit discount)
                const byOldPrice = products.filter(p => p && typeof p.oldPrice !== 'undefined' && typeof p.price !== 'undefined' && Number(p.oldPrice) > Number(p.price))
                if (byOldPrice.length) filtered = byOldPrice.slice(0, 8)
                else filtered = products.slice(0, Math.min(8, products.length))
            }
            if (mounted) setProductList(filtered)
        }
        load()
        return ()=> mounted = false
    },[])

    // derive colors from products
    useEffect(()=>{
        let mounted = true
        async function derive(list){
            if (!Array.isArray(list) || list.length === 0) return setColorOptions([])
            const sample = list[0]
            if (sample && typeof sample === 'object' && (sample.colors || sample.color)){
                const set = new Set()
                list.forEach(p=>{
                    const raw = p.colors || p.color
                    if (!raw) return
                    if (Array.isArray(raw)) raw.forEach(c=>c && set.add(String(c)))
                    else if (typeof raw === 'string') raw.split(',').map(s=>s.trim()).filter(Boolean).forEach(c=>set.add(String(c)))
                })
                if (mounted) setColorOptions(Array.from(set))
                return
            }
            try{
                const ids = list.slice(0,12)
                const details = await Promise.all(ids.map(id=> productDetail(id).catch(()=>null) ))
                const set = new Set()
                details.forEach(r=>{
                    const data = r && r.data ? r.data : r
                    if (!data) return
                    const raw = data.colors || data.color
                    if (!raw) return
                    if (Array.isArray(raw)) raw.forEach(c=>c && set.add(String(c)))
                    else if (typeof raw === 'string') raw.split(',').map(s=>s.trim()).filter(Boolean).forEach(c=>set.add(String(c)))
                })
                if (mounted) setColorOptions(Array.from(set))
            }catch(e){ console.warn(e) }
        }
        derive(productList || [])
        return ()=> mounted = false
    },[productList])

    // client-side filtering
    useEffect(()=>{
        let mounted = true
        async function prepare(){
            if (!productList) { setDisplayProducts(null); return }
            setLoadingDisplay(true)
            const items = Array.isArray(productList) ? productList : []
            function matches(p){
                if (!p) return false
                if (Array.isArray(filters.colors) && filters.colors.length){
                    const raw = p.colors || p.color || ''
                    const arr = Array.isArray(raw) ? raw.map(String) : (typeof raw === 'string' ? raw.split(',').map(s=>s.trim()) : [])
                    const arrLower = arr.map(a=>a.toLowerCase())
                    const anyMatch = filters.colors.some(fc => arrLower.includes(String(fc).toLowerCase()))
                    if (!anyMatch) return false
                }
                if (Array.isArray(filters.sizes) && filters.sizes.length){
                    const raw = p.size || p.sizes || ''
                    const arr = Array.isArray(raw) ? raw.map(String) : (typeof raw === 'string' ? raw.split(',').map(s=>s.trim()) : [])
                    const arrLower = arr.map(a=>a.toLowerCase())
                    const anyMatch = filters.sizes.some(fs => arrLower.includes(String(fs).toLowerCase()))
                    if (!anyMatch) return false
                }
                const priceCandidate = (()=>{
                    if (typeof p.price === 'number') return Number(p.price)
                    if (p.price && typeof p.price === 'object') return Number(p.price.value || p.price.current || p.price.sale || p.price.price || 0)
                    if (typeof p.salePrice === 'number') return Number(p.salePrice)
                    if (typeof p.priceFinal === 'number') return Number(p.priceFinal)
                    return Number(p.price || 0)
                })()
                if (typeof filters.priceMin !== 'undefined'){ if (priceCandidate < Number(filters.priceMin)) return false }
                if (typeof filters.priceMax !== 'undefined'){ if (priceCandidate > Number(filters.priceMax)) return false }
                return true
            }
            let filtered = items.filter(matches)
            if (mounted){ setDisplayProducts(filtered); setLoadingDisplay(false) }
        }
        prepare()
        return ()=> mounted = false
    },[productList, filters])

    const sortedProducts = useMemo(()=>{
        const src = Array.isArray(displayProducts) ? displayProducts : (Array.isArray(productList) ? productList : [])
        if (!Array.isArray(src) || src.length === 0) return []
        const items = src.slice()
        const priceOf = (p) => {
            if (!p) return 0
            if (typeof p.price === 'number') return Number(p.price)
            if (p.price && typeof p.price === 'object') return Number(p.price.value || p.price.current || p.price.sale || p.price.price || 0)
            if (typeof p.salePrice === 'number') return Number(p.salePrice)
            if (typeof p.priceFinal === 'number') return Number(p.priceFinal)
            return Number(p.price || 0)
        }
        const dateOf = (p) => {
            if (!p) return 0
            const d = p.createdAt || p.created || p.publishedAt || p.date || p.updatedAt
            const t = d ? (new Date(d)).getTime() : 0
            return isNaN(t) ? 0 : t
        }
        if (sortOption === 'price_asc') items.sort((a,b)=> priceOf(a) - priceOf(b))
        else if (sortOption === 'price_desc') items.sort((a,b)=> priceOf(b) - priceOf(a))
        else if (sortOption === 'newest') items.sort((a,b)=> dateOf(b) - dateOf(a))
        else if (sortOption === 'oldest') items.sort((a,b)=> dateOf(a) - dateOf(b))
        return items
    },[sortOption, displayProducts, productList])

    function onFilterChange(key, val){
        const next = Object.assign({}, filters)
        if (val === null || (Array.isArray(val) && val.length===0) || (typeof val === 'object' && Object.keys(val).length===0)) delete next[key]
        else next[key] = val
        setFilters(next)
    }

    return (
        <main className="shoppage">
            
            {/* Full-width sale banners (separate from PromoFeatures) */}
            <SaleCarousel />
            {/* Promo/coupons area (moved above filters) */}
            <PromoFeatures />

            <section className="shoppage_filter">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                    <div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'center'}}>
                        <FilterDropdown title={'Màu sắc'} type={'multi'} options={colorOptions.length ? colorOptions : ['Đen','Trắng','Đỏ','Xanh','Hồng']} value={filters.colors || []} onChange={(v)=> onFilterChange('colors', v)} />
                        <FilterDropdown title={'Kích thước'} type={'multi'} options={['XS','S','M','L','XL','XXL']} value={filters.sizes || [] } onChange={(v)=> onFilterChange('sizes', v)} />
                        <FilterDropdown title={'Khoảng giá'} type={'range'} value={{ min: filters.priceMin, max: filters.priceMax }} onChange={(v)=> {
                            const next = Object.assign({}, filters)
                            if (typeof v.min !== 'undefined') next.priceMin = v.min; else delete next.priceMin
                            if (typeof v.max !== 'undefined') next.priceMax = v.max; else delete next.priceMax
                            setFilters(next)
                        }} />
                    </div>
                    <div style={{display:'flex',alignItems:'center'}}>
                        <div style={{fontWeight:700,marginRight:12}}>Sắp xếp theo</div>
                        <div style={{position:'relative',display:'inline-flex',alignItems:'center'}}>
                            <select value={sortOption} onChange={(e)=> setSortOption(e.target.value)} style={{ WebkitAppearance:'none', MozAppearance:'none', appearance:'none', border:'1px solid rgba(0,0,0,0.06)', background:'#f6f6f6', padding:'6px 28px 6px 12px', borderRadius:20, minWidth:130, height:36, fontSize:13, outline:'none', cursor:'pointer' }}>
                                <option value="default">Mặc định</option>
                                <option value="price_asc">Giá: Từ thấp đến cao</option>
                                <option value="price_desc">Giá: Từ cao đến thấp</option>
                                <option value="newest">Mới nhất</option>
                                <option value="oldest">Cũ nhất</option>
                            </select>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#333',opacity:0.7}}>
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            </section>

            {loadingDisplay ? (<div style={{padding:24,color:'#666'}}>Đang tải sản phẩm...</div>) : null}

            <section className="shoppage_product-list">
                { (Array.isArray(sortedProducts) ? sortedProducts : []).map((item, index)=>{
                    if (!item) return null
                    if (typeof item === 'object'){
                        const pid = item._id || item.id || item._id === 0 ? item._id : null
                        return <Productcard id={String(pid || index)} key={`sale${index}`} />
                    }
                    return <Productcard id={String(item)} key={`sale${index}`} />
                }) }
                { Array.isArray(displayProducts) && displayProducts.length === 0 ? (<div style={{padding:24,color:'#666'}}>Không có sản phẩm giảm giá phù hợp.</div>) : null }
            </section>
        </main>
    )
}

export default SalePage
