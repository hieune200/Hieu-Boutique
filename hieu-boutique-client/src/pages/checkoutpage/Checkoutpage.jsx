
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useState, useContext, useEffect } from 'react';

import trashIcon from '../../assets/imgs/common/trash.png'
import logoTp from '../../assets/imgs/common/logo-tp.png'
import logoMomo from '../../assets/imgs/common/logo-momo.png'
import logoVnpay from '../../assets/imgs/common/logo-vnpay.png'
import momo from '../../assets/imgs/common/vcb.jpg'
import bank from '../../assets/imgs/common/anhqr.jpg'
import { globalContext } from '../../context/globalContext';
import { getInfor, checkoutAPI, updateInfor } from '../../services/Auth.api';
import './Checkoutpage.scss'
import { useToast } from '../../components/ToastProvider'

const Checkoutpage = ()=>{
    const nav = useNavigate()
    const location = useLocation()
    const {ctUserID, appliedCoupon, setServerError} = useContext(globalContext)
    const { showToast } = useToast()
    const [reload, setReload] = useState(true)
    // read cart from localStorage into state so navigation shows latest contents
    const [cartData, setCartData] = useState(() => {
        try{ return JSON.parse(localStorage.getItem('cart')) }catch(e){ return null }
    })
    const [payMethod, setPayMethod] = useState({"method" : "offline", "service" : null})
    const [inforCheckout, setInforCheckout] = useState()
    const [ totalBill, setTotalBill] = useState(0)
    const [loading, setLoading] = useState(false)
    const [couponCode, setCouponCode] = useState('')
    const [discountAmount, setDiscountAmount] = useState(0)
    const [pendingOrderData, setPendingOrderData] = useState(null)
    const [orderCode, setOrderCode] = useState('')
    const [successOrder, setSuccessOrder] = useState(null)
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [wards, setWards] = useState([])

    useEffect(()=>{ window.scrollTo({top : 0, behavior : "smooth"}) }, [])
    useEffect(()=>{
        // load provinces for VN address selects
        async function loadProvinces(){
            try{
                const res = await fetch('https://provinces.open-api.vn/api/?depth=1')
                const data = await res.json()
                setProvinces(data || [])
            }catch(err){
                console.warn('loadProvinces failed', err)
                setProvinces([])
            }
        }
        loadProvinces()

        async function init(){
            // re-read cart from localStorage in case we navigated here after adding
            let latest = null
            try{ latest = JSON.parse(localStorage.getItem('cart')) }catch(e){ latest = null }
            setCartData(latest)
            // compute totals from the freshly-read cart
            const tb = (latest && Array.isArray(latest)) ? latest.reduce((a, e)=>a + (Number(e.count) || 0), 0) : 0
            setTotalBill(tb)

            // only fetch user info when we have a logged-in user
            if (!ctUserID) {
                setLoading(false)
                setInforCheckout(null)
                return
            }

            // only attempt to fetch user info when logged in; handle network errors
            if (ctUserID) {
                setLoading(true)
                try{
                    const res = await getInfor()
                    if (!res || res.status != 201){
                        showToast((res && res.message) ? res.message : 'Lỗi khi tải thông tin', 'error')
                        setInforCheckout(null)
                    } else {
                        setInforCheckout(res.data)
                    }
                }catch(err){
                    console.warn('getInfor failed', err)
                    showToast('Không thể kết nối server. Bạn vẫn có thể xem giỏ hàng.', 'error')
                    setInforCheckout(null)
                }finally{
                    setLoading(false)
                }
            } else {
                setLoading(false)
            }
        }
        init()
    },[ctUserID, nav, location.pathname, location.search, location.hash, showToast, reload])

    // if user has saved province/district in `inforCheckout`, populate dependent selects
    useEffect(()=>{
        async function populateFromUser(){
            try{
                if (!inforCheckout) return
                if (inforCheckout.provinceCode){
                    // fetch districts for province
                    const pres = await fetch(`https://provinces.open-api.vn/api/p/${inforCheckout.provinceCode}?depth=2`)
                    const pjson = await pres.json()
                    setDistricts(pjson.districts || [])
                }
                if (inforCheckout.districtCode){
                    const dres = await fetch(`https://provinces.open-api.vn/api/d/${inforCheckout.districtCode}?depth=2`)
                    const djson = await dres.json()
                    setWards(djson.wards || [])
                }
            }catch(err){ console.warn('populateFromUser failed', err) }
        }
        populateFromUser()
    },[inforCheckout])

    // keep local coupon inputs in sync with globally applied coupon (if any)
    useEffect(()=>{
        if (appliedCoupon && appliedCoupon.code){
            setCouponCode(appliedCoupon.code)
            setDiscountAmount(appliedCoupon.discount || 0)
        }
    }, [appliedCoupon])

    const handlRemoveItem = (index) => {
        try{
            const cur = Array.isArray(cartData) ? [...cartData] : []
            cur.splice(index,1)
            localStorage.setItem('cart', cur.length > 0 ? JSON.stringify(cur) : null)
            setCartData(cur.length > 0 ? cur : null)
            setTotalBill(cur.reduce((a,e)=>a + (Number(e.count)||0), 0))
            setReload(r=>!r)
        }catch(e){ console.warn('remove item failed', e) }
    }
    const handleSetPayMethod = (value)=>{
        setPayMethod(prev => ({ ...prev, method: value, service: value === 'offline' ? null : prev.service }))
    }
    const handleSetPayService = (value)=>{
        // allow setting service and ensure method becomes 'online' when selecting a service
        setPayMethod(prev => ({ ...prev, method: 'online', service: value }))
        // prepare pendingOrderData immediately when selecting an online service (bank/momo)
        if (value === 'bank' || value === 'momo'){
            // require shipping info before showing payment modal
            const required = ['name','phoneNumber','email','address','province','provinceCode','district','districtCode','ward','wardCode']
            const missing = []
            for (const f of required){ if (!inforCheckout || !inforCheckout[f]) missing.push(f) }
            if (missing.length > 0){
                showToast('Vui lòng điền đầy đủ thông tin giao hàng trước khi chọn chuyển khoản/ ví.', 'error')
                // unset service to avoid opening modal
                setPayMethod(prev => ({ ...prev, service: null }))
                return
            }   

            // build order data (same structure as when submitting)
            const date = new Date();
            let day = date.getDate() / 10 < 1 ? '0' + date.getDate() : date.getDate();
            let month = date.getMonth() / 10 < 1 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
            let orderDay = `${day} / ${month} / ${date.getFullYear()}`
            let orderList = cartData?.map(item => ({
                id: item.id,
                title: item.title,
                img: item.img,
                size: item.size,
                color: item.color || null,
                unitPrice: item.count && item.quantity ? Math.round(item.count / item.quantity) : null,
                quantity: item.quantity
            }))

            const shipping = {
                name: inforCheckout.name,
                phoneNumber: inforCheckout.phoneNumber,
                email: inforCheckout.email,
                address: inforCheckout.address,
                province: inforCheckout.province || null,
                provinceCode: inforCheckout.provinceCode || null,
                district: inforCheckout.district || null,
                districtCode: inforCheckout.districtCode || null,
                ward: inforCheckout.ward || null,
                wardCode: inforCheckout.wardCode || null,
                note: inforCheckout.note || null
            }

            const data = {
                orderDay: orderDay,
                deliveryDate: null,
                orderStatus: 'pending',
                totalOder: totalBill,
                checkout: 'online',
                orderList: orderList,
                shipping: shipping
            }
            if (appliedCoupon && appliedCoupon.code){
                data.couponCode = appliedCoupon.code
                data.couponDiscount = appliedCoupon.discount || 0
                data.coupon = appliedCoupon
            } else if (couponCode){
                data.couponCode = couponCode
                data.couponDiscount = discountAmount || 0
            }
            data.subtotal = totalBill
            data.subtotalAfterDiscount = Math.max(0, Number(totalBill || 0) - Number(discountAmount || 0))
            data.shippingFee = data.subtotalAfterDiscount >= 499000 ? 0 : 25000
            data.finalTotal = data.subtotalAfterDiscount + data.shippingFee
            const code = `HB${Math.random().toString(36).slice(2,10).toUpperCase()}`
            data.orderCode = code
            setOrderCode(code)
            setPendingOrderData({ ...data })
        }
    }
    async function handleSubmit (e){
        e.preventDefault()
        if (payMethod.method === "online" && payMethod.service === null){
            showToast('bạn vui lòng chọn dịch vụ chuyển khoản mà bạn muốn và tiến hành thanh toán', 'error')
            return
        }

        // validate shipping info: all fields except 'note' are required
        const required = ['name','phoneNumber','email','address','province','provinceCode','district','districtCode','ward','wardCode']
        const missing = []
        for (const f of required){ if (!inforCheckout || !inforCheckout[f]) missing.push(f) }
        if (missing.length > 0){
            showToast('Vui lòng điền đầy đủ thông tin giao hàng (tên, điện thoại, email, địa chỉ, tỉnh/quận/phường).', 'error')
            return
        }

        // basic validation for phone and email
        const phoneOk = /^\d{9,11}$/.test(String(inforCheckout.phoneNumber))
        const emailOk = String(inforCheckout.email).includes('@')
        if (!phoneOk){ showToast('Số điện thoại không hợp lệ', 'error'); return }
        if (!emailOk){ showToast('Email không hợp lệ', 'error'); return }

        setLoading(true)
        const date = new Date();
        let day = date.getDate() / 10 < 1 ? '0' + date.getDate() : date.getDate();
        let month = date.getMonth() / 10 < 1 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
        let orderDay = `${day} / ${month} / ${date.getFullYear()}`
        let orderList = cartData?.map(item => ({
            id: item.id,
            title: item.title,
            img: item.img,
            size: item.size,
            color: item.color || null,
            unitPrice: item.count && item.quantity ? Math.round(item.count / item.quantity) : null,
            quantity: item.quantity
        }))

        // attach full shipping info so order contains confirmation details
        const shipping = {
            name: inforCheckout.name,
            phoneNumber: inforCheckout.phoneNumber,
            email: inforCheckout.email,
            address: inforCheckout.address,
            province: inforCheckout.province || null,
            provinceCode: inforCheckout.provinceCode || null,
            district: inforCheckout.district || null,
            districtCode: inforCheckout.districtCode || null,
            ward: inforCheckout.ward || null,
            wardCode: inforCheckout.wardCode || null,
            note: inforCheckout.note || null
        }

        let data = {
            orderDay: orderDay,
            deliveryDate: null,
            orderStatus: 'pending',
            totalOder: totalBill,
            checkout: payMethod.method,
            orderList: orderList,
            shipping: shipping
        }

        // attach applied coupon info if present (prefer global appliedCoupon)
        if (appliedCoupon && appliedCoupon.code){
            data.couponCode = appliedCoupon.code
            data.couponDiscount = appliedCoupon.discount || 0
            data.coupon = appliedCoupon
        } else if (couponCode) {
            // fallback to manually entered coupon on this page
            data.couponCode = couponCode
            data.couponDiscount = discountAmount || 0
        }

        // include computed totals so server stores exact amounts
        data.subtotal = totalBill
        data.subtotalAfterDiscount = Math.max(0, Number(totalBill || 0) - Number(discountAmount || 0))
        data.shippingFee = data.subtotalAfterDiscount >= 499000 ? 0 : 25000
        data.finalTotal = data.subtotalAfterDiscount + data.shippingFee

        // generate an order code for tracking (used for both offline and online flows)
        const code = `HB${Math.random().toString(36).slice(2,10).toUpperCase()}`
        data.orderCode = code

        // If payment is online, open QR modal and wait for user confirmation
        if (payMethod.method === 'online'){
            setOrderCode(code)
            setPendingOrderData({ ...data })
            // open QR modal by setting a default service (bank) if none
            if (!payMethod.service) handleSetPayService('bank')
            setLoading(false)
            return
        }

        // best-effort: update user's profile with shipping info if logged in
        try{
            if (ctUserID){
                const profileUpdate = { ...shipping }
                if (inforCheckout.username) profileUpdate.username = inforCheckout.username
                try{ await updateInfor(profileUpdate) }catch(e){ console.warn('profile update failed', e) }
            }
        }catch(err){ console.warn('profile update flow error', err) }

        const res = await checkoutAPI(data)
        if (res && (res.status == 500 || res.status === '500')){
            try{ setServerError(res.message) }catch(e){ console.warn('setServerError failed', e) }
        }
        if (res && res.status == 201) {
            // remove cart and show a friendly confirmation modal
            localStorage.removeItem('cart')
            setSuccessOrder({ orderCode: code, finalTotal: data.finalTotal })
        }
        showToast((res && res.message) ? res.message : 'Thông báo', (res && res.status == 201) ? 'success' : 'error')
        setLoading(false)
    }

    // finalize an online (QR / bank) payment after user confirms on modal
    const finalizeOnlinePayment = async () => {
        if (!pendingOrderData) return
        setLoading(true)
        try{
            const res = await checkoutAPI(pendingOrderData)
            if (res && (res.status == 500 || res.status === '500')){
                try{ setServerError(res.message) }catch(e){ console.warn('setServerError failed', e) }
            }
            if (res && res.status == 201) {
                localStorage.removeItem('cart')
            }
            showToast((res && res.message) ? res.message : 'Thông báo', (res && res.status == 201) ? 'success' : 'error')
            // mark payment modal closed
            handleSetPayService('complete')
            setPendingOrderData(null)
            setOrderCode('')
            nav('/')
        }catch(err){
            console.warn('finalizeOnlinePayment failed', err)
            showToast('Thanh toán thất bại, thử lại', 'error')
        }finally{
            setLoading(false)
        }
    }
    const handleSetInforCheckout = (type,value)=>{
        setInforCheckout(prev => ({ ...(prev || {}), [type]: value }))
    }
    const formatCurrency = (v)=>{
        try{ return Number(v).toLocaleString('it-IT', {style : 'currency', currency : 'VND'}) }catch(e){ return '0đ' }
    }

    const updateCart = (newCart)=>{
        try{
            if (newCart && newCart.length) localStorage.setItem('cart', JSON.stringify(newCart))
            else localStorage.removeItem('cart')
        }catch(e){}
        setCartData(newCart && newCart.length ? newCart : null)
        const tb = (newCart && Array.isArray(newCart)) ? newCart.reduce((a,e)=>a + (Number(e.count)||0), 0) : 0
        setTotalBill(tb)
        try{ const cur = newCart; window.dispatchEvent(new CustomEvent('hb_cart_updated', { detail: { cart: cur, ts: Date.now() } })) }catch(e){}
    }

    const changeItemQuantity = (index, delta)=>{
        try{
            const cur = Array.isArray(cartData) ? [...cartData] : []
            if (!cur[index]) return
            const oldQty = Number(cur[index].quantity) || 1
            const unitPrice = cur[index].unitPrice || Math.round((Number(cur[index].count)||0) / Math.max(1, oldQty))
            const newQty = Math.max(1, oldQty + delta)
            cur[index].quantity = newQty
            cur[index].unitPrice = unitPrice
            cur[index].count = unitPrice * newQty
            updateCart(cur)
        }catch(e){ console.warn('change qty failed', e) }
    }

    const applyCoupon = ()=>{
        // simple coupon examples — extend as needed
        const code = String(couponCode || '').trim().toUpperCase()
        if (!code) return setDiscountAmount(0)
        if (code === 'GIAM50K') { setDiscountAmount(50000); showToast('Áp dụng mã GIAM50K: -50.000đ','success'); return }
        if (code === 'FREE100') { setDiscountAmount(totalBill); showToast('Áp dụng mã FREE100: giảm toàn bộ','success'); return }
        setDiscountAmount(0); showToast('Mã không hợp lệ hoặc hết hạn','error')
    }
    if (loading) return(
        <main className="checkoutpage">Loading...</main>
    )

    const SHIPPING_THRESHOLD = 499000
    const DEFAULT_SHIPPING_FEE = 25000

    // compute dynamic fees and totals
    const effectiveDiscount = Number(discountAmount || 0)
    const subtotalAfterDiscount = Math.max(0, Number(totalBill || 0) - effectiveDiscount)
    const shippingFee = subtotalAfterDiscount >= SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE
    const grandTotal = subtotalAfterDiscount + shippingFee

    return(
        <main className="checkoutpage">
            <div className="checkout-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr 420px', gap:24}}>
                <section className="checkout-left">
                    <h2>Thông tin giao hàng</h2>
                    <form className="custommer-form" onSubmit={handleSubmit}>
                        <input required type="text" name="name" id="name" placeholder='Họ và tên' className='col12' value={inforCheckout?.name || ''} onChange={(e) => handleSetInforCheckout('name', e.target.value)}/>
                        <input required type="tel" name="tel" id="tel" placeholder='Số điện thoại' className='col12' pattern='[0-9]{10}' value={inforCheckout?.phoneNumber || ''} onChange={(e) => handleSetInforCheckout('phoneNumber', e.target.value)}/>
                        <input required type="email" name="email" id="email" placeholder='Email' className='col12' value={inforCheckout?.email || ''} onChange={(e) => handleSetInforCheckout('email', e.target.value)}/>
                        <input required type="text" name="address" id="address" placeholder='Địa chỉ' className='col12' value={inforCheckout?.address || ''} onChange={(e) => handleSetInforCheckout('address', e.target.value)}/>
                        <select className='col12' value={inforCheckout?.provinceCode || ''} onChange={async (e)=>{
                            const code = e.target.value
                            const prov = provinces.find(p=>String(p.code) === String(code))
                            handleSetInforCheckout('provinceCode', code)
                            handleSetInforCheckout('province', prov ? prov.name : '')
                            // clear downstream
                            handleSetInforCheckout('districtCode', null)
                            handleSetInforCheckout('district', null)
                            handleSetInforCheckout('wardCode', null)
                            handleSetInforCheckout('ward', null)
                            setWards([])
                            setDistricts([])
                            if (!code) return
                            try{
                                const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
                                const data = await res.json()
                                setDistricts(data.districts || [])
                            }catch(err){ console.warn('load districts failed', err); setDistricts([]) }
                        }}>
                            <option value=''>Chọn Tỉnh/Thành phố</option>
                            {provinces.map(p=> <option key={p.code} value={p.code}>{p.name}</option>)}
                        </select>

                        <select className='col12' value={inforCheckout?.districtCode || ''} onChange={async (e)=>{
                            const code = e.target.value
                            const dist = districts.find(d=>String(d.code) === String(code))
                            handleSetInforCheckout('districtCode', code)
                            handleSetInforCheckout('district', dist ? dist.name : '')
                            // clear wards
                            handleSetInforCheckout('wardCode', null)
                            handleSetInforCheckout('ward', null)
                            setWards([])
                            if (!code) return
                            try{
                                const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
                                const data = await res.json()
                                setWards(data.wards || [])
                            }catch(err){ console.warn('load wards failed', err); setWards([]) }
                        }}>
                            <option value=''>Chọn Quận/ Huyện</option>
                            {districts.map(d=> <option key={d.code} value={d.code}>{d.name}</option>)}
                        </select>

                        <select className='col12' value={inforCheckout?.wardCode || ''} onChange={(e)=>{
                            const code = e.target.value
                            const w = wards.find(wd=>String(wd.code) === String(code))
                            handleSetInforCheckout('wardCode', code)
                            handleSetInforCheckout('ward', w ? w.name : '')
                        }}>
                            <option value=''>Chọn Phường/ Xã</option>
                            {wards.map(w=> <option key={w.code} value={w.code}>{w.name}</option>)}
                        </select>
                        <textarea placeholder='Ghi chú thêm (Ví dụ: Giao hàng giờ hành chính)' className='col12' value={inforCheckout?.note || ''} onChange={(e)=>handleSetInforCheckout('note', e.target.value)} />
                    </form>
                </section>

                <section className="checkout-center">
                    <h2>Hình thức thanh toán</h2>
                    <div style={{display:'flex', flexDirection:'column', gap:12}}>
                        <button type="button" className={`pay-option ${payMethod.method === 'offline' ? 'active' : ''}`} onClick={()=>handleSetPayMethod('offline')} style={{padding:18, borderRadius:8, border: payMethod.method === 'offline' ? '1px solid #d32f2f' : '1px solid #eee', background: payMethod.method === 'offline' ? '#fff' : '#fafafa'}}>
                            <div style={{display:'flex', alignItems:'center', gap:12}}>
                                <img src={logoTp} alt="cod" style={{width:36}} />
                                <div>COD, Thanh toán khi nhận hàng</div>
                            </div>
                        </button>
                        {/* show service selector when online is chosen */}
                        { payMethod.method === 'online' && (
                            <div style={{display:'flex', gap:8, marginTop:6}}>
                                <button type="button" className={`btn ${payMethod.service === 'bank' ? 'active' : ''}`} onClick={()=>handleSetPayService('bank')} style={{padding:'8px 12px', borderRadius:8, border: payMethod.service === 'bank' ? '1px solid #d32f2f' : '1px solid #eee'}}>Chuyển khoản ngân hàng</button>
                                <button type="button" className={`btn ${payMethod.service === 'momo' ? 'active' : ''}`} onClick={()=>handleSetPayService('momo')} style={{padding:'8px 12px', borderRadius:8, border: payMethod.service === 'momo' ? '1px solid #d32f2f' : '1px solid #eee'}}>Ví điện tử (MoMo)</button>
                            </div>
                        ) }
                        <button type="button" className={`pay-option ${payMethod.method === 'online' ? 'active' : ''}`} onClick={()=>handleSetPayMethod('online')} style={{padding:18, borderRadius:8, border: payMethod.method === 'online' ? '1px solid #d32f2f' : '1px solid #eee', background: payMethod.method === 'online' ? '#fff' : '#fafafa'}}>
                            <div style={{display:'flex', alignItems:'center', gap:12}}>
                                <img src={logoMomo} alt="online" style={{width:36}} />
                                <div>Thanh toán chuyển khoản / ví điện tử</div>
                            </div>
                        </button>
                    </div>
                </section>

                <aside className="checkout-right">
                    <div style={{marginBottom:12, display:'flex', gap:12}}>
                        <input value={couponCode} onChange={(e)=>setCouponCode(e.target.value)} placeholder='Nhập mã giảm giá của bạn' style={{flex:1, padding:12, borderRadius:8, border:'1px solid #eee'}} />
                        <button type="button" onClick={applyCoupon} className='btn' style={{background:'#c62828', color:'#fff', padding:'10px 16px', borderRadius:8}}>Áp dụng</button>
                    </div>

                    <div className='cart-box' style={{border:'1px solid #eee', borderRadius:10, padding:12}}>
                        <h3 style={{marginTop:0}}>Giỏ hàng</h3>
                        <div style={{display:'flex', flexDirection:'column', gap:12}}>
                            { (Array.isArray(cartData) && cartData.length) ? cartData.map((item, idx)=> (
                                <div key={idx} style={{display:'flex', gap:12, alignItems:'center'}}>
                                    <img src={item?.img} alt={item?.title} style={{width:72, height:72, objectFit:'cover', borderRadius:6}} />
                                    <div style={{flex:1}}>
                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                            <strong style={{fontSize:16}}>{item?.title}</strong>
                                            <button type="button" onClick={()=>handlRemoveItem(idx)} style={{border:0, background:'transparent', color:'#c62828'}}>✕</button>
                                        </div>
                                        <div style={{marginTop:6, display:'flex', gap:8, alignItems:'center'}}>
                                            <div style={{background:'#f5f5f5', padding:'6px 8px', borderRadius:6}}>{item?.size}</div>
                                            { item?.color && <div style={{background:'#f5f5f5', padding:'6px 8px', borderRadius:6}}>{item?.color}</div> }
                                        </div>
                                        <div style={{marginTop:8, display:'flex', alignItems:'center', gap:8}}>
                                            <div style={{display:'flex', alignItems:'center', border:'1px solid #222', borderRadius:8, padding:'6px 8px'}}>
                                                <button type="button" onClick={()=>changeItemQuantity(idx, -1)} style={{border:0, background:'transparent', fontSize:18}}>−</button>
                                                <div style={{minWidth:36, textAlign:'center'}}>{item?.quantity}</div>
                                                <button type="button" onClick={()=>changeItemQuantity(idx, 1)} style={{border:0, background:'transparent', fontSize:18}}>+</button>
                                            </div>
                                            <div style={{marginLeft:'auto', fontWeight:700}}>{formatCurrency(item?.count || 0)}</div>
                                        </div>
                                    </div>
                                </div>
                            )) : <div>Giỏ hàng đang trống</div> }
                        </div>

                        <div style={{marginTop:12, borderTop:'1px solid #eee', paddingTop:12}}>
                            <div style={{display:'flex', justifyContent:'space-between'}}><div>Tạm tính</div><div>{formatCurrency(totalBill)}</div></div>
                            <div style={{display:'flex', justifyContent:'space-between'}}><div>Giảm giá</div><div>{formatCurrency(effectiveDiscount)}</div></div>
                            <div style={{display:'flex', justifyContent:'space-between'}}><div>Phí giao hàng</div><div>{formatCurrency(shippingFee)}</div></div>
                            <hr />
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:20, fontWeight:700}}><div>Tổng</div><div>{formatCurrency(grandTotal)}</div></div>
                        </div>

                        <div style={{marginTop:12, display:'flex', gap:8}}>
                            <button type="button" className='btn' onClick={()=>nav('/')} style={{flex:1, background:'#eee'}}>Trang chủ</button>
                            <button type="button" className='btn' onClick={(e)=>handleSubmit(e)} style={{flex:1, background:'#c62828', color:'#fff'}}>Đặt hàng</button>
                        </div>
                    </div>
                </aside>
            </div>

            {   
                ![null,'complete'].includes(payMethod.service) && (
                <div className="QRcode">
                    <div className="QRcode_coating" onClick={()=>{handleSetPayService('complete')}}></div>
                    <div className="QRcode_modal" role="dialog" aria-modal="true">
                        <div className="QRcode_left">
                            {/* show QR image */}
                            { payMethod.service === 'momo' ? (
                                <img src={momo} alt="momo-qr" className="QRcode_img" />
                            ) : (
                                <img src={bank} alt="bank-qr" className="QRcode_img" />
                            ) }
                        </div>
                        <div className="QRcode_right">
                            <h2>Quét mã QR để thanh toán</h2>
                            <p style={{color:'rgba(0,0,0,0.6)'}}>Thời gian còn lại: 15p00s</p>
                            <div style={{marginTop:12}}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}><div>Ngân hàng:</div><div style={{fontWeight:800}}>VietinBank – Ngân hàng TMCP Công Thương Việt Nam</div></div>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}><div>Số tài khoản:</div><div style={{fontWeight:800}}>116647746666</div></div>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}><div>Tên tài khoản:</div><div style={{fontWeight:800}}>CÔNG TY CỔ PHẦN 5S FASHION</div></div>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}><div>Nội dung:</div><div style={{fontWeight:800}}>{pendingOrderData?.orderCode || orderCode ? `Thanh toán cho đơn hàng: ${pendingOrderData?.orderCode || orderCode}` : 'Thanh toán đơn hàng'}</div></div>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}><div>Số tiền:</div><div style={{fontWeight:900, color:'#c62828', fontSize:18}}>{formatCurrency((pendingOrderData && pendingOrderData.finalTotal) ? pendingOrderData.finalTotal : grandTotal)}</div></div>
                            </div>
                            <div style={{marginTop:18, display:'flex', justifyContent:'center'}}>
                                <button type="button" className='btn' onClick={()=>finalizeOnlinePayment()} style={{background:'#c62828', color:'#fff', padding:'10px 24px', borderRadius:8}}>Xác nhận</button>
                            </div>
                        </div>
                    </div>
                </div>
                )
            }
            { successOrder && (
                <div className="QRcode">
                    <div className="QRcode_coating" onClick={()=>{ setSuccessOrder(null) }}></div>
                    <div className="QRcode_modal" role="dialog" aria-modal="true">
                        <div className="QRcode_right" style={{padding:'40px', textAlign:'center'}}>
                            <h2>Đặt hàng thành công</h2>
                            <p style={{marginTop:12}}>Cám ơn bạn! Đơn hàng của bạn đã được ghi nhận.</p>
                            <p style={{marginTop:8}}>Mã đơn hàng: <strong>{successOrder.orderCode}</strong></p>
                            <p style={{marginTop:8}}>Tổng thanh toán: <strong style={{color:'#c62828'}}>{formatCurrency(successOrder.finalTotal)}</strong></p>
                            <div style={{marginTop:18, display:'flex', justifyContent:'center', gap:12, justifyItems:'center'}}>
                                { ctUserID && (
                                    <button type="button" className='btn' onClick={()=>{ setSuccessOrder(null); nav('/user/order') }} style={{background:'#1976d2', color:'#fff', padding:'10px 20px', borderRadius:8}}>Xem đơn hàng</button>
                                ) }
                                <button type="button" className='btn' onClick={()=>{ setSuccessOrder(null); nav('/') }} style={{background:'#c62828', color:'#fff', padding:'10px 24px', borderRadius:8}}>OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Checkoutpage;
