import { useState, useEffect } from 'react'
import './componentStyle/ReviewModal.scss'

const ReviewModal = ({ open, onClose, product, productId, onSubmitted, initialName, initialPhone })=>{
    const [rating, setRating] = useState(5)
    const [name, setName] = useState(initialName || '')
    const [phone, setPhone] = useState(initialPhone || '')
    const [comment, setComment] = useState('')
    const [files, setFiles] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [submitSuccess, setSubmitSuccess] = useState('')

    useEffect(()=>{
        if (!open){
            // reset form when closing
            setRating(5); setName(initialName || ''); setPhone(initialPhone || ''); setComment(''); setFiles([]); setSubmitting(false)
            setSubmitError(''); setSubmitSuccess('')
        } else {
            // when opening, initialize rating from product's saved average (use floor so 4.3 -> 4 stars)
            try{
                const prodScore = product && product.ratingAverage ? Number(product.ratingAverage) : null
                const initial = prodScore !== null && !isNaN(prodScore) ? Math.max(1, Math.min(5, Math.floor(prodScore))) : 5
                setRating(initial)
                // prefill name/phone when available
                setName(initialName || '')
                setPhone(initialPhone || '')
            }catch(e){ /* ignore */ }
        }
    },[open, product, initialName, initialPhone])

    if (!open) return null

    const onFileChange = (e)=>{
        const selected = Array.from(e.target.files || [])
        const allowed = selected.slice(0, Math.max(0, 5 - files.length))
        const newFiles = [...files, ...allowed].slice(0,5)
        setFiles(newFiles)
    }

    const removeFile = (idx)=> setFiles(files.filter((_,i)=> i!== idx))

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/products'

    const handleSubmit = async (ev)=>{
        ev.preventDefault()
        setSubmitError('')
        // require logged-in user to submit
        const userId = sessionStorage.getItem('userID')
        if (!userId) { setSubmitError('Vui lòng đăng nhập để gửi đánh giá.'); return }
        if (!name || !phone || !comment) { setSubmitError('Vui lòng điền tên, số điện thoại và nội dung đánh giá.'); return }
        setSubmitting(true)
        try{
            // build form data for upload
            const form = new FormData()
            form.append('productId', productId)
            form.append('rating', String(rating))
            form.append('name', name)
            form.append('phone', phone)
            form.append('userId', userId)
            form.append('comment', comment)
            files.forEach((f, _i)=> form.append('images', f))
            // POST to server — use configured API base
            const url = `${API_BASE}/product/${productId}/reviews`
            const token = sessionStorage.getItem('token')
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
            const res = await fetch(url, { method: 'POST', headers, body: form })
            let data = {}
            try{ data = await res.json() }catch(e){ data = {} }
            if (res.ok) {
                setSubmitSuccess('Gửi đánh giá thành công. Cảm ơn bạn!')
                // optionally call parent callback to refresh reviews
                onSubmitted && onSubmitted()
                // close modal after short delay so user sees success
                // dispatch a local notification event so header/panel update immediately
                try{
                    const note = {
                        id: `note-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                        title: `Cảm ơn vì đánh giá`,
                        time: new Date().toISOString(),
                        body: `Bạn vừa gửi đánh giá cho ${product?.title || ''}`,
                        type: 'review',
                        productId: productId,
                        read: false
                    }
                    try{
                        const uid = sessionStorage.getItem('userID') || localStorage.getItem('userID') || 'anonymous'
                        const key = `hb_notifications_pending_${uid}`
                        const cur = JSON.parse(localStorage.getItem(key) || '[]')
                        cur.unshift(note)
                        localStorage.setItem(key, JSON.stringify(cur.slice(0,50)))
                    }catch(e){}
                    window.dispatchEvent(new CustomEvent('new-notification', { detail: note }))
                }catch(e){}
                setTimeout(()=>{ onClose() }, 900)
            } else {
                const msg = data.message || 'Lỗi khi gửi đánh giá. Vui lòng thử lại.'
                setSubmitError(msg)
            }
        }catch(err){
            console.error('submit review error', err)
            setSubmitError('Lỗi kết nối. Vui lòng thử lại sau.')
        }finally{ setSubmitting(false) }
    }

    return (
        <div className="review-modal" role="dialog" aria-modal="true">
            <div className="review-overlay" onClick={onClose} />
            <div className="review-box">
                <header>
                    <h3>Đánh giá của bạn về sản phẩm</h3>
                    <button className="close" onClick={()=> !submitting && onClose()} disabled={submitting}>✕</button>
                </header>
                <div className="review-body">
                    <div className="product-meta">
                        <img src={product?.img?.[0] || product?.img} alt={product?.title} />
                        <div className="meta-text">
                            <div className="product-title">{product?.title}</div>
                            <div className="product-id">{productId}</div>
                            <div className="rating-preset">{Array.from({length:5}).map((_,i)=> <span key={i} className={`star ${i < rating ? 'active':''}`}>★</span>)}</div>
                        </div>
                    </div>

                    <form className="review-form" onSubmit={handleSubmit}>
                        {submitError ? <div className="error-message" role="alert">{submitError}</div> : null}
                        {submitSuccess ? <div className="success-message" role="status">{submitSuccess}</div> : null}
                        <div className="star-picker">
                            {Array.from({length:5}).map((_,i)=>{
                                    const val = i + 1
                                    return (
                                        <button key={i} type="button" className={`star-btn ${rating >= val ? 'active' : ''}`} onClick={()=> setRating(val)} aria-label={`${val} sao`}>
                                            <span className="star-char">★</span>
                                        </button>
                                    )
                                })}
                        </div>

                        <div className="inputs-row">
                            <input placeholder="Họ tên" value={name} onChange={e=>setName(e.target.value)} />
                            <input placeholder="Số điện thoại" value={phone} onChange={e=>setPhone(e.target.value)} />
                        </div>

                        <textarea placeholder="Chia sẻ cảm nhận của bạn về sản phẩm" value={comment} onChange={e=>setComment(e.target.value)} />

                        <div className="upload-area">
                            <label className="upload-label">
                                <input type="file" accept="image/*,video/*" multiple onChange={onFileChange} />
                                <span className="upload-cta">📷 Gửi hình chụp thực tế và video (Tối đa 5)</span>
                            </label>
                            <div className="preview-list">
                                {files.map((f, _i)=> (
                                    <div key={_i} className="preview-item">
                                        <img src={URL.createObjectURL(f)} alt={`preview-${_i}`} />
                                        <button type="button" className="remove" onClick={()=> removeFile(_i)}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="submit" disabled={submitting}>{submitting? 'Đang gửi...' : 'Gửi đánh giá'}</button>
                            <button type="button" className="cancel" onClick={onClose} disabled={submitting}>Hủy</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ReviewModal
