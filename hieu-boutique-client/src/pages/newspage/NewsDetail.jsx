import { useParams, Link } from 'react-router-dom'
import { handleBreadcrumbClick } from '../../utils/breadcrumb'
import newsArticles from '../../services/model/newsArticles'
import './newspageStyle/NewsDetail.scss'
import { useEffect, useState, useContext } from 'react'
import { globalContext } from '../../context/globalContext'
import { useToast } from '../../components/ToastProvider'
import { loginAPI } from '../../services/Auth.api'

const SERVER_BASE = import.meta.env.VITE_SERVER_BASE || 'http://localhost:3000'

const NewsDetail = () => {
    // helper to format dates
    const formatDate = (d) => {
        try{ return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) }catch(e){ return d }
    }

    const shareTo = (provider) => {
        const pageUrl = window.location.href
        if(provider === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, '_blank')
        if(provider === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(document.title || '')}`, '_blank')
    }

    const copyLink = async () => {
        const pageUrl = window.location.href
        try{
            if(navigator.clipboard && navigator.clipboard.writeText){
                await navigator.clipboard.writeText(pageUrl)
                showToast('Đã sao chép link vào clipboard', 'success')
                return
            }
        }catch(e){ void e }
        // fallback prompt
        prompt('Sao chép link:', pageUrl)
    }
    const { id } = useParams()
    const article = newsArticles.find(a=> a.id === id) || newsArticles[0] || { title:'', short:'', img:'', content:'', author:'', date: new Date().toISOString() }
    const related = newsArticles.filter(a=> a.id !== id)
    const { ctUserID, getUserID } = useContext(globalContext)
    const { showToast } = useToast()
    // comments state persisted in localStorage per-article
    const [comments, setComments] = useState([])
    const [form, setForm] = useState({ name: '', text: '' })
    const [sessionId, setSessionId] = useState(null)
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [loginState, setLoginState] = useState({ username: '', password: '', loading: false })

    // session id to allow delete only from the same browser session
    useEffect(()=>{
        try{
            let sid = localStorage.getItem('hb_session')
            if(!sid){ sid = Date.now().toString() + Math.random().toString(36).slice(2,8); localStorage.setItem('hb_session', sid) }
            setSessionId(sid)
        }catch(e){ setSessionId(null) }

        // Try to load comments from backend, fallback to localStorage
        let cancelled = false
        const load = async ()=>{
            try{
                const res = await fetch(`${SERVER_BASE}/comments/article/${id}`)
                if(!res.ok) throw new Error('no comments')
                const data = await res.json()
                if(cancelled) return
                // normalize _id -> id and date
                const normalized = data.map(d=> ({ id: d._id || d.id || Date.now().toString(), name: d.name, text: d.text, date: d.date ? new Date(d.date).toISOString() : new Date().toISOString(), session: d.session || null, reported: !!d.reported }))
                setComments(normalized)
                // also cache to localStorage for offline
                try{ localStorage.setItem(`comments_${id}`, JSON.stringify(normalized)) }catch(e){ void e }
                return
            }catch(e){
                // fallback to localStorage
                try{
                    const key = `comments_${id}`
                    const raw = localStorage.getItem(key)
                    if(raw) setComments(JSON.parse(raw))
                    else setComments([])
                }catch(e){ setComments([]) }
            }
        }
        load()
        // also refetch when user logs in (ctUserID may change) - handled by dependency list
        return ()=>{ cancelled = true }
    },[id, ctUserID])

    const saveComments = (next)=>{
        try{ localStorage.setItem(`comments_${id}`, JSON.stringify(next)) }catch(e){ void e }
        setComments(next)
    }

    const submitComment = async (e)=>{
        e.preventDefault()
        const name = form.name?.trim() || 'Khách'
        const text = form.text?.trim()
        if(!text) return showToast('Vui lòng nhập nội dung bình luận','error')

        // try to post to backend
        try{
            const res = await fetch(`${SERVER_BASE}/comments/article/${id}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, text, session: sessionId })
            })
            if(res.ok){
                const created = await res.json()
                const c = { id: created._id || created.id || Date.now().toString(), name: created.name, text: created.text, date: new Date(created.date || Date.now()).toISOString(), session: created.session || null, reported: !!created.reported }
                const next = [c, ...comments]
                saveComments(next)
                setForm({ name:'', text:'' })
                return
            }
        }catch(e){ void e }

        // fallback to localStorage
        const c = { id: Date.now().toString(), name, text, date: new Date().toISOString(), session: sessionId || null, reported: false }
        const next = [c, ...comments]
        saveComments(next)
        setForm({ name:'', text:'' })
    }

    // login modal handlers
    const submitLoginModal = async (e)=>{
        e && e.preventDefault()
        if(!loginState.username || !loginState.password) return showToast('Nhập tên đăng nhập và mật khẩu','error')
        setLoginState({...loginState, loading: true})
        try{
            const resp = await loginAPI({ username: loginState.username, password: loginState.password })
            showToast(resp.message, resp && resp.status == 201 ? 'success' : 'error')
            if(resp && resp.status == 201){
                if (resp.ObjectId) sessionStorage.setItem('userID', resp.ObjectId)
                if (resp.token) sessionStorage.setItem('token', resp.token)
                getUserID()
                setShowLoginModal(false)
                setLoginState({ username:'', password:'', loading:false })
                // comments effect will refetch because ctUserID changed
                return
            }
        }catch(e){ console.error(e) }
        setLoginState({...loginState, loading:false})
    }

    

    const removeComment = async (cid)=>{
        if(!confirm('Xóa bình luận này?')) return
        // try backend delete
        try{
            const res = await fetch(`${SERVER_BASE}/comments/${cid}?session=${sessionId}`, { method: 'DELETE' })
            if(res.ok){
                const next = comments.filter(c=> c.id !== cid)
                saveComments(next)
                return
            }
        }catch(e){ void e }
        // fallback: local
        const next = comments.filter(c=> c.id !== cid)
        saveComments(next)
    }

    const reportComment = async (cid)=>{
        if(!confirm('Báo cáo bình luận này?')) return
        try{
            const res = await fetch(`${SERVER_BASE}/comments/report/${cid}`, { method: 'POST' })
            if(res.ok){
                const next = comments.map(c=> c.id === cid ? {...c, reported: true} : c)
                saveComments(next)
                return
            }
        }catch(e){ void e }
        const next = comments.map(c=> c.id === cid ? {...c, reported: true} : c)
        saveComments(next)
    }

    return (
        <main className="news-detail">
            <div className="container">
                <nav className="breadcrumb">
                    <Link to="/" onClick={()=> handleBreadcrumbClick('Trang chủ')}>Trang chủ</Link>
                    <span> › </span>
                    <Link to="/news" onClick={()=> handleBreadcrumbClick('Tin tức')}>Tin tức</Link>
                    <span> › </span>
                    <span>{article.title}</span>
                </nav>

                <div className="grid">
                    <div className="nd-main">
                        <div className="detail-header">
                            <h1 className="nd-title">{article.title}</h1>
                            <div className="meta-share">
                                <div className="meta">
                                    <span className="author">{article.author}</span>
                                    <span className="dot">•</span>
                                    <span className="date">{formatDate(article.date)}</span>
                                </div>
                                <div className="share">
                                    <button className="share-btn" onClick={()=>shareTo('facebook')} aria-label="Share on Facebook"> 
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12.072C22 6.48 17.523 2 12 2S2 6.48 2 12.072C2 17.084 5.657 21.23 10.438 22v-7.01H7.898v-2.918h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.63.772-1.63 1.562v1.875h2.773l-.443 2.918h-2.33V22C18.343 21.23 22 17.084 22 12.072z" fill="#1877F2"/></svg>
                                    </button>
                                    <button className="share-btn" onClick={()=>shareTo('twitter')} aria-label="Share on Twitter">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 5.924c-.63.28-1.308.47-2.02.556.727-.436 1.286-1.127 1.55-1.95-.68.404-1.435.7-2.236.86C18.79 4.6 17.9 4 16.88 4c-1.56 0-2.824 1.27-2.824 2.84 0 .22.02.43.07.63C11.7 7.4 9.1 6.08 7.4 4.03c-.24.42-.38.92-.38 1.44 0 .98.5 1.85 1.26 2.36-.46-.02-.9-.14-1.28-.35v.04c0 1.37.97 2.51 2.25 2.77-.24.06-.5.08-.76.08-.18 0-.36-.02-.54-.05.36 1.14 1.4 1.97 2.63 1.99C9.1 15.9 7.7 16.5 6.22 16.5c-.18 0-.36 0-.54-.02 1.02.66 2.22 1.04 3.55 1.04 4.26 0 6.6-3.56 6.6-6.64v-.3c.45-.32.82-.72 1.12-1.18-.42.18-.86.3-1.33.36.48-.3.86-.76 1.06-1.32z" fill="#1DA1F2"/></svg>
                                    </button>
                                    <button className="share-btn" onClick={copyLink} aria-label="Copy link">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.9 12a3 3 0 0 1 0-4.24l3.36-3.36a3 3 0 0 1 4.24 4.24l-.7.7" stroke="#444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.1 12a3 3 0 0 1 0 4.24l-3.36 3.36a3 3 0 0 1-4.24-4.24l.7-.7" stroke="#444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p className="nd-short">{article.short}</p>
                        <div className="nd-img"><img src={article.img} alt={article.title} /></div>
                        <div className="nd-content">
                            {article.content.split('\n\n').map((para, idx)=> <p key={idx}>{para}</p>)}
                        </div>

                        <div className="comments-section">
                            {ctUserID ? (
                                <div className="comments-wrapper">
                                    <section className="comments">
                                        <h3 className="comments-title">Bình luận ({comments.length})</h3>
                                        <form className="comment-form" onSubmit={submitComment}>
                                            <input type="text" placeholder="Tên (tùy chọn)" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
                                            <textarea placeholder="Viết bình luận..." value={form.text} onChange={e=>setForm({...form, text: e.target.value})} rows={4} />
                                            <div className="cf-actions"><button type="submit" className="btn-submit">Gửi bình luận</button></div>
                                        </form>

                                        <div className="comment-list">
                                            {comments.length === 0 && <p className="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên!</p>}
                                            {comments.map(c=> (
                                                <article key={c.id} className={`comment-item ${c.reported ? 'reported' : ''}`}>
                                                    <div className="ci-meta">
                                                        <div className="ci-avatar" aria-hidden>
                                                            {c.name ? c.name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : 'K'}
                                                        </div>
                                                        <div style={{flex:1}}>
                                                            <strong className="ci-name">{c.name}</strong>
                                                            <span className="ci-date">{new Date(c.date).toLocaleString('vi-VN')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="ci-body">{c.text}</div>
                                                    <div className="ci-actions">
                                                        {/* show delete only if comment belongs to this session */}
                                                        {c.session && sessionId && c.session === sessionId ? (
                                                            <button className="ci-delete" onClick={()=>removeComment(c.id)} aria-label="Xóa bình luận">Xóa</button>
                                                        ) : (
                                                            <button className="ci-report" onClick={()=>reportComment(c.id)} aria-label="Báo cáo bình luận">Báo cáo</button>
                                                        )}
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </section>

                                    {showLoginModal && (
                                        <div className="login-modal-overlay">
                                            <div className="login-modal">
                                                <button className="login-modal-close" onClick={()=>setShowLoginModal(false)}>×</button>
                                                <h3>Đăng nhập để bình luận</h3>
                                                <form onSubmit={submitLoginModal} className="login-modal-form">
                                                    <input placeholder="Tên đăng nhập" value={loginState.username} onChange={e=>setLoginState({...loginState, username: e.target.value})} />
                                                    <input type="password" placeholder="Mật khẩu" value={loginState.password} onChange={e=>setLoginState({...loginState, password: e.target.value})} />
                                                    <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                                                        <button type="button" className="btn-secondary" onClick={()=>{ setShowLoginModal(false) }}>Huỷ</button>
                                                        <button type="submit" className="btn-submit">{loginState.loading ? 'Đang...' : 'Đăng nhập'}</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="comments-locked">
                                    <p>Vui lòng <a href="#" onClick={(e)=>{ e.preventDefault(); setShowLoginModal(true) }}>đăng nhập</a> để xem và viết bình luận.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="nd-sidebar">
                        <h3 className="related-title">Bài viết liên quan</h3>
                        <div className="related-list">
                            {related.slice(0,4).map(r=> (
                                <Link key={r.id} to={`/news/${r.id}`} className="related-item">
                                    <div className="ri-thumb"><img src={r.img} alt={r.title} /></div>
                                    <div className="ri-info"><p className="ri-title">{r.title}</p><p className="ri-short">{r.short}</p></div>
                                </Link>
                            ))}
                        </div>
                    </aside>
                </div>

            </div>
        </main>
    )
}

export default NewsDetail
