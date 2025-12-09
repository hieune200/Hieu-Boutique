import { useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import logoTp from '../../assets/imgs/common/logo-tp.png'
import logoVnpay from '../../assets/imgs/common/logo-vnpay.png'
import logoMomo from '../../assets/imgs/common/logo-momo.png'
import logoVietcom from '../../assets/imgs/common/vietcom.svg'
import logoVietin from '../../assets/imgs/common/vietin.svg'
import logoBidv from '../../assets/imgs/common/bidv.svg'
import logoAgribank from '../../assets/imgs/common/agribank.svg'

const BANKS = [
    { id: 'tpbank', name: 'TPBank', logo: logoTp },
    { id: 'vietcom', name: 'Vietcombank', logo: logoVietcom },
    { id: 'vietin', name: 'VietinBank', logo: logoVietin },
    { id: 'bidv', name: 'BIDV', logo: logoBidv },
    { id: 'agribank', name: 'Agribank', logo: logoAgribank },
    { id: 'vnpay', name: 'VNPAY', logo: logoVnpay },
    { id: 'momo', name: 'Momo', logo: logoMomo }
]

const Bank = ({ userData, onUpdate }) => {
    const { showToast } = useToast()
    const [selected, setSelected] = useState(userData?.bankName || '')
    const [accountNumber, setAccountNumber] = useState(userData?.accountNumber || '')
    const [ownerName, setOwnerName] = useState(userData?.accountOwner || '')

    const save = (e)=>{
        e && e.preventDefault()
        if (!selected) { showToast('Vui lòng chọn ngân hàng', 'error'); return }
        if (!accountNumber || accountNumber.trim().length < 6) { showToast('Vui lòng nhập số tài khoản hợp lệ', 'error'); return }
        const updated = { ...userData, bankName: selected, accountNumber, accountOwner: ownerName }
        try{
            onUpdate && onUpdate(updated)
            showToast('Thông tin ngân hàng đã được lưu', 'success')
        }catch(e){
            console.error('bank save error', e)
            showToast('Không thể lưu thông tin ngân hàng', 'error')
        }
    }

    return (
        <div className="user-subpage bank">
            <h2>Ngân Hàng</h2>
            <p>Thêm hoặc cập nhật thông tin tài khoản ngân hàng để nhận hoàn tiền hoặc thanh toán.</p>
            <form onSubmit={save} className="bank-form">
                <label className="bank-label">Chọn ngân hàng</label>
                <div className="bank-grid" role="list">
                    {BANKS.map(b => (
                        <button
                            key={b.id}
                            type="button"
                            role="listitem"
                            className={`bank-card ${selected === b.name ? 'selected' : ''}`}
                            onClick={()=> setSelected(b.name)}
                            title={b.name}
                        >
                            {b.logo ? (
                                <img src={b.logo} alt={b.name} />
                            ) : (
                                <div className="bank-fallback">
                                    {b.name.split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase()}
                                </div>
                            )}
                            <div className="bank-name">{b.name}</div>
                        </button>
                    ))}
                </div>

                <label>Số tài khoản</label>
                <input value={accountNumber} onChange={e=>setAccountNumber(e.target.value)} placeholder="Số tài khoản" />
                <label>Chủ tài khoản</label>
                <input value={ownerName} onChange={e=>setOwnerName(e.target.value)} placeholder="Tên chủ tài khoản" />

                <div style={{marginTop:12}}>
                    <button className="btn infor_list_btn" type="submit">Lưu</button>
                </div>
            </form>
        </div>
    )
}

export default Bank
