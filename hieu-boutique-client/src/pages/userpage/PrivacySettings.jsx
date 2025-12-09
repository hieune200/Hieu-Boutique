import { useState } from 'react'
import { useToast } from '../../components/ToastProvider'

const PrivacySettings = ({ userData, onUpdate }) => {
    const [showProfile, setShowProfile] = useState(userData?.publicProfile ?? true)
    const { showToast } = useToast()

    const save = (e)=>{
        e && e.preventDefault()
        const updated = { ...userData, publicProfile: showProfile }
        onUpdate && onUpdate(updated)
        showToast('Cài đặt riêng tư đã được lưu (mô phỏng)', 'success')
    }

    return (
        <div className="user-subpage privacy-settings">
            <h2>Những Thiết Lập Riêng Tư</h2>
            <p>Quản lý ai có thể xem thông tin của bạn.</p>
            <form onSubmit={save} className="privacy-form">
                <label><input type="checkbox" checked={showProfile} onChange={e=>setShowProfile(e.target.checked)} /> Công khai hồ sơ</label>
                <div style={{marginTop:12}}>
                    <button className="btn" onClick={save}>Lưu</button>
                </div>
            </form>
        </div>
    )
}

export default PrivacySettings
