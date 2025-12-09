import '../static/staticPages.scss'
import hero from '../../assets/imgs/home/slide12.png'
import starIcon from '../../assets/imgs/common/green-star.png'
import returnIcon from '../../assets/imgs/common/return-icon.png'
import shipIcon from '../../assets/imgs/common/ship-icon.png'
// removed unused logos to avoid lint warnings

const PrivacyPolicy = ()=>{
  return (
    <main className="static-page container policy-page">
      <section className="policy-hero">
        <img src={hero} alt="Bảo mật - Hieu Boutique" />
        <div className="policy-hero_text">
          <h1>Chính sách bảo mật thông tin</h1>
          <p>Hieu Boutique cam kết bảo vệ thông tin cá nhân của khách hàng và sử dụng dữ liệu một cách an toàn, minh bạch.</p>
        </div>
      </section>

      <section className="policy-overview">
        <h2>Thông tin thu thập</h2>
        <p>Chúng tôi chỉ thu thập những thông tin cần thiết để xử lý đơn hàng và hỗ trợ khách hàng.</p>
        <ul>
          <li>Thông tin cá nhân: tên, số điện thoại, email, địa chỉ giao nhận.</li>
          <li>Thông tin giao dịch: lịch sử đơn hàng, chứng từ thanh toán (nếu có).</li>
          <li>Dữ liệu tương tác: cookie và hành vi duyệt trang để cải thiện trải nghiệm.</li>
        </ul>

        <div className="policy-cards">
          <article className="card">
            <img src={starIcon} alt="Bảo mật" />
            <h3>Quyền riêng tư</h3>
            <p>Thông tin cá nhân chỉ được dùng để xử lý đơn hàng và liên hệ CSKH khi cần.</p>
          </article>
          <article className="card">
            <img src={returnIcon} alt="Hạn chế truy cập" />
            <h3>Hạn chế truy cập</h3>
            <p>Chỉ nhân viên được ủy quyền mới truy cập dữ liệu để phục vụ xử lý đơn hàng.</p>
          </article>
          <article className="card">
            <img src={shipIcon} alt="Bảo vệ dữ liệu" />
            <h3>Bảo vệ dữ liệu</h3>
            <p>Áp dụng các biện pháp kỹ thuật và quản lý để ngăn chặn truy cập trái phép.</p>
          </article>
        </div>
      </section>

      <section className="payment-faq card">
        <h3>Câu hỏi thường gặp</h3>
        <details>
          <summary>Làm sao để yêu cầu xóa thông tin cá nhân?</summary>
          <p>Liên hệ CSKH qua email hoặc form liên hệ, cung cấp thông tin cần xóa và mã đơn hàng để chúng tôi xác thực.</p>
        </details>
        <details>
          <summary>Thông tin của tôi có được chia sẻ không?</summary>
          <p>Chúng tôi không bán chia sẻ thông tin cá nhân cho bên thứ ba trừ trường hợp pháp lý hoặc bên vận chuyển cần thông tin giao hàng.</p>
        </details>
      </section>
    </main>
  )
}

export default PrivacyPolicy
