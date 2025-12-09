import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { productDetail } from '../services/products.api'
import cartIcon from '../assets/imgs/common/cart-icon.png'
import assetsMap from '../assets/imgs/anhsanpham/assetsMap'

// local demo assets (use import.meta.url so bundler resolves them)
const demoAssets = {
    ao: new URL('../assets/imgs/anhsanpham/demo-ao.svg', import.meta.url).href,
    dam: new URL('../assets/imgs/anhsanpham/demo-dam.svg', import.meta.url).href,
    quan: new URL('../assets/imgs/anhsanpham/demo-quan.svg', import.meta.url).href,
    treem: new URL('../assets/imgs/anhsanpham/demo-treem.svg', import.meta.url).href,
    default: new URL('../assets/imgs/anhsanpham/default-demo.svg', import.meta.url).href,
}

function findLocalJpg(product){
    if (!product) return null
    const title = (product.title || '').toLowerCase()
    const cat = (product.category || '').toLowerCase()
    const tokens = (title + ' ' + cat).replace(/[^a-z0-9\u00C0-\u017F]+/gi, ' ').split(/\s+/).filter(Boolean)
    // score assets by token matches
    const scored = assetsMap.map(a => {
        const name = a.name.toLowerCase()
        let score = 0
        tokens.forEach(t => { if (name.includes(t)) score += 1 })
        if (cat && name.includes(cat)) score += 1
        return { a, score }
    }).sort((x,y) => y.score - x.score)
    if (scored.length && scored[0].score > 0) return scored[0].a.url
    return null
}

import './componentStyle/ProductCard.scss'
import QuickAddPanel from './QuickAddPanelFixed'
import { useToast } from './ToastProvider'

