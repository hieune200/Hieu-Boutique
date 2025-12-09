import { useState } from 'react'

const Notifications = ({ userData }) => {
    const [notifications] = useState(userData?.notifications || [
        { id: '1', text: 'Đơn hàng #123 đã được giao', date: '2025-11-01' },
        { id: '2', text: 'Mã giảm giá mới: HIEU10', date: '2025-10-21' }
    ])

    return (
        <div className="user-subpage notifications">
            <h2>Thông báo</h2>
            <ul className="notifications-list">
                {notifications.map(n=> (
                    <li key={n.id} className="notification-item">
                        <div className="notif-text">{n.text}</div>
                        <div className="notif-date">{n.date}</div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default Notifications
