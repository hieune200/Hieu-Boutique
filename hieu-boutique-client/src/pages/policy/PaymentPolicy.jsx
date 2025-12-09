import '../static/staticPages.scss'
import payLogo from '../../assets/imgs/common/pay-logo.png'
import shipIcon from '../../assets/imgs/common/ship-icon.png'
import returnIcon from '../../assets/imgs/common/return-icon.png'
import greenStar from '../../assets/imgs/common/green-star.png'
import hero from '../../assets/imgs/home/slide12.png'
import momo from '../../assets/imgs/common/logo-momo.png'
import vnpay from '../../assets/imgs/common/logo-vnpay.png'
import bankQR from '../../assets/imgs/common/anhqr.jpg'
import momoQR from '../../assets/imgs/common/vcb.jpg'
import ghn from '../../assets/imgs/common/ghn-logo.png'
import bctLogo from '../../assets/imgs/common/bct-logo.png'
import logoImg from '../../assets/imgs/common/logo.png'

const PaymentPolicy = ()=>{
  return (
    <main className="static-page container policy-page">
      <section className="policy-hero">
        <img src={hero} alt="Thanh toán - Hieu Boutique" />
        <div className="policy-hero_text">
          <h1>Chính sách thanh toán</h1>
          <p>Hieu Boutique hỗ trợ nhiều hình thức thanh toán để mang lại sự thuận tiện cho khách hàng.</p>
        </div>
      </section>

      <section className="policy-overview">
        <h2>Phương thức thanh toán</h2>
        <p>Chúng tôi chấp nhận nhiều phương thức thanh toán an toàn và tiện lợi:</p>
        <div className="payment-methods">
          {[
            { src: payLogo, label: 'Cổng thanh toán' },
            { src: momo, label: 'MoMo' },
            { src: momoQR, label: 'MoMo QR' },
            { src: vnpay, label: 'VNPAY' },
            { src: bankQR, label: 'Chuyển khoản QR' },
            { src: ghn, label: 'GHN / COD' }
          ].map((m, i) => (
            <figure className="method" key={i}>
              <img src={m.src} alt={m.label} />
              <figcaption>{m.label}</figcaption>
            </figure>
          ))}
        </div>

        <div className="payment-steps card">
          <h3>Hướng dẫn thanh toán nhanh</h3>
          <div className="steps">
            <div className="step">
              <img src={payLogo} alt="Chọn phương thức" />
              <div>
                <strong>1. Chọn phương thức</strong>
                <p>Chọn MoMo, VNPAY, chuyển khoản hoặc thanh toán khi nhận tùy nhu cầu.</p>
              </div>
            </div>
            <div className="step">
              <img src={momoQR} alt="Quét mã" />
              <div>
                <strong>2. Xác nhận & thanh toán</strong>
                <p>Quét mã QR hoặc điền thông tin thanh toán trên cổng, kiểm tra số tiền chính xác trước khi xác nhận.</p>
              </div>
            </div>
            <div className="step">
              <img src={bankQR} alt="Lưu biên lai" />
              <div>
                <strong>3. Lưu biên lai</strong>
                <p>Lưu ảnh biên lai/ghi chú mã đơn hàng để gửi CSKH nếu cần hỗ trợ.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="policy-cards">
        <article className="card">
          <img src={shipIcon} alt="Giao nhận" />
          <h3>Hướng dẫn chuyển khoản</h3>
          <p>Ghi đúng mã đơn hàng trong phần nội dung chuyển khoản để CSKH xử lý nhanh. Lưu biên lai và gửi ảnh nếu cần xác thực.</p>
        </article>
        <article className="card">
          <img src={returnIcon} alt="Hoàn tiền" />
          <h3>Hoàn tiền</h3>
          <p>Nếu được hoàn tiền (hủy đơn, trả hàng), tiền sẽ về tài khoản trong 7-14 ngày làm việc, tùy ngân hàng.</p>
        </article>
        <article className="card">
          <img src={greenStar} alt="An toàn" />
          <h3>Bảo mật thanh toán</h3>
          <p>Mọi giao dịch được xử lý qua cổng bảo mật; Hieu Boutique không lưu thông tin thẻ của khách hàng.</p>
        </article>
      </section>

      <section className="trust-logos warranty-logos-grid">
        {[bctLogo, logoImg, payLogo].map((src, i) => (
          <figure className="trust" key={i}>
            <img src={src} alt={`trust-${i}`} />
          </figure>
        ))}
      </section>

      <section className="payment-faq card">
        <h3>Câu hỏi thường gặp</h3>
        <details>
          <summary>Thời gian tiền về tài khoản sau khi chuyển khoản?</summary>
          <p>Tiền thường về trong 1-3 ngày làm việc với chuyển khoản nội bộ, 3-7 ngày với liên ngân hàng.</p>
        </details>
        <details>
          <summary>Làm sao nếu bị trừ tiền nhưng đơn không thành công?</summary>
          <p>Gửi biên lai giao dịch + mã đơn hàng cho CSKH qua email hoặc chat để được kiểm tra và hoàn tiền nếu cần.</p>
        </details>
      </section>
    </main>
  )
}

export default PaymentPolicy
