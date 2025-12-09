import '../static/staticPages.scss'
import hero from '../../assets/imgs/home/slide12.png'
import shipIcon from '../../assets/imgs/common/ship-icon.png'
import returnIcon from '../../assets/imgs/common/return-icon.png'
import starIcon from '../../assets/imgs/common/green-star.png'
// removed unused logos to avoid lint warnings

const PurchasePolicy = ()=>{
  return (
    <main className="static-page container policy-page">
      <section className="policy-hero">
        <img src={hero} alt="Mua hàng - Hieu Boutique" />
        <div className="policy-hero_text">
          <h1>Chính sách mua hàng</h1>
          <p>Quy trình đặt hàng, xác nhận, hủy đơn và các điều kiện liên quan khi mua sản phẩm tại Hieu Boutique.</p>
        </div>
      </section>

      <section className="policy-links">
        <div className="link-card">
          <h3>Chính sách bảo mật thông tin</h3>
          <p>Chúng tôi cam kết bảo mật thông tin cá nhân của khách hàng. Thông tin được thu thập chỉ nhằm phục vụ xử lý đơn hàng, chăm sóc khách hàng và cải thiện trải nghiệm mua sắm.</p>
          <a href="/policy/privacy" className="btn-link">Xem chi tiết</a>
        </div>

        <div className="link-card active">
          <h3>Chính sách mua hàng</h3>
          <p>Tóm tắt quy trình mua hàng: hướng dẫn đặt hàng, xác nhận, hủy đơn, giao nhận và chính sách hoàn/đổi hàng tại Hieu Boutique.</p>
          <a href="/policy/purchase" className="btn-link">Xem chi tiết</a>
        </div>
      </section>

      <section className="policy-overview">
        <h2>Đặt hàng & Xác nhận</h2>
        <p>Khách hàng đặt hàng trực tuyến; hệ thống gửi email/SMS xác nhận và CSKH sẽ liên hệ khi cần xác thực thông tin.</p>

        <div className="policy-cards">
          <article className="card">
            <img src={starIcon} alt="Đặt hàng" />
            <h3>Đặt hàng nhanh</h3>
            <p>Chọn sản phẩm, thêm vào giỏ và hoàn tất thanh toán. Lưu lại mã đơn để tra cứu.</p>
          </article>
          <article className="card">
            <img src={returnIcon} alt="Hủy đơn" />
            <h3>Hủy đơn & Hoàn tiền</h3>
            <p>Yêu cầu hủy trước khi giao cho đối tác vận chuyển; hoàn tiền theo chính sách của cổng thanh toán/ngân hàng.</p>
          </article>
          <article className="card">
            <img src={shipIcon} alt="Giao nhận" />
            <h3>Giao hàng</h3>
            <p>Đơn hàng sẽ được đóng gói và bàn giao cho đối tác vận chuyển; theo dõi trạng thái qua mã vận đơn.</p>
          </article>
        </div>
      </section>


      <section className="payment-faq card">
        <h3>Câu hỏi thường gặp</h3>
        <details>
          <summary>Làm sao để hủy đơn đã đặt?</summary>
          <p>Liên hệ CSKH ngay khi muốn hủy; nếu đơn chưa được giao, chúng tôi sẽ hỗ trợ xử lý và hoàn tiền theo quy định.</p>
        </details>
        <details>
          <summary>Tôi có thể thay đổi địa chỉ giao hàng không?</summary>
          <p>Thay đổi địa chỉ chỉ thực hiện được trước khi đơn được giao cho đối tác vận chuyển; liên hệ CSKH để hỗ trợ.</p>
        </details>
      </section>
    </main>
  )
}

export default PurchasePolicy
