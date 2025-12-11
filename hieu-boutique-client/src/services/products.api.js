// In the browser `process` is undefined; Vite exposes env via `import.meta.env`.
// The client expects product APIs to live under the `/products` prefix on the
// backend (express router mounted at `/products/`). Allow users to set
// `VITE_API_URL` to the server root (e.g. http://localhost:3000) or directly
// to the products base (e.g. http://localhost:3000/products). Normalize here
// so callers can use paths like `/catalog/menu` safely.
const SERVER_ROOT = (import.meta.env.VITE_API_URL || "http://127.0.0.1:3000").replace(/\/$/, '')
const BASE_URL = SERVER_ROOT.endsWith('/products') ? SERVER_ROOT : `${SERVER_ROOT}/products`

// Helper to fetch JSON with graceful error handling
let backendAvailable = true
let _loggedBackendDown = false
async function fetchJson(path, opts){
    if (!backendAvailable) return null
    try{
        const full = `${BASE_URL}${path}`
        const res = await fetch(full, opts)
        if (!res.ok) {
            // server responded with non-2xx — log once as a warning
            console.warn('API error', res.status, res.statusText, full)
            return null
        }
        // On success, mark backend available
        backendAvailable = true
        _loggedBackendDown = false
        return await res.json()
    }catch(e){
        // network error / connection refused — mark backend unavailable and warn once
        backendAvailable = false
        if (!_loggedBackendDown) {
            console.warn('Backend appears unreachable:', `${BASE_URL}${path}`, e && e.message ? e.message : e)
            _loggedBackendDown = true
        }
        return null
    }
}

async function categoryAPI(category, filters){
    // filters: { priceMin, priceMax, discountMin, discountMax, colors, sizes, materials, collections }
    let qs = ''
    if (filters && Object.keys(filters).length){
        const parts = []
        if (typeof filters.priceMin !== 'undefined') parts.push(`priceMin=${encodeURIComponent(filters.priceMin)}`)
        if (typeof filters.priceMax !== 'undefined') parts.push(`priceMax=${encodeURIComponent(filters.priceMax)}`)
        if (typeof filters.discountMin !== 'undefined') parts.push(`discountMin=${encodeURIComponent(filters.discountMin)}`)
        if (typeof filters.discountMax !== 'undefined') parts.push(`discountMax=${encodeURIComponent(filters.discountMax)}`)
        if (filters.colors) parts.push(`colors=${encodeURIComponent(Array.isArray(filters.colors) ? filters.colors.join(',') : filters.colors)}`)
        if (filters.sizes) parts.push(`sizes=${encodeURIComponent(Array.isArray(filters.sizes) ? filters.sizes.join(',') : filters.sizes)}`)
        if (filters.materials) parts.push(`materials=${encodeURIComponent(Array.isArray(filters.materials) ? filters.materials.join(',') : filters.materials)}`)
        if (filters.collections) parts.push(`collections=${encodeURIComponent(Array.isArray(filters.collections) ? filters.collections.join(',') : filters.collections)}`)
        // pagination
        if (typeof filters.page !== 'undefined') parts.push(`page=${encodeURIComponent(filters.page)}`)
        if (typeof filters.limit !== 'undefined') parts.push(`limit=${encodeURIComponent(filters.limit)}`)
            if (parts.length) qs = `?${parts.join('&')}`
    }
    const resp = await fetchJson(`/category/${category}${qs}`)
    if (!resp) {
        // provide a local fallback when backend is unreachable
        const fallbackCount = 12
        const fallbackIds = Array.from({length: fallbackCount}).map((_,i)=> `fallback-${category || 'p'}-${i+1}`)
        if (filters && (typeof filters.page !== 'undefined' || typeof filters.limit !== 'undefined')){
            const page = Math.max(1, Number(filters.page) || 1)
            const limit = Math.max(1, Number(filters.limit) || 24)
            const skip = (page - 1) * limit
            const items = fallbackIds.slice(skip, skip + limit)
            const total = fallbackIds.length
            const totalPages = Math.max(1, Math.ceil(total / limit))
            return { status: 201, message: 'Fallback paged products', data: { page, limit, total, totalPages, items } }
        }
        return { status: 201, message: 'Fallback products', data: fallbackIds }
    }
    // If caller requested pagination (page/limit present in filters), return full server wrapper
    if (filters && (typeof filters.page !== 'undefined' || typeof filters.limit !== 'undefined')) return resp
    // Normalize older call sites that expect `res.data` to be an array of ids
    if (resp.data && resp.data.items) return { data: resp.data.items }
    return resp
}

    // helper: call category API with pagination
    async function categoryAPIPage(category, filters, page = 1, limit = 24){
        const f = Object.assign({}, filters || {})
        f.page = page
        f.limit = limit
        return await categoryAPI(category, f)
    }

async function productDetail(id){
    const resp = await fetchJson(`/product/${id}`)
    if (resp && resp.data) return resp
    // fallback: return a local sample product so UI can render when backend is down
    console.warn('productDetail: backend unreachable, using local fallback sample for id', id)
    const sample = {
        status: '200',
        message: 'Sample product (fallback)',
        data: {
            _id: id,
            title: 'Sample Áo Thun Basic - Fallback',
            img: ['/src/assets/imgs/common/logo.png','/src/assets/imgs/common/cart-icon.png','/src/assets/imgs/common/green-star.png'],
            colors: ['Đen','Trắng','Đỏ'],
            size: ['S','M','L','XL'],
            price: 199000,
            warehouse: 20,
            sold: 123,
            ratingAverage: 4.5,
            ratingCount: 12,
            longDescription: '<p>Đây là mô tả mẫu hiển thị khi backend không liên lạc được.</p><ul><li>Chất liệu: cotton</li><li>Form: ôm vừa</li></ul>'
        }
    }
    return sample
}

async function suggestListProduct(category, id){
    return (await fetchJson(`/suggest/${category}/${id}`)) || []
}

async function hotProductsList(){
    return (await fetchJson(`/hot-products`)) || []
}

async function searchProducts(keyword){
    return (await fetchJson(`/search/${encodeURIComponent(keyword)}`)) || []
}

async function collectionProducts(slug){
    return (await fetchJson(`/collection/${slug}`)) || []
}

async function collectionInfo(slug){
    return (await fetchJson(`/collection/info/${slug}`)) || null
}

async function fetchCatalog(){
    const resp = await fetchJson(`/catalog`)
    if (!resp || !resp.data) return { categories: [], collections: [] }
    return resp.data
}

async function fetchCatalogMenu(){
    const resp = await fetchJson(`/catalog/menu`)
    if (!resp || !resp.data) return []
    return resp.data
}

// update structured product details (size, colors, material, care)
async function updateProductDetails(id, payload){
    return await fetchJson(`/product/${id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
}

// purchase: decrement warehouse by quantity (server-side atomic)
async function purchaseProduct(id, quantity){
    const token = sessionStorage.getItem('token') || null
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return await fetchJson(`/product/${id}/purchase`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ quantity })
    })
}

export { categoryAPI, categoryAPIPage, productDetail, suggestListProduct, hotProductsList, searchProducts, collectionProducts, collectionInfo, updateProductDetails, purchaseProduct, fetchCatalog, fetchCatalogMenu };