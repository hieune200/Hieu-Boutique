// React import not required with the JSX runtime
import '../newspage/newspageStyle/newspage.scss'
import './staticPages.scss'

import hero from '../../assets/imgs/about/gioithieu1.jpg'
import introImg from '../../assets/imgs/about/gioithieu2.jpg'
import v1 from '../../assets/imgs/about/gioithieu3.jpg'
import v2 from '../../assets/imgs/about/gioithieu4.jpg'
import v3 from '../../assets/imgs/about/gioithieu5.jpg'
// removed unused g1 image import
import g2 from '../../assets/imgs/about/gioithieu7.jpg'
import g3 from '../../assets/imgs/about/gioithieu8.jpg'
import g4 from '../../assets/imgs/about/gioithieu9.jpg'
import g5 from '../../assets/imgs/about/gioithieu10.jpg'
import g6 from '../../assets/imgs/about/gioithieu11.jpg'
import g7 from '../../assets/imgs/about/gioithieu12.jpg'
import g8 from '../../assets/imgs/about/gioithieu13.jpg'
import g9 from '../../assets/imgs/about/gioithieu14.jpg'

const AboutPage = ()=>{
  return (
    <main className="static-page container about-page">
      <section className="about-hero">
        <img src={hero} alt="Hieu Boutique" />
        <div className="about-hero_text">
          <h1>HIEU BOUTIQUE</h1>
          <p>Thời trang tinh tế — Tự tin mỗi ngày</p>
        </div>
      </section>

      <section className="about-intro">
        <div className="about-intro_txt">
          <h2>Chúng tôi là ai</h2>
          <p>Hieu Boutique ra đời với sứ mệnh mang đến các sản phẩm thời trang chất lượng, phù hợp phong cách trẻ trung và thanh lịch cho khách hàng Việt Nam. Từ ý tưởng thiết kế đến lựa chọn chất liệu, mọi khâu đều được chăm chút tỉ mỉ để tạo ra những sản phẩm dễ mặc, dễ phối và bền đẹp theo thời gian.</p>

          <h3>Tầm nhìn & Sứ mệnh</h3>
          <p>Trở thành thương hiệu thời trang được yêu thích trong phân khúc casual-smart, đồng thời xây dựng trải nghiệm mua sắm thân thiện, chuyên nghiệp và bền vững với môi trường.</p>
        </div>
        <div className="about-intro_img">
          <img src={introImg} alt="Giới thiệu" />
        </div>
      </section>

      <section className="about-values">
        <h2>Giá trị cốt lõi</h2>
        <div className="values-grid">
          <div className="val">
            <img src={v1} alt="Chất lượng" />
            <h4>Chất lượng</h4>
            <p>Kiểm soát chặt chẽ từ khâu chọn vải đến thành phẩm để đảm bảo độ bền và cảm giác thoải mái khi mặc.</p>
          </div>
          <div className="val">
            <img src={v2} alt="Khách hàng" />
            <h4>Khách hàng</h4>
            <p>Đặt khách hàng làm trọng tâm, lắng nghe và liên tục cải tiến dịch vụ mua sắm.</p>
          </div>
          <div className="val">
            <img src={v3} alt="Chính trực" />
            <h4>Chính trực</h4>
            <p>Minh bạch thông tin sản phẩm và chính sách, tôn trọng quyền lợi người mua.</p>
          </div>
        </div>
      </section>

      <section className="about-milestones">
        <h2>Dấu mốc của chúng tôi</h2>
        <p className="muted">Những cột mốc quan trọng trong hành trình phát triển Hieu Boutique.</p>
        <div className="milestones-grid">
          {[
            {img: g2, key: 'gioithieu7', title: 'Khởi nguồn', desc: 'Bắt đầu với niềm đam mê thời trang và mong muốn mang lại sản phẩm tinh tế.'},
            {img: g3, key: 'gioithieu8', title: 'Bộ sưu tập đầu tiên', desc: 'Ra mắt bộ sưu tập đầu tiên với tiêu chí thoải mái và dễ phối đồ.'},
            {img: g4, key: 'gioithieu9', title: 'Mở rộng', desc: 'Mở rộng mẫu mã, cải tiến chất liệu và nâng cao trải nghiệm khách hàng.'},
            {img: g5, key: 'gioithieu10', title: 'Cửa hàng trực tuyến', desc: 'Đưa sản phẩm tới nhiều khách hàng hơn thông qua nền tảng trực tuyến.'},
            {img: g6, key: 'gioithieu11', title: 'Đội ngũ', desc: 'Xây dựng đội ngũ sáng tạo và chăm sóc khách hàng chuyên nghiệp.'},
            {img: g7, key: 'gioithieu12', title: 'Chuỗi phát triển', desc: 'Tiếp tục phát triển bộ sưu tập theo xu hướng và phản hồi khách hàng.'},
            {img: g8, key: 'gioithieu13', title: 'Cộng đồng', desc: 'Xây dựng cộng đồng khách hàng trung thành và kết nối yêu thương thời trang.'},
            {img: g9, key: 'gioithieu14', title: 'Tương lai', desc: 'Không ngừng đổi mới để mang đến nhiều giá trị hơn cho khách hàng.'}
          ].map((m)=> (
            <article className="milestone-card" key={m.key}>
              <div className="milestone-img">
                <img src={m.img} alt={m.title} loading="lazy"/>
              </div>
              <div className="milestone-body">
                <h4>{m.title}</h4>
                <p className="muted small">{m.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-timeline">
        <h2>Các Dấu Mốc Đặc Biệt</h2>
        <div className="timeline-wrap">
          <div className="timeline-line" />
          <div className="timeline-items">
            {[
              {icon: 'rocket', date: '4.2017', title: 'Khởi nghiệp', desc: 'Cửa hàng thời trang đầu tiên ra đời, đánh dấu bước khởi đầu.'},
              {icon: 'building', date: '9.2019', title: 'Thương hiệu chính thức', desc: 'Thương hiệu chính thức ra mắt, mở rộng showroom.'},
              {icon: 'bulb', date: '2022', title: 'Đổi mới nhận diện', desc: 'Thay đổi nhận diện thương hiệu và phát triển sản phẩm.'},
              {icon: 'plane', date: '2023', title: 'Mở rộng thị trường', desc: 'Top doanh nghiệp xuất sắc, tiếp cận khách hàng toàn quốc.'},
              {icon: 'chart', date: '2024', title: 'Tăng trưởng', desc: 'Mở rộng mạng lưới, tăng trưởng về doanh số và quy mô.'}
            ].map((m, i) => (
              <div className="timeline-item" key={i}>
                <div className="timeline-icon" aria-hidden>
                  {m.icon === 'rocket' && (
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="#c8102e"><path d="M12 2c-1 0-4 1-6 3s-3 5-3 6 1 5 3 6 5 3 6 3 4-1 6-3 3-5 3-6-1-5-3-6-5-3-6-3zm0 2c.8 0 3 .8 4 2 1 1 2.1 3 2.1 4s-.8 3-2 4c-1.2 1.2-3.8 2.9-5.1 3.3-.7.2-1.8.2-2.6 0C7 18 5.6 17.4 4 16c0 0 1-2 2-3s3-2 4-3c1-1 2-3 2-4 0-1-.2-2-2-2z"/></svg>
                  )}
                  {m.icon === 'building' && (
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="#c8102e"><path d="M3 21h18v-2H3v2zm2-4h14V3H5v14zm2-2v-2h2v2H7zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2z"/></svg>
                  )}
                  {m.icon === 'bulb' && (
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="#c8102e"><path d="M9 21h6v-1a3 3 0 0 0-6 0v1zm3-19a7 7 0 0 0-4 12v1h8v-1a7 7 0 0 0-4-12z"/></svg>
                  )}
                  {m.icon === 'plane' && (
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="#c8102e"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9L2 14v2l8-1v4l3-1 3 1v-4l6 1z"/></svg>
                  )}
                  {m.icon === 'chart' && (
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="#c8102e"><path d="M3 17h2v4H3v-4zm4-6h2v10H7V11zm4-4h2v14h-2V7zm4 6h2v8h-2v-8z"/></svg>
                  )}
                </div>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-date">{m.date}</div>
                  <div className="timeline-title">{m.title}</div>
                  <div className="timeline-desc muted small">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-contact">
        <h2>Liên hệ</h2>
        <p>Hotline: <strong>0869.600.976</strong> — Email: <a href="mailto:cskh@hieuboutique.com">cskh@hieuboutique.com</a></p>
        <p>Địa chỉ: 242 Điện Biên Phủ, P. Thanh Khê, Đà Nẵng</p>
      </section>
    </main>
  )
}

export default AboutPage
