import { useState, useEffect, useContext } from 'react'
import './homepageStyle/PromoFeatures.scss'
import { globalContext } from '../../context/globalContext'
import { getInfor } from '../../services/Auth.api'
import voucherImg from '../../assets/imgs/common/voucher.png'
import shippingIcon from '../../assets/imgs/contact-icons/shipping.svg'
import exchangeIcon from '../../assets/imgs/contact-icons/info.svg'
import warrantyIcon from '../../assets/imgs/contact-icons/payment.svg'
import supportIcon from '../../assets/imgs/contact-icons/vip.svg'

const PromoFeatures = ()=>{
  const { applyCoupon: applyCouponToContext, ctUserID, appliedCoupon, clearCoupon } = useContext(globalContext)
  const [coupons, setCoupons] = useState([])
  const [toast, setToast] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  // sample vouchers to show when backend has no coupons (demo local-only)
  const sampleCoupons = [
    { id: 'demo50k', demo: true, discount: 50000, title: 'Giảm 50.000₫', sub: 'Đơn từ 799.000₫', code: 'HB50K', expiry: '2025-12-31', remaining: 999, image: voucherImg },
    { id: 'demo20k', demo: true, discount: 20000, title: 'Giảm 20.000₫', sub: 'Đơn từ 399.000₫', code: 'HB20K', expiry: '2025-12-31', remaining: 999, image: voucherImg },
    { id: 'demo10p', demo: true, discount: 0, title: 'Giảm 10% tới 100.000₫', sub: 'Áp dụng cho tất cả sản phẩm', code: 'HB10P', expiry: '2025-12-31', remaining: 999, image: voucherImg }
  ]
  const [usedCoupons, setUsedCoupons] = useState([])
  const [inputValid, setInputValid] = useState('') // '', 'ok', 'error'
  const [inputMessage, setInputMessage] = useState('')
  const apiBase = import.meta.env.VITE_API || 'http://localhost:3000'

  function showToast(msg){
    setToast(msg)
    setTimeout(()=> setToast(''), 2200)
  }
  
  async function applyManualCode(){
    const code = inputCode && inputCode.trim()
    if (!code) return showToast('Vui lòng nhập mã')
    // if same coupon already applied, ignore
    if (appliedCoupon && appliedCoupon.code === code) return showToast('Mã này đã được áp dụng')
    // check if it's a demo/sample coupon
    const demo = sampleCoupons.find(s => String(s.code || '').toLowerCase() === String(code).toLowerCase())
    if (demo && demo.demo){
      const payload = { id: demo.id, code: demo.code, discount: demo.discount || 0, title: demo.title, expiry: demo.expiry }
      applyCouponToContext(payload)
      showToast('Đã áp dụng mã demo: ' + payload.code)
      // decrement locally
      setCoupons(prev => prev.map(x => (x.code && x.code.toLowerCase() === demo.code.toLowerCase()) ? {...x, remaining: Math.max(0, (x.remaining||demo.remaining)-1)} : x))
      setInputCode('')
      // also add to usedCoupons locally for UI
      setUsedCoupons(prev => Array.from(new Set([...(prev||[]), demo.code])))
      return
    }

    try{
      const cart = JSON.parse(localStorage.getItem('cart')) || []
      const subtotal = Array.isArray(cart) && cart.length ? cart.reduce((a,e)=>a + (e.count || 0), 0) : 0
      const headers = { 'Content-Type':'application/json' }
      if (ctUserID) headers['user-id'] = ctUserID
      const res = await fetch(`${apiBase}/coupons/apply`, { method: 'POST', headers, body: JSON.stringify({ code, userId: ctUserID, subtotal }) })
      if (!res.ok){
        const err = await res.json().catch(()=>({ error: 'Áp dụng thất bại' }))
        showToast(err.error || 'Áp dụng thất bại')
        setInputValid('error')
        setInputMessage(err.error || 'Áp dụng thất bại')
        return
      }
      const payload = await res.json()
      applyCouponToContext(payload)
      showToast('Đã áp dụng mã: ' + payload.code)
      setInputCode('')
      // refresh usedCoupons list
      if (ctUserID) fetchUserUsedCoupons()
    }catch(e){
      showToast('Không thể áp dụng mã')
      setInputValid('error')
      setInputMessage('Lỗi mạng, thử lại')
    }
  }
  async function saveCode(c){
    try{
      const text = c.code || ''
      if (navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      showToast('Mã đã được sao chép: ' + text)
      // optimistic remaining decrement locally
      setCoupons(prev => prev.map(x => x.id===c.id ? {...x, remaining: Math.max(0, x.remaining-1)} : x))
    }
    catch(e){
      showToast('Không thể sao chép mã')
    }
  }

  async function applyCoupon(c){
    // support demo coupons locally
    if (c && c.demo){
      const payload = { id: c.id, code: c.code, discount: c.discount || 0, title: c.title, expiry: c.expiry }
      applyCouponToContext(payload)
      showToast('Đã áp dụng mã demo: ' + payload.code)
      setCoupons(prev => prev.map(x => x.id===c.id ? {...x, remaining: Math.max(0, x.remaining-1)} : x))
      setSelectedVoucher(null)
      // add to used list locally
      setUsedCoupons(prev => Array.from(new Set([...(prev||[]), c.code])))
      return
    }
    try{
      // validate with backend
      const cart = JSON.parse(localStorage.getItem('cart')) || []
      const subtotal = Array.isArray(cart) && cart.length ? cart.reduce((a,e)=>a + (e.count || 0), 0) : 0
      const headers = { 'Content-Type':'application/json' }
      if (ctUserID) headers['user-id'] = ctUserID
      const res = await fetch(`${apiBase}/coupons/apply`, { method: 'POST', headers, body: JSON.stringify({ code: c.code, userId: ctUserID, subtotal }) })
      if (!res.ok) {
        const err = await res.json().catch(()=>({error:'Không hợp lệ'}))
        showToast(err.error || 'Áp dụng thất bại')
        return
      }
      const payload = await res.json()
      applyCouponToContext(payload)
      showToast('Đã áp dụng mã: ' + payload.code)
      setCoupons(prev => prev.map(x => x.id===c.id ? {...x, remaining: Math.max(0, x.remaining-1)} : x))
      // close modal if open
      setSelectedVoucher(null)
      if (ctUserID) fetchUserUsedCoupons()
    }catch(e){
      showToast('Không thể áp dụng mã')
    }
  }

  // fetch user's used coupons
  async function fetchUserUsedCoupons(){
    try{
      if (!ctUserID) return
      const res = await getInfor()
      if (!res) return
      if (res.status && res.status == 201 && res.data){
        setUsedCoupons(Array.isArray(res.data.usedCoupons) ? res.data.usedCoupons : [])
      } else if (res.usedCoupons){
        setUsedCoupons(Array.isArray(res.usedCoupons) ? res.usedCoupons : [])
      }
    }catch(e){ console.warn('fetchUserUsedCoupons', e) }
  }

  function openVoucher(v){
    setSelectedVoucher(v)
  }

  function closeVoucher(){
    setSelectedVoucher(null)
  }

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const res = await fetch(`${apiBase}/coupons`)
        if (!res.ok) throw new Error('fetch coupons failed')
        const data = await res.json()
        if (mounted) setCoupons(data)
      }catch(e){
        // fallback if server not available
        setCoupons([
          { id: 'c50k', title: 'Giảm 50.000₫', sub: 'Đơn tối thiểu 899.000₫', code: 'HB50K', expiry: '2025-12-02', remaining: 283, image: voucherImg },
          { id: 'c20k', title: 'Giảm 20.000₫', sub: 'Đơn tối thiểu 400.000₫', code: 'HB20K', expiry: '2025-12-01', remaining: 32, image: voucherImg }
        ])
      }
    })()
    return ()=>{ mounted = false }
  },[apiBase])

  useEffect(()=>{
    if (ctUserID) fetchUserUsedCoupons()
  },[ctUserID])

  // validate input as user types
  useEffect(()=>{
    const code = inputCode && inputCode.trim()
    if (!code){ setInputValid(''); setInputMessage(''); return }
    // if already applied
    if (appliedCoupon && appliedCoupon.code === code){ setInputValid('error'); setInputMessage('Mã này đã được áp dụng'); return }
    // if user already used it
    if (usedCoupons && usedCoupons.map(x=>x.toLowerCase()).includes(code.toLowerCase())){ setInputValid('error'); setInputMessage('Bạn đã sử dụng mã này'); return }
    // if exists in coupons or sampleCoupons
    const exists = ((coupons||[]).concat(sampleCoupons)).some(x => String(x.code||'').toLowerCase() === code.toLowerCase())
    if (exists){ setInputValid('ok'); setInputMessage('Mã hợp lệ') } else { setInputValid('error'); setInputMessage('Mã không tồn tại') }
  },[inputCode, coupons, appliedCoupon, usedCoupons])

  return (
    <section className="promo-features">

      <div className="feature-icons">
        {[
          { id: 'f1', icon: shippingIcon, title: 'MIỄN PHÍ GIAO HÀNG ĐƠN TỪ 499K', sub: 'Giao hàng nhanh chóng' },
          { id: 'f2', icon: exchangeIcon, title: 'ĐỔI HÀNG LINH HOẠT', sub: 'Trong vòng 15 ngày kể từ ngày mua' },
          { id: 'f3', icon: warrantyIcon, title: 'BẢO HÀNH SẢN PHẨM', sub: 'Trong vòng 6 tháng kể từ ngày mua' },
          { id: 'f4', icon: supportIcon, title: 'TƯ VẤN NHANH CHÓNG', sub: 'Hỗ trợ từ 7h30-23h mỗi ngày' }
        ].map(f => (
          <div className="feature" key={f.id}>
            <div className="feature-icon"><img src={f.icon} alt={f.title} /></div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-sub">{f.sub}</div>
          </div>
        ))}
      </div>

      {/* Coupons section removed from homepage per request */}

      {/* Applied coupon summary and voucher modal removed from homepage per request */}

      {toast && <div className="promo-toast">{toast}</div>}
    </section>
  )
}

export default PromoFeatures
