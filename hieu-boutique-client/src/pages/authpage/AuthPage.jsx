
import { useState, useContext } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import { globalContext } from "../../context/globalContext";
import { useToast } from '../../components/ToastProvider'
import TermsModal from '../../components/TermsModal'
import { registerAPI, loginAPI } from "../../services/Auth.api";

import './authpage.scss'
import fbLogo from '../../assets/imgs/common/fb-color.svg'
import insLogo from '../../assets/imgs/common/ins-color.svg'
import googleLogo from '../../assets/imgs/common/google-color.svg'
import ForgotPasswordModal from '../../components/ForgotPasswordModal'
import logoImg from '../../assets/imgs/common/logo.png'
// socialLoginAPI kept for direct API use if needed

const LoginPage = () => {
    const nav = useNavigate()
    
    const location = useLocation()
    const { getUserID } = useContext(globalContext)
    const { showToast } = useToast()
    const [loginData, setLoginData] = useState({
        username: "",
        password: "",
        remember: false,
        loading: false
    })
    async function login() {
        let response = await loginAPI({ username: loginData.username, password: loginData.password })
        showToast(response.message || 'Đã đăng nhập', response.status == 201 ? 'success' : 'error')
        if (response.status == 201) {
            // Persist according to "remember" checkbox
            const storage = loginData.remember ? localStorage : sessionStorage
            // write to chosen storage
            try{ storage.setItem('userID', response.ObjectId) }catch(e){ console.warn('setItem userID failed', e) }
            if (response.token) try{ storage.setItem('token', response.token) }catch(e){ console.warn('setItem token failed', e) }
            // cleanup the other storage so there is single source of truth
            try{ if (loginData.remember){ sessionStorage.removeItem('userID'); sessionStorage.removeItem('token') } else { localStorage.removeItem('userID'); localStorage.removeItem('token') } }catch(e){ console.warn(e) }
            getUserID()
            // redirect back to requested page if provided
            const params = new URLSearchParams(location.search)
            const next = params.get('next')
            nav(next || '/')
            return
        }
        setLoginData({...loginData, "loading": false})
    }

    const [showForgot, setShowForgot] = useState(false)

    const handleSocial = async (provider) => {
        try {
            // Open provider login popup first; only after successful provider auth
            // (the server's callback will postMessage token back) do we navigate
            let serverBase = import.meta.env.VITE_SERVER_BASE || 'http://localhost:3000'
            if (typeof serverBase === 'string'){
                const s = serverBase.trim()
                if (!s) serverBase = 'http://localhost:3000'
                else if (s.startsWith(':')) serverBase = `http://localhost${s}`
                else if (s.startsWith('//')) serverBase = `http:${s}`
            }
            const popup = window.open(`${serverBase}/auth/oauth/${provider}`, 'oauth', 'width=600,height=700')
            if (!popup) { showToast('Không thể mở cửa sổ đăng nhập. Vui lòng cho phép popup.', 'error'); return }

            const messageHandler = async (e) => {
                try {
                    const data = e.data || {}
                    // Expect profile object: { provider, providerId, name, email, avatar }
                    if (data && data.provider && data.providerId) {
                        // Ask user for confirmation before linking
                        const display = data.name || data.email || data.providerId
                        const ok = window.confirm(`Xác nhận: đây có phải tài khoản bạn muốn dùng? ${display}\n\nNhấn OK để liên kết tài khoản ${data.provider} với trang.`)
                        if (!ok) {
                            window.removeEventListener('message', messageHandler)
                            try { popup.close() } catch (err) { console.warn('popup close failed', err) }
                            return
                        }

                        // User confirmed; call server to create/find account and issue token
                        const payload = {
                            provider: data.provider,
                            providerId: data.providerId,
                            email: data.email,
                            name: data.name,
                            avatar: data.avatar
                        }
                        const resp = await (await import('../../services/Auth.api')).socialLoginAPI(payload)
                        if (resp && (resp.token || resp.ObjectId)){
                            // store social login result according to remember checkbox state
                            const storage = loginData.remember ? localStorage : sessionStorage
                            if (resp.token) try{ storage.setItem('token', resp.token) }catch(e){ console.warn(e) }
                            if (resp.ObjectId) try{ storage.setItem('userID', resp.ObjectId) }catch(e){ console.warn(e) }
                            if (data.name) try{ storage.setItem('social_name', data.name) }catch(e){ console.warn(e) }
                            if (data.email) try{ storage.setItem('social_email', data.email) }catch(e){ console.warn(e) }
                            if (data.avatar) try{ storage.setItem('social_avatar', data.avatar) }catch(e){ console.warn(e) }
                            // clear opposite storage
                            try{ if (loginData.remember){ sessionStorage.removeItem('token'); sessionStorage.removeItem('userID') } else { localStorage.removeItem('token'); localStorage.removeItem('userID') } }catch(e){ console.warn(e) }
                            getUserID()
                            window.removeEventListener('message', messageHandler)
                            try { popup.close() } catch (err) { console.warn('popup close failed', err) }
                            nav('/user/profile')
                            return
                        }
                        showToast('Liên kết tài khoản thất bại. Vui lòng thử lại.', 'error')
                        window.removeEventListener('message', messageHandler)
                        try { popup.close() } catch (err) { console.warn('popup close failed', err) }
                    }
                } catch (err) { console.error(err) }
            }
            window.addEventListener('message', messageHandler, false)

            const checkInterval = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkInterval)
                    window.removeEventListener('message', messageHandler)
                }
            }, 500)
        } catch (err) { console.error(err); showToast('Đăng nhập xã hội thất bại','error') }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoginData({...loginData, "loading": true})
        login()
    }

    const handleLoginData = (type,data) => {
        if (type == "username") setLoginData({...loginData, "username": data})
        if (type == "password") setLoginData({...loginData, "password": data})
        if (type == "remember") setLoginData({...loginData, "remember": data})
    } 
    if (loginData.loading){
        return(
            <div className="contain-auth">
                <div>Đang đăng nhập...</div>
            </div>
        )
    }
    return(
        <div className="contain-auth">
            <Link to="/" className="auth-logo" aria-label="Hieu Boutique">
                <img src={logoImg} alt="Hieu Boutique" />
            </Link>
            <div className="auth-hero">
                <div className="welcome-msg">
                    <h2>Chào mừng bạn trở lại Hieu Boutique</h2>
                    <p>Đăng nhập để khám phá phong cách của riêng bạn.</p>
                </div>
            </div>
            <form className="login"onSubmit={(e)=>handleSubmit(e)}>
                <label htmlFor="username">Tên đăng nhập:</label>
                <input type="text" name="username" id="username" placeholder="nguyenvinhhieu" onChange={(e)=>handleLoginData("username",e.target.value)} required />
                <label htmlFor="password">Mật khẩu:</label>
                <input type="password" name="password" id="password" placeholder="************" onChange={(e)=>handleLoginData("password",e.target.value)} required />
                <div className="login-feature">
                    <div>
                        <input type="checkbox" name="remember" id="remember" className="pointer" onChange={(e)=>handleLoginData("remember",e.target.checked)} />
                        <label htmlFor="remember" className="pointer">Ghi nhớ đăng nhập</label>
                    </div>
                    <button type="button" className="link-like" onClick={()=>setShowForgot(true)}>Quên mật khẩu</button>
                </div>
                {showForgot && <ForgotPasswordModal open={showForgot} onClose={()=>setShowForgot(false)} />}
                <button className="btn-login pointer">Đăng Nhập</button>

                <div className="go-to-register">
                    <p>Bạn chưa có tài khoản?</p> <Link to="/register">Đăng ký ngay</Link>
                </div>
                <div className="login-2nd">
                    <img src={fbLogo} alt="facebook" className="social-icon" onClick={() => handleSocial('facebook')} />
                    <img src={insLogo} alt="instagram" className="social-icon" onClick={() => handleSocial('instagram')} />
                    <img src={googleLogo} alt="google" className="social-icon" onClick={() => handleSocial('google')} />
                </div>
            </form>
        </div>
    )
}

