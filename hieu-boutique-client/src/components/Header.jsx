import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useState, useContext, useEffect, useRef } from 'react'
import BackToTop from './BackToTop'
import NotificationPanel from './NotificationPanel'

import { menu as staticMenu } from './headerData'
import { fetchCatalogMenu, categoryAPI, productDetail } from '../services/products.api'
// Cart modal removed: clicking cart icon now navigates directly to checkout
import Search from './Search'
import logo from '../assets/imgs/common/logo.png'
import userIcon from '../assets/imgs/common/user-icon.png'
import cartIcon from '../assets/imgs/common/cart-icon.png'
import shopAllImg from '../assets/imgs/common/header-shop-all.png'
import { globalContext } from '../context/globalContext'
import './componentStyle/Header.scss'
import { useToast } from './ToastProvider'
import { getInfor } from '../services/Auth.api'

// Helper: render sub-collections inside mega-menu
function collection (arr, categoryPath) {
    if (!Array.isArray(arr) || arr.length === 0) return null
    return arr.map((c) => {
        return (
            <li className='nav-t2_menu_collection_opt' key={`${categoryPath}::${c}`}>
                <Link to={`/shop/${encodeURIComponent(categoryPath)}/${encodeURIComponent(c)}`}>
                    <span className="collection-label">{c}</span>
                </Link>
            </li>
        )
    })
}

function productLinks(products){
    if (!Array.isArray(products) || products.length === 0) return null
    return (
        <ul className='nav-t2_menu_products'>
            {products.map(p => (
                <li key={p._id} className='nav-t2_menu_product_opt'>
                    <Link to={`/productdetail/${p.category}/${p._id}`}>{p.title}</Link>
                </li>
            ))}
        </ul>
    )
}

