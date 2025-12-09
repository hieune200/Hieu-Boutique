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

    // fetch notifications when opening (try API, fallback to demo data)
    async function loadNotifications(){
        try{
            const res = await fetch('/api/user/notifications', { credentials: 'include' })
            if (res && res.ok){
                const data = await res.json()
                if (Array.isArray(data)){
                    // apply any local overrides (fallback persistence) for this user
                    const overrides = getLocalReadOverrides()
                    const deleted = getLocalDeletedOverrides()
                    const merged = data.map(n => ({ ...n, read: (overrides && overrides[n.id] !== undefined) ? overrides[n.id] : !!n.read }))
                    // remove locally-deleted notifications
                    const filtered = merged.filter(n => !(deleted && deleted[n.id]))
                    // keep all (read + unread) so user can see read items grayed
                    return setNotifications(filtered)
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
        // only show unread in panel
        setNotifications(fallback.map(n => ({ ...n, read: (overrides && overrides[n.id] !== undefined) ? overrides[n.id] : false })).filter(n => !(deleted && deleted[n.id])))
    }

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

    // keep notifications up-to-date when user becomes available
    useEffect(()=>{
        if (!ctUserID) {
            setNotifications([])
            return
        }
        // load on login/refresh
        loadNotifications()
    }, [ctUserID])

        // listen for runtime 'new-notification' events (optional)
        useEffect(()=>{
            function onNew(e){
                const payload = e && e.detail ? e.detail : null
                if (!payload) return
                setNotifications(prev => [payload, ...prev].slice(0,50))
            }
            window.addEventListener('new-notification', onNew)
            return ()=> window.removeEventListener('new-notification', onNew)
        }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    // mark a single notification read (optimistic)
    // mark a single notification read -> update in-place and persist
    async function markRead(n){
        if (!n) return
        // update UI immediately
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
        // persist locally immediately so toggling/refresh won't revert
        setLocalReadOverride(n.id, true)
        try{
            await fetch(`/api/user/notifications/${encodeURIComponent(n.id)}/read`, { method: 'POST', credentials: 'include' })
        }catch(e){
            // already stored locally; nothing more to do
        }
    }

    // mark a single notification unread (optimistic)
    async function markUnread(n){
        if (!n) return
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: false } : x))
        // persist locally immediately
        setLocalReadOverride(n.id, false)
        try{
            await fetch(`/api/user/notifications/${encodeURIComponent(n.id)}/unread`, { method: 'POST', credentials: 'include' })
        }catch(e){
            // already stored locally
        }
    }

    // toggle read/unread
    function toggleRead(n){
        if (!n) return
        if (n.read) markUnread(n)
        else markRead(n)
    }

    // mark all read (keep items visible but muted)
    async function markAllRead(){
        const ids = notifications.map(n=>n.id)
        setNotifications(prev => prev.map(x => ({ ...x, read: true })))
        // persist locally immediately
        try{ ids.forEach(id => setLocalReadOverride(id, true)) }catch(err){ }
        try{
            await fetch('/api/user/notifications/mark-all-read', { method: 'POST', credentials: 'include' })
        }catch(e){
            // local overrides already saved
        }
    }

    // delete a single notification
    async function deleteNotification(n){
        if (!n) return
        // remove from UI immediately
        setNotifications(prev => prev.filter(x => x.id !== n.id))
        // persist deletion locally immediately so reload won't restore it
        try{ setLocalDeletedOverride(n.id) }catch(err){ }
        try{
            await fetch(`/api/user/notifications/${encodeURIComponent(n.id)}`, { method: 'DELETE', credentials: 'include' })
        }catch(e){
            // already recorded locally
        }
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
                                        <div className="cart-wrap feature_btn feature_icon_box pointer">
                                            <div style={{position:'relative'}}>
                                                <img src={cartIcon} alt="cart" className='feature-img pointer' onClick={()=>handleCartControl()}/>
                                                { cartCount > 0 && (
                                                    <div className="cart-count-badge" aria-hidden>{cartCount>99? '99+': cartCount}</div>
                                                ) }
                                            </div>
                                            {appliedCoupon && (
                                                <div className="coupon-badge" title={`Mã áp dụng: ${appliedCoupon.code}`}>{appliedCoupon.code}</div>
                                            )}
                                        </div>
                                </div>
                <div className="feature_notif feature_btn pointer" onClick={async ()=> {
                    // open panel for both logged-in and not-logged-in users
                    setNotifOpen(v=>!v)
                    // if toggling open and user is logged in, load notifications
                    if (!notifOpen && ctUserID){
                        loadNotifications()
                    }
                    // if not logged in, we still open panel which will show a login prompt
                }} aria-label="Thông báo">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="feature-img">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill="#111"/>
                        <path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 10-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="#111"/>
                    </svg>
                    { unreadCount > 0 && (
                        <div className="notif-badge" title={`${unreadCount} thông báo chưa đọc`}>{unreadCount>99? '99+': unreadCount}</div>
                    )}
                </div>

                {/* Notification panel rendered at top-right when notifOpen */}
                <NotificationPanel
                    open={notifOpen}
                    onClose={()=> setNotifOpen(false)}
                    notifications={ctUserID ? notifications : []}
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
    function collection (arr, categoryPath) {
        if (!Array.isArray(arr) || arr.length === 0) return null
        return arr.map((c) => {
                return (
                <li className='nav-t2_menu_collection_opt' key={`${categoryPath}::${c}`}>
                    <Link to={`/shop/${encodeURIComponent(categoryPath)}/${encodeURIComponent(c)}`}>
                        <span className="collection-label">{c}</span>
                    </Link>
                </li>
            )})
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

export default Header;