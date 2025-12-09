import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './adminStyle.scss'

const EditHighlight = ()=>{
    const { id } = useParams()
    const nav = useNavigate()
    const [loading, setLoading] = useState(true)
    const [product, setProduct] = useState(null)
    const [items, setItems] = useState([])
    const [description, setDescription] = useState('')
    const [sizesStr, setSizesStr] = useState('')
    const [material, setMaterial] = useState('')
    const [colorsStr, setColorsStr] = useState('')
    const [care, setCare] = useState('')
    const [message, setMessage] = useState('')

    useEffect(()=>{
        if (!id) return
        (async ()=>{
            setLoading(true)
            try{
                const res = await fetch(`/products/product/${id}`)
                const json = await res.json()
                const prod = json.data || {}
                setProduct(prod)
                setDescription(prod.description || '')
                    setSizesStr(Array.isArray(prod.size) ? prod.size.join(', ') : (prod.size || ''))
                    setMaterial(prod.material || prod.materials || '')
                    setColorsStr(Array.isArray(prod.colors) ? prod.colors.join(', ') : (prod.colors || prod.color || ''))
                    setCare(prod.care || '')
                if (Array.isArray(prod.highlights) && prod.highlights.length) setItems(prod.highlights)
                else if (prod.highlight) setItems([prod.highlight])
                else setItems([{ title: '', text: '' }])
            }catch(err){
                console.error(err)
            }finally{setLoading(false)}
        })()
    },[id])

    const updateItem = (idx, field, value)=>{
        const copy = [...items]
        copy[idx] = {...copy[idx], [field]: value}
        setItems(copy)
    }
    const addItem = ()=> setItems(prev => ([...prev, { title: '', text: '' }]))
    const removeItem = (idx)=> setItems(prev => prev.filter((_,i)=> i!==idx))

    const handleSave = async ()=>{
        setMessage('')
        try{
            // include description in payload when present
            const base = items.length > 1 ? { highlights: items } : { highlight: items[0] }
            const payload = { ...base, description }
            const res = await fetch(`/products/product/${id}/highlight`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            })
            const json = await res.json()
            if (json.status && String(json.status).startsWith('2')){
                setMessage('Lưu thành công')
                setProduct(json.data)
            } else {
                setMessage(json.message || 'Lỗi khi lưu')
            }
        }catch(err){
            console.error(err)
            setMessage('Lỗi khi lưu')
        }
    }

    const handleSaveDetails = async ()=>{
        setMessage('')
        try{
            const payload = {
                size: sizesStr,
                material,
                colors: colorsStr,
                care
            }
            const res = await fetch(`/products/product/${id}/details`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            })
            const json = await res.json()
            if (json.status && String(json.status).startsWith('2')){
                setMessage('Lưu chi tiết thành công')
                setProduct(json.data)
            } else {
                setMessage(json.message || 'Lỗi khi lưu chi tiết')
            }
        }catch(err){
            console.error(err)
            setMessage('Lỗi khi lưu chi tiết')
        }
    }

    if (loading) return <div style={{padding:20}}>Đang tải...</div>

    return (
        <main className="admin-edit-highlight" style={{padding:20}}>
            <button onClick={()=> nav(-1)} style={{marginBottom:12}}>← Quay lại</button>
            <h2>Chỉnh đặc điểm nổi bật cho sản phẩm</h2>
            <h3 style={{fontSize:16, marginTop:6}}>{product?.title}</h3>
            <div style={{marginTop:12}}>
                <label style={{display:'block', marginBottom:6}}>Mô tả chi tiết sản phẩm (description):</label>
                <textarea value={description} onChange={e=> setDescription(e.target.value)} placeholder="Mô tả chi tiết, có thể dài nhiều câu" style={{width:'100%', minHeight:120}} />
            </div>
            <div style={{marginTop:12, borderTop: '1px solid #eee', paddingTop:12}}>
                <h4>Chi tiết cấu trúc (Size / Material / Color / Care)</h4>
                <div style={{marginTop:8}}>
                    <label>Size (phân cách bằng dấu phẩy):</label>
                    <input value={sizesStr} onChange={e=> setSizesStr(e.target.value)} placeholder="S, M, L, XL" style={{width:'100%'}} />
                </div>
                <div style={{marginTop:8}}>
                    <label>Chất liệu (material):</label>
                    <input value={material} onChange={e=> setMaterial(e.target.value)} placeholder="Cotton 100%" style={{width:'100%'}} />
                </div>
                <div style={{marginTop:8}}>
                    <label>Màu sắc (phân cách bằng dấu phẩy):</label>
                    <input value={colorsStr} onChange={e=> setColorsStr(e.target.value)} placeholder="Đỏ, Đen, Trắng" style={{width:'100%'}} />
                </div>
                <div style={{marginTop:8}}>
                    <label>Cách sử dụng & Bảo quản (care):</label>
                    <textarea value={care} onChange={e=> setCare(e.target.value)} placeholder="Giặt tay, không tẩy, phơi nơi thoáng" style={{width:'100%', minHeight:80}} />
                </div>
                <div style={{marginTop:8}}>
                    <button onClick={handleSaveDetails}>Lưu chi tiết</button>
                </div>
            </div>
            <div className="items">
                {items.map((it, idx)=> (
                    <div className="item" key={idx}>
                        <input placeholder="Tiêu đề (ví dụ: PHOM DÁNG)" value={it.title} onChange={e=> updateItem(idx,'title', e.target.value)} />
                        <textarea placeholder="Mô tả ngắn" value={it.text} onChange={e=> updateItem(idx,'text', e.target.value)} />
                        <div className="controls">
                            <button onClick={()=> removeItem(idx)} disabled={items.length<=1}>Xóa</button>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{marginTop:12}}>
                <button onClick={addItem}>Thêm đặc điểm</button>
                <button onClick={handleSave} style={{marginLeft:10}}>Lưu</button>
                {message && <span style={{marginLeft:12}}>{message}</span>}
            </div>
        </main>
    )
}

export default EditHighlight