const Header = ()=>{
    const nav = useNavigate()
    const location = useLocation()
    // programmatic navigation is used via `nav` directly where needed
    const { ctUserID, getUserID, appliedCoupon } = useContext(globalContext)
    const { showToast } = useToast()
    // note: cart modal state removed — click opens checkout
    const [searchControl, setSearchControl] = useState(false)
    const [searchKeyWork, setSearchKeyWork] = useState('')
    const [menuData, setMenuData] = useState(staticMenu)
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const [personalOpen, setPersonalOpen] = useState(false)
    const personalRef = useRef()
    const [notifOpen, setNotifOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    // clicking cart navigates to checkout
    const [cartCount, setCartCount] = useState(0)
    const [userRole, setUserRole] = useState(null)

    const computeCartCount = (cart) => {
        try{
            if (!cart) return 0
            if (!Array.isArray(cart)) return 0
            return cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
        }catch(e){ return 0 }
    }

    useEffect(()=>{
        // initialize from localStorage
        try{ const cur = JSON.parse(localStorage.getItem('cart')); setCartCount(computeCartCount(cur)) }catch(e){ setCartCount(0) }
        // storage event for cross-tab updates
        function onStorage(e){
            try{ if (!e || !e.key) return; if (e.key === 'cart' || e.key && e.key.startsWith('hb_product_updated_')) { const cur = JSON.parse(localStorage.getItem('cart')); setCartCount(computeCartCount(cur)) } }catch(err){ }
        }
        // custom event for same-tab updates
        function onCartUpdated(ev){ try{ const detail = ev && ev.detail; const cur = detail && detail.cart ? detail.cart : JSON.parse(localStorage.getItem('cart')); setCartCount(computeCartCount(cur)) }catch(err){} }
        window.addEventListener('storage', onStorage)
        window.addEventListener('hb_cart_updated', onCartUpdated)
        return ()=>{ window.removeEventListener('storage', onStorage); window.removeEventListener('hb_cart_updated', onCartUpdated) }
    }, [])

    const handleCartControl = () => { nav('/checkout') }

    // close mobile nav on route change
    useEffect(()=>{ setMobileNavOpen(false) }, [location.pathname])
    // close personal menu on route change
    useEffect(()=>{ setPersonalOpen(false) }, [location.pathname])
    // close notification panel on route change
    useEffect(()=>{ setNotifOpen(false) }, [location.pathname])

    // close personal menu when clicking outside
    useEffect(()=>{
        function onDoc(e){
            if (!personalRef.current) return
            if (!personalRef.current.contains(e.target)) setPersonalOpen(false)
        }
        document.addEventListener('pointerdown', onDoc)
        return ()=> document.removeEventListener('pointerdown', onDoc)
    },[])

    

    // LocalStorage helpers for fallback persistence when API isn't available
    function localStorageKey(){
        try{ if (ctUserID) return `hb_notifications_read_${ctUserID}` }catch(e){}
        return `hb_notifications_read_anonymous`
    }
    function getLocalReadOverrides(){
        try{
            const key = localStorageKey()
            const raw = localStorage.getItem(key)
            if (!raw) return null
            return JSON.parse(raw)
        }catch(e){ return null }
    }
    function setLocalReadOverride(id, read){
        try{
            const key = localStorageKey()
            const cur = getLocalReadOverrides() || {}
            cur[id] = !!read
            localStorage.setItem(key, JSON.stringify(cur))
        }catch(e){ /* ignore */ }
    }


    // local storage helpers for deleted notifications (fallback when API delete fails)
    function localDeletedKey(){
        try{ if (ctUserID) return `hb_notifications_deleted_${ctUserID}` }catch(e){}
        return `hb_notifications_deleted_anonymous`
    }
    function getLocalDeletedOverrides(){
        try{
            const raw = localStorage.getItem(localDeletedKey())
            if (!raw) return null
            return JSON.parse(raw)
        }catch(e){ return null }
    }
    function setLocalDeletedOverride(id){
        try{
            const key = localDeletedKey()
            const cur = getLocalDeletedOverrides() || {}
            cur[id] = true
            localStorage.setItem(key, JSON.stringify(cur))
        }catch(e){ /* ignore */ }
    }

    // helper: treat notifications that reference orders/reviews/products as account-specific
    function isPersonalNotification(n){
        if (!n) return false
        const personalTypes = new Set(['order','order_received','review','order_update','order_cancelled'])
        if (n.type && personalTypes.has(String(n.type))) return true
        if (n.orderCode || n.productId || n.reviewId) return true
        return false
    }

    function sortNotificationsArray(arr){
        if (!Array.isArray(arr)) return arr || []
        return arr.slice().sort((a,b)=>{
            try{
                const pa = isPersonalNotification(a)
                const pb = isPersonalNotification(b)
                if (pa !== pb) return pa ? -1 : 1 // personal first
                const ta = a && (a.createdAt || a.time || a.date) ? new Date(a.createdAt || a.time || a.date) : new Date(0)
                const tb = b && (b.createdAt || b.time || b.date) ? new Date(b.createdAt || b.time || b.date) : new Date(0)
                return tb - ta
            }catch(e){ return 0 }
        }).slice(0,50)
    }

    // fetch notifications when opening (try API, fallback to demo data)
    function normalizeNotification(n){
        if (!n) return n
        const id = n.id || (n._id && (n._id.$oid || String(n._id))) || String(n._id || n.id || '')
        const createdAt = n.createdAt || n.time || n.date || null
        return { ...n, id, createdAt }
    }

    async function loadNotifications(){
        try{
            const API_BASE = import.meta.env.VITE_API_URL || ''
            if (ctUserID) {
                const base = API_BASE.replace(/\/$/, '')
                const res = await fetch(`${base}/auth/notifications/${encodeURIComponent(ctUserID)}`, { credentials: 'include' })
                if (res && res.ok){
                    const raw = await res.json()
                    const data = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : null)
                    if (Array.isArray(data)){
                        const overrides = getLocalReadOverrides()
                        const deleted = getLocalDeletedOverrides()

                        const mergedServer = data.map(d => normalizeNotification(d)).map(n => ({ ...n, read: (overrides && overrides[n.id] !== undefined) ? overrides[n.id] : !!n.read }))
                        const filteredServer = mergedServer.filter(n => !(deleted && deleted[n.id]))

                        const pendingKey = ctUserID ? `hb_notifications_pending_${ctUserID}` : 'hb_notifications_pending_anonymous'
                        let pending = []
                        try{ pending = JSON.parse(localStorage.getItem(pendingKey) || '[]') }catch(e){ pending = [] }
                        pending = (Array.isArray(pending) ? pending : []).map(p => ({ ...p, id: p.id || p._id || String(p._id || '') }))

                        const serverIds = new Set(filteredServer.map(s => String(s.id)))
                        const pendingNotOnServer = pending.filter(p => !serverIds.has(String(p.id)))

                        const merged = [...pendingNotOnServer, ...filteredServer]
                        try{ localStorage.setItem(pendingKey, JSON.stringify(pendingNotOnServer)) }catch(e){}

                        const sorted = sortNotificationsArray(merged)
                        try{ localStorage.setItem(`hb_notifications_cache_${ctUserID}`, JSON.stringify(sorted)) }catch(e){}
                        return setNotifications(sorted)
                    }
                }
            }
        }catch(e){ /* ignore and fallback */ }
        // fallback demo notifications (apply overrides if any)
        const fallback = [
            { id: 'local-1', title: 'Chào mừng!', time: '1 giờ trước', body: 'Cảm ơn bạn đã ghé HIEU BOUTIQUE. Xem ưu đãi mới.' },
            { id: 'local-2', title: 'Đơn hàng #1234', time: '2 ngày trước', body: 'Đơn hàng của bạn đã được xác nhận.' }
        ]
        const overrides = getLocalReadOverrides()
        const deleted = getLocalDeletedOverrides()
        const fallbackProcessed = fallback.map(n => ({ ...n, read: (overrides && overrides[n.id] !== undefined) ? overrides[n.id] : false })).filter(n => !(deleted && deleted[n.id]))
        try{ localStorage.setItem(`hb_notifications_cache_${ctUserID || 'anonymous'}`, JSON.stringify(sortNotificationsArray(fallbackProcessed))) }catch(e){}
        setNotifications(sortNotificationsArray(fallbackProcessed))
    }
    useEffect(()=>{
        // load notifications on login state change — when logged out, load cached/fallback items
        loadNotifications()
    }, [ctUserID])

    // fetch user info to discover role (used to show admin link)
    useEffect(()=>{
        let mounted = true
        if (!ctUserID) { setUserRole(null); return }
        (async ()=>{
            try{
                const resp = await getInfor()
                if (!mounted) return
                if (!resp){ setUserRole(null); return }
                const info = resp.data ? resp.data : resp
                setUserRole(info && info.role ? info.role : null)
            }catch(e){ if (mounted) setUserRole(null) }
        })()
        return ()=> { mounted = false }
    }, [ctUserID])

        // listen for runtime 'new-notification' events (optional)
        useEffect(()=>{
            function onNew(e){
                const payload = e && e.detail ? e.detail : null
                if (!payload) return
                    console.debug('new-notification received in header', payload)
                    setNotifications(prev => {
                        // prepend new unread notification and keep only unread items, then sort
                        try{
                            const merged = [payload, ...(prev || []).filter(x => !x.read && String(x.id) !== String(payload.id))]
                            return sortNotificationsArray(merged)
                        }catch(e){ return [payload] }
                    })
                    // refresh from server to ensure server-backed notifications are shown (if user is logged in)
                    try{ if (ctUserID) loadNotifications().then(()=> console.debug('loadNotifications() refreshed after new-notification')).catch(()=>{}) }catch(e){}
                    
                }

            window.addEventListener('new-notification', onNew)
            return ()=> window.removeEventListener('new-notification', onNew)
        }, [])

    const unreadCount = ctUserID ? (notifications || []).filter(n => !n.read).length : 0

    // mark a single notification read (optimistic) — set read flag instead of removing
    async function markRead(n){
        if (!n) return
        // mark as read in UI (grayed)
        setNotifications(prev => (prev || []).map(x => String(x.id) === String(n.id) ? ({ ...x, read: true }) : x))
        // persist locally immediately so toggling/refresh won't revert
        setLocalReadOverride(n.id, true)
        try{
            const API_BASE = import.meta.env.VITE_API_URL || ''
            const base = API_BASE.replace(/\/$/, '')
            const createdAtPayload = n && n.createdAt ? (typeof n.createdAt === 'string' ? n.createdAt : (new Date(n.createdAt)).toISOString()) : (new Date()).toISOString()
            await fetch(`${base}/auth/notifications/mark-read`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: ctUserID, createdAt: createdAtPayload }) })
        }catch(e){ /* ignore network errors — local override keeps UX */ }
        try{ window.dispatchEvent(new CustomEvent('notif-updated')) }catch(e){}
    }

    // mark a single notification unread (optimistic)
    async function markUnread(n){
        if (!n) return
        // mark as unread in UI
        setNotifications(prev => (prev || []).map(x => String(x.id) === String(n.id) ? ({ ...x, read: false }) : x))
        // persist locally immediately
        setLocalReadOverride(n.id, false)
        try{ /* no server API for unread; local override is sufficient */ }catch(e){}
        try{ window.dispatchEvent(new CustomEvent('notif-updated')) }catch(e){}
    }

    // toggle read/unread
    function toggleRead(n){
        if (!n) return
        if (n.read) markUnread(n)
        else markRead(n)
    }

    // mark all read (keep items visible but muted)
    async function markAllRead(){
        const ids = (notifications || []).map(n => n.id)
        // mark all as read in UI
        setNotifications(prev => (prev || []).map(x => ({ ...x, read: true })))
        // persist locally immediately
        try{ ids.forEach(id => setLocalReadOverride(id, true)) }catch(err){ }
        try{
            // attempt server calls but ignore failures — local overrides keep UX consistent
            await Promise.allSettled((notifications || []).map(item => {
                const API_BASE = import.meta.env.VITE_API_URL || ''
                const base = API_BASE.replace(/\/$/, '')
                const createdAtPayload = item && item.createdAt ? (typeof item.createdAt === 'string' ? item.createdAt : (new Date(item.createdAt)).toISOString()) : (new Date()).toISOString()
                return fetch(`${base}/auth/notifications/mark-read`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: ctUserID, createdAt: createdAtPayload }) })
            }))
        }catch(e){ /* ignore */ }
        try{ window.dispatchEvent(new CustomEvent('notif-updated')) }catch(e){}
    }

    // delete a single notification
    async function deleteNotification(n){
        if (!n) return
        // remove from UI immediately
        setNotifications(prev => prev.filter(x => x.id !== n.id))
        // persist deletion locally immediately so reload won't restore it
        try{ setLocalDeletedOverride(n.id) }catch(err){ }
        try{ window.dispatchEvent(new CustomEvent('notif-updated')) }catch(e){}
    }

    function handleNotifItemClick(n){
        // navigate to provided link if available, else go to notifications page
        if (!n) return
        markRead(n)
        if (n.link){
            setNotifOpen(false)
            nav(n.link)
            return
        }
        if (n.type === 'order' && n.orderId){
            setNotifOpen(false)
            nav(`/user/order/${n.orderId}`)
            return
        }
        // fallback to notifications page
        setNotifOpen(false)
        nav('/user/notifications')
    }

    // hide header + promo when scrolling down a bit, show when scrolling up
    useEffect(()=>{
        const lastY = { value: typeof window !== 'undefined' ? window.scrollY : 0 }
        const THRESHOLD = 60 // start hiding after user scrolls this far from top
        function onScroll(){
            const y = window.scrollY || window.pageYOffset
            const delta = y - lastY.value
            // ignore tiny scrolls
            if (Math.abs(delta) < 8) return
            if (y > THRESHOLD && delta > 0){
                // scrolling down past threshold -> hide header
                document.body.classList.add('header-hidden')
            }else{
                // scrolling up -> show header
                document.body.classList.remove('header-hidden')
            }
            lastY.value = y
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return ()=> window.removeEventListener('scroll', onScroll)
    },[])

    // load dynamic menu from server and fall back to static menu
    useEffect(()=>{
        let mounted = true
        async function loadMenu(){
            try{
                const data = await fetchCatalogMenu()
                if (!mounted) return
                if (Array.isArray(data) && data.length > 0){
                    // map items to { category, path, collection }
                    const mapped = data.map(item => ({ category: item.category, path: item.category, collection: item.collections || [] }))

                    // fetch a couple of sample products per category (for header quick links)
                    const SAMPLE_CAT_COUNT = 6 // only enrich first N categories to limit requests
                    const SAMPLE_PER_CAT = 3
                    await Promise.all(mapped.slice(0, SAMPLE_CAT_COUNT).map(async (m) => {
                        try{
                            const res = await categoryAPI(m.path)
                            const ids = (res && res.data) ? res.data.slice(0, SAMPLE_PER_CAT) : []
                            if (!ids.length){ m.products = [] ; return }
                            const details = await Promise.all(ids.map(id => productDetail(id)))
                            m.products = details.map(d => (d && d.data) ? d.data : null).filter(Boolean)
                        }catch(err){ m.products = [] }
                    }))

                    setMenuData(mapped)
                }
            }catch(e){
                // ignore and keep static menu
                console.warn('fetchCatalogMenu failed', e)
            }
        }
        loadMenu()
        return ()=> { mounted = false }
    }, [])
    const goToLogin = () => {
        if (!ctUserID) {
            const next = encodeURIComponent(location.pathname + location.search + location.hash)
            nav(`/login?next=${next}`)
        }
    }
    const goToLogout = () => {
        // Clear user identity and tokens from both storages so "remember me" is revoked on explicit logout
        try{ sessionStorage.removeItem('userID'); sessionStorage.removeItem('token') }catch(e){ console.warn('clear sessionStorage failed', e) }
        try{ localStorage.removeItem('userID'); localStorage.removeItem('token') }catch(e){ console.warn('clear localStorage failed', e) }
        // also clear social prefill keys if present in either storage
        try{ sessionStorage.removeItem('social_name'); sessionStorage.removeItem('social_email'); sessionStorage.removeItem('social_avatar') }catch(e){ console.warn('clear social sessionStorage failed', e) }
        try{ localStorage.removeItem('social_name'); localStorage.removeItem('social_email'); localStorage.removeItem('social_avatar') }catch(e){ console.warn('clear social localStorage failed', e) }
        localStorage.removeItem("cart")
        getUserID()
        try{ showToast('Đăng xuất thành công', 'success') }catch(e){ console.warn('showToast failed', e) }
        nav('/')
    }
    const handleSearchKeyWork = (e) => {  
        setSearchKeyWork(e.target.value)
    }
    const searchEnter = (e) =>{
        if (e.key == 'Enter') {
            const k = String(searchKeyWork || '').trim()
            if (k) {
                // navigate to search results page with query param
                nav(`/search?q=${encodeURIComponent(k)}`)
                // clear any overlay state
                setSearchControl(false)
            }
        }
    }
    function translateCategory(name){
        if (!name) return name
        const map = {
            ao: 'Áo',
            quan: 'Quần',
            dam: 'Đầm',
            phukien: 'Phụ kiện',
            vay: 'Váy',
            treem: 'Trẻ em',
            'phu-kien': 'Phụ kiện',
            'accessories': 'Phụ kiện',
            'children': 'Trẻ em',
            'all': 'Tất cả'
        }
        const key = String(name).toLowerCase()
        return map[key] || name.replace(/(^|-|_)([a-z])/g, (_,a,b)=>b.toUpperCase())
    }

    return(
        <>
        <header className="header">
                <Link to="/" className="logo pointer">
                    <div className="logo_img">
                        <img src={logo} alt="logo" />
                    </div>
                    <p className="logo_name">HIEU BOUTIQUE</p>
                </Link>
            <nav className="navigation">
                <Link to='/' className="nav-t1 pointer">Trang chủ</Link>
                <Link to='/sale' className="nav-before-link pointer" aria-label="Sale">
                    <span className="nav-before-text">SALE</span>
                </Link>
                <Link to='/shop/all' className="nav-t1 hover-handle-nav-t2 pointer">Sản phẩm</Link>
                <Link to='/news' className="nav-t1 pointer">Tin tức</Link>
                {/* <Link to='/address' className="nav-t1 pointer">Cửa hàng</Link> */}
                <Link to='/contacts' className="nav-t1 pointer">Liên hệ</Link>
                { userRole === 'admin' && (
                    <Link to='/admin' className="nav-t1 pointer" aria-label="Admin">Admin</Link>
                )}
                <div className="nav-t2">
                    <div className="nav-list">
                        {
                            menuData.map( function (option, index) {
                                return(
                                    <div className="nav-t2_menu" key={`menut1 ${index}`}>
                                        <Link className='nav-t2_menu_category pointer' to={`/shop/${option.path}`}>{translateCategory(option.category)}</Link>
                                                                    <ul className='nav-t2_menu_collection'>
                                                                        {collection(option.collection, option.path)}
                                                                    </ul>
                                                                    { productLinks(option.products) }
                                    </div>
                                )
                            })
                        }
                    </div>
                    <Link to="/shop/all" className="nav-shop-all pointer">
                        <img src={shopAllImg} alt="shop all" />
                        <p>Xem tất cả sản phẩm</p>
                    </Link>
                </div>
            </nav>
            {/* top-right SALE link removed — badge moved before 'Sản phẩm' */}
            <div className="feature">
                <button className="mobile-toggle" aria-label="Mở menu" onClick={()=> setMobileNavOpen(!mobileNavOpen)}>
                    <svg width="20" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M3 12h18M3 18h18" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div className="feature_search">
                    <input type="text" className='search-header' placeholder='Tìm kiếm' value={searchKeyWork} onChange={(e)=> handleSearchKeyWork(e)} onKeyDown={(e)=> searchEnter(e)}/>
                    {
                        searchControl && <Search setSearchControl={setSearchControl} setSearchKeyWork={setSearchKeyWork} searchKeyWork={searchKeyWork}/>
                    }
                </div>
                <div ref={personalRef} className="feature_personal feature_btn pointer" onClick={()=> {
                    if (!ctUserID) return goToLogin()
                    setPersonalOpen(v=>!v)
                }}>   
                    <img src={userIcon} alt="personal" className='feature-img'/>
                    {
                        ctUserID &&
                        <ul className={"feature_personal_sel" + (personalOpen? ' open':'')} onPointerDown={e=>e.stopPropagation()}>
                            <li className="opt">
                                <Link className="opt-link pointer" to="/user/profile">
                                    <span className="opt-icon" aria-hidden>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h14c0-3.866-3.134-7-7-7z" fill="#111"/></svg>
                                    </span>
                                    <span className="opt-label">Thông tin cá nhân</span>
                                </Link>
                            </li>
                            <li className="opt">
                                <Link className="opt-link pointer" to="/user/order">
                                    <span className="opt-icon" aria-hidden>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6zm5-3h8v2H8V3z" fill="#111"/></svg>
                                    </span>
                                    <span className="opt-label">Đơn mua</span>
                                </Link>
                            </li>
                            <li className="opt">
                                <button className="opt-link opt-logout pointer" onClick={()=>goToLogout()}>
                                    <span className="opt-icon" aria-hidden>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 13v-2H7V8l-5 4 5 4v-3h9zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" fill="#111"/></svg>
                                    </span>
                                    <span className="opt-label">Đăng xuất</span>
                                </button>
                            </li>
                        </ul>
                    }
                </div>
                <div className="feature_cart">
                    <div className="cart-wrap feature_btn feature_icon_box pointer" onClick={()=>handleCartControl()} role="button" aria-label="Mở giỏ hàng">
                        <div style={{position:'relative'}}>
                            <img src={cartIcon} alt="cart" className='feature-img pointer'/>
                            { cartCount > 0 && (
                                <div className="cart-count-badge" aria-hidden>{cartCount>99? '99+': cartCount}</div>
                            ) }
                        </div>
                        {/* applied coupon shown on the cart/checkout page instead of header */}
                    </div>
                </div>
                <div className="feature_notif feature_btn pointer" onClick={async ()=> {
                    // If not logged in, send user to login instead of showing notifications
                    if (!ctUserID) { goToLogin(); return }
                    // toggle panel and load notifications when opening
                    setNotifOpen(v=>!v)
                    if (!notifOpen && ctUserID){
                        loadNotifications()
                    }
                }} aria-label="Thông báo">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="feature-img">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill="#111"/>
                        <path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 10-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="#111"/>
                    </svg>
                    { ctUserID && unreadCount > 0 && (
                        <div className="notif-badge" title={`${unreadCount} thông báo chưa đọc`}>{unreadCount>99? '99+': unreadCount}</div>
                    )}
                </div>

                {/* Notification panel rendered at top-right when notifOpen */}
                {
                    // compute whether we have any cached/fallback notifications (used to decide empty panel messaging)
                }
                <NotificationPanel
                    open={notifOpen}
                    onClose={()=> setNotifOpen(false)}
                    notifications={ctUserID ? notifications : []}
                    hasLocalNotifications={ctUserID ? (() => { try{ const key = `hb_notifications_cache_${ctUserID}`; return !!localStorage.getItem(key) }catch(e){ return false } })() : false}
                    maxVisible={3}
                    onRequireLogin={() => goToLogin()}
                    onToggleRead={(n)=> toggleRead(n)}
                    onMarkAllRead={()=> markAllRead()}
                    onItemClick={(n)=> handleNotifItemClick(n)}
                    onDeleteNotification={(n)=> deleteNotification(n)}
                />
                                
            </div>
            {
                mobileNavOpen && (
                    <div className="mobile-nav">
                        <nav>
                            <Link to="/" onClick={()=> setMobileNavOpen(false)}>Trang chủ</Link>
                            <Link to="/sale" onClick={()=> setMobileNavOpen(false)}>SALE</Link>
                            <Link to="/shop/all" onClick={()=> setMobileNavOpen(false)}>Sản phẩm</Link>
                            <Link to="/news" onClick={()=> setMobileNavOpen(false)}>Tin tức</Link>
                            <Link to="/contacts" onClick={()=> setMobileNavOpen(false)}>Liên hệ</Link>
                            <div className="mobile-categories">
                                {menuData.map((m, i)=> (<Link key={i} to={`/shop/${m.path}`} onClick={()=> setMobileNavOpen(false)} className="mobile-cat">{translateCategory(m.category)}</Link>))}
                            </div>
                        </nav>
                    </div>
                )
            }
        </header>
        <BackToTop />
        </>
    )
}

export default Header;