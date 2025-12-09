import { useParams, Link, useNavigate } from 'react-router-dom'
import { handleBreadcrumbClick } from '../../utils/breadcrumb'
import { useEffect, useState, useMemo } from 'react'

import Productcard from '../../components/ProductCard'
import {categoryAPI, categoryAPIPage, fetchCatalog, productDetail} from '../../services/products.api'
import FilterDropdown from '../../components/FilterDropdown'
import './productpage.scss'
import { useToast } from '../../components/ToastProvider'

const Shoppage = ()=>{
    const { category } = useParams()
    const [productList, setProductList] = useState()
    const [filters, setFilters] = useState({})
    const [, setCatalog] = useState({ categories: [], collections: [] })
    const [colorOptions, setColorOptions] = useState([])
    const [displayProducts, setDisplayProducts] = useState(null)
    const [loadingDisplay, setLoadingDisplay] = useState(false)
    // debug state removed for production
    const [, setShowFallbackInfo] = useState(false)
    const [sortOption, setSortOption] = useState('default')

    const navigate = useNavigate()
    const { showToast } = useToast()

    // fetch products when category or filters change
    useEffect(()=>{
        scrollTo({top: 0, behavior: 'smooth'})
        async function getCategoryData(cat, filters){
            console.debug('[ProductPage] getCategoryData', { cat, filters })
            // if filters are present, ask for a larger page so client-side can filter more candidates
            let res
            try{
                // Some backends filter by the route `category` param and don't expect an extra `collections` query param.
                // To avoid double-filtering or mismatched param names, remove `collections` when calling the server
                const filtersToSend = Object.assign({}, filters || {})
                if (filtersToSend.collections) delete filtersToSend.collections
                if (filters && Object.keys(filters).length){
                    res = await categoryAPIPage(cat, filtersToSend, 1, 200)
                } else {
                    res = await categoryAPI(cat, filtersToSend)
                }
            }catch(e){
                res = await categoryAPI(cat, filters)
            }
                console.debug('[ProductPage] categoryAPI response', res)
            if (!res) return
            if (res.status == 500) {
                try{ showToast(res.message || 'Lỗi khi tải danh mục', 'error') }catch(e){ console.warn(e) }
                return
            }
            // Normalize: if server returned paged wrapper, extract items
            if (res.data && res.data.items) setProductList(res.data.items)
            else setProductList(res.data || res)
        }
        getCategoryData(category, filters)
    },[category, JSON.stringify(filters), showToast])

    // derive available color options from the returned product list
    useEffect(()=>{
        let mounted = true
        async function deriveColors(list){
            if (!Array.isArray(list) || list.length === 0) return setColorOptions([])
            // if items look like product objects with colors, extract directly
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
            // otherwise list appears to be ids; try to fetch details for first 12 ids to collect colors
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
            }catch(e){
                // ignore
            }
        }
        deriveColors(productList || [])
        return ()=> mounted = false
    },[productList])

    // Client-side filtering fallback: when productList contains ids (or backend doesn't support server filters),
    // fetch product details for a subset and apply filters in-browser.
    useEffect(()=>{
        let mounted = true
        async function prepareDisplay(){
            if (!productList) {
                setDisplayProducts(null)
                return
            }
            setLoadingDisplay(true)
            // if productList already contains product objects, use them
            const items = Array.isArray(productList) ? productList : []
            const hasObjects = items.length && typeof items[0] === 'object'
            console.debug('[ProductPage] prepareDisplay - items count', items.length, 'hasObjects?', !!hasObjects)
            let products = []
            if (hasObjects){
                products = items
            } else {
                // items are probably ids -> fetch up to 48 product details
                const ids = items.slice(0, 48)
                console.debug('[ProductPage] prepareDisplay - will fetch details for ids sample', ids.slice(0,6))
                const details = await Promise.all(ids.map(id => productDetail(id).then(r => r && (r.data || r)).catch(() => null)))
                products = details.filter(Boolean)
                console.debug('[ProductPage] prepareDisplay - fetched details count', products.length, 'sample', products.slice(0,3).map(p=> ({ id: p._id || p.id, title: p.title || p.name })) )
            }

            // filter helper
            function matches(p){
                if (!p) return false
                // collections / category: robust matching against different possible fields
                if (Array.isArray(filters.collections) && filters.collections.length){
                    const key = String(filters.collections[0]).toLowerCase()
                    const candidates = []
                    if (p.collection) candidates.push(p.collection)
                    if (p.category) candidates.push(p.category)
                    if (p.collections) candidates.push(p.collections)
                    if (p.tags) candidates.push(p.tags)
                    // flatten to strings
                    const strings = []
                    ;(Array.isArray(candidates) ? candidates : [candidates]).forEach(c => {
                        if (!c) return
                        if (typeof c === 'string') strings.push(c.toLowerCase())
                        else if (Array.isArray(c)) c.forEach(x=> x && strings.push(String(x).toLowerCase()))
                        else if (typeof c === 'object'){
                            ['key','slug','name','_id','id','title'].forEach(k=>{
                                if (c[k]) strings.push(String(c[k]).toLowerCase())
                            })
                        }
                    })
                    if (!strings.some(s => s === key || s.includes(key))) return false
                }
                // colors
                if (Array.isArray(filters.colors) && filters.colors.length){
                    const raw = p.colors || p.color || ''
                    const arr = Array.isArray(raw) ? raw.map(String) : (typeof raw === 'string' ? raw.split(',').map(s=>s.trim()) : [])
                    const arrLower = arr.map(a=>a.toLowerCase())
                    const anyMatch = filters.colors.some(fc => arrLower.includes(String(fc).toLowerCase()))
                    if (!anyMatch) return false
                }
                // sizes
                if (Array.isArray(filters.sizes) && filters.sizes.length){
                    const raw = p.size || p.sizes || p.sizeList || ''
                    const arr = Array.isArray(raw) ? raw.map(String) : (typeof raw === 'string' ? raw.split(',').map(s=>s.trim()) : [])
                    const arrLower = arr.map(a=>a.toLowerCase())
                    const anyMatch = filters.sizes.some(fs => arrLower.includes(String(fs).toLowerCase()))
                    if (!anyMatch) return false
                }
                // price range: try several possible fields
                const priceCandidate = (()=>{
                    if (typeof p.price === 'number') return Number(p.price)
                    if (p.price && typeof p.price === 'object'){
                        return Number(p.price.value || p.price.current || p.price.sale || p.price.price || 0)
                    }
                    if (typeof p.salePrice === 'number') return Number(p.salePrice)
                    if (typeof p.priceFinal === 'number') return Number(p.priceFinal)
                    return Number(p.price || 0)
                })()
                if (typeof filters.priceMin !== 'undefined'){
                    if (priceCandidate < Number(filters.priceMin)) return false
                }
                if (typeof filters.priceMax !== 'undefined'){
                    if (priceCandidate > Number(filters.priceMax)) return false
                }
                return true
            }

            let filtered = products.filter(matches)
            console.debug('[ProductPage] prepareDisplay - filtered count', filtered.length, 'from', products.length)

            // If strict filters produced nothing but we have candidate products, try a fuzzy/text fallback
            if (filtered.length === 0 && products.length > 0){
                try{
                    const tokens = []
                    if (Array.isArray(filters.colors)) filters.colors.forEach(c=> c && tokens.push(String(c).toLowerCase()))
                    if (Array.isArray(filters.sizes)) filters.sizes.forEach(s=> s && tokens.push(String(s).toLowerCase()))
                    if (filters.collections && Array.isArray(filters.collections)) filters.collections.forEach(c=> c && tokens.push(String(c).toLowerCase()))
                    if (typeof filters.priceMin !== 'undefined') tokens.push(String(filters.priceMin))
                    if (typeof filters.priceMax !== 'undefined') tokens.push(String(filters.priceMax))

                    const fuzzy = products.filter(p=>{
                        try{
                            const fields = []
                            if (p.title) fields.push(String(p.title))
                            if (p.name) fields.push(String(p.name))
                            if (p.description) fields.push(String(p.description || p.longDescription || ''))
                            if (p.colors) fields.push(Array.isArray(p.colors) ? p.colors.join(' ') : String(p.colors))
                            if (p.size) fields.push(Array.isArray(p.size) ? p.size.join(' ') : String(p.size))
                            if (p.sizes) fields.push(Array.isArray(p.sizes) ? p.sizes.join(' ') : String(p.sizes))
                            if (p.category) fields.push(String(p.category))
                            if (p.collection) fields.push(String(p.collection))
                            if (p.tags) fields.push(Array.isArray(p.tags) ? p.tags.join(' ') : String(p.tags))
                            const hay = fields.join(' ').toLowerCase()
                            return tokens.some(t => t && hay.includes(String(t).toLowerCase()))
                        }catch(e){ return false }
                    })
                    if (fuzzy.length) {
                        console.debug('[ProductPage] prepareDisplay - fuzzy matched', fuzzy.length)
                        filtered = fuzzy
                        setShowFallbackInfo(true)
                    } else {
                        // as a last resort show candidate products so UI isn't empty
                        console.debug('[ProductPage] prepareDisplay - no fuzzy matches, showing candidates')
                        filtered = products.slice(0, Math.min(products.length, 48))
                        setShowFallbackInfo(true)
                    }
                }catch(e){
                    console.warn('fuzzy fallback failed', e)
                }
            } else {
                setShowFallbackInfo(false)
            }

            if (mounted) {
                setDisplayProducts(filtered)
                setLoadingDisplay(false)
            }
        }
        prepareDisplay()
        return ()=> mounted = false
    },[productList, filters, category])

    // derive sorted products for rendering (does not mutate `displayProducts` state)
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

    // fetch catalog (categories, collections) for filter lists
    useEffect(()=>{
        let mounted = true
        fetchCatalog().then(d=>{ if (mounted && d) setCatalog(d) })
        return ()=> mounted = false
    },[])

    // keep filters.collections in sync with the route `category` param
    useEffect(()=>{
        if (!category) return
        setFilters(prev => {
            // if route is 'all' we should remove collection filter
            if (category === 'all'){
                if (prev.collections) {
                    const next = Object.assign({}, prev)
                    delete next.collections
                    return next
                }
                return prev
            }
            // if already set to the same category, do nothing
            if (Array.isArray(prev.collections) && prev.collections[0] === category) return prev
            // otherwise set it so the UI and API use the route selection
            return Object.assign({}, prev, { collections: [category] })
        })
    },[category])
    const categoryPath = {
        "all" : "Tất cả sản phẩm",
        "dam" : "Đầm",
        "quan" : "Quần",
        "ao" : "Áo",
        "phukien" :  "Phụ kiện",
        "chanvay" : "Chân váy",
    }
    function onFilterChange(key, val){
        const next = Object.assign({}, filters)
        if (val === null || (Array.isArray(val) && val.length===0) || (typeof val === 'object' && Object.keys(val).length===0)){
            delete next[key]
        } else {
            next[key] = val
        }
        console.debug('[ProductPage] setFilters ->', next)
        setFilters(next)
    }

    return(
        <main className="shoppage">
            <section className="shoppage_path">
                <nav className="breadcrumb">
                    <Link to="/" onClick={()=> handleBreadcrumbClick('Trang chủ')}>Trang chủ</Link>
                    <span> › </span>
                    <Link to="/shop/all" onClick={()=> handleBreadcrumbClick('Sản phẩm')}>Sản phẩm</Link>
                    <span> › </span>
                    <span>{categoryPath[category]}</span>
                </nav>
            </section>
            <section className="shoppage_filter">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                    <div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'center'}}>
                        {
                            // compute display value: if filters.collections is an array of keys, show its label
                        }
                        <FilterDropdown
                            title={'Danh mục'}
                            type={'single'}
                            options={Object.keys(categoryPath).map(k=>categoryPath[k])}
                            value={(Array.isArray(filters.collections) && filters.collections.length) ? categoryPath[filters.collections[0]] : (filters.collections || null)}
                            onChange={(v)=> {
                                if (!v) return onFilterChange('collections', null)
                                // translate displayed label back to collection key expected by API
                                const foundKey = Object.keys(categoryPath).find(k => categoryPath[k] === v)
                                onFilterChange('collections', foundKey ? [foundKey] : [v])
                                // navigate to the corresponding category route so the UI reflects selection
                                if (foundKey) navigate(`/shop/${foundKey}`)
                            }}
                        />

                        <FilterDropdown
                            title={'Màu sắc'}
                            type={'multi'}
                            options={colorOptions.length ? colorOptions : ['Đen','Trắng','Đỏ','Xanh','Hồng']}
                            value={filters.colors || []}
                            onChange={(v)=> onFilterChange('colors', v)}
                        />

                        <FilterDropdown
                            title={'Kích thước'}
                            type={'multi'}
                            options={['XS','S','M','L','XL','XXL']}
                            value={filters.sizes || []}
                            onChange={(v)=> onFilterChange('sizes', v)}
                        />

                        <FilterDropdown
                            title={'Khoảng giá'}
                            type={'range'}
                            value={{ min: filters.priceMin, max: filters.priceMax }}
                            onChange={(v)=> {
                                const next = Object.assign({}, filters)
                                if (typeof v.min !== 'undefined') next.priceMin = v.min
                                else delete next.priceMin
                                if (typeof v.max !== 'undefined') next.priceMax = v.max
                                else delete next.priceMax
                                setFilters(next)
                            }}
                        />
                    </div>
                    {/* Sort control placed on the right side, same horizontal line as filters */}
                    <div style={{display:'flex',alignItems:'center', marginLeft: 'auto', gap:12, flexShrink:0}}>
                        <div style={{fontWeight:700,marginRight:12}}>Sắp xếp theo</div>
                        <div style={{position:'relative',display:'inline-flex',alignItems:'center'}}>
                            <select
                                value={sortOption}
                                onChange={(e)=> setSortOption(e.target.value)}
                                style={{
                                    WebkitAppearance:'none',
                                    MozAppearance:'none',
                                    appearance:'none',
                                    border:'1px solid rgba(0,0,0,0.06)',
                                    background:'#f6f6f6',
                                    padding:'6px 28px 6px 12px',
                                    borderRadius:20,
                                    minWidth:130,
                                    height:36,
                                    fontSize:13,
                                    outline:'none',
                                    cursor:'pointer'
                                }}
                            >
                                <option value="default">Mặc định</option>
                                <option value="price_asc">Giá: Từ thấp đến cao</option>
                                <option value="price_desc">Giá: Từ cao đến thấp</option>
                                <option value="newest">Mới nhất</option>
                                <option value="oldest">Cũ nhất</option>
                            </select>
                            {/* chevron icon */}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="false" style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#333',opacity:0.7}}>
                                <title>Sort chevron</title>
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            </section>
            
            {loadingDisplay ? (
                <div style={{padding:24,color:'#666'}}>Đang tải sản phẩm...</div>
            ) : null}

            {
                !productList ? (
                    <section className="shoppage_product-list">
                        loading...
                    </section>
                ) : (
                    <section className="shoppage_product-list">
                        {/* If no strict matches, we previously showed fallback candidates — now we prefer a single clear message below when empty. */}
                        {
                            // prefer sortedProducts (derived from displayProducts or productList)
                            (Array.isArray(sortedProducts) ? sortedProducts : []).map((item, index) => {
                                // item may be a product object or an id string
                                if (!item) return null
                                if (typeof item === 'object'){
                                    const pid = item._id || item.id || item._id === 0 ? item._id : null
                                    return <Productcard id={String(pid || index)} key={`prod${index}`} />
                                }
                                return <Productcard id={String(item)} key={`prod${index}`} />
                            })
                        }
                        {
                            // if displayProducts is an empty array (no matches), show single clear message
                            Array.isArray(displayProducts) && displayProducts.length === 0 ? (
                                <div style={{padding:24,color:'#666',whiteSpace:'normal'}}>Không có sản phẩm nào phù hợp.</div>
                            ) : null
                        }
                    </section>
                )
            }
        </main> 

    )
}

export default Shoppage;
