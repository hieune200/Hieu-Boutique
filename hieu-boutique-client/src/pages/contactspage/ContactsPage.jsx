
import './contactspage.scss'
import { Link } from 'react-router-dom'
import InfoIcon from '../../components/icons/InfoIcon'
import ShippingIcon from '../../components/icons/ShippingIcon'
import FaqIcon from '../../components/icons/FaqIcon'
import PaymentIcon from '../../components/icons/PaymentIcon'
import VipIcon from '../../components/icons/VipIcon'
import decor1 from '../../assets/imgs/home/coll2.png'
import decor2 from '../../assets/imgs/home/coll3.png'
import decor3 from '../../assets/imgs/sanphamnoibat/aosomitrang.jpg'

const ContactsPage = () => {
    window.scrollTo({top: '0', behavior: 'smooth'})

    const infoItems = [
        { id: 'about', title: 'Giới thiệu về Hieu Boutique', to: '/about', Icon: InfoIcon },
        { id: 'order', title: 'Hướng dẫn đặt hàng', to: '/policy/purchase', Icon: ShippingIcon },
        { id: 'vip-check', title: 'Hướng dẫn kiểm tra hạng thẻ thành viên', to: '/vip', Icon: VipIcon },
        { id: 'loyalty', title: 'Chính sách khách hàng thân thiết', to: '/vip', Icon: VipIcon },
        { id: 'returns', title: 'Chính sách đổi trả', to: '/policy/warranty', Icon: ShippingIcon },
        { id: 'warranty', title: 'Chính sách bảo hành', to: '/policy/warranty', Icon: ShippingIcon },
        { id: 'privacy', title: 'Chính sách bảo mật', to: '/policy/privacy', Icon: InfoIcon },
        { id: 'faq', title: 'Câu hỏi thường gặp', to: '/policy/purchase', Icon: FaqIcon },
        { id: 'payment', title: 'Phương thức thanh toán', to: '/policy/payment', Icon: PaymentIcon },
        { id: 'contact', title: 'Thông tin liên hệ', to: '/contacts', Icon: InfoIcon }
    ]

    return (
        <main className="contactspage">
            <div className="infor">
                <p>Thông tin</p>
                <div className="info-grid">
                    {infoItems.map(item => (
                        <Link
                            key={item.id}
                            to={item.to ?? '/contacts'}
                            className={`info-card info-card--${item.id}`}
                            aria-label={item.title}
                        >
                            <div className="card-media">
                                {item.Icon ? <item.Icon className="contact-icon" /> : null}
                            </div>
                            <div className="card-body">
                                <h4>{item.title}</h4>
                                <p className='short'>{item.short}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="shop-link">
                        <h2 className='shop-name'>Hieu - Boutique</h2>
                        <div className="shop-title">
                            <p>Hieu - Boutique là cửa hàng thời trang nữ tại Đà Nẵng chuyên cung cấp các mẫu thời trang nữ trẻ trung, thanh lịch và phụ kiện đi kèm. Chúng tôi chú trọng chất liệu, cắt may tỉ mỉ và dịch vụ hậu mãi tận tâm.</p>
                            <p><strong>Địa chỉ:</strong> 123 Đường Thời Trang, Quận Thanh Khê, TP. Đà Nẵng.</p>
                            <p><strong>Giờ mở cửa:</strong> Thứ 2 - Chủ nhật: 09:00 - 20:30</p>
                            <p><strong>Hỗ trợ khách hàng:</strong> Hotline: <a href="tel:0869600976">0869 600 976</a> — Email: <a href="mailto:cskh@hieuboutique.com">cskh@hieuboutique.com</a></p>
                        </div>

                        
                        
                        <div className="shop-gallery" aria-hidden>
                            <figure>
                                <img src={decor1} alt="Bộ sưu tập mới" />
                                <figcaption>Bộ sưu tập mới</figcaption>
                            </figure>
                            <figure>
                                <img src={decor2} alt="Giao hàng nhanh" />
                                <figcaption>Giao hàng & Thanh toán</figcaption>
                            </figure>
                            <figure>
                                <img src={decor3} alt="Sản phẩm tiêu biểu" />
                                <figcaption>Sản phẩm tiêu biểu</figcaption>
                            </figure>
                        </div>

                        <div className="shop-links-list">
                            <ul>
                                <li><strong>Facebook:</strong> <a href="https://www.facebook.com/">facebook.com/hieuboutique</a></li>
                                <li><strong>Shopee:</strong> <a href="https://shopee.vn/">shopee.vn/hieuboutique</a></li>
                                <li><strong>Instagram:</strong> <a href="https://www.instagram.com/">instagram.com/hieuboutique</a></li>
                                <li><strong>Tiktok:</strong> <a href="https://www.tiktok.com/">tiktok.com/@hieuboutique</a></li>
                                <li><strong>YouTube:</strong> <a href="https://www.youtube.com/">youtube.com/hieuboutique</a></li>
                                <li><strong>Danh sách cửa hàng:</strong> <Link to="/address" className='pointer'>Xem toàn bộ hệ thống</Link></li>
                            </ul>
                        </div>
            </div>
        </main>
    )

}

export default ContactsPage
