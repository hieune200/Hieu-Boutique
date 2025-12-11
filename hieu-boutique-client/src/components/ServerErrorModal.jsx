import { useContext } from 'react'
import { globalContext } from '../context/globalContext'

const ServerErrorModal = ()=>{
    const { serverError, setServerError } = useContext(globalContext)
    if (!serverError) return null

    const onClose = ()=> setServerError(null)
    const copy = ()=> navigator.clipboard && navigator.clipboard.writeText(serverError)

    return (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}} onClick={onClose}>
            <div role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()} style={{maxWidth:720, width:'90%', background:'#fff', borderRadius:8, padding:20}}>
                <h3 style={{marginTop:0}}>Xin lỗi — Đã xảy ra lỗi</h3>
                <p>{serverError}</p>
                <p>Vui lòng ghi lại mã lỗi ở trên và liên hệ bộ phận hỗ trợ hoặc gửi email tới <strong>support@hieuboutique.vn</strong>.</p>
                <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:12}}>
                    <button onClick={copy} className='btn' style={{background:'#eee'}}>Sao chép mã</button>
                    <button onClick={onClose} className='btn' style={{background:'#c62828', color:'#fff'}}>Đóng</button>
                </div>
            </div>
        </div>
    )
}

export default ServerErrorModal
