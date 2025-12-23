
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom'

import OrderItem from './OrderItem'
import ReviewModal from '../../components/ReviewModal'
import ChangePassword from './ChangePassword'
import Notifications from './Notifications'
import Vouchers from './Vouchers'

import { getInfor, updateInfor, getOrder, cancelOrderAPI, confirmReceivedAPI } from '../../services/Auth.api'
import './userpage.scss'
import { useToast } from '../../components/ToastProvider'

const UserPage = ()=>{
    const nav = useNavigate()
    const location = useLocation()
    const {feature} = useParams()
    const [ board, setBoard ] = useState()
    const [ orderList, setOrderList ] = useState()    
    const [ userID, setUserID ] = useState(localStorage.getItem('userID') || sessionStorage.getItem("userID"))
    const [ userData, setUserData ] = useState()
    const [ loading, setLoading ] = useState(false)
    const [ showSocialBanner, setShowSocialBanner ] = useState(true)
    const [ saveMessage, setSaveMessage ] = useState(null)
    useEffect(()=>{
        setBoard(feature)
        window.scrollTo({top: '0', behavior: 'smooth'})
        if (!userID) {
            const next = encodeURIComponent(location.pathname + location.search + location.hash)
            nav(`/login?next=${next}`)
        }
    }, [feature, userID, nav, location.pathname, location.search, location.hash])
    const { showToast } = useToast()
    const getUserInfor = useCallback(async ()=>{
        const response = await getInfor()
        if (!response){
            showToast('Lỗi khi tải thông tin người dùng', 'error')
            nav('/')
            return
        }
        // normalize: support both { status, message, data } and raw data object
        if (response.status && response.status != 201){
            showToast(response.message || 'Lỗi khi tải thông tin người dùng', 'error')
            nav('/')
            return
        }
        const data = response.data ? response.data : response
        setLoading(false)
        // Prefill with social data if present (after social OAuth login)
        const prefills = {}
        const socialName = sessionStorage.getItem('social_name')
        const socialEmail = sessionStorage.getItem('social_email')
        const socialAvatar = sessionStorage.getItem('social_avatar')
        if (socialName && (!response.data.name || response.data.name.trim() === '')) prefills.name = socialName
        if (socialEmail && (!response.data.email || response.data.email.trim() === '')) prefills.email = socialEmail
        if (socialAvatar && (!response.data.avatar || response.data.avatar.trim() === '')) prefills.avatar = socialAvatar
        const merged = { ...data, ...prefills }
        // Normalize avatar value: if it's a raw base64 string without data: prefix, add a sensible default prefix.
        const normalizeAvatar = (a) => {
            if (!a) return '/ava.svg'
            if (typeof a !== 'string') return '/ava.svg'
            const s = a.trim()
            if (s === '') return '/ava.svg'
            // already a data URL or absolute/relative path
            if (s.startsWith('data:') || s.startsWith('http:') || s.startsWith('https:') || s.startsWith('/')) return s
            // looks like base64 (very permissive): only base64 chars and possibly newlines
            // avoid over-eager detection; require length > 50 to reduce false positives
            if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 50) {
                return `data:image/jpeg;base64,${s}`
            }
            // fallback to original value
            return s
        }
        merged.avatar = normalizeAvatar(merged.avatar)
        setUserData(merged)
    }, [nav, showToast])
    const getOrderList = useCallback(async ()=>{
        const res = await getOrder()
        if (!res){
            showToast('Lỗi khi lấy đơn hàng', 'error')
            return
        }
        if (res.status && res.status != 201){
            showToast(res.message || 'Lỗi khi lấy đơn hàng', 'error')
            return
        }
        const list = res.data ? res.data : res
        setLoading(false)
        setOrderList(Array.isArray(list) ? list.reverse() : (list && list.reverse ? list.reverse() : []))
    }, [showToast])
    useEffect(()=>{
        const userInfoBoards = ['profile', 'notifications', 'vouchers']
        setLoading(true)
        setUserID(localStorage.getItem('userID') || sessionStorage.getItem("userID"))
        // Always load basic user information (avatar, username) so sidebar stays in sync across boards
        if (localStorage.getItem('userID') || sessionStorage.getItem('userID')) {
            getUserInfor()
        }
        if (feature == 'order') getOrderList()
        else setLoading(false)
    },[feature, userID, getUserInfor, getOrderList])

    // Persist helper: called when subpages update user data
    const persistUserData = async (nextUserData) => {
        setUserData(nextUserData)
        try{
            const res = await updateInfor(nextUserData)
            if (res && (res.status == 201 || res.status === '201')){
                setSaveMessage({ type: 'success', text: res.message || 'Lưu thông tin thành công' })
                setTimeout(()=> setSaveMessage(null), 3000)
                try{ window.dispatchEvent(new CustomEvent('user-updated', { detail: { user: nextUserData, ts: Date.now() } })) }catch(e){}
            } else {
                setSaveMessage({ type: 'error', text: res?.message || 'Lưu thất bại' })
                setTimeout(()=> setSaveMessage(null), 3000)
                console.error('Failed to persist user data', res)
            }
        }catch(e){ console.error('persistUserData error', e) }
    }
    const handleReBuy = () => {
        // legacy placeholder; real handler below
        showToast('Chức năng mua lại chưa được triển khai', 'info');
    }

    const handleCancelOrder = async (orderCode, idx) => {
        if (!orderCode) return
        try{
            const res = await cancelOrderAPI(orderCode)
            if (!res || res.status != 201){
                showToast(res?.message || 'Hủy đơn thất bại', 'error')
                return
            }
            // optimistic update: mark order as canceled in UI
            setOrderList(prev => {
                if (!prev) return prev
                const next = [...prev]
                const pos = next.findIndex(o => (o.orderCode || '') === orderCode)
                if (pos >= 0){ next[pos] = { ...next[pos], orderStatus: 'cancled', canceledAt: (new Date()).toISOString() } }
                return next
            })
            showToast('Đã hủy đơn', 'success')
                try{
                    const note = {
                        id: `note-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                        title: `Đơn hàng ${orderCode} đã hủy`,
                        time: new Date().toISOString(),
                        body: `Đơn hàng ${orderCode} đã được hủy theo yêu cầu.`,
                        type: 'order',
                        orderId: orderCode,
                        read: false
                    }
                    // persist to pending queue so panel shows it even if server hasn't saved yet
                    try{
                        const uid = sessionStorage.getItem('userID') || localStorage.getItem('userID') || 'anonymous'
                        const key = `hb_notifications_pending_${uid}`
                        const cur = JSON.parse(localStorage.getItem(key) || '[]')
                        cur.unshift(note)
                        localStorage.setItem(key, JSON.stringify(cur.slice(0,50)))
                    }catch(e){ /* ignore */ }
                    window.dispatchEvent(new CustomEvent('new-notification', { detail: note }))
                }catch(e){ /* ignore */ }
        }catch(e){ console.error('handleCancelOrder error', e); showToast('Lỗi khi hủy đơn', 'error') }
    }

    const handleConfirmReceived = async (orderCode) => {
        if (!orderCode) return
        try{
            const res = await confirmReceivedAPI(orderCode)
            if (!res || res.status != 201){
                showToast(res?.message || 'Xác nhận thất bại', 'error')
                return
            }
            // optimistic UI: mark order as customerConfirmed so 'Đánh giá' button appears
            setOrderList(prev => {
                if (!prev) return prev
                const next = [...prev]
                const pos = next.findIndex(o => (o.orderCode || '') === orderCode)
                if (pos >= 0){ next[pos] = { ...next[pos], orderStatus: 'completed', customerConfirmed: true, receivedAt: (new Date()).toISOString() } }
                return next
            })
            showToast('Cảm ơn! Đã xác nhận nhận hàng', 'success')
            try{
                const note = {
                    id: `note-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                    title: `Xác nhận nhận hàng ${orderCode}`,
                    time: new Date().toISOString(),
                    body: `Bạn đã xác nhận đã nhận hàng cho đơn ${orderCode}. Cảm ơn bạn.`,
                    type: 'order',
                    orderId: orderCode,
                    read: false
                }
                try{
                    const uid = sessionStorage.getItem('userID') || localStorage.getItem('userID') || 'anonymous'
                    const key = `hb_notifications_pending_${uid}`
                    const cur = JSON.parse(localStorage.getItem(key) || '[]')
                    cur.unshift(note)
                    localStorage.setItem(key, JSON.stringify(cur.slice(0,50)))
                }catch(e){ /* ignore */ }
                window.dispatchEvent(new CustomEvent('new-notification', { detail: note }))
            }catch(e){ /* ignore */ }
        }catch(e){ console.error('handleConfirmReceived error', e); showToast('Lỗi khi xác nhận', 'error') }
    }

    const handleReBuyOrder = (order) => {
        try{
            if (!order || !Array.isArray(order.orderList)) return showToast('Không có sản phẩm để mua lại', 'info')
            const cart = JSON.parse(localStorage.getItem('cart')) || []
            // add each ordered item to cart (merge by id/size/color)
            for (const it of order.orderList){
                const defaultSize = it.size || ''
                const defaultColor = it.color || ''
                const idx = cart.findIndex(c => c.id === it.id && (c.size||'') === defaultSize && (c.color||'') === defaultColor)
                const qty = Number(it.quantity) || 1
                const price = Number(it.unitPrice) || (Number(it.price) || 0)
                if (idx === -1){
                    cart.unshift({ id: it.id, img: (it.img && (Array.isArray(it.img)? it.img[0]: it.img)) || '', title: it.title || '', size: defaultSize, color: defaultColor, quantity: qty, count: qty * price })
                } else {
                    const existing = cart[idx]
                    existing.quantity = (existing.quantity || 0) + qty
                    existing.count = existing.quantity * (Number(existing.count) / Math.max(1, Number(existing.quantity)))
                }
            }
            localStorage.setItem('cart', JSON.stringify(cart))
            try{ window.dispatchEvent(new CustomEvent('hb_cart_updated', { detail: { cart, ts: Date.now() } })) }catch(e){ /* ignore */ }
            showToast('Đã thêm sản phẩm vào giỏ hàng', 'success')
            nav('/checkout')
        }catch(e){ console.error('handleReBuyOrder error', e); showToast('Lỗi khi thêm vào giỏ', 'error') }
    }

    const handleReviewOrder = (order) => {
        try{
            if (!order || !Array.isArray(order.orderList) || order.orderList.length === 0) return showToast('Không có sản phẩm để đánh giá', 'info')
            const first = order.orderList[0]
            const pid = first.id
            const pcat = first.category || (first.cat || '')
            if (!pid) return showToast('Không tìm thấy sản phẩm để đánh giá', 'error')
            // open inline review modal instead of navigating away
            setReviewModalOpen(true)
            setReviewTarget({ productId: pid, product: { title: first.title || '', img: Array.isArray(first.img)? first.img : (first.img? [first.img]: []) } })
        }catch(e){ console.error('handleReviewOrder error', e); showToast('Lỗi khi mở trang đánh giá', 'error') }
    }

    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [reviewTarget, setReviewTarget] = useState({ productId: null, product: null })

    const onReviewSubmitted = ()=>{
        // refresh orders and product reviews if needed
        try{ getOrderList() }catch(e){ /* ignore */ }
    }

    const [contactOrder, setContactOrder] = useState(null)
    const [contactForm, setContactForm] = useState({ name:'', email:'', phone:'', message:'' })
    const handleContactSeller = (order) => {
        // open a modal showing seller/contact info from order.shipping or fallback
        setContactOrder(order)
        // prefill form from userData and order
        setContactForm({
            name: userData?.name || '',
            email: userData?.email || '',
            phone: userData?.phoneNumber || '',
            message: `Tôi muốn liên hệ về đơn ${order?.orderCode || ''}.\n` + (order?.shipping?.note ? `Ghi chú: ${order.shipping.note}\n` : '')
        })
    }

    const handleContactChange = (key, value) => setContactForm(prev => ({...prev, [key]: value}))

    const handleSendContact = async (e) => {
        e.preventDefault()
        if (!contactOrder) return
        // submit contact to server so it is stored and emailed to seller (best-effort)
        try{
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
            const url = `${API_BASE}/auth/order/contact`
            const token = sessionStorage.getItem('token') || localStorage.getItem('token')
            const payload = {
                orderCode: contactOrder.orderCode,
                sellerEmail: contactOrder.seller?.email || contactOrder.shipping?.email || '',
                sellerName: contactOrder.seller?.name || '',
                name: contactForm.name,
                email: contactForm.email,
                phone: contactForm.phone,
                message: contactForm.message
            }
            const headers = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
            let data = {}
            try{ data = await res.json() }catch(e){ /* ignore */ }
            if (res.ok) {
                showToast(data.message || 'Gửi liên hệ thành công', 'success')
                setContactOrder(null)
                    try{
                        const note = {
                            id: `note-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                            title: `Gửi liên hệ: ${contactOrder.orderCode || ''}`,
                            time: new Date().toISOString(),
                            body: `Bạn đã gửi liên hệ tới người bán về đơn ${contactOrder.orderCode || ''}.`,
                            type: 'contact',
                            read: false
                        }
                        try{
                            const uid = sessionStorage.getItem('userID') || localStorage.getItem('userID') || 'anonymous'
                            const key = `hb_notifications_pending_${uid}`
                            const cur = JSON.parse(localStorage.getItem(key) || '[]')
                            cur.unshift(note)
                            localStorage.setItem(key, JSON.stringify(cur.slice(0,50)))
                        }catch(e){ /* ignore */ }
                        window.dispatchEvent(new CustomEvent('new-notification', { detail: note }))
                    }catch(e){ /* ignore */ }
            } else {
                showToast(data.message || 'Gửi liên hệ thất bại', 'error')
            }
        }catch(err){ console.error('handleSendContact error', err); showToast('Lỗi khi gửi liên hệ', 'error') }
    }

    const handleChangeUserData = (key, value) => {
        if (key == 'avatar'){
            var maxSizeInBytes = 1 * 1024 * 1024; 
            if (value.size > maxSizeInBytes) {
                showToast("Vui lòng chọn hình ảnh nhỏ hơn 1MB", 'error')
                return
            }
            var reader = new FileReader();
            reader.onloadend = ()=> setUserData({...userData, avatar: reader.result})
            reader.readAsDataURL(value);
            return
        }
        setUserData({...userData, [key]: value})
    }

    async function handleSaveInfor (e){
        e.preventDefault()
        const res = await updateInfor(userData)
        if (res && (res.status == 201 || res.status === '201')){
            setSaveMessage({ type: 'success', text: res.message || 'Lưu thông tin thành công' })
            setTimeout(()=> setSaveMessage(null), 3000)
        } else {
            setSaveMessage({ type: 'error', text: res?.message || 'Lưu thất bại' })
            setTimeout(()=> setSaveMessage(null), 3000)
        }
        // If update succeeded, clear temporary social prefill data
        if (res && (res.status == 201 || res.status == '201')){
            try{
                sessionStorage.removeItem('social_name')
                sessionStorage.removeItem('social_email')
                sessionStorage.removeItem('social_avatar')
            } catch(e){ console.warn(e) }
            setShowSocialBanner(false)
        }
    }
    return(
        <main className="userpage">
            <aside className="sidebar">
                <div className="sidebar_avt">
                    <img src={userData?.avatar || '/ava.svg'} alt="avt" className="sidebar_avt_img" onError={(e)=>{ try{ e.currentTarget.src = '/ava.svg' }catch(err){ console.warn(err) } }} />
                    <div className="sidebar_avt_username">
                        <p>{userData?.username}</p>
                    <Link to="/user/profile">Sửa hồ sơ</Link>
                    </div>
                </div>
                <nav className="sidebar_nav">
                    <ul>
                        <li><Link to="/user/profile">Tài khoản của tôi</Link></li>
                        <ul className="sidebar_nav_list">
                            <li><Link to="/user/profile">Hồ sơ</Link></li>
                            <li><Link to="/user/change-password">Đổi Mật Khẩu</Link></li>
                        </ul>
                        <li><Link to="/user/order">Đơn Mua</Link></li>
                        <li><Link to="/user/notifications">Thông báo</Link></li>
                        <li><Link to="/user/vouchers">Kho Voucher</Link></li>
                    </ul>
                </nav>
            </aside>
            <section className="board">
                {/* Loading state is now non-blocking; components render and handle missing data */}
                {
                    board === 'profile' && 
                    !loading &&
                    <div className="profile">
                        <div className="profile_header">
                            <p>Hồ Sơ Của Tôi</p>
                            <p>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
                        </div>
                        {
                            (showSocialBanner && (sessionStorage.getItem('social_name') || sessionStorage.getItem('social_email'))) &&
                            <div className="social-prefill-banner">
                                <p>Chúng tôi đã điền thông tin từ tài khoản xã hội của bạn. Vui lòng kiểm tra và nhấn "Lưu" để cập nhật.</p>
                                <div style={{display:'flex', gap:8}}>
                                    <button className="btn" onClick={()=>setShowSocialBanner(false)}>Đóng</button>
                                </div>
                            </div>
                        }
                        <form className="profile_form" onSubmit={handleSaveInfor}>
                            <div className="label-list">
                                <label htmlFor="username">Tên đăng nhập</label>
                                <label htmlFor="name">Tên</label>
                                <label htmlFor="email">Email</label>
                                <label htmlFor="phone" className="required">Sô điện thoại</label>
                                <label htmlFor="birthday">Ngày sinh</label>
                                <label htmlFor="sex">Giới tính</label>
                            </div>
                            <div className="input-list">
                                <p>{userData?.username}</p>
                                <input type="text" name="name" id="name" defaultValue={userData?.name} onChange={(e)=>handleChangeUserData('name',e.target.value)} />
                                <input type="email" name="email" id="email" defaultValue={userData?.email}/>
                                <input type="tel" name="phone" id="phone" defaultValue={userData?.phoneNumber} required pattern="[0-9]{10}" onChange={(e)=>handleChangeUserData('phoneNumber',e.target.value)} />
                                <input type="date" name="birthday" id="birthday" defaultValue={userData?.birthday} onChange={(e)=>handleChangeUserData('birthday',e.target.value)} />
                                <div className="sex-options">
                                    <input type="radio" name="sex" id="male" checked={userData?.sex == "male" ? true : false}  onChange={()=>handleChangeUserData('sex', 'male')}/>
                                    <label htmlFor="male"> Nam </label>
                                    <input type="radio" name="sex" id="female" checked={userData?.sex == "female" ? true : false} onChange={()=>handleChangeUserData('sex', 'female')} />
                                    <label htmlFor="female"> Nữ </label>
                                    <input type="radio" name="sex" id="null" checked={userData?.sex == null ? true : false} onChange={()=>handleChangeUserData('sex', null)} />
                                    <label htmlFor="null"> Khác </label>
                                </div>
                                <button className="infor_list_btn pointer">Lưu</button>
                            </div>
                            <div className="infor_avt">
                                <div className="infor_avt_img" style={{backgroundImage: `url(${userData?.avatar || '/ava.svg'})`}}></div>
                                <input type="file" name="avt" id="avt" onChange={(e)=>handleChangeUserData('avatar', e.target.files[0])} />
                                <label htmlFor="avt" className="edit-avatar-btn">Chọn Ảnh</label>
                                <p>Dung lượng file tối đa 1MB <br /> Định dạng: JPEG, PNG</p>
                            </div>
                            {saveMessage && <div className={`save-toast ${saveMessage.type}`}>{saveMessage.text}</div>}
                        </form>
                    </div>
                }
                    {
                        board === 'change-password' && <ChangePassword userData={userData} onChangePassword={(p)=>persistUserData({ ...userData, password: p.newPwd })} />
                    }
                    {/* Bank, Address, Notifications Settings and Privacy sections removed from UI */}
                    {
                        board === 'notifications' && <Notifications userData={userData} />
                    }
                    {
                        board === 'vouchers' && <Vouchers userData={userData} onUpdate={(next)=>persistUserData(next)} />
                    }
                {
                    board === 'order' &&
                    !loading &&
                    <div className="order">
                        <p className="order_title">Danh sách đơn mua</p>
                        <div className="order_list">
                            {
                                orderList?.map((order, index) => {
                                    return (
                                        <div className="order_list_item" key={index}>
                                            <div className="order_list_item_header">
                                                <div>
                                                    <p>Địa chỉ: {order.address}</p>
                                                    <p>Ngày mua: {order.orderDay}</p>
                                                </div>
                                                {
                                                    (order.shipping && order.shipping.note) && (
                                                        <div style={{marginTop:8}}><strong>Ghi chú khách hàng:</strong> <span style={{marginLeft:8}}>{order.shipping.note}</span></div>
                                                    )
                                                }
                                                {
                                                    order.orderStatus === "completed" &&
                                                    <p>
                                                        <span className='state'> Giao hàng thành công </span>
                                                        <span className='oder-status'> Hoàn Thành </span>
                                                    </p>
                                                }
                                                {
                                                    order.orderStatus === "pending" &&
                                                    <p>
                                                        <span className='pending'> Đang xử lý </span>
                                                    </p>
                                                }
                                                {
                                                    order.orderStatus === "cancled" &&
                                                    <p>
                                                        <span className='cancled'> Đơn hàng đã bị huỷ </span>
                                                    </p>
                                                }
                                            </div>
                                            <div className="order_list_item_list">
                                                {
                                                    order?.orderList?.map((item, index) => <OrderItem item={item} index={index} key={index}/>)
                                                }
                                            </div>
                                            <div className="order_list_item_footer">
                                                <p>
                                                    Thành tiền: { order.totalOder.toLocaleString('it-IT', {style :"currency", currency : "VND"})}
                                                </p>
                                                <div className="footer-btn">
                                                    {
                                                        order.orderStatus !== "pending" && <div className="btn bg-black" onClick={()=>handleReBuyOrder(order)}>Mua lại</div>
                                                    }
                                                    {
                                                        order.orderStatus === "pending" && (
                                                            <>
                                                                <div className="btn bg-black" onClick={()=>handleCancelOrder(order.orderCode)}>Hủy đơn</div>
                                                                <div className="btn confirm-btn" onClick={()=>handleConfirmReceived(order.orderCode)}>Xác nhận đã nhận hàng</div>
                                                            </>
                                                        )
                                                    }
                                                    {
                                                        order.orderStatus === "completed" && (
                                                            order.customerConfirmed ? (
                                                                <>
                                                                    <div className="btn" style={{opacity:0.95}}>Đã nhận</div>
                                                                    <div className="btn review-btn" onClick={()=>handleReviewOrder(order)}>Đánh giá</div>
                                                                </>
                                                            ) : (
                                                                <div className="btn confirm-btn" onClick={()=>handleConfirmReceived(order.orderCode)}>Đã nhận</div>
                                                            )
                                                        )
                                                    }
                                                    {
                                                        order.orderStatus === "cancled" && <div className="btn review-btn" onClick={()=>handleReviewOrder(order)}>Đánh giá</div>
                                                    }
                                                    <button type="button" className="btn" onClick={()=>handleContactSeller(order)}>Liên hệ người bán</button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                }
                { contactOrder && (
                    <div className="review-modal" role="dialog" aria-modal="true">
                        <div className="review-overlay" onClick={()=>setContactOrder(null)} />
                        <div className="review-box">
                            <header>
                                <h3>Liên hệ người bán</h3>
                                <button className="close" onClick={()=>setContactOrder(null)}>✕</button>
                            </header>
                            <div className="review-body">
                                <div className="product-meta" style={{marginBottom:6}}>
                                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                                        <div style={{fontWeight:700}}>Đơn hàng</div>
                                        <div style={{color:'#555'}}>{contactOrder.orderCode}</div>
                                    </div>
                                    <div style={{marginLeft:20, display:'flex',flexDirection:'column'}}>
                                        <div style={{fontWeight:700}}>Người bán</div>
                                        <div style={{color:'#555'}}>{contactOrder.seller?.name || 'Hieu Boutique'}</div>
                                        <div style={{marginTop:6, fontSize:13, color:'#333'}}>Email người bán: <span style={{color:'#666', fontWeight:600}}>{contactOrder.seller?.email || contactOrder.shipping?.email || 'N/A'}</span></div>
                                    </div>
                                </div>

                                <form className="review-form" onSubmit={handleSendContact}>
                                    <div className="inputs-row">
                                        <input placeholder="Tên của bạn" value={contactForm.name} onChange={(e)=>handleContactChange('name', e.target.value)} />
                                        <input placeholder="Số điện thoại" value={contactForm.phone} onChange={(e)=>handleContactChange('phone', e.target.value)} />
                                    </div>
                                    <input placeholder="Email của bạn" value={contactForm.email} onChange={(e)=>handleContactChange('email', e.target.value)} />

                                    <textarea placeholder="Nội dung liên hệ" value={contactForm.message} onChange={(e)=>handleContactChange('message', e.target.value)} />

                                    <div className="form-actions">
                                        <button type="submit" className="submit">Gửi liên hệ</button>
                                        <button type="button" className="cancel" onClick={()=>setContactOrder(null)}>Đóng</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                ) }
                <ReviewModal open={reviewModalOpen} onClose={()=> setReviewModalOpen(false)} product={reviewTarget.product} productId={reviewTarget.productId} onSubmitted={onReviewSubmitted} initialName={userData?.name} initialPhone={userData?.phoneNumber} />
            </section>
        </main>
    )
}

export default UserPage;