
import { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { handleBreadcrumbClick } from '../../utils/breadcrumb'

import ProductCard from '../../components/ProductCard'
import SizeGuide from '../../components/SizeGuide'
import ReviewModal from '../../components/ReviewModal'
import trashIcon from '../../assets/icons/trash-red.svg'
import { productDetail, suggestListProduct } from '../../services/products.api'
import { updateProductDetails } from '../../services/products.api'
import cartIcon from '../../assets/imgs/common/cart-icon.png' 
import greenStar from '../../assets/imgs/common/green-star.png' 
import returnIcon from '../../assets/imgs/common/return-icon.png' 
import shipIcon from '../../assets/imgs/common/ship-icon.png' 
import './productdetailpage.scss'
import { globalContext } from '../../context/globalContext'
import { useToast } from '../../components/ToastProvider'

// client-side SVG placeholder generator for missing product images
function placeholderDataURL(label = 'Product', w = 1200, h = 800){
    const text = String(label || 'Product').replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    const svg = `<?xml version="1.0" encoding="utf-8"?>\n` +
        `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
        `<rect width='100%' height='100%' fill='#fafafa'/>` +
        `<rect x='40' y='80' width='${w-80}' height='${Math.round(h*0.7)}' rx='12' fill='#fff' stroke='#eee'/>` +
        `<text x='${Math.round(w/2)}' y='${Math.round(h/2)}' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='36' fill='#b71c1c'>${encodeURIComponent(text)}</text>` +
        `</svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// create a short, recognizable product code from a long id (e.g. ObjectId)
function getShortCode(id){
    if (!id) return ''
    try{
        const s = String(id)
        if (s.length >= 8) return s.slice(0,8).toUpperCase()
        return s.toUpperCase()
    }catch(e){ return '' }
}

const ProductDetailPage = ()=>{
    const nav = useNavigate()
    const { category, id } = useParams()
    const [data, setData] = useState(null)
    const [quantity, setQuantity] = useState(1)
    const [prodSize, setProdSize ] = useState('S')
    const [selectedColor, setSelectedColor] = useState(null)
    const [mainImgSrc, setMainImgSrc] = useState(null)
    const [imgAnimating, setImgAnimating] = useState(false)
    const imgAnimTimer = useRef(null)
    // fetch product + suggestions and compute review aggregates
    const computeAggregates = (prod)=>{
        if (!prod) return prod
        const reviews = Array.isArray(prod.reviews) ? prod.reviews : []
        const counts = { _1:0,_2:0,_3:0,_4:0,_5:0 }
        let hasImagesCount = 0
        let total = 0
        reviews.forEach(r=>{
            const rt = Number(r.rating) || 0
            if (rt >=1 && rt <=5) counts[`_${rt}`] = (counts[`_${rt}`] || 0) + 1
            if (Array.isArray(r.images) && r.images.length) hasImagesCount++
            total += rt
        })
        const ratingCount = reviews.length
        const ratingAverage = ratingCount ? Math.round((total / ratingCount) * 10) / 10 : 5

        return { ...prod, reviews, _1Count: counts._1, _2Count: counts._2, _3Count: counts._3, _4Count: counts._4, _5Count: counts._5, hasImagesCount, ratingCount, ratingAverage }
    }

    const fetchData = useCallback(async (category, id)=>{
        window.scrollTo({top : 0, behavior : 'smooth'})
        try{
            const prodDataResp = await productDetail(id)
            const prodSuggestResp = await suggestListProduct(category, id)
            if (!prodDataResp || !prodDataResp.data){
                setData(null)
                setFetchError('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.')
                return
            }
            const prod = computeAggregates(prodDataResp.data)
            const newData = { prodData: prod, prodSuggest: (prodSuggestResp && prodSuggestResp.data) ? prodSuggestResp.data : [] }
            setData(newData)
            setFetchError('')
        }catch(e){
            console.error('getData error', e)
            setData(null)
            setFetchError('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.')
        }
        setQuantity(1)
        setProdSize('S')
    }, [])

    useEffect(()=>{ fetchData(category, id) }, [id, category, fetchData])

    // persist a brief recently-viewed entry to localStorage
    const [recentItems, setRecentItems] = useState([])

    // initialize recentItems from localStorage on mount
    useEffect(()=>{
        try{
            const raw = localStorage.getItem('recentlyViewed')
            const arr = raw ? JSON.parse(raw) : []
            setRecentItems(Array.isArray(arr) ? arr : [])
        }catch(e){ console.error('read recentlyViewed', e); setRecentItems([]) }
    }, [])

    // map of recent product details fetched from API (id -> productData)
    const [recentDetails, setRecentDetails] = useState({})
    useEffect(()=>{
        let mounted = true
        async function loadRecentDetails(){
            try{
                const raw = localStorage.getItem('recentlyViewed')
                const arr = raw ? JSON.parse(raw) : []
                const ids = (Array.isArray(arr) ? arr : []).slice(0,4).map(i => String(i.id))
                if (!ids.length){ if (mounted) setRecentDetails({}); return }
                const promises = ids.map(pid => productDetail(pid).then(res => (res && res.data) ? res.data : null).catch(()=>null))
                const results = await Promise.all(promises)
                const map = {}
                results.forEach((r, idx)=>{ if (r) map[ids[idx]] = r })
                if (mounted) setRecentDetails(map)
            }catch(e){ console.error('loadRecentDetails', e); if (mounted) setRecentDetails({}) }
        }
        loadRecentDetails()
        return ()=> { mounted = false }
    }, [recentItems])

    useEffect(()=>{
        try{
            if (!data || !data.prodData) return
            const entry = {
                id: String(data.prodData._id || id),
                title: data.prodData.title || '',
                img: Array.isArray(data.prodData.img) ? data.prodData.img[0] : (data.prodData.img || null),
                price: data.prodData.price || 0,
                at: Date.now()
            }
            const raw = localStorage.getItem('recentlyViewed')
            const arr = raw ? JSON.parse(raw) : []
            // remove existing entry for same id
            const filtered = Array.isArray(arr) ? arr.filter(i => String(i.id) !== String(entry.id)) : []
            filtered.unshift(entry)
            const max = 4
            const truncated = filtered.slice(0, max)
            localStorage.setItem('recentlyViewed', JSON.stringify(truncated))
            setRecentItems(truncated)
        }catch(e){ console.error('persist recentlyViewed', e) }
    }, [data, id])

    const [fetchError, setFetchError] = useState('')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    // Normalize API host: prefer origin (scheme + host + port) to avoid accidental path suffixes
    const API_HOST = (()=>{
        try{ const u = new URL(String(API_BASE)); return u.origin }catch(e){ return String(API_BASE).replace(/\/+$/,'') }
    })()

    // normalize src returned from API (server stores '/uploads/...' paths)
    const normalizeSrc = (s) => {
        if (!s) return s
        try{
            const str = String(s)
            // keep absolute http/https as-is
            if (/^https?:\/\//i.test(str)) return str
            // keep data/blob URLs unchanged
            if (/^data:/i.test(str)) return str
            if (/^blob:/i.test(str)) return str
            // protocol-relative
            if (str.startsWith('//')) return `${window.location.protocol}${str}`
            // server-returned absolute path like '/uploads/...'
            if (str.startsWith('/')) return `${API_HOST}${str}`
            // fallback: treat as relative to API
            return `${API_HOST}/${str}`
        }catch(e){ return s }
    }

    // decode JWT payload (best-effort, not verification) to check admin role client-side
    const decodeTokenPayload = (token) => {
        try{
            if (!token) return null
            const parts = String(token).split('.')
            if (parts.length < 2) return null
            const payload = parts[1]
            // atob can throw on non-base64; wrap in try/catch
            const json = window.atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
            try{ return JSON.parse(decodeURIComponent(escape(json))) }catch(e){ return JSON.parse(json) }
        }catch(e){ return null }
    }
    useEffect(()=>{
        if (data && Array.isArray(data?.prodData?.colors) && data.prodData.colors.length){
            setSelectedColor(prev => prev || data.prodData.colors[0])
        }
    },[data])
    const isStoreOnly = Boolean(data?.prodData?.storeOnly)
    const { ctUserID } = useContext(globalContext)
    const location = useLocation()
    const [showLoginPrompt, setShowLoginPrompt] = useState(false)
    const { showToast } = useToast()
    const _token = sessionStorage.getItem('token') || localStorage.getItem('token')
    const tokenPayload = decodeTokenPayload(_token)
    const isAdminClient = Boolean(tokenPayload && ((tokenPayload.role && String(tokenPayload.role).toLowerCase() === 'admin') || tokenPayload.isAdmin))

    // If navigated with ?autoReview=1, open the review modal automatically
    useEffect(()=>{
        try{
            const params = new URLSearchParams(location.search)
            const auto = params.get('autoReview') || params.get('review')
            if (auto && (auto === '1' || auto === 'true')){
                setReviewModalOpen(true)
            }
        }catch(e){ /* ignore */ }
    }, [location.search])

    // initialize main image when data arrives
    useEffect(()=>{
        if (!data) return
        const imgs = Array.isArray(data?.prodData?.img) ? data.prodData.img : (data?.prodData?.img ? [data.prodData.img] : [])
        const initial = (imgs && imgs.length) ? (imgs[0]) : null
        setMainImgSrc(normalizeSrc(initial))
    },[data])

    const triggerMainImageChange = (src)=>{
        if (!src) return
        // reset timer
        if (imgAnimTimer.current) clearTimeout(imgAnimTimer.current)
        setImgAnimating(true)
        // slight delay to allow CSS to pick up the class change if needed
        setMainImgSrc(src)
        imgAnimTimer.current = setTimeout(()=>{
            setImgAnimating(false)
            imgAnimTimer.current = null
        }, 320)
    }

    // format color name and helper to generate random colors and persist to backend
    const formatColorName = (c)=>{
        if (!c && c !== 0) return ''
        const s = String(c).trim()
        // if it's a hex color, return upper-case hex
        if (/^#([0-9a-f]{3,6})$/i.test(s)) return s.toUpperCase()
        // normalize ascii variants and capitalize words
        const map = { 'den':'Đen','denn':'Đen','trang':'Trắng','do':'Đỏ','xanh':'Xanh','xanh nhạt':'Xanh nhạt','be':'Be','tim':'Tím','vang':'Vàng','vàng':'Vàng' }
        const lower = s.toLowerCase()
        if (map[lower]) return map[lower]
        // capitalize each word
        return s.split(/\s+/).map(w=> w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    }

    

    useEffect(()=>{
        // if product exists but has no colors, set theme colors and persist to backend
        async function ensureColors(){
            try{
                if (!data || !data.prodData) return
                const existing = data.prodData.colors || data.prodData.color
                const parsed = Array.isArray(existing) ? existing : (typeof existing === 'string' ? existing.split(',').map(s=>s.trim()).filter(Boolean) : [])

                const theme = ['Đen','Trắng','Đỏ','Vàng','Xanh']

                if (parsed.length === 0){
                    // set theme colors for products missing color metadata
                    const res = await updateProductDetails(data.prodData._id, { colors: theme })
                    if (res && res.data){
                        setData(prev => ({...prev, prodData: res.data}))
                        setSelectedColor(theme[0])
                    } else {
                        setData(prev => ({...prev, prodData: {...prev.prodData, colors: theme}}))
                        setSelectedColor(theme[0])
                    }
                } else {
                    // normalize existing names and restrict to theme where possible
                    const formatted = parsed.map(formatColorName)
                    const standardized = formatted.filter(f => theme.includes(f))
                    const finalColors = standardized.length > 0 ? standardized : theme

                        // if finalColors differs from stored parsed/formatted, persist
                        const same = JSON.stringify(parsed) === JSON.stringify(finalColors) || JSON.stringify(formatted) === JSON.stringify(finalColors)
                        if (!same){
                            const res = await updateProductDetails(data.prodData._id, { colors: finalColors })
                            if (res && res.data){
                                setData(prev => ({...prev, prodData: res.data}))
                                setSelectedColor(prev => prev || (res.data.colors && res.data.colors[0]))
                            } else {
                                // only update state when we actually have a change to apply
                                setData(prev => ({...prev, prodData: {...prev.prodData, colors: finalColors}}))
                                setSelectedColor(prev => prev || finalColors[0])
                            }
                        } else {
                            // colors are already normalized — avoid re-setting `data` to prevent render loops
                            setSelectedColor(prev => prev || finalColors[0])
                        }
                }
            }catch(e){ console.error('ensureColors error', e) }
        }
        ensureColors()
    },[data])
    const handleChangeQuantity = (num)=>{
        let newQuantity = num + quantity
        if(newQuantity <= 0 || newQuantity > data?.prodData.warehouse){
            showToast("Số lượng không hợp lệ", 'error')
            return
        }
        setQuantity(newQuantity)
    }
    const handleAddToCart = ()=>{
        let cart = JSON.parse(localStorage.getItem("cart"))
        const findIndex = () => {
            if (cart === null) return null
            for ( let i in cart ){
                if (cart[i].title === data?.prodData.title && cart[i].size === prodSize) return i
            }
            return null
        }
        let checkIndex = findIndex()
        let countQuantity = [-1,null].includes(checkIndex) ? Number(quantity) : Number(quantity) + Number(cart[checkIndex].quantity)
        let count = countQuantity * Number(data?.prodData.price)
        let newProd = {
            "id" : data?.prodData._id,
            "img": data?.prodData.img[0],
            "title": data?.prodData.title,
            "size": prodSize,
            "quantity": countQuantity,
            "count": count
        }
        if (![-1,null].includes(checkIndex)) cart.splice(checkIndex,1)
        let newCart = cart ? [newProd,...cart] : [newProd]
        localStorage.setItem("cart", JSON.stringify(newCart))
        showToast(`Thêm sản phẩm "${newProd.title}" size ${prodSize} Thành Công`, 'success')
        // notify other components (same-tab + cross-tab) that cart changed
        try{ const key = `hb_cart_updated`; const cur = JSON.parse(localStorage.getItem('cart')); try{ window.dispatchEvent(new CustomEvent('hb_cart_updated', { detail: { cart: cur, ts: Date.now() } })) }catch(e){ /* ignore inner */ } }catch(e){ /* ignore outer */ }
    }
    const handleClickBuy = ()=>{
        // New behavior: add item to cart and navigate to checkout (cart) page
        try{
            handleAddToCart()
            showToast('Đã thêm vào giỏ hàng — chuyển đến giỏ hàng', 'success')
            nav('/checkout')
        }catch(e){
            console.warn('handleClickBuy failed', e)
            showToast('Không thể thêm vào giỏ hàng, thử lại', 'error')
        }
    }
    
    // Voucher modal + limited quantity (user copies code, does not auto-apply)
    const voucherCatalog = {
        'GIAM50K': { code: 'GIAM50K', title: 'Giảm 50K', amount: 50000, valid: '05/11/2025 - 02/12/2025', note: 'Áp dụng cho đơn tối thiểu 500k', total: 30 },
        'GIAM20K': { code: 'GIAM20K', title: 'Giảm 20K', amount: 20000, valid: '05/11/2025 - 02/12/2025', note: 'Áp dụng cho đơn tối thiểu 200k', total: 100 }
    }
    const [voucherModal, setVoucherModal] = useState({open:false})
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [reviewFilter, setReviewFilter] = useState(null) // null | 'withImages' | 1..5
    const [reviewPage, setReviewPage] = useState(1)
    const reviewsPerPage = 5
    const [deletingReviewId, setDeletingReviewId] = useState(null)
    const getReservedCount = (code)=>{
        try{
            const raw = localStorage.getItem('reservedVouchers')
            const obj = raw ? JSON.parse(raw) : {}
            return obj[code] || 0
        }catch(e){ return 0 }
    }
    const reserveCopy = (code)=>{
        try{
            const raw = localStorage.getItem('reservedVouchers')
            const obj = raw ? JSON.parse(raw) : {}
            obj[code] = (obj[code] || 0) + 1
            localStorage.setItem('reservedVouchers', JSON.stringify(obj))
        }catch(e){ console.error(e) }
    }
    const openVoucherModal = (code)=>{
        const info = voucherCatalog[code]
        if (!info) return
        const reserved = getReservedCount(code)
        const remaining = Math.max(0, (info.total || 0) - reserved)
        setVoucherModal({ open:true, ...info, remaining })
    }
    const handleCopyVoucher = async ()=>{
        try{
            if (!voucherModal.code) return
            if (voucherModal.remaining <= 0){ showToast('Mã đã hết lượt sao chép', 'error'); return }
            await navigator.clipboard.writeText(voucherModal.code)
            reserveCopy(voucherModal.code)
            const newRemaining = Math.max(0, voucherModal.remaining - 1)
            setVoucherModal(prev => ({...prev, remaining: newRemaining}))
            showToast('Mã đã được sao chép. Vui lòng dán mã trong giỏ hàng để áp dụng giảm giá.', 'success')
        }catch(e){ console.error(e); showToast('Không thể sao chép mã tự động. Hãy sao chép thủ công: ' + voucherModal.code, 'error') }
    }
    const images = Array.isArray(data?.prodData?.img) ? data.prodData.img : (data?.prodData?.img ? [data.prodData.img] : [])
    const colors = (()=>{
        const raw = data?.prodData?.colors || data?.prodData?.color
        if (!raw) return []
        if (Array.isArray(raw)) return raw
        if (typeof raw === 'string') return raw.split(',').map(s=>s.trim()).filter(Boolean)
        return [String(raw)]
    })()
    const mainImage = (()=>{
        if (!images || images.length === 0) return null
        if (Array.isArray(data?.prodData?.colors) && data.prodData.colors.length && images.length === data.prodData.colors.length){
            const idx = data.prodData.colors.indexOf(selectedColor)
            return images[idx] || images[0]
        }
        return images[0]
    })()

    // helper: mask phone (keep first 3 and last 2 digits, mask the middle)
    const maskPhone = (phone)=>{
        if (!phone) return ''
        const s = String(phone).replace(/\s+/g,'')
        if (s.length <= 5) return s.replace(/.(?=.{2})/g, '*')
        const first = s.slice(0,3)
        const last = s.slice(-2)
        const middle = '*'.repeat(Math.max(0, s.length - first.length - last.length))
        return `${first}${middle}${last}`
    }

    // helper: format date/time for reviews
    const fmtDate = (iso)=>{
        try{
            const d = new Date(iso)
            if (isNaN(d)) return ''
            return d.toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour:'2-digit', minute:'2-digit' })
        }catch(e){ return '' }
    }

    // Re-introduce product-specific description renderer (per-product)
    const renderDescription = ()=>{
        if (!data || !data.prodData) return null
        const p = data.prodData

        // Prefer rich HTML if provided
        if (p.longDescription || p.description){
            const html = p.longDescription || p.description
            return (
                <section className="productpage_description">
                    <h3 className="title">Mô tả chi tiết sản phẩm</h3>
                    <div className="description-block" dangerouslySetInnerHTML={{__html: html}} />
                </section>
            )
        }

        const sizesText = Array.isArray(p.size) ? p.size.join(', ') : (p.size || 'S, M, L, XL')
        const materialText = p.material || 'Chất liệu tốt, thoải mái khi mặc.'
        const colorsText = (p.colors && p.colors.length) ? p.colors.map(formatColorName).join(', ') : (p.color || 'Chưa xác định')
        const careList = Array.isArray(p.care) ? p.care : (p.care ? [p.care] : null)

        const renderSizeChart = ()=>{
            const chart = p.sizeChart || p.measurements
            if (!chart || typeof chart !== 'object') return null
            const sizes = Object.keys(chart)
            if (!sizes.length) return null
            return (
                <table className="size-chart">
                    <thead>
                        <tr>
                            <th>Size</th>
                            <th>Vòng ngực (cm)</th>
                            <th>Vòng eo (cm)</th>
                            <th>Vai (cm)</th>
                            <th>Dài áo (cm)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sizes.map(s => {
                            const row = chart[s] || {}
                            return (
                                <tr key={s}>
                                    <td><b>{s}</b></td>
                                    <td>{row.chest ?? row.bust ?? '-'}</td>
                                    <td>{row.waist ?? '-'}</td>
                                    <td>{row.shoulder ?? row.shoulderWidth ?? '-'}</td>
                                    <td>{row.length ?? row.bodyLength ?? '-'}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )
        }

        return (
            <section className="productpage_description">
                <h3 className="title">Mô tả chi tiết sản phẩm</h3>
                <div className="description-block">
                    <h4>Tổng quan</h4>
                    <p>{p.title} {p.brief ? `- ${p.brief}` : ''}</p>

                    <h4>Chất liệu</h4>
                    <p>{materialText}{p.materialDetail ? ` — ${p.materialDetail}` : ''}</p>

                    <h4>Form & vừa vặn</h4>
                    <p>{p.fit || p.form || 'Form ôm vừa, chọn theo bảng size.'}</p>

                    <h4>Kích thước & bảng đo</h4>
                    {renderSizeChart() || (
                        <p>Size có sẵn: {sizesText}.</p>
                    )}

                    <h4>Màu sắc</h4>
                    <p>{colorsText}</p>

                    {p.modelInfo && (
                        <>
                            <h4>Thông tin mẫu</h4>
                            <p>{p.modelInfo}</p>
                        </>
                    )}

                    <h4>Cách sử dụng & gợi ý</h4>
                    <p>{p.usage || p.styleTips || 'Gợi ý phối đồ cơ bản.'}</p>

                    <h4>Cách bảo quản</h4>
                    {careList ? (
                        <ol>{careList.map((c,i)=> <li key={i}>{c}</li>)}</ol>
                    ) : (
                        <ol>
                            <li>Giặt nhẹ, nhiệt độ thấp.</li>
                            <li>Không dùng chất tẩy mạnh.</li>
                        </ol>
                    )}

                    <h4>Vận chuyển & đổi trả</h4>
                    <p>{p.shippingInfo || 'Giao hàng 2-5 ngày; đổi trả theo chính sách.'}</p>

                    {p.faq && (
                        <>
                            <h4>FAQ</h4>
                            <div dangerouslySetInnerHTML={{__html: p.faq}} />
                        </>
                    )}

                    <h4>Ghi chú</h4>
                    <p>{p.notes || ''}</p>
                </div>
            </section>
        )
    }

    // Reviews renderer: show static placeholders when `data` is not yet available
    const renderReviews = ()=>{
        const score = data?.prodData?.ratingAverage ?? 5
        const count = data?.prodData?.ratingCount ?? 0
        return (
            <section className="productpage_reviews" aria-label="Đánh giá sản phẩm">
                <div className="reviews_top">
                    <div className="rating-summary">
                        <h3>Đánh giá sản phẩm</h3>
                        <div className="score">{score}<span>/5</span></div>
                        {(() => {
                            const active = Math.max(0, Math.min(5, Math.floor(Number(score) || 0)))
                            return (
                                <div className="stars">{Array.from({length:5}).map((_,i)=>(<span key={i} className={`star ${i < active ? 'active': ''}`}>★</span>))}</div>
                            )
                        })()}
                        <a className="reviews-count" href="#reviews">{count} đánh giá</a>
                    </div>
                    <div className="reviews_cta">
                        <h4>Chia sẻ nhận xét của bạn về sản phẩm này</h4>
                        <button className="btn-review" onClick={()=> setReviewModalOpen(true)}>☆ Đánh giá</button>
                    </div>
                </div>
                <div className="review-filters">
                    <button className={`chip ${reviewFilter === 'withImages' ? 'active' : ''}`} onClick={()=> setReviewFilter(prev => prev === 'withImages' ? null : 'withImages')}>Kèm ảnh ({data?.prodData?.hasImagesCount ?? 0})</button>
                    <button className={`chip ${reviewFilter === 5 ? 'active' : ''}`} onClick={()=> setReviewFilter(prev => prev === 5 ? null : 5)}>★ 5 ({data?.prodData?._5Count ?? 0})</button>
                    <button className={`chip ${reviewFilter === 4 ? 'active' : ''}`} onClick={()=> setReviewFilter(prev => prev === 4 ? null : 4)}>★ 4 ({data?.prodData?._4Count ?? 0})</button>
                    <button className={`chip ${reviewFilter === 3 ? 'active' : ''}`} onClick={()=> setReviewFilter(prev => prev === 3 ? null : 3)}>★ 3 ({data?.prodData?._3Count ?? 0})</button>
                    <button className={`chip ${reviewFilter === 2 ? 'active' : ''}`} onClick={()=> setReviewFilter(prev => prev === 2 ? null : 2)}>★ 2 ({data?.prodData?._2Count ?? 0})</button>
                    <button className={`chip ${reviewFilter === 1 ? 'active' : ''}`} onClick={()=> setReviewFilter(prev => prev === 1 ? null : 1)}>★ 1 ({data?.prodData?._1Count ?? 0})</button>
                </div>

                {/* Render filtered reviews list (simple) */}
                <div id="reviews" className="reviews-list">
                    {(() => {
                        const all = Array.isArray(data?.prodData?.reviews) ? data.prodData.reviews.slice().reverse() : []
                        const filtered = all.filter(r => {
                            if (!reviewFilter) return true
                            if (reviewFilter === 'withImages') return Array.isArray(r.images) && r.images.length
                            return Number(r.rating) === Number(reviewFilter)
                        })
                        if (filtered.length === 0) return (<div className="no-reviews">Chưa có đánh giá nào cho bộ lọc này.</div>)
                            const totalPages = Math.max(1, Math.ceil(filtered.length / reviewsPerPage))
                            const page = Math.min(Math.max(1, reviewPage), totalPages)
                            const start = (page - 1) * reviewsPerPage
                            const pageItems = filtered.slice(start, start + reviewsPerPage)
                            return (
                                <div>
                                    {pageItems.map((r, idx) => (
                                        <article className="review-item" key={r._id?.toString() || idx}>
                                            <div className="review-head" style={{display:'flex',alignItems:'center',gap:12}}>
                                                <div style={{fontWeight:700}}>{r.name || 'Khách hàng'}</div>
                                                <div className="review-stars">{Array.from({length:5}).map((_,i)=> <span key={i} className={`star ${i < (Number(r.rating)||0) ? 'active':''}`}>★</span>)}</div>
                                                    <div className="review-meta" style={{color:'#666',fontSize:13,marginLeft:'auto'}}>{fmtDate(r.createdAt)}{r.phone ? ` • ${maskPhone(r.phone)}` : ''}</div>
                                                    {/* show delete button when logged-in and owner of review */}
                                                    {((ctUserID && r.userId && String(ctUserID) === String(r.userId)) || isAdminClient) ? (
                                                        <button
                                                            className="delete-review"
                                                            disabled={deletingReviewId === r._id}
                                                            onClick={async ()=>{
                                                                if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return
                                                                setDeletingReviewId(r._id)
                                                                try{
                                                                    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/products'
                                                                    const url = `${API_BASE}/product/${data.prodData._id}/reviews/${r._id}`
                                                                    const token = sessionStorage.getItem('token') || localStorage.getItem('token')
                                                                    const headers = {'Content-Type':'application/json'}
                                                                    // only include x-user-id when not using admin token
                                                                    if (!isAdminClient && ctUserID) headers['x-user-id'] = ctUserID
                                                                    if (token) headers['Authorization'] = `Bearer ${token}`
                                                                    const res = await fetch(url, { method: 'DELETE', headers, body: JSON.stringify({ userId: ctUserID }) })
                                                                    const json = await res.json().catch(()=>({}))
                                                                    if (res.ok && (json.status === '200' || res.status === 200)){
                                                                        showToast('Xóa đánh giá thành công', 'success')
                                                                        fetchData(category, id)
                                                                    } else {
                                                                        showToast(json.message || 'Không thể xóa đánh giá', 'error')
                                                                    }
                                                                }catch(e){ console.error('delete review error', e); showToast('Lỗi khi xóa đánh giá', 'error') }
                                                                setDeletingReviewId(null)
                                                                
                                                            }}
                                                        >
                                                            <img src={trashIcon} alt="xóa" className="delete-icon" />
                                                            <span className="delete-label">{deletingReviewId === r._id ? 'Đang xóa...' : 'Xóa'}</span>
                                                        </button>
                                                    ) : null}
                                            </div>
                                            <div className="review-body-item" style={{marginTop:8,whiteSpace:'pre-wrap'}}>{r.comment}</div>
                                            {Array.isArray(r.images) && r.images.length ? (
                                                <div className="review-images" style={{display:'flex',gap:8,marginTop:8}}>{r.images.map((src,i)=> <img key={i} src={normalizeSrc(src)} alt={`review-${i}`} style={{width:120,height:120,objectFit:'cover',borderRadius:8}} />)}</div>
                                            ) : null}
                                        </article>
                                    ))}

                                    {totalPages > 1 && (
                                        <div className="pagination" style={{display:'flex',gap:8,alignItems:'center',marginTop:12}}>
                                            <button className="page-btn" disabled={page<=1} onClick={()=> setReviewPage(p=> Math.max(1, p-1))}>‹ Trước</button>
                                            {Array.from({length: totalPages}).map((_,i)=> (
                                                <button key={i} className={`page-num ${i+1===page ? 'active' : ''}`} onClick={()=> setReviewPage(i+1)}>{i+1}</button>
                                            ))}
                                            <button className="page-btn" disabled={page>=totalPages} onClick={()=> setReviewPage(p=> Math.min(totalPages, p+1))}>Sau ›</button>
                                        </div>
                                    )}
                                </div>
                            )
                    })()}
                </div>
            </section>
        )
    }

    // Render recently viewed section (reusable so we can place it consistently)
    const renderRecentlySection = ()=>{
        try{
            // prefer state, but fall back to localStorage synchronously if empty
            let arr = Array.isArray(recentItems) && recentItems.length ? recentItems : (JSON.parse(localStorage.getItem('recentlyViewed') || '[]') || [])
            if (!Array.isArray(arr)) arr = []
            const filtered = arr.filter(i => String(i.id) !== String(data?.prodData?._id))
            if (!filtered || filtered.length === 0) return null
            const filteredLimited = filtered.slice(0, 4)
            return (
                <section className="productpage_recently">
                    <h3 className="title">Sản phẩm đã xem</h3>
                    <div className="list">
                        {filteredLimited.map((item, idx)=>{
                            const detail = recentDetails && recentDetails[String(item.id)]
                            const title = detail?.title || item.title || 'Sản phẩm'
                            const imgs = Array.isArray(detail?.img) ? detail.img : (item.img ? [item.img] : [])
                            const priceVal = Number(detail?.price ?? item.price ?? 0)
                            const origVal = Number(detail?.oldPrice ?? detail?.originalPrice ?? 0)
                            const sold = detail?.sold ?? detail?.soldCount ?? null
                            const rating = detail?.ratingAverage ?? detail?._avgRating ?? null
                            const discountPct = (origVal && origVal > priceVal) ? Math.round((1 - (priceVal / origVal)) * 100) : 0
                            return (
                                <Link key={item.id || idx} to={`/productdetail/all/${item.id}`} className="recent-mini-card">
                                    {discountPct > 0 && (
                                        <div className="discount-badge">-{discountPct}%</div>
                                    )}
                                    <div className="mini-img">
                                        <img src={normalizeSrc(imgs[0] || item.img || placeholderDataURL(title, 600,600))} alt={title} onError={(e)=>{ try{ e.currentTarget.src = placeholderDataURL(title, 600,600) }catch(err){ console.warn(err) } }} />
                                    </div>
                                    <div className="mini-thumbs">
                                        {(imgs.slice(0,4)).map((s,i)=> (
                                            <img key={i} src={normalizeSrc(s)} alt={`thumb-${i}`} onError={(e)=>{ try{ e.currentTarget.style.display = 'none' }catch(err){ console.warn(err) } }} />
                                        ))}
                                    </div>
                                    <div className="mini-meta">
                                        <div className="meta-top">
                                            <div className="mini-rating" aria-hidden>
                                                <span className="rating-value">{rating ? `${rating}/5` : '5/5'}</span>
                                                <span className="star">★</span>
                                            </div>
                                            <div className="mini-title">{title}</div>
                                        </div>
                                        <div className="mini-code">Mã: {getShortCode(item.id)}</div>
                                        <div className="price-row-mini">
                                            <span className="mini-price">{priceVal.toLocaleString('it-IT', {style:'currency',currency:'VND'})}</span>
                                            {origVal > priceVal && (
                                                <span className="mini-orig">{origVal.toLocaleString('it-IT', {style:'currency',currency:'VND'})}</span>
                                            )}
                                        </div>
                                        {typeof sold === 'number' ? (<div className="mini-sold">{sold} sản phẩm đã bán</div>) : null}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </section>
            )
        }catch(e){ console.error('render recentlyViewed', e); return null }
    }

    
    if (!data) return (
        <main className="productpage">
            {fetchError ? (
                <div className="api-error" style={{background:'#ffecec',border:'1px solid #f2c6c6',color:'#7a0b0b',padding:12,borderRadius:8,margin:'12px 20px'}}> 
                    {fetchError}
                </div>
            ) : null}
            
            <section className="productpage_path">
                <nav className="breadcrumb">
                    <Link to="/" onClick={()=> handleBreadcrumbClick('Trang chủ')}>Trang chủ</Link>
                    <span> › </span>
                    <Link to="/shop/all" onClick={()=> handleBreadcrumbClick('Sản phẩm')}>Sản phẩm</Link>
                    <span> › </span>
                    <span>{data?.prodData?.title}</span>
                </nav>
            </section>
            <section className="productpage_prod-detail">
                <div className="prod-img unselect">
                    <div className="img-list">
                        <div className='img'>
                            <div className="api-loading"></div>
                        </div>
                        <div className='img'>
                            <div className="api-loading"></div>
                        </div>
                        <div className='img'>
                            <div className="api-loading"></div>
                        </div>
                    </div>
                    <div className="main-img">
                        <div className="api-loading"></div>
                    </div>
                </div>
                <div className="prod-infor"></div>
            </section>

            {renderDescription()}

            {renderReviews()}

            <section className="productpage_list">
                <h3 className="title">Sản phẩm liên quan</h3>
                <div className="list">
                    {
                        data?.prodSuggest?.map((id, index)=> <ProductCard id={id} key={index}/>)
                    }
                </div>
            </section>
            
        </main>
    )
    return(
        <main className="productpage">
            {fetchError ? (
                <div className="api-error" style={{background:'#ffecec',border:'1px solid #f2c6c6',color:'#7a0b0b',padding:12,borderRadius:8,margin:'12px 20px'}}> 
                    {fetchError}
                </div>
            ) : null}
            
            <section className="productpage_path">
                <nav className="breadcrumb">
                    <Link to="/" onClick={()=> handleBreadcrumbClick('Trang chủ')}>Trang chủ</Link>
                    <span> › </span>
                    <Link to="/shop/all" onClick={()=> handleBreadcrumbClick('Sản phẩm')}>Sản phẩm</Link>
                    <span> › </span>
                    <span>{data?.prodData?.title}</span>
                </nav>
            </section>
            <section className="productpage_prod-detail">
                <div className="prod-img unselect">
                        <div className="img-list">
                            {images.slice(0,4).map((src, idx)=> {
                                const isActive = (mainImgSrc || mainImage || images[0]) === src
                                const handleThumbClick = ()=> triggerMainImageChange(src)
                                return (
                                    <img 
                                        key={idx} 
                                        src={normalizeSrc(src)} 
                                        alt={`thumb-${idx}`} 
                                        className={`img ${isActive ? 'thumb-active':''}`} 
                                        onClick={handleThumbClick}
                                        onKeyDown={(e)=> { if (e.key === 'Enter') handleThumbClick() }}
                                        role="button"
                                        tabIndex={0}
                                        onError={(e)=>{ try{ e.currentTarget.src = placeholderDataURL(data?.prodData?.title || `thumb-${idx}`, 360,360) }catch(err){ console.warn(err) } }}
                                    />
                                )
                            })}
                        </div>
                        <div className="main-img">
                            <img src={normalizeSrc(mainImgSrc || mainImage || images[0])} alt={data?.prodData?.title || 'product'} className={imgAnimating ? 'img-anim' : ''} onError={(e)=>{ try{ e.currentTarget.src = placeholderDataURL(data?.prodData?.title || 'product', 900,700) }catch(err){ console.warn(err) } }} />
                        </div>
                        {/* color selector removed from left column; it will be rendered under size in the info column */}
                </div>
                <div className="prod-infor">
                    <h3 className='title'>{data?.prodData?.title}</h3>
                        <h4 className='id'>Mã sản phẩm: {getShortCode(id)}</h4>
                    {/* Color name & swatches (moved above size) */}
                    
                    <div className="rating-sold">
                        <div className="stars">
                            {(() => {
                                const avg = Number(data?.prodData?.ratingAverage) || 0
                                const count = Number(data?.prodData?.ratingCount) || 0
                                const active = Math.round(avg)
                                return (
                                    <>
                                        {Array.from({length:5}).map((_,i)=> <span key={i} className={`star ${i < active ? 'active' : ''}`}>★</span>)}
                                        <span className="rating-count">({count})</span>
                                    </>
                                )
                            })()}
                            <span className="sep">|</span>
                            <span className="sold">Đã bán: <b>{data?.prodData?.sold ?? 0}</b></span>
                        </div>
                    </div>
                    {/* Show current (sale) price and crossed original price if available */}
                    {(() => {
                        const priceVal = Number(data?.prodData?.price) || 0
                        const origVal = Number(data?.prodData?.oldPrice || data?.prodData?.originalPrice || data?.prodData?.compareAtPrice || 0)
                        return (
                            <div className="price-row">
                                <p className="price">{priceVal.toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}</p>
                                {origVal > priceVal && (
                                    <span className="orig-price">{origVal.toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}</span>
                                )}
                            </div>
                        )
                    })()}

                    <div className="vouchers">
                        <div className="vouchers-label">VOUCHER GIẢM GIÁ</div>
                        <div className="voucher-list">
                            <button className="voucher" onClick={()=> openVoucherModal('GIAM50K')}>
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                    <rect x="1.5" y="4" width="21" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
                                    <circle cx="8" cy="10" r="1.2" fill="currentColor" />
                                    <circle cx="16" cy="14" r="1.2" fill="currentColor" />
                                    <path d="M7.2 7.2 L16.8 16.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                                <span>Giảm 50K</span>
                            </button>
                            <button className="voucher" onClick={()=> openVoucherModal('GIAM20K')}>
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                    <rect x="1.5" y="4" width="21" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
                                    <circle cx="8" cy="10" r="1.2" fill="currentColor" />
                                    <circle cx="16" cy="14" r="1.2" fill="currentColor" />
                                    <path d="M7.2 7.2 L16.8 16.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                                <span>Giảm 20K</span>
                            </button>
                        </div>
                        {/* Voucher modal */}
                        {voucherModal.open && (
                            <div className="voucher-modal" role="dialog" aria-modal="true">
                                <div className="voucher-overlay" onClick={()=> setVoucherModal({open:false})}></div>
                                <div className="voucher-box">
                                    <header>
                                        <h3>{voucherModal.title} <small style={{marginLeft:8,fontSize:12}}>{voucherModal.code}</small></h3>
                                        <button className="close" onClick={()=> setVoucherModal({open:false})}>×</button>
                                    </header>
                                    <div className="voucher-content">
                                        <p><b>Hạn sử dụng mã:</b></p>
                                        <p className="muted">{voucherModal.valid}</p>
                                        <p><b>Ưu đãi:</b></p>
                                        <p className="muted">{voucherModal.note || `Giảm ${voucherModal.amount?.toLocaleString('it-IT')} VND`}</p>
                                        <p><b>Số lượng còn lại:</b> {typeof voucherModal.remaining === 'number' ? voucherModal.remaining : '-'}</p>
                                        <div style={{display:'flex',gap:12,marginTop:12}}>
                                            <button className="voucher-copy" onClick={handleCopyVoucher} disabled={voucherModal.remaining <= 0}>Sao chép mã</button>
                                            <button className="voucher-close" onClick={()=> setVoucherModal({open:false})}>Đóng</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    
                        {/* Open review modal */}
                        <ReviewModal open={reviewModalOpen} onClose={()=>setReviewModalOpen(false)} product={data?.prodData} productId={id} onSubmitted={()=> fetchData(category, id)} />
                        {/* Login prompt modal shown when user clicks Buy but is not authenticated */}
                        {showLoginPrompt && (
                            <div className="login-prompt-modal" role="dialog" aria-modal="true">
                                <div className="login-overlay" onClick={()=> setShowLoginPrompt(false)}></div>
                                <div className="login-box">
                                    <h3>Vui lòng đăng nhập</h3>
                                    <p>Bạn cần đăng nhập để tiếp tục mua hàng. Đăng nhập ngay bây giờ?</p>
                                    <div style={{display:'flex',gap:12,justifyContent:'flex-end',marginTop:12}}>
                                        <button className="btn" onClick={()=> setShowLoginPrompt(false)}>Hủy</button>
                                        <button className="btn" onClick={()=>{ setShowLoginPrompt(false); const next = encodeURIComponent(location.pathname + location.search + location.hash); nav(`/login?next=${next}`) }}>Đăng nhập</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="size unselect">
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <p>Chọn size: </p>
                            <SizeGuide />
                        </div>
                        {
                            data?.prodData?.size?.map((size, index)=>{
                                return(
                                    <div key={index} style={{display: 'inline-block'}}>
                                        <input id={'size'+index} name='size' type="radio" onChange={()=> {setProdSize(size)}} defaultChecked={size == 'S'}/>
                                        <label htmlFor={'size'+index} >{size}</label>
                                    </div>
                                )
                            })
                        }
                            <p className="size-help">Nếu cần tư vấn, bạn hãy liên hệ trực tiếp tới số điện thoại trên trang web hoặc nhắn tin để nhận được sự hỗ trợ.</p>
                    </div>
                    {/* Color selection: placed right below size selector */}
                    {colors.length > 0 ? (
                        <div className="color-row unselect">
                            <div className="selected-color-meta">
                                <h4 className="selected-color-name">{selectedColor || colors[0]}</h4>
                            </div>
                            <div className="color-swatches">
                                {colors.map((c, i)=>{
                                    const cssColor = (()=>{
                                        const map = {
                                            'Đen':'#000000', 'Den':'#000000',
                                            'Trắng':'#FFFFFF', 'Trang':'#FFFFFF',
                                            'Đỏ':'#C60B0B', 'Do':'#C60B0B',
                                            'Vàng':'#F5C542', 'Vang':'#F5C542',
                                            'Xanh':'#3B82F6', 'Xanh nhạt':'#7CB3FF',
                                            'Tím':'#5A2A6A','Tím than đậm':'#2B1B3A','Be':'#F5E0C7'
                                        }
                                        return map[c] || c || '#ddd'
                                    })()
                                    const imgForColor = (images.length === colors.length) ? images[i] : null
                                    const handleClick = ()=>{
                                        setSelectedColor(c)
                                        if (imgForColor) triggerMainImageChange(imgForColor)
                                    }
                                    return (
                                        <button key={i} className={`color-thumb ${selectedColor===c ? 'active':''}`} onClick={handleClick} title={c}>
                                            {imgForColor ? (
                                                <img src={imgForColor} alt={c} onError={(e)=>{ try{ e.currentTarget.src = placeholderDataURL(c || data?.prodData?.title || `color-${i}`, 200,200) }catch(err){ console.warn(err) } }} />
                                            ) : (
                                                <span className="swatch-circle" style={{background: cssColor}} />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="color-row unselect">
                            <div className="selected-color-meta">
                                <h4 className="selected-color-name">Chưa có màu</h4>
                            </div>
                            <div className="color-swatches">
                                {[0,1,2].map(i=> (
                                    <button key={i} className={`color-thumb placeholder`} title={`Màu ${i+1}`}>
                                        <span className="swatch-circle" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <p className="warehouse unselect">Số lượng trong kho: <b>{data?.prodData?.warehouse}</b></p>
                    <div className="set-quantity-cart unselect">
                        <p className="setquantity">
                            <span className='btn pointer' onClick={()=>handleChangeQuantity(-1)}> - </span>
                            <span className='num'> {quantity} </span>
                            <span className='btn pointer' onClick={()=>handleChangeQuantity(1)}> + </span>
                        </p>
                        <div className={`set-btn set-cart pointer unselect ${isStoreOnly ? 'disabled' : ''}`} onClick={()=>{ if (isStoreOnly) { showToast('Sản phẩm này hiện chỉ còn hàng tại cửa hàng. Quý khách vui lòng liên hệ hoặc ghé trực tiếp để được hỗ trợ tốt nhất.', 'error'); return } handleAddToCart() }} >
                            <img src={cartIcon} alt=""/>
                        </div>
                        <div className={`set-btn set-buy pointer unselect ${isStoreOnly ? 'disabled' : ''}`} onClick={()=>{ if (isStoreOnly) { showToast('Sản phẩm này hiện chỉ còn hàng tại cửa hàng. Quý khách vui lòng liên hệ hoặc ghé trực tiếp để được hỗ trợ tốt nhất.', 'error'); return } handleClickBuy() }}>Mua Ngay</div>
                    </div>
                    <div className="services">
                        <div className="services_child">
                            <img src={greenStar} alt="hieu boutique" />
                            <p>
                                <b>Miễn phí vận chuyển</b>
                                <span>Đơn hàng từ 299k</span>
                            </p>
                        </div>
                        <div className="services_child">
                            <img src={shipIcon} alt="hieu boutique" />
                            <p>
                                <b>Giao hàng nhanh</b>
                                <span>Từ 2 - 5 ngày</span>
                            </p>
                        </div>
                        <div className="services_child">
                            <img src={returnIcon} alt="hieu boutique" />
                            <p>
                                <b>Đổi trả linh hoạt</b>
                                <span>Trong vòng 7 ngày</span>
                            </p>
                        </div>
                    </div>
                    <p className="policy unselect">
                        Đổi hàng Online tại hệ thống Hieu Boutique hoặc đổi online nếu:
                        <br />- Sản phẩm còn nguyên tem, chưa sử dụng và không bị hư hỏng do nguyên nhân sau mua.
                        <br />- Kèm hoá đơn có giá trị tương đương hoặc cao hơn.
                        <br />- Khi đổi hàng vui lòng cung cấp tên và số điện thoại người mua.
                        <br /><i>Lưu ý: Sản phẩm len và những mặt hàng có tính chất đặc thù có thể không áp dụng đổi trả. Liên hệ Hieu Boutique để được hỗ trợ.</i>
                    </p>
                </div>
            </section>

            {renderDescription()}
            {renderReviews()}
            <section className="productpage_list">
                <h3 className="title">Sản phẩm liên quan</h3>
                <div className="list">
                    {
                        data?.prodSuggest?.map((id, index)=> <ProductCard id={id} key={index}/>)
                    }
                </div>
            </section>
            { renderRecentlySection() }
        </main>
    )
}

export default ProductDetailPage