import { useState } from 'react'
import { useToast } from '../../components/ToastProvider'

const NotificationsSettings = ({ userData, onUpdate }) => {
    const [emailNotify, setEmailNotify] = useState(userData?.notifyEmail ?? true)
    const [smsNotify, setSmsNotify] = useState(userData?.notifySms ?? false)
    const { showToast } = useToast()

    const save = (e)=>{
        e && e.preventDefault()
        const updated = { ...userData, notifyEmail: emailNotify, notifySms: smsNotify }
        onUpdate && onUpdate(updated)
        showToast('Cài đặt thông báo đã được lưu (mô phỏng)', 'success')
    }

    return (
        <div className="user-subpage notifications-settings">
            <h2>Cài Đặt Thông Báo</h2>
            <p>Quản lý cách bạn nhận thông báo từ Hieu Boutique.</p>
            <form onSubmit={save} className="notif-form">
                <label><input type="checkbox" checked={emailNotify} onChange={e=>setEmailNotify(e.target.checked)} /> Nhận email thông báo</label>
                <label><input type="checkbox" checked={smsNotify} onChange={e=>setSmsNotify(e.target.checked)} /> Nhận SMS</label>
                <div style={{marginTop:12}}>
                    <button className="btn" onClick={save}>Lưu</button>
                </div>
            </form>
        </div>
    )
}

export default NotificationsSettings
