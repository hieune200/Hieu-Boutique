import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './notifications.scss'

const Notifications = ({ userData }) => {
    const nav = useNavigate()
    const [notifications, setNotifications] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 6
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedNotif, setSelectedNotif] = useState(null)

    function isPersonalNotification(n){
        if (!n) return false
        const personalTypes = new Set(['order','order_received','review','order_update','order_cancelled'])
        if (n.type && personalTypes.has(String(n.type))) return true
        if (n.orderCode || n.productId || n.reviewId) return true
        return false
    }

    function sortNotificationsArray(arr){
        if (!Array.isArray(arr)) return arr || []
        return arr.slice().sort((a,b)=>{
            try{
                const pa = isPersonalNotification(a)
                const pb = isPersonalNotification(b)
                if (pa !== pb) return pa ? -1 : 1
                const ta = a && (a.createdAt || a.time || a.date) ? new Date(a.createdAt || a.time || a.date) : new Date(0)
                const tb = b && (b.createdAt || b.time || b.date) ? new Date(b.createdAt || b.time || b.date) : new Date(0)
                return tb - ta
            }catch(e){ return 0 }
        })
    }

    function getCurrentUserId(){
        if (userData && userData._id) return userData._id
        try{ const s = sessionStorage.getItem('userID'); if (s) return s }catch(e){ /* ignore */ }
        try{ const l = localStorage.getItem('userID'); if (l) return l }catch(e){ /* ignore */ }
        return null
    }

    async function load(){
        try{
            const API_BASE = import.meta.env.VITE_API_URL || ''
            const currentId = getCurrentUserId()
            // try read from local cache first (kept by Header)
            const cacheKey = `hb_notifications_cache_${currentId || 'anonymous'}`
            try{
                const raw = localStorage.getItem(cacheKey)
                if (raw){
                    const parsed = JSON.parse(raw)
                    if (Array.isArray(parsed) && parsed.length){
                        setNotifications(sortNotificationsArray(parsed))
                        // still try to refresh from server in background when we have id
                        if (!currentId) return
                    }
                }
            }catch(e){}
            if (!currentId) return
            const res = await fetch(`${API_BASE}/auth/notifications/${currentId}`, { credentials: 'include' })
            if (res && res.ok){
                const raw = await res.json()
                const data = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : null)
                if (Array.isArray(data)){
                    // normalize server objects that may contain _id
                    const normalize = (n) => {
                        if (!n) return n
                        const id = n.id || (n._id && (n._id.$oid || String(n._id))) || String(n._id || n.id || '')
                        // ensure createdAt is an ISO string when possible
                        const raw = n.createdAt || n.time || n.date || null
                        let createdAt = null
                        try{ if (raw) createdAt = (new Date(raw)).toISOString(); }catch(e){ createdAt = null }
                        const time = createdAt || (n.time || n.date || '')
                        return { ...n, id, createdAt, time }
                    }
                    let normalized = data.map(normalize)
                    normalized = normalized.map((n,i) => {
                        const idVal = n.id || (n._id && (n._id.$oid || String(n._id))) || `notif-${i}-${Math.floor(Math.random()*1000000)}`
                        // ensure createdAt ISO
                        let createdAt = n.createdAt || n.time || null
                        try{ if (createdAt) createdAt = (new Date(createdAt)).toISOString(); }catch(e){ createdAt = null }
                        return ({ ...n, id: idVal, createdAt })
                    })
                    // apply any local read/delete overrides so UI reflects local actions immediately
                    const overrides = getLocalReadOverrides()
                    const deleted = getLocalDeletedOverrides()
                    const processed = normalized.map(n => ({ ...n, read: (overrides && overrides[n.id] !== undefined) ? overrides[n.id] : !!n.read })).filter(n => !(deleted && deleted[n.id]))
                    try{ localStorage.setItem(cacheKey, JSON.stringify(processed)) }catch(e){ /* ignore */ }
                    setNotifications(sortNotificationsArray(processed))
                    return
                }
            }
        }catch(e){ /* ignore */ }
        // fallback to userData prop
        const fallback = Array.isArray(userData?.notifications) ? userData.notifications : []
        const normalize = (n) => {
            if (!n) return n
            const id = n.id || (n._id && (n._id.$oid || String(n._id))) || String(n._id || n.id || '')
            const createdAt = n.createdAt || n.time || n.date || null
            const time = createdAt
            return { ...n, id, createdAt, time }
        }
        const ensured = (fallback.map(normalize)).map((n,i)=> ({ ...n, id: n.id || `notif-fallback-${i}-${Math.floor(Math.random()*1000000)}` }))
        setNotifications(sortNotificationsArray(ensured))
    }

    useEffect(()=>{
        load()
        function onNew(e){
            const payload = e && e.detail ? e.detail : null
            if (!payload) return
            setNotifications(prev => sortNotificationsArray([payload, ...(prev || [])]))
        }
        window.addEventListener('new-notification', onNew)
        // also listen for updates from other actions (read/delete/markAll)
        function onUpdated(){ load() }
        window.addEventListener('notif-updated', onUpdated)
        return ()=> { window.removeEventListener('new-notification', onNew); window.removeEventListener('notif-updated', onUpdated) }
    },[userData?._id])

    // local persistence helpers (mirror Header.jsx fallback behavior)
    function localReadKey(){ try{ if (userData && userData._id) return `hb_notifications_read_${userData._id}` }catch(e){ /* ignore */ } return `hb_notifications_read_anonymous` }
    function getLocalReadOverrides(){ try{ const raw = localStorage.getItem(localReadKey()); if (!raw) return null; return JSON.parse(raw) }catch(e){ return null } }
    function setLocalReadOverride(id, read){ try{ const key = localReadKey(); const cur = getLocalReadOverrides() || {}; cur[id] = !!read; localStorage.setItem(key, JSON.stringify(cur)) }catch(e){ /* ignore */ } }

    function localDeletedKey(){ try{ if (userData && userData._id) return `hb_notifications_deleted_${userData._id}` }catch(e){ /* ignore */ } return `hb_notifications_deleted_anonymous` }
    function getLocalDeletedOverrides(){ try{ const raw = localStorage.getItem(localDeletedKey()); if (!raw) return null; return JSON.parse(raw) }catch(e){ return null } }
    function setLocalDeletedOverride(id){ try{ const key = localDeletedKey(); const cur = getLocalDeletedOverrides() || {}; cur[id] = true; localStorage.setItem(key, JSON.stringify(cur)) }catch(e){ /* ignore */ } }

    async function markRead(n){
        if (!n) return
        // optimistic update
        setNotifications(prev => (prev || []).map(x => x.id === n.id ? { ...x, read: true } : x))
        setLocalReadOverride(n.id, true)
        try{
            const API_BASE = import.meta.env.VITE_API_URL || ''
            const base = API_BASE.replace(/\/$/, '')
            await fetch(`${base}/auth/notifications/mark-read`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userData?._id, createdAt: n.createdAt }) })
        }catch(e){ /* ignore */ }
        try{ window.dispatchEvent(new CustomEvent('notif-updated')) }catch(e){ /* ignore */ }
    }

    async function markUnread(n){
        if (!n) return
        setNotifications(prev => (prev || []).map(x => x.id === n.id ? { ...x, read: false } : x))
        setLocalReadOverride(n.id, false)
        try{ window.dispatchEvent(new CustomEvent('notif-updated')) }catch(e){ /* ignore */ }
    }

    async function deleteNotification(n){
        if (!n) return
        setNotifications(prev => (prev || []).filter(x => x.id !== n.id))
        setLocalDeletedOverride(n.id)
        try{ window.dispatchEvent(new CustomEvent('notif-updated')) }catch(e){ /* ignore */ }
    }

    function openItem(n){
        if (!n) return
        // mark as read and open modal detail view
        markRead(n)
        setSelectedNotif(n)
        setModalOpen(true)
    }

    const fmtTime = (n) => {
        const t = n.time || n.createdAt || n.date
        try{ return t ? new Date(t).toLocaleString() : '' }catch(e){ return String(t || '') }
    }

    // compute pagination
    const totalItems = Array.isArray(notifications) ? notifications.length : 0
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const pageIndex = Math.max(1, Math.min(currentPage, totalPages))
    const pageItems = (notifications || []).slice((pageIndex - 1) * pageSize, pageIndex * pageSize)

    return (
        <div className="user-subpage notifications">
            <h2>Thông báo</h2>
            <div className="notifications-board">
                {pageItems && pageItems.length ? pageItems.map((n,i)=> (
                    <div key={n.id || n._id || `notif-key-${(pageIndex-1)*pageSize + i}`} className={`notification-card ${n.read? 'read':''}`}>
                        <div className="card-head">
                            <div className="card-title">{n.title || n.text || n.message || 'Thông báo'}</div>
                            <div className="card-meta">{n.type ? String(n.type).toUpperCase() : ''} · {fmtTime(n)}</div>
                        </div>
                        <div className="card-body">{n.body || n.message || ''}</div>
                        <div className="card-actions">
                            <button className="primary" onClick={() => openItem(n)}>Mở</button>
                            { n.read ? (
                                <button onClick={() => markUnread(n)}>Chưa đọc</button>
                            ) : (
                                <button onClick={() => markRead(n)}>Đánh dấu đã đọc</button>
                            )}
                            <button onClick={() => deleteNotification(n)}>Xóa</button>
                        </div>
                    </div>
                )) : (
                    <div className="notification-empty">Không có thông báo nào.</div>
                )}

                {/* pagination controls */}
                { totalPages > 1 && (
                    <div className="pagination">
                        <button disabled={pageIndex === 1} onClick={() => setCurrentPage(p => Math.max(1, p-1))}>‹</button>
                        {Array.from({length: totalPages}).map((_, idx) => (
                            <button key={`pg-${idx+1}`} className={idx+1 === pageIndex ? 'active' : ''} onClick={() => setCurrentPage(idx+1)}>{idx+1}</button>
                        ))}
                        <button disabled={pageIndex === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}>›</button>
                    </div>
                )}

            </div>

            {/* modal detail view */}
            { modalOpen && selectedNotif && (
                <div className="notif-modal-backdrop" role="dialog" aria-modal="true">
                    <div className="notif-modal">
                        <div className="modal-head">
                            <h3>{selectedNotif.title || 'Thông báo'}</h3>
                            <button className="modal-close" aria-label="Đóng" onClick={()=> { setModalOpen(false); setSelectedNotif(null) }}>×</button>
                        </div>
                        <div className="modal-meta">{selectedNotif.type ? String(selectedNotif.type).toUpperCase() : ''} · {fmtTime(selectedNotif)}</div>
                        <div className="modal-body">{selectedNotif.body || selectedNotif.message || selectedNotif.text || ''}</div>
                        <div className="modal-actions">
                            { selectedNotif.link ? (
                                <button className="primary" onClick={()=> { setModalOpen(false); setSelectedNotif(null); nav(selectedNotif.link) }}>Mở liên kết</button>
                            ) : null }
                            <button onClick={()=> { setModalOpen(false); setSelectedNotif(null) }}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Notifications
