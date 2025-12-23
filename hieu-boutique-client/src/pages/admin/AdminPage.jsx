import '/src/pages/admin/admin.scss'
import { useState, useEffect } from 'react'

export default function AdminPage(){
    const [editing, setEditing] = useState(null)
    const [categories, setCategories] = useState([])
    const [selectedCat, setSelectedCat] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [metrics, setMetrics] = useState(null)
    const [recentOrders, setRecentOrders] = useState([])
    const [usingFallback, setUsingFallback] = useState(false)

    const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.VITE_SERVER_BASE || 'http://localhost:3000')

    useEffect(()=>{
        let mounted = true
        async function load(){
            setLoading(true)
            try{
                const res = await fetch(`${API_BASE}/products/catalog`)
                if (!res.ok) throw new Error('catalog fetch failed')
                const data = await res.json()
                if (!mounted) return
                // expect { categories: [...], collections: [...] } or similar
                setCategories(Array.isArray(data) ? data : (data.categories || data.menu || []))
                // pick first category
                const first = (Array.isArray(data) && data.length) ? data[0] : (data.categories && data.categories[0])
                if (first) setSelectedCat(first.slug || first.id || first.name)
            }catch(err){
                console.warn('load catalog failed', err)
                setCategories([])
            }finally{ if (mounted) setLoading(false) }
        }
        load()
        return ()=>{ mounted = false }
    },[])

    useEffect(()=>{
        if (!selectedCat) return
        let mounted = true
        async function loadProducts(){
            setLoading(true)
            try{
                const res = await fetch(`${API_BASE}/products/category/${encodeURIComponent(selectedCat)}`)
                if (!res.ok) throw new Error('product fetch failed')
                const data = await res.json()
                if (!mounted) return
                setProducts(Array.isArray(data) ? data : (data.data || []))
            }catch(err){
                console.warn('load products failed', err)
                setProducts([])
            }finally{ if (mounted) setLoading(false) }
        }
        loadProducts()
        return ()=>{ mounted = false }
    },[selectedCat])

    // fetch admin metrics and recent orders
    useEffect(()=>{
        let mounted = true
        async function loadMetrics(){
                try{
                const base = API_BASE
                const url = `${base}/auth/admin/metrics`
                const r = await fetch(url, { credentials: 'include' })
                if (r.ok){
                    const j = await r.json()
                    if (!mounted) return
                    setMetrics(j.data || null)
                    return
                }
                // on any non-ok response, try the public fallback so UI shows DB numbers
                try{ await fallbackMetrics() }catch(e){ console.warn('fallbackMetrics failed', e) }
                return
            }catch(e){ console.warn('load metrics failed', e); try{ await fallbackMetrics() }catch(err){ console.warn('fallbackMetrics failed', err) } }
        }
        async function loadRecent(){
                try{
                const base = API_BASE
                const url = `${base}/auth/admin/recent-orders`
                const r = await fetch(url, { credentials: 'include' })
                if (r.ok){
                    const j = await r.json()
                    if (!mounted) return
                    setRecentOrders(Array.isArray(j.data) ? j.data : [])
                    return
                }
                // on any non-ok response, try the public fallback for recent orders
                try{ await fallbackRecent() }catch(e){ console.warn('fallbackRecent failed', e) }
                return
            }catch(e){ console.warn('load recent orders failed', e); try{ await fallbackRecent() }catch(err){ console.warn('fallbackRecent failed', err) } }
        }
        
        // fallback implementations using public endpoints
        async function fallbackMetrics(){
            try{
                // fetch guest orders (public)
                const gResp = await fetch(`${API_BASE}/auth/guest-orders`)
                const gJson = gResp.ok ? await gResp.json() : null
                const guestOrders = Array.isArray(gJson && gJson.data) ? gJson.data : (Array.isArray(gJson) ? gJson : [])

                // collect products by fetching each category
                const prods = []
                try{
                    const catResp = await fetch(`${API_BASE}/products/catalog`)
                    const catJson = catResp.ok ? await catResp.json() : null
                    const cats = Array.isArray(catJson) ? catJson : (catJson && (catJson.categories||catJson.menu) ? (catJson.categories||catJson.menu) : [])
                    for (const c of cats){
                        try{
                            const r = await fetch(`${API_BASE}/products/category/${encodeURIComponent(c.slug||c.id||c.name)}`)
                            if (!r.ok) continue
                            const j = await r.json()
                            const list = Array.isArray(j) ? j : (j && j.data ? j.data : [])
                            prods.push(...list)
                        }catch(e){ continue }
                    }
                }catch(e){ /* ignore */ }

                const normalizeTotal = (o)=>{
                    if (!o) return 0
                    if (typeof o.totalPrice === 'number') return Number(o.totalPrice)
                    if (typeof o.total === 'number') return Number(o.total)
                    if (Array.isArray(o.orderList) && o.orderList.length){
                        return o.orderList.reduce((s,it)=>s + ((Number(it.price||it.unitPrice||it.gia||0) || 0) * (Number(it.quantity)||0)),0)
                    }
                    return 0
                }

                let totalOrders = 0
                let totalRevenue = 0
                const revenueMap = {}
                for (let i=0;i<30;i++){ const dt = new Date(); dt.setDate(dt.getDate() - (29-i)); revenueMap[dt.toISOString().slice(0,10)] = 0 }

                for (const g of guestOrders){
                    const ord = g.order || g
                    const t = normalizeTotal(ord)
                    const status = (ord && (ord.orderStatus || ord.status)) || 'new'
                    // only include completed orders in totals and revenueByDay
                    if (String(status).toLowerCase() === 'completed'){
                        totalOrders += 1
                        totalRevenue += t
                        const key = (g.createdAt ? new Date(g.createdAt) : (ord.createdAt ? new Date(ord.createdAt) : new Date())).toISOString().slice(0,10)
                        if (key in revenueMap) revenueMap[key] += t
                    }
                }

                const revenueByDay = Object.keys(revenueMap).map(k=>({ date: k, total: revenueMap[k] }))

                const topProducts = (prods || []).slice().sort((a,b)=> (Number(b.sold||b.soluong||0) - Number(a.sold||a.soluong||0)) ).slice(0,10).map(p=>({ id: p._id||p.id, title: p.title||p.name||p.tensp||p.masanpham, sold: p.sold||p.soluong||0, price: p.price||p.gia||0, img: Array.isArray(p.img)?p.img[0]:p.img }))

                // top customers by guest email
                const custMap = {}
                for (const g of guestOrders){
                    const ord = g.order || g
                    const email = (ord.shipping && ord.shipping.email) || ord.email || 'guest'
                    const status = (ord && (ord.orderStatus || ord.status)) || 'new'
                    custMap[email] = custMap[email] || { email, orders:0, spent:0 }
                    // count only completed orders toward customer orders/spent
                    if (String(status).toLowerCase() === 'completed'){
                        custMap[email].orders += 1
                        custMap[email].spent += normalizeTotal(ord)
                    }
                }
                const topCustomers = Object.values(custMap).sort((a,b)=>b.spent - a.spent).slice(0,10)

                setMetrics({ totalProducts: (prods||[]).length, totalOrders, totalRevenue, revenueByDay, avgOrderValue: totalOrders?Math.round(totalRevenue/totalOrders):0, ordersByStatus: {}, topProducts, topCustomers })
                setUsingFallback(true)
            }catch(e){ console.warn('fallbackMetrics error', e) }
        }

        async function fallbackRecent(){
            try{
                const gResp = await fetch(`${API_BASE}/auth/guest-orders`)
                const gJson = gResp.ok ? await gResp.json() : null
                const guestOrders = Array.isArray(gJson && gJson.data) ? gJson.data : (Array.isArray(gJson) ? gJson : [])
                const recent = guestOrders.map(g=>{
                    const ord = g.order || g
                    const total = Array.isArray(ord.orderList)? ord.orderList.reduce((s,it)=>s + ((Number(it.price||it.unitPrice||it.gia||0)||0) * (Number(it.quantity)||0)),0) : (typeof ord.totalPrice==='number'?ord.totalPrice:0)
                    return { source:'guest', orderCode: ord.orderCode||ord.code||null, customer: ord.shipping?.name||ord.name||'Khách vãng lai', email: ord.shipping?.email||ord.email||null, createdAt: g.createdAt||ord.createdAt||new Date(), status: ord.orderStatus||ord.status||'new', total }
                }).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)).slice(0,50)
                setRecentOrders(recent)
                setUsingFallback(true)
            }catch(e){ console.warn('fallbackRecent error', e) }
        }
        loadMetrics(); loadRecent()
        return ()=>{ mounted = false }
    },[])

    return (
        <div className="admin-root">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <h3>Bảng quản trị</h3>
                    <div className="muted">Hieu Boutique</div>
                </div>
                <nav>
                    <ul>
                        <li className="active">Tổng quan</li>
                        <li>Sản phẩm</li>
                        <li>Đơn hàng</li>
                        <li>Khách hàng</li>
                        <li>Báo cáo</li>
                    </ul>
                </nav>
                <div style={{marginTop:20}}>
                    <h4 style={{color:'var(--muted)'}}>Danh mục</h4>
                    <ul style={{listStyle:'none',padding:0,marginTop:8}}>
                        {categories && categories.length ? categories.map(c => (
                            <li key={c.slug || c.id || c.name} onClick={()=>setSelectedCat(c.slug || c.id || c.name)} style={{padding:'8px 6px',cursor:'pointer',borderRadius:6,background:(String(selectedCat) === String(c.slug || c.id || c.name) ? 'rgba(0,0,0,0.06)' : 'transparent')}}>
                                {c.name || c.title || c.slug}
                            </li>
                        )) : <li className="muted">No categories</li>}
                    </ul>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-top">
                    <input className="admin-search" placeholder="Search..." />
                    <div className="admin-icons">🔔 🛒 👤</div>
                </header>

                {/* Fallback notice removed: admin login supplies full data, no banner shown */}

                <section className="admin-metrics">
                    <div className="card">
                        <div className="card-title">Tổng sản phẩm</div>
                        <div className="card-value">{metrics ? metrics.totalProducts : products.length}</div>
                    </div>
                    <div className="card">
                        <div className="card-title">Tổng đơn hàng</div>
                        <div className="card-value">{metrics ? metrics.totalOrders : '—'}</div>
                    </div>
                    <div className="card">
                        <div className="card-title">Tổng doanh thu</div>
                        <div className="card-value">{metrics ? (Number(metrics.totalRevenue||0).toLocaleString('vi-VN') + '₫') : '—'}</div>
                    </div>
                    <div className="card">
                        <div className="card-title">Tăng trưởng</div>
                        <div className="card-value">{metrics ? (()=>{
                            // simple growth: compare last day vs previous day
                            const rb = metrics.revenueByDay || []
                            if (rb.length < 2) return '—'
                            const last = rb[rb.length-1].total || 0
                            const prev = rb[rb.length-2].total || 0
                            const diff = prev === 0 ? 0 : ((last - prev) / (prev || 1) * 100)
                            return (diff >= 0 ? '+' : '') + Math.round(diff) + '%'
                        })() : '—'}</div>
                    </div>
                </section>

                <section className="admin-content">
                    <div className="left-col">
                        <div className="panel panel-chart">
                            <h4>Doanh thu</h4>
                                <div className="chart-placeholder">
                                    {metrics && Array.isArray(metrics.revenueByDay) ? (
                                        <div style={{width:'100%'}}>
                                            <div style={{fontSize:12,color:'#6b7280',marginBottom:8}}>Doanh thu (30 ngày)</div>
                                            <div className="sparkline">
                                                {metrics.revenueByDay.map((d,i)=>{
                                                    const vals = metrics.revenueByDay.map(x=>x.total||0)
                                                    const max = Math.max(...vals,1)
                                                    const h = Math.round(((d.total||0)/max) * 100)
                                                    return <div key={d.date} className="bar" style={{height: `${Math.max(6,h)}%`}} title={`${d.date}: ${Number(d.total||0).toLocaleString('vi-VN')}₫`} />
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="muted">Không có dữ liệu doanh thu</div>
                                    )}
                                </div>
                        </div>

                        <div className="panel panel-table">
                            <h4>Danh sách sản phẩm {selectedCat ? ` — ${selectedCat}` : ''}</h4>
                            <table className="table">
                                <thead><tr><th>Hình</th><th>SKU</th><th> Tên</th><th>Nhà cung cấp</th><th>Giá</th><th>Tồn kho</th><th>Hành động</th></tr></thead>
                                <tbody>
                                    {(products && products.length) ? products.map(p => (
                                        <tr key={p._id || p.id || p.masanpham}>
                                            <td><div className="thumb" style={{backgroundImage: p.img && p.img.length ? `url(${Array.isArray(p.img)?p.img[0]:p.img})` : 'none', backgroundSize:'cover'}}/></td>
                                            <td style={{fontWeight:700}}>{p.sku || p.masanpham || ''}</td>
                                            <td>{p.title || p.name || p.tensp || p.masanpham}</td>
                                            <td>{p.supplier || '-'}</td>
                                            <td>{p.price || p.gia || (p.unitPrice ? p.unitPrice + '₫' : '')}</td>
                                            <td>{p.warehouse || p.stock || p.soluong || '-'}</td>
                                            <td>
                                                <button className="link" onClick={()=>setEditing(p)}>Sửa</button>
                                                <button className="link">Xóa</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="muted">Không có sản phẩm</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="right-col">
                        <div className="panel panel-top-products">
                            <h4>Sản phẩm bán chạy</h4>
                            <ul style={{listStyle:'none',padding:0,margin:0}}>
                                {metrics && metrics.topProducts && metrics.topProducts.length ? metrics.topProducts.map(p=> (
                                    <li key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 6px',borderBottom:'1px solid #f3f4f6'}}>
                                        <div style={{width:46,height:46,backgroundImage: p.img?`url(${p.img})`:'none',backgroundSize:'cover',borderRadius:6}} />
                                        <div style={{flex:1}}><div style={{fontWeight:700}}>{p.title}</div><div style={{fontSize:12,color:'#6b7280'}}>{(p.sold||0)+' bán'}</div></div>
                                        <div style={{fontWeight:700}}>{p.price? Number(p.price).toLocaleString('vi-VN')+'₫' : '—'}</div>
                                    </li>
                                )) : <li className="muted" style={{padding:8}}>Không có dữ liệu</li>}
                            </ul>
                        </div>

                        <div className="panel panel-top-customers">
                            <h4>Khách hàng hàng đầu</h4>
                            <ul style={{listStyle:'none',padding:0,margin:0}}>
                                {metrics && metrics.topCustomers && metrics.topCustomers.length ? metrics.topCustomers.map(c=> (
                                    <li key={c.username+c.email} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 6px',borderBottom:'1px solid #f3f4f6'}}>
                                        <div style={{flex:1}}><div style={{fontWeight:700}}>{c.username}</div><div style={{fontSize:12,color:'#6b7280'}}>{c.email || '—'}</div></div>
                                        <div style={{textAlign:'right'}}><div>{c.orders} đơn</div><div style={{fontWeight:700}}>{Number(c.spent||0).toLocaleString('vi-VN')}₫</div></div>
                                    </li>
                                )) : <li className="muted" style={{padding:8}}>Không có dữ liệu</li>}
                            </ul>
                        </div>
                        <div className="panel panel-orders">
                            <h4>Đơn hàng</h4>
                            <table className="table">
                                <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày</th><th>Thanh toán</th><th>Vận chuyển</th><th>Trạng thái</th><th style={{textAlign:'right'}}>Tổng</th></tr></thead>
                                <tbody>
                                    {recentOrders && recentOrders.length ? recentOrders.map(o => (
                                        <tr key={(o.orderCode||Math.random())+String(o.createdAt)}>
                                            <td>{o.orderCode || '—'}</td>
                                            <td>{o.customer || '—'}</td>
                                            <td>{o.createdAt ? (new Date(o.createdAt)).toLocaleString() : '—'}</td>
                                            <td>{o.paymentMethod || (o.data && o.data.paymentMethod) || '—'}</td>
                                            <td>{o.trackingNumber || (o.data && o.data.trackingNumber) || '—'}</td>
                                            <td><span className={`status ${o.status||'new'}`}>{o.status || 'new'}</span></td>
                                            <td style={{textAlign:'right'}}>{o.total ? Number(o.total).toLocaleString('vi-VN') + '₫' : '—'}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="muted">Không có đơn hàng</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="panel panel-edit">
                            <h4>{editing ? 'Chỉnh sửa sản phẩm' : 'Thêm / Chỉnh sửa sản phẩm'}</h4>
                            <div className="form-row">
                                <label>SKU / Mã hàng</label>
                                <input defaultValue={editing?.sku || editing?.masanpham || ''} style={{padding:12,fontSize:16}} />
                            </div>
                            <div className="form-row">
                                <label>Tên sản phẩm</label>
                                <input defaultValue={editing?.title || editing?.name || ''} style={{padding:12,fontSize:16}} />
                            </div>
                            <div className="form-row">
                                <label>Nhà cung cấp</label>
                                <input defaultValue={editing?.supplier || ''} style={{padding:12,fontSize:16}} />
                            </div>
                            <div className="form-row two">
                                <div>
                                    <label>Giá</label>
                                    <input defaultValue={editing?.price || ''} style={{padding:12,fontSize:16}} />
                                </div>
                                <div>
                                    <label>Giá vốn</label>
                                    <input defaultValue={editing?.costPrice || ''} style={{padding:12,fontSize:16}} />
                                </div>
                            </div>
                            <div className="form-row two">
                                <div>
                                    <label>Lợi nhuận (%)</label>
                                    <input defaultValue={editing?.margin || ''} style={{padding:12,fontSize:16}} />
                                </div>
                                <div>
                                    <label>Tồn kho</label>
                                    <input defaultValue={editing?.warehouse || editing?.stock || ''} style={{padding:12,fontSize:16}} />
                                </div>
                            </div>
                            <div className="form-row">
                                <label>Tags (phân cách bằng dấu phẩy)</label>
                                <input defaultValue={Array.isArray(editing?.tags)?editing.tags.join(', '):(editing?.tags||'')} style={{padding:12,fontSize:16}} />
                            </div>
                            <div className="form-row">
                                <label>Kích thước (W x H x D)</label>
                                <input defaultValue={editing?.dimensions?`${editing.dimensions.width||''} x ${editing.dimensions.height||''} x ${editing.dimensions.depth||''}` : ''} style={{padding:12,fontSize:16}} />
                            </div>
                            <div className="form-row">
                                <label>Mô tả</label>
                                <textarea defaultValue={editing?.description||''} rows={6} style={{width:'100%',padding:12,fontSize:15,borderRadius:8}} />
                            </div>
                            <div className="form-row two" style={{alignItems:'center'}}>
                                <div>
                                    <label>Trạng thái</label>
                                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                        <label><input type="checkbox" defaultChecked={typeof editing?.active === 'undefined' ? true : !!editing.active} /> Hoạt động</label>
                                        <label><input type="checkbox" defaultChecked={!!editing?.featured} /> Nổi bật</label>
                                    </div>
                                </div>
                                <div>
                                    <label>Khối lượng (kg)</label>
                                    <input defaultValue={editing?.weight || ''} style={{padding:12,fontSize:16}} />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button className="btn muted" onClick={()=>setEditing(null)}>Hủy</button>
                                <button className="btn primary" onClick={async ()=>{
                                    // gather inputs from panel
                                    const panel = document.querySelector('.panel.panel-edit')
                                    if (!panel) return
                                    const sku = panel.querySelector('input[defaultValue]')?.value || ''
                                    const inputs = panel.querySelectorAll('input')
                                    const vals = {}
                                    // heuristic: map by label text
                                    try{
                                        const skuVal = panel.querySelector('input[defaultValue]')?.value
                                    }catch(e){}
                                    const title = panel.querySelector('input[placeholder], input[defaultValue]')?.value || ''
                                    // better: select by order of inputs used above
                                    const allInputs = Array.from(panel.querySelectorAll('input'))
                                    const getByIndex = (i)=> allInputs[i] ? allInputs[i].value : undefined

                                    const payload = {}
                                    // index mapping based on layout: 0 sku,1 title,2 supplier,3 price,4 costPrice,5 margin,6 warehouse,7 tags,8 dimensions,9 weight, checkboxes at later
                                    payload.sku = getByIndex(0)
                                    payload.title = getByIndex(1)
                                    payload.supplier = getByIndex(2)
                                    payload.price = Number(getByIndex(3) || 0)
                                    payload.costPrice = Number(getByIndex(4) || 0)
                                    payload.margin = Number(getByIndex(5) || 0)
                                    // warehouse might be string
                                    payload.warehouse = Number(getByIndex(6) || 0)
                                    const tagsRaw = getByIndex(7) || ''
                                    payload.tags = tagsRaw.split(',').map(s=>s.trim()).filter(Boolean)
                                    const dimsRaw = getByIndex(8) || ''
                                    const parts = dimsRaw.split('x').map(s=>s.trim())
                                    payload.dimensions = { width: parts[0]||null, height: parts[1]||null, depth: parts[2]||null }
                                    payload.weight = Number(getByIndex(9) || 0)
                                    const checkboxes = Array.from(panel.querySelectorAll('input[type=checkbox]'))
                                    if (checkboxes[0]) payload.active = checkboxes[0].checked
                                    if (checkboxes[1]) payload.featured = checkboxes[1].checked

                                    // description textarea
                                    const ta = panel.querySelector('textarea')
                                    if (ta) payload.description = ta.value

                                    // send PATCH to update details
                                    if (editing && (editing._id || editing.id)){
                                        const id = editing._id || editing.id || editing.masanpham
                                        try{
                                            const r = await fetch(`${API_BASE}/products/product/${encodeURIComponent(id)}/details`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                credentials: 'include',
                                                body: JSON.stringify(payload)
                                            })
                                            if (r.ok){
                                                const j = await r.json()
                                                alert('Lưu thành công')
                                                setEditing(null)
                                                // refresh products
                                                setSelectedCat(selectedCat)
                                            } else {
                                                const j = await r.json().catch(()=>({}))
                                                alert('Lưu thất bại: ' + (j.message || r.statusText))
                                            }
                                        }catch(e){ console.error(e); alert('Lỗi khi lưu') }
                                    } else {
                                        alert('Tạo sản phẩm mới chưa được hỗ trợ qua UI (cần admin token)')
                                    }
                                }}>Lưu</button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="admin-summary-row" style={{display:'flex',gap:12,marginBottom:18}}>
                    <div className="card" style={{flex:1}}>
                        <div className="card-title">Giá trị trung bình đơn</div>
                        <div className="card-value">{metrics ? (Number(metrics.avgOrderValue||0).toLocaleString('vi-VN') + '₫') : '—'}</div>
                    </div>
                    <div className="card" style={{flex:1}}>
                        <div className="card-title">Đơn theo trạng thái</div>
                        <div className="card-value" style={{fontSize:14}}>
                            {metrics ? Object.entries(metrics.ordersByStatus||{}).map(([k,v])=> (<div key={k} style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#6b7280'}}>{k}</span><strong>{v}</strong></div>)) : '—'}
                        </div>
                    </div>
                </section>

            </main>
        </div>
    )
}
