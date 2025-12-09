import { useState } from 'react'

const Address = ({ userData, onUpdate }) => {
    const [addresses, setAddresses] = useState(userData?.addresses || [])
    const [newAddr, setNewAddr] = useState('')

    const add = (e)=>{
        e.preventDefault()
        if(!newAddr) return
        const next = [{ id: Date.now().toString(), text: newAddr }, ...addresses]
        setAddresses(next)
        onUpdate && onUpdate({ ...userData, addresses: next })
        setNewAddr('')
    }

    const remove = (id)=>{
        const next = addresses.filter(a=> a.id !== id)
        setAddresses(next)
        onUpdate && onUpdate({ ...userData, addresses: next })
    }

    return (
        <div className="user-subpage address">
            <h2>Địa Chỉ</h2>
            <p>Quản lý địa chỉ giao hàng của bạn.</p>
            <form onSubmit={add} className="address-form">
                <input placeholder="Thêm địa chỉ mới" value={newAddr} onChange={e=>setNewAddr(e.target.value)} />
                <button className="btn" type="submit">Thêm</button>
            </form>
            <ul className="address-list">
                {addresses.map(a=> (
                    <li key={a.id} className="address-item">
                        <div>{a.text}</div>
                        <button className="btn small" onClick={()=>remove(a.id)}>Xóa</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default Address