const RegisterPage = () => {
    const nav = useNavigate()
    const [regData, setRegData] = useState({
        username: "",
        password: "",
        passwordAgain: "",
        email: "",
        phoneNumber: "",
        address: "",
        term: false,
        loading: false
    })
    const [showTerms, setShowTerms] = useState(false)

    const handlSetData = (type,data) => {
        let newData = {...regData}
        newData[type] = data
        setRegData(newData)
    }
    const { showToast } = useToast()
    async function handleRegister (e){
        e.preventDefault();
        if (!regData.term) {
            showToast("Vui lòng chọn đồng ý với điều khoản và chính sách", 'error')
            return
        }
        if(regData.password !== regData.passwordAgain){
            showToast("Mật khẩu không trùng khớp", 'error')
            return
        }
        setRegData({...regData, "loading": true})
        let requestData = {...regData}
        delete requestData.term
        delete requestData.loading
        delete requestData.passwordAgain
        const response = await registerAPI(requestData)
        showToast(response.message, response.status == 201 ? 'success' : 'error')
        if (response.status == 201) {
            nav('/login')
            return
        }
        else{
            setRegData({
                username: "",
                password: "",
                passwordAgain: "",
                email: "",
                phoneNumber: "",
                address: "",
                term: false,
                loading: false
            })
        }
    }

    if (regData.loading){
        return(
            <div className="contain-auth">
                <div>Đang đăng ký...</div>
            </div>
        )
    }
    return(
        <div className="contain-auth">
            <div className="auth-hero">
                <div className="welcome-msg">
                    <h2>Đăng ký tại Hieu Boutique</h2>
                    <p>Tạo tài khoản để khám phá phong cách của riêng bạn.</p>
                </div>
            </div>
            <Link to="/" className="auth-logo" aria-label="Hieu Boutique">
                <img src={logoImg} alt="Hieu Boutique" />
            </Link>
            <form className="register" onSubmit={handleRegister}>
                <div className="register_input">
                    <div className="left">
                        <label htmlFor="username">Tên đăng nhập:</label>
                        <input type="text" name="username" id="username" placeholder="nguyenvinhhieu" required onChange={(e) => handlSetData('username', e.target.value)} />
                        <label htmlFor="password">Mật khẩu:</label>
                        <input type="password" name="password" id="password" placeholder="************" required onChange={(e) => handlSetData('password', e.target.value)} />
                        <label htmlFor="passwordAgain">Nhập lại mật khẩu:</label>
                        <input type="password" name="passwordAgain" placeholder="************" id="passwordAgain" required onChange={(e) => handlSetData('passwordAgain', e.target.value)} />
                    </div>
                    <div className="right">
                        <label htmlFor="email">Email:</label>
                        <input type="email" name="email" id="email" placeholder="abc@gmail.com"required onChange={(e) => handlSetData('email', e.target.value)} />
                        <label htmlFor="phone">Số điện thoại:</label>
                        <input type="tel" name="phone" id="phone" placeholder="0123456789" required pattern="[0-9]{10}" onChange={(e) => handlSetData('phoneNumber', e.target.value)} />
                        <label htmlFor="address">Địa chỉ:</label>
                        <input type="text" name="address" id="address" placeholder="Số nhà, phường, thành phố" required onChange={(e) => handlSetData('address', e.target.value)} />
                    </div>
                </div>
                <div className="register_term">
                    <input type="checkbox" name="term" id="term" onChange={(e)=>handlSetData('term', e.target.checked)}/>
                    <label htmlFor="term">Tôi đồng ý với <button type="button" className="link-like" onClick={()=>setShowTerms(true)}>Điều khoản và chính sách của Hieu</button></label>
                </div>
                <TermsModal open={showTerms} onClose={()=>setShowTerms(false)} />
                <button className="btn-register pointer">Đăng Ký</button>
                <div className="go-to-login">
                    <p> Bạn đã có tài khoản? <Link to={'/login'} >Đăng nhập ngay</Link></p>
                </div>
            </form>
        </div>
    )
}
export { LoginPage, RegisterPage };