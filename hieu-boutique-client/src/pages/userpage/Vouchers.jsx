import { useState, useContext } from 'react'
import { globalContext } from '../../context/globalContext'
import voucherImg from '../../assets/imgs/common/voucher.png'

const Vouchers = ({ userData }) => {
    const { applyCoupon: applyCouponToContext, ctUserID } = useContext(globalContext)
    const [vouchers, setVouchers] = useState(userData?.vouchers || [
        { id: 'v1', code: 'WELCOME10', desc: 'Giảm 10% cho đơn hàng đầu', expire: '2026-01-01', remaining: 1, image: voucherImg }
    ])
    const [toast, setToast] = useState('')
    const apiBase = import.meta.env.VITE_API || 'http://localhost:3000'

    function showToast(msg){
        setToast(msg)
        setTimeout(()=> setToast(''), 2200)
    }

    async function copyCode(v){
        try{
            const text = v.code || ''
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
            // optimistic decrement
            setVouchers(prev => prev.map(x => x.id === v.id ? {...x, remaining: Math.max(0, (x.remaining||0)-1)} : x))
        }
        catch(e){ showToast('Không thể sao chép mã') }
    }

    async function apply(v){
        try{
            const headers = { 'Content-Type': 'application/json' }
            if (ctUserID) headers['user-id'] = ctUserID
            const res = await fetch(`${apiBase}/coupons/apply`, { method: 'POST', headers, body: JSON.stringify({ code: v.code, userId: ctUserID }) })
            if (!res.ok){
                const err = await res.json().catch(()=>({ error: 'Áp dụng thất bại' }))
                showToast(err.error || 'Áp dụng thất bại')
                return
            }
            const payload = await res.json()
            applyCouponToContext(payload)
            showToast('Đã áp dụng mã: ' + payload.code)
            setVouchers(prev => prev.map(x => x.id === v.id ? {...x, remaining: Math.max(0, (x.remaining||0)-1)} : x))
        }
        catch(e){ showToast('Không thể áp dụng mã') }
    }

    return (
        <div className="user-subpage vouchers">
            <h2>Kho Voucher</h2>
            <p>Danh sách voucher bạn đang sở hữu.</p>
            <ul className="vouchers-list">
                {vouchers.map(v=> (
                    <li key={v.code} className="voucher-item" style={{display:'flex', alignItems:'center', gap:12}}>
                        <img src={v.image || voucherImg} alt={v.code} style={{width:64, height:64, objectFit:'cover', borderRadius:8, border:'1px solid #eee'}} />
                        <div style={{flex:1}}>
                          <div className="voucher-code">{v.code}</div>
                          <div className="voucher-desc">{v.desc}</div>
                          <div className="voucher-exp">Hạn: {v.expire}</div>
                        </div>
                        <div className="voucher-actions">
                            <button className="apply" onClick={()=>apply(v)}>Áp dụng</button>
                            <button className="save" onClick={()=>copyCode(v)}>Sao chép mã</button>
                        </div>
                    </li>
                ))}
            </ul>
            {toast && <div className="voucher-toast">{toast}</div>}
        </div>
    )
}

export default Vouchers
