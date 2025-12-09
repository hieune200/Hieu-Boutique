import { useState } from 'react'
import { useToast } from '../../components/ToastProvider'

const ChangePassword = ({ onChangePassword }) => {
    const [currentPwd, setCurrentPwd] = useState('')
    const [newPwd, setNewPwd] = useState('')
    const [confirmPwd, setConfirmPwd] = useState('')

    const { showToast } = useToast()
    const submit = (e)=>{
        e.preventDefault()
        if (!newPwd || newPwd.length < 6) return showToast('Mật khẩu mới phải ít nhất 6 ký tự', 'error')
        if (newPwd !== confirmPwd) return showToast('Mật khẩu xác nhận không khớp', 'error')
        // Ideally call API — here we'll call onChangePassword if provided
        onChangePassword && onChangePassword({ currentPwd, newPwd })
        showToast('Mật khẩu đã được cập nhật (mô phỏng)', 'success')
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    }

    return (
        <div className="user-subpage change-password">
            <h2>Đổi Mật Khẩu</h2>
            <p>Đổi mật khẩu để bảo vệ tài khoản của bạn.</p>
            <form className="change-password-form" onSubmit={submit}>
                <label>Mật khẩu hiện tại</label>
                <input type="password" value={currentPwd} onChange={e=>setCurrentPwd(e.target.value)} />
                <label>Mật khẩu mới</label>
                <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} />
                <label>Xác nhận mật khẩu mới</label>
                <input type="password" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} />
                <div style={{marginTop:12}}>
                    <button className="btn" type="submit">Cập nhật</button>
                </div>
            </form>
        </div>
    )
}

export default ChangePassword
