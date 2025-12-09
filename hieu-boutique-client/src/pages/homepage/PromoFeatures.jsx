import { useState, useEffect, useContext } from 'react'
import './homepageStyle/PromoFeatures.scss'
import { globalContext } from '../../context/globalContext'
import voucherImg from '../../assets/imgs/common/voucher.png'

// banner images and inline SvgGift were removed (not used in current layout)

const PromoFeatures = ()=>{
  const { applyCoupon: applyCouponToContext } = useContext(globalContext)
  const [coupons, setCoupons] = useState([])
  const [toast, setToast] = useState('')
  // Vite exposes env via import.meta.env. Use VITE_API if set, otherwise fallback to localhost
  const apiBase = import.meta.env.VITE_API || 'http://localhost:3000'

  function showToast(msg){
    setToast(msg)
    setTimeout(()=> setToast(''), 2200)
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
    try{
      // validate with backend
      const res = await fetch(`${apiBase}/coupons/apply`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ code: c.code }) })
      if (!res.ok) {
        const err = await res.json().catch(()=>({error:'Không hợp lệ'}))
        showToast(err.error || 'Áp dụng thất bại')
        return
      }
      const payload = await res.json()
      applyCouponToContext(payload)
      showToast('Đã áp dụng mã: ' + payload.code)
      setCoupons(prev => prev.map(x => x.id===c.id ? {...x, remaining: Math.max(0, x.remaining-1)} : x))
    }catch(e){
      showToast('Không thể áp dụng mã')
    }
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
          { id: 'c50k', title: 'Giảm 50.000₫', sub: 'Đơn tối thiểu 899.000₫', code: 'HB50K', expiry: '2025-12-02', remaining: 283 },
          { id: 'c20k', title: 'Giảm 20.000₫', sub: 'Đơn tối thiểu 400.000₫', code: 'HB20K', expiry: '2025-12-01', remaining: 32 }
        ])
      }
    })()
    return ()=>{ mounted = false }
  },[apiBase])

  return (
    <section className="promo-features">

      <div className="coupons-row">
        {coupons.map(c => (
          <div className="coupon" key={c.id}>
            <div className="coupon-left">
                      <div className="coupon-head">
                          <img src={voucherImg} alt="voucher" className="badge-img" />
                          <div className="coupon-title">{c.title}</div>
                        </div>
              <div className="coupon-sub">{c.sub}</div>
              <div className="coupon-actions">
                <button className="apply" onClick={()=>applyCoupon(c)}>Áp dụng</button>
                <button className="save" onClick={()=>saveCode(c)}>Sao chép mã</button>
              </div>
              <div className="expiry">HSD: {c.expiry} <span className="remain">(Còn {c.remaining})</span></div>
            </div>
            <div className="coupon-right">
              <div className="code-pill">{c.code}</div>
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="promo-toast">{toast}</div>}
    </section>
  )
}

export default PromoFeatures