// client-side SVG placeholder generator used as img onError fallback
function placeholderDataURL(label = 'Product', w = 800, h = 800){
    const text = String(label).replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    const svg = `<?xml version="1.0" encoding="utf-8"?>\n` +
        `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
        `<rect width='100%' height='100%' fill='#fafafa'/>` +
        `<rect x='40' y='80' width='${w-80}' height='${Math.round(h*0.7)}' rx='12' fill='#fff' stroke='#eee'/>` +
        `<text x='${Math.round(w/2)}' y='${Math.round(h/2)}' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='32' fill='#b71c1c'>${encodeURIComponent(text)}</text>` +
        `</svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// (getShortCode removed from ProductCard - unused here)

const Productcard = ({ id })=>{  
    const { showToast } = useToast()
    const [productData, setProductData] = useState()
    const [image, setImage] = useState(null)
    const [didChange, setDidChange] = useState(false)
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    useEffect(()=>{
        let mounted = true
        async function loadProductDetail(pid){
            try{
                const res = await productDetail(pid)
                if (!mounted) return
                if (!res) return
                if (res.status == 500){
                    try{ showToast(res.message || 'Lỗi khi tải sản phẩm', 'error') }catch(e){ console.warn(e) }
                    return
                }
                setProductData(res.data)
            }catch(err){ console.error('loadProductDetail error', err) }
        }
        if (id) loadProductDetail(id)

        // listen for cross-tab/local updates for this product
        const storageHandler = (e) => {
            try{
                if (!e || !e.key) return
                if (e.key === `hb_product_updated_${id}`) {
                    loadProductDetail(id)
                }
            }catch(err){ console.warn('storageHandler', err) }
        }
        const customHandler = (ev) => {
            try{
                const payload = ev && ev.detail
                if (!payload) return
                if (String(payload.id) === String(id)) loadProductDetail(id)
            }catch(err){ console.warn('customHandler', err) }
        }
        window.addEventListener('storage', storageHandler)
        window.addEventListener('hb_product_updated', customHandler)

        return ()=>{ mounted = false; window.removeEventListener('storage', storageHandler); window.removeEventListener('hb_product_updated', customHandler) }
    },[id, showToast])
    const imgSrc = Array.isArray(productData?.img) ? productData.img[0] : productData?.img

    useEffect(()=>{
        if (imgSrc) {
            setImage(imgSrc)
            // trigger brief animation on image change
            setDidChange(true)
            const t = setTimeout(()=> setDidChange(false), 220)
            return ()=> clearTimeout(t)
        }
        // if product has no images, prefer a local JPG match, then demo SVG, then generated placeholder
        if (!imgSrc && productData) {
            const local = findLocalJpg(productData)
            if (local) {
                setImage(local)
            } else {
                const catKey = (productData.category || '').toLowerCase()
                const pick = demoAssets[catKey] || (
                    (productData.title || '').toLowerCase().includes('áo') ? demoAssets.ao :
                    (productData.title || '').toLowerCase().includes('đầm') || (productData.title || '').toLowerCase().includes('dam') ? demoAssets.dam :
                    (productData.title || '').toLowerCase().includes('quần') || (productData.title || '').toLowerCase().includes('quan') ? demoAssets.quan :
                    demoAssets.default
                )
                setImage(pick)
            }
            setDidChange(true)
            const t2 = setTimeout(()=> setDidChange(false), 220)
            return ()=> clearTimeout(t2)
        }
    },[imgSrc, productData])

    // navigation moved to Link wrapper
    if (!productData){
        return (
            <div className="productcard">
                <div className="api-loading"></div>
            </div>
        )
    }

    // Determine discount display
    const oldPrice = productData.oldPrice || null
    const price = productData.price || 0
    const discountPercent = oldPrice ? Math.round((oldPrice - price) / oldPrice * 100) : 0

    const isLowStock = (productData.warehouse || 0) <= 25
        const isStoreOnly = Boolean(productData.storeOnly)
    // use explicit numeric check: if `sold` is 0 we should respect it (0 is falsy)
    const estimatedSold = (typeof productData.sold === 'number') ? productData.sold : Math.max(0, Math.round((100 - (productData?.warehouse||0)) / 2))
    const swatches = Array.isArray(productData.img) ? productData.img.slice(0,5) : []

    return(
        <>
        <Link to={`/productdetail/${productData?.category}/${productData?._id}`} className="productcard pointer">
            {(isLowStock || isStoreOnly) && <div className="badge store-only">Chỉ còn tại cửa hàng</div>}
            {discountPercent > 0 && <div className="discount-circle">-{discountPercent}%</div>}
            <div className="img-wrap">
                <img
                    className={didChange ? 'did-change' : ''}
                    src={image || imgSrc}
                    alt={productData?.title || 'hieu boutique'}
                    onError={(e)=>{
                        try{
                            // prefer bundled demo asset for this category, then fallback to generated SVG
                            const catKey = (productData?.category || '').toLowerCase()
                            const demo = demoAssets[catKey] || demoAssets.default
                            if (e.currentTarget.src !== demo) {
                                e.currentTarget.src = demo
                                return
                            }
                            e.currentTarget.src = placeholderDataURL(productData?.title || 'Demo')
                            }catch(err){ console.warn('fetch product details failed', err) }
                    }}
                />
                <div className={`quick-add ${isStoreOnly ? 'disabled' : ''}`} onClick={(e)=>{ 
                    e.preventDefault(); e.stopPropagation(); 
                    if (isStoreOnly) { 
                        try{ showToast('Sản phẩm này hiện chỉ còn hàng tại cửa hàng. Quý khách vui lòng liên hệ hoặc ghé trực tiếp để được hỗ trợ tốt nhất.', 'error') }catch(err){ console.warn('showToast failed', err) }
                        return
                    }
                    setShowQuickAdd(true)
                }}>
                    <img src={cartIcon} alt="cart" style={{width:18,height:18}}/>
                    <span className="quick-add-text">Thêm giỏ hàng</span>
                </div>
            </div>

            <div className="swatches">
                {swatches.map((s, idx)=> (
                    <button key={idx} className={"swatch" + (image===s? ' active':'')} onClick={(e)=>{e.preventDefault(); setImage(s)}}>
                        <img src={s} alt={`swatch-${idx}`} onError={(e)=>{ try{ const demo = demoAssets.default; if (e.currentTarget.src !== demo) { e.currentTarget.src = demo; return } e.currentTarget.src = placeholderDataURL(s || productData?.title || `swatch-${idx}`, 200,200) }catch(err){ console.warn('swatch image fallback failed', err) } }} />
                    </button>
                ))}
            </div>

            <div className="meta">
                <div className="meta-top">
                    <div className="rating">
                        <span className="star">★</span>
                        <span className="rating-score">5/5</span>
                    </div>
                    <div className="title-inline">{productData?.title}</div>
                </div>
                <div className="price-row">
                    <p className="price">{price?.toLocaleString('it-IT', {style : "currency", currency : "VND"})}</p>
                    {oldPrice && <p className="original">{oldPrice?.toLocaleString('it-IT', {style : "currency", currency : "VND"})}</p>}
                </div>
                <div className="sold">{estimatedSold} sản phẩm đã bán</div>
            </div>
        </Link>
        {showQuickAdd && <QuickAddPanel product={productData} image={image} onClose={()=> setShowQuickAdd(false)} />}
        </>
    )
}

Productcard.propTypes = {
    id: PropTypes.string.isRequired,
};

export default Productcard;

