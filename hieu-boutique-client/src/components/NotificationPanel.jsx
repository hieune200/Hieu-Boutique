import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './componentStyle/NotificationPanel.scss'

const NotificationPanel = ({
  open,
  onClose,
  notifications = [],
  hasLocalNotifications = false,
  maxVisible = 3,
  onRequireLogin,
  onToggleRead = ()=>{},
  onMarkAllRead = ()=>{},
  onDeleteNotification = ()=>{},
  onItemClick = ()=>{}
}) => {
  const ref = useRef()

  useEffect(()=>{
    if (!open) return
    function onDoc(e){
      if (!ref.current) return
      if (!ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('pointerdown', onDoc)
    return ()=> document.removeEventListener('pointerdown', onDoc)
  },[open, onClose])

  if (!open) return null

  const hasNotifications = Array.isArray(notifications) && notifications.length > 0
  const visible = hasNotifications ? notifications.slice(0, maxVisible) : []
  const remainder = hasNotifications ? Math.max(0, notifications.length - visible.length) : 0

  return (
    <div className="notif-panel" ref={ref} onPointerDown={e=>e.stopPropagation()} role="dialog" aria-label="Thông báo">
      <div className="notif-panel-header">
        <h4>Thông báo</h4>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          { hasNotifications && <button className="notif-markall" onClick={onMarkAllRead}>Đánh dấu đã đọc</button> }
          <button className="notif-close" aria-label="Đóng" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="notif-panel-body">
        { hasNotifications ? (
          visible.map((n, i) => (
            <div
              className={"notif-item" + (n.read ? ' read' : ' unread')}
              key={n.id || i}
            >
              <div
                className="notif-item-inner"
                role="button"
                tabIndex={0}
                onClick={()=> { onToggleRead(n); onItemClick(n) }}
                onKeyDown={(e)=>{ if (e.key === 'Enter' || e.key === ' ') { onToggleRead(n); onItemClick(n) } }}
              >
                <div className="notif-left">
                  <div className={`notif-cat ${n.type || ''}`}>{n.type ? n.type.toUpperCase() : 'TH'} </div>
                </div>
                <div className="notif-main">
                  <div className="notif-title">{n.title || 'Thông báo mới'}</div>
                  <div className="notif-meta">{n.time || n.date || ''}</div>
                  <div className="notif-body">{n.body || n.message || ''}</div>
                </div>
                <div className="notif-actions">
                  <button
                    className={"small-mark" + (n.read ? ' is-read' : '')}
                    onClick={(e)=>{ e.stopPropagation(); onToggleRead(n) }}
                    title={n.read ? 'Chuyển sang chưa đọc' : 'Đánh dấu là đã đọc'}
                  >{ n.read ? 'Chưa đọc' : 'Đánh dấu' }</button>
                  <button className="small-delete" onClick={(e)=>{ e.stopPropagation(); onDeleteNotification(n) }} title="Xóa thông báo">Xóa</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          hasLocalNotifications ? (
            <div className="notif-empty">
              <p>Không có thông báo nào.</p>
            </div>
          ) : (
            <div className="notif-empty">
              <p>Bạn cần đăng nhập để xem thông báo hoặc hiện tại chưa có thông báo.</p>
              { typeof onRequireLogin === 'function' && <button className="notif-login-btn" onClick={onRequireLogin}>Đăng nhập</button> }
            </div>
          )
        ) }
      </div>

      <div className="notif-panel-footer">
        <small className="notif-footer-note">Nhấn vào thông báo để xem chi tiết — <Link to="/user/notifications">Xem tất cả thông báo</Link>{ remainder > 0 ? ` (${remainder} thêm)` : '' }</small>
      </div>
    </div>
  )
}

export default NotificationPanel
