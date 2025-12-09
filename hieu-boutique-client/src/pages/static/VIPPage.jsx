import { Link } from 'react-router-dom'
import './staticPages.scss'
import imgSilver from '../../assets/imgs/sanphamnoibat/aosomitrang.jpg'
import imgGold from '../../assets/imgs/home/coll2.png'
import imgPlatinum from '../../assets/imgs/home/coll3.png'
import icoShip from '../../assets/imgs/common/ship-icon.png'
import icoVoucher from '../../assets/imgs/common/voucher.png'
import icoStar from '../../assets/imgs/common/green-star.png'
import icoReturn from '../../assets/imgs/common/return-icon.png'

const tiers = [
  {
    id: 'silver',
    name: 'Silver',
    range: '0 - 4.999.000₫',
    img: imgSilver,
    benefits: [
      'Tích điểm: 1 điểm = 1.000₫',
      'Ưu đãi 3% cho mọi đơn hàng',
      'Ưu đãi sinh nhật: voucher 50.000₫',
      'Ưu tiên nhận thông tin khuyến mãi'
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    range: '5.000.000₫ - 19.999.000₫',
    img: imgGold,
    benefits: [
      'Tích điểm: 1.2 điểm = 1.000₫',
      'Ưu đãi 7% cho mọi đơn hàng',
      'Quà sinh nhật: voucher 200.000₫',
      'Miễn phí giao hàng cho đơn trên 500.000₫',
      'Quyền truy cập sớm cho bộ sưu tập mới'
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum',
    range: 'Từ 20.000.000₫ trở lên',
    img: imgPlatinum,
    benefits: [
      'Tích điểm: 1.5 điểm = 1.000₫',
      'Ưu đãi 12% cho mọi đơn hàng',
      'Quà sinh nhật giá trị cao + voucher 500.000₫',
      'Hỗ trợ stylist cá nhân và ưu tiên bảo hành/đổi trả',
      'Mời tham gia sự kiện khách hàng thân thiết'
    ]
  }
]

const VIPPage = ()=>{
  return (
    <main className="static-page container vip-page">
      <section className="vip-hero">
        <div className="vip-hero_inner">
          <h1>Hội viên VIP</h1>
          <p className="lead">Chương trình thành viên của Hieu Boutique mang đến quyền lợi gia tăng theo từng hạng để tri ân khách hàng trung thành. Tìm hiểu cách tích điểm, nâng hạng và những ưu đãi đặc quyền dành riêng cho bạn.</p>
          <div className="vip-hero_cta">
            <Link className="btn-apply" to="/login">Đăng nhập / Đăng ký</Link>
            <a className="btn-apply-secondary" href="#tiers" onClick={(e)=>{e.preventDefault(); document.getElementById('tiers')?.scrollIntoView({behavior:'smooth'})}}>Xem chi tiết hạng</a>
          </div>
        </div>
      </section>

      <section className="vip-intro">
        <h2 id="tiers">Hạng hội viên & Lợi ích</h2>
        <p className="muted">Tích lũy theo tổng chi tiêu trong 12 tháng gần nhất. Hệ thống tự động cập nhật hạng khi đạt ngưỡng.</p>
        <div className="vip-cards">
          {tiers.map((t,i) => (
            <article className={`vip-card vip-card--${t.id}`} key={t.id} style={{animationDelay: `${i * 120}ms`}}>
              <div className="vip-card_media">
                <img src={t.img} alt={t.name} loading="lazy" />
              </div>
              <div className="vip-card_body">
                <h3>{t.name}</h3>
                <div className="vip-range">{t.range}</div>
                <ul>
                  {t.benefits.map((b, idx) => (
                    <li key={idx}>
                      <img className="benefit-ico" src={
                        b.toLowerCase().includes('giao') ? icoShip :
                        b.toLowerCase().includes('voucher') ? icoVoucher :
                        b.toLowerCase().includes('ưu đãi') ? icoStar :
                        icoReturn
                      } alt="ico"/>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="vip-cta-row">
                  <Link to="/login" className="btn-apply small">Tham gia ngay</Link>
                  <a href="#contact-hr" className="btn-apply-secondary small">Liên hệ</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="vip-details">
        <h2>Chi tiết chương trình</h2>
        <h4>1. Cách tính điểm</h4>
        <p>Điểm được tính trên giá trị sau khi áp dụng khuyến mãi và chưa bao gồm phí vận chuyển. Mỗi 1.000₫ mua hàng sẽ tương ứng với số điểm theo hạng (ví dụ Silver: 1 điểm, Gold: 1.2 điểm...). Điểm được cập nhật trong vòng 24 giờ sau khi đơn hàng hoàn thành.</p>

        <h4>2. Nâng hạng & Gia hạn</h4>
        <p>Hạng được xét theo tổng chi tiêu trong 12 tháng gần nhất. Khi đạt ngưỡng mới, hạng sẽ được nâng tự động. Nếu trong kỳ tiếp theo không giữ được ngưỡng, hệ thống sẽ xét hạ hạng theo quy định.</p>

        <h4>3. Quyền lợi bổ sung</h4>
        <p>Ưu đãi có thể được thay đổi theo từng thời điểm; mọi thông báo sẽ được gửi qua email hoặc SMS đăng ký. Một số quyền lợi (ví dụ quà sinh nhật, sự kiện riêng) chỉ áp dụng khi cập nhật thông tin cá nhân đầy đủ.</p>

        <h4>4. Điều khoản & Điều kiện</h4>
        <p>Chương trình có thể kết thúc hoặc thay đổi theo quyết định của Hieu Boutique. Mọi tranh chấp sẽ được giải quyết theo quy định nội bộ và pháp luật hiện hành.</p>
      </section>

      <section className="contact-hr" id="contact-hr">
        <h2>Liên hệ hỗ trợ</h2>
        <p>Vui lòng liên hệ bộ phận chăm sóc khách hàng để biết thêm chi tiết về tài khoản và quyền lợi VIP:</p>
        <p><strong>Email:</strong> <a href="mailto:cskh@hieuboutique.com">cskh@hieuboutique.com</a> — <strong>Hotline:</strong> 0869.600.976</p>
      </section>
    </main>
  )
}

export default VIPPage
