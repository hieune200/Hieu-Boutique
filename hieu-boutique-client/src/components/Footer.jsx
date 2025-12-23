
import fb from '../assets/imgs/common/fb-logo.png'
import ins from '../assets/imgs/common/ins-logo.png'
import tiktok from '../assets/imgs/common/tiktok-logo.png'
import pay from '../assets/imgs/common/pay-logo.png'
import bct from '../assets/imgs/common/bct-logo.png'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useToast } from './ToastProvider'
import './componentStyle/Footer.scss'

const Footer = ()=>{
    const [email, setEmail] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const { showToast } = useToast()
    const { pathname } = useLocation()
    const hideNewsletter = pathname && pathname.toLowerCase().includes('/vip')
    return(
        <footer className="footer">
            {!hideNewsletter && (
            <section className="footer_newsletter">
                <div className="newsletter_left">
                    <h4>Đăng Ký Nhận Khuyến Mãi</h4>
                    <form className="newsletter_form" onSubmit={async (e)=>{
                        e.preventDefault();
                        if(!email) return;
                        try{
                            setSubmitting(true)
                            const res = await fetch('http://localhost:3000/newsletter/subscribe', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email })
                            })
                            const data = await res.json()
                            if(res.ok) {
                                showToast(data.message || 'Đăng ký thành công', 'success')
                                setEmail('')
                            } else {
                                showToast(data.message || 'Lỗi khi đăng ký', 'error')
                            }
                        }catch(err){
                            console.error(err)
                            showToast('Lỗi kết nối. Vui lòng thử lại sau.', 'error')
                        }finally{ setSubmitting(false) }
                    }}>
                        <input type="email" placeholder="Nhập Email của bạn" value={email} onChange={(e)=>setEmail(e.target.value)} required />
                        <button className="btn-register" type="submit" disabled={submitting}>{submitting? 'Đang gửi...' : 'Đăng ký'}</button>
                    </form>
                </div>
                <div className="newsletter_right">
                    <a className="social-btn" href="https://www.facebook.com/" aria-label="facebook"><img src={fb} alt="facebook"/></a>
                    <a className="social-btn" href="https://www.instagram.com/" aria-label="instagram"><img src={ins} alt="instagram"/></a>
                    <a className="social-btn" href="https://www.youtube.com/" aria-label="youtube"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="false"><title>YouTube</title><path d="M22 7.2s-.2-1.6-.8-2.3c-.7-.9-1.5-.9-1.9-1C16.8 3.5 12 3.5 12 3.5h0s-4.8 0-7.3.4c-.4.1-1.2.1-1.9 1C2.2 5.6 2 7.2 2 7.2S2 9 2 10.8v2.4C2 15 2 16.8 2 16.8s.2 1.6.8 2.3c.7.9 1.7.9 2.1 1 1.5.4 6.9.4 6.9.4s4.8 0 7.3-.4c.4-.1 1.2-.1 1.9-1 .6-.7.8-2.3.8-2.3s0-1.8 0-3.6v-2.4C22 9 22 7.2 22 7.2z" fill="#666"/><path d="M10 14l5-2-5-2v4z" fill="#fff"/></svg></a>
                    <a className="social-btn" href="https://www.tiktok.com/" aria-label="tiktok"><img src={tiktok} alt="tiktok"/></a>
                </div>
            </section>
            )}
            <section className="footer_mid">
                <div className="footer_mid_contacts">
                    <h5>Liên hệ</h5>
                    <ul>
                        <li>
                                <span className="icon phone" aria-hidden>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><title>Phone</title><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 3.09 4.18 2 2 0 0 1 5 2h3a2 2 0 0 1 2 1.72c.12 1.05.38 2.08.76 3.06a2 2 0 0 1-.45 2.11L9.91 10.91a16 16 0 0 0 6 6l1-1a2 2 0 0 1 2.11-.45c.98.38 2.01.64 3.06.76A2 2 0 0 1 22 16.92z" stroke="#fff" strokeWidth="0" fill="#666"/></svg>
                            </span>
                            <span className="text">Hotline: <strong>0869.600.976</strong></span>
                        </li>
                        <li>
                                <span className="icon location" aria-hidden>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><title>Location</title><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#666"/></svg>
                            </span>
                            <span className="text">242 Điện Biên Phủ, P. Thanh Khê, Đà Nẵng</span>
                        </li>
                        <li>
                                <span className="icon chat" aria-hidden>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><title>Chat</title><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#666"/></svg>
                            </span>
                            <span className="text">Zalo / Liên hệ: 0823.823.823</span>
                        </li>
                        <li>
                                <span className="icon mail" aria-hidden>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><title>Mail</title><path d="M4 4h16v16H4z" fill="#666"/></svg>
                            </span>
                            <span className="text">Email: <a href="mailto:cskh@hieuboutique.com">cskh@hieuboutique.com</a></span>
                        </li>
                    </ul>
                </div>
                <div className="footer_mid_company">
                    <h5>Công ty</h5>
                    <ul>
                        <li><a href="/about">Về chúng tôi</a></li>
                        <li><a href="/news">Tin tức</a></li>
                        <li><a href="/careers">Tuyển dụng</a></li>
                        <li><a href="/vip">Hội viên VIP</a></li>
                        <li><a href="/address">Chuỗi cửa hàng</a></li>
                    </ul>
                    {/* certification badge removed */}
                </div>
                <div className="footer_mid_policy">
                    <h5>Chính sách</h5>
                    <ul>
                        <li><a href="/policy/payment">Chính sách thanh toán</a></li>
                        <li><a href="/policy/warranty">Chính sách bảo hành, đổi trả</a></li>
                        <li><a href="/policy/shipping">Chính sách giao nhận & kiểm tra</a></li>
                        <li><a href="/policy/privacy">Chính sách bảo mật thông tin</a></li>
                        <li><a href="/policy/purchase">Chính sách mua hàng</a></li>
                    </ul>
                </div>
            </section>
            <section className="footer_bot">
                <div className="footer_bot_content">
                    <div className="bot_text">
                        <p>Copyrights © 2023 by Hieu Boutique.</p>
                        <p>Mã số doanh nghiệp: 100122132. Giấy chứng nhận đăng ký doanh nghiệp do Sở Kế Hoạch và Đầu Tư Thành phố Đà Nẵng cấp lần đầu ngày 30/11/2022.</p>
                    </div>
                    <div className="bot_badges">
                        <img src={bct} alt="da thong bao bo cong thuong" title="Đã thông báo Bộ Công Thương" />
                        <img src={pay} alt="payments" />
                    </div>
                </div>
            </section>
        </footer>
    )
}

export default Footer;