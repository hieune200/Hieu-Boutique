
// Normalize server base so missing host/colon-only values won't produce invalid URLs in the browser
let SERVER_BASE = import.meta.env.VITE_SERVER_BASE || 'http://localhost:3000'
if (typeof SERVER_BASE === 'string') {
    const s = SERVER_BASE.trim()
    if (s === '') SERVER_BASE = 'http://localhost:3000'
    else if (s.startsWith(':')) SERVER_BASE = `http://localhost${s}`
    else if (s.startsWith('//')) SERVER_BASE = `http:${s}`
}
const url = `${SERVER_BASE}/auth`

async function registerAPI (data) {
    const res = await fetch(`${url}/register`, {
        method: "POST",
        headers:{"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .catch(err => console.log(err))
    return res
}

async function loginAPI (data){
    const res = await fetch(`${url}/login`, {
        method: "PUT",
        headers:{"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .catch(err => console.log(err))
    return res
}

async function getInfor (){
    const ObjectId = localStorage.getItem("userID") || sessionStorage.getItem("userID")
    try{
        const r = await fetch(`${url}/user/${ObjectId}`)
        if (!r) return { status: 500, message: 'No response from server' }
        const json = await r.json()
        return json
    } catch (err){
        console.error('getInfor error', err)
        return { status: 500, message: 'Network error' }
    }
}

async function updateInfor (data){
    const res = await fetch(`${url}/update`,{
        method: "PUT",
        headers:{"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .catch(err=> console.log(err))
    return res
}

async function checkoutAPI (data){
    const id = localStorage.getItem("userID") || sessionStorage.getItem("userID")
    const res = await fetch(`${url}/checkout/`,{
        method: "POST",
        headers:{
            "Content-Type": "application/json",
            "user-id": id
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .catch(err=> console.log(err))
    return res
}

async function getOrder (){
    const id = localStorage.getItem("userID") || sessionStorage.getItem("userID")
    const headers = {}
    if (id) headers['user-id'] = id
    const res = await fetch(`${url}/order/list/${id}`, { headers })
    .then(res => res.json())
    .catch(err=> console.log(err))
    return res
}

async function cancelOrderAPI(orderCode){
    const id = localStorage.getItem("userID") || sessionStorage.getItem("userID")
    const headers = { 'Content-Type': 'application/json' }
    if (id) headers['user-id'] = id
    try{
        const r = await fetch(`${url}/order/cancel`, { method: 'POST', headers, body: JSON.stringify({ orderCode }) })
        if (!r) return { status: 500, message: 'No response from server' }
        return await r.json()
    }catch(err){ console.error('cancelOrderAPI error', err); return { status: 500, message: 'Network error' } }
}

async function confirmReceivedAPI(orderCode){
    const id = localStorage.getItem("userID") || sessionStorage.getItem("userID")
    const headers = { 'Content-Type': 'application/json' }
    if (id) headers['user-id'] = id
    try{
        const r = await fetch(`${url}/order/confirm`, { method: 'POST', headers, body: JSON.stringify({ orderCode }) })
        if (!r) return { status: 500, message: 'No response from server' }
        return await r.json()
    }catch(err){ console.error('confirmReceivedAPI error', err); return { status: 500, message: 'Network error' } }
}

async function socialLoginAPI (data){
    try{
        const r = await fetch(`${url}/social`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!r) return { status: 500, message: 'No response from server' }
        // r.json() may return an object with status as string; normalize
        const json = await r.json()
        return json
    } catch (err){
        console.error('socialLoginAPI error', err)
        return { status: 500, message: 'Network error' }
    }
}

async function forgotPasswordRequest (data){
    try{
        const r = await fetch(`${url}/forgot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!r) return { status: 500, message: 'No response from server' }
        return await r.json()
    } catch (err){ console.error('forgotPasswordRequest error', err); return { status: 500, message: 'Network error' } }
}

async function resetPassword (data){
    try{
        const r = await fetch(`${url}/reset`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!r) return { status: 500, message: 'No response from server' }
        return await r.json()
    } catch (err){ console.error('resetPassword error', err); return { status: 500, message: 'Network error' } }
}

async function createSocialPlaceholderAPI (data){
    try{
        const r = await fetch(`${url}/social/placeholder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!r) return { status: 500, message: 'No response from server' }
        return await r.json()
    } catch (err){
        console.error('createSocialPlaceholderAPI error', err)
        return { status: 500, message: 'Network error' }
    }
}

export { registerAPI, loginAPI, getInfor, updateInfor, checkoutAPI, getOrder, cancelOrderAPI, confirmReceivedAPI, socialLoginAPI, createSocialPlaceholderAPI, forgotPasswordRequest, resetPassword };