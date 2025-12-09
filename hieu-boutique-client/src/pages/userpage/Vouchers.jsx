import { useState } from 'react'

const Vouchers = ({ userData }) => {
    const [vouchers] = useState(userData?.vouchers || [
        { code: 'WELCOME10', desc: 'Giảm 10% cho đơn hàng đầu', expire: '2026-01-01' }
    ])

    return (
        <div className="user-subpage vouchers">
            <h2>Kho Voucher</h2>
            <p>Danh sách voucher bạn đang sở hữu.</p>
            <ul className="vouchers-list">
                {vouchers.map(v=> (
                    <li key={v.code} className="voucher-item">
                        <div className="voucher-code">{v.code}</div>
                        <div className="voucher-desc">{v.desc}</div>
                        <div className="voucher-exp">Hạn: {v.expire}</div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default Vouchers
