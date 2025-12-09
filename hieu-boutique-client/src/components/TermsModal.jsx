// React import not required with the JSX runtime
import './componentStyle/TermsModal.scss'

const TermsModal = ({ open, onClose }) => {
  if (!open) return null
  return (
    <div className="terms-modal-overlay" role="dialog" aria-modal="true">
      <div className="terms-modal">
        <header className="terms-modal__header">
          <h3>Điều khoản và Chính sách của Hieu Boutique</h3>
          <button className="terms-close" onClick={onClose} aria-label="Đóng">✕</button>
        </header>
        <div className="terms-modal__body">
          <section>
            <h4>1. Giới thiệu</h4>
            <p>Chào mừng bạn đến với Hieu Boutique. Khi tạo tài khoản hoặc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản, chính sách và hướng dẫn sau. Những chính sách này quy định quyền lợi, trách nhiệm và cách thức Hieu Boutique xử lý dữ liệu, vận chuyển và đổi trả.</p>
          </section>

          <section>
            <h4>2. Điều kiện sử dụng</h4>
            <p>Bạn phải đủ 18 tuổi hoặc có sự đồng ý của người đại diện hợp pháp để sử dụng dịch vụ. Khi đăng ký, vui lòng cung cấp thông tin chính xác. Mọi hành vi gian lận, sử dụng trái phép hoặc gây hại tới hệ thống sẽ bị xử lý theo quy định.</p>
          </section>

          <section>
            <h4>3. Chính sách bảo mật thông tin</h4>
            <p>Hieu Boutique cam kết bảo vệ thông tin cá nhân của khách hàng. Chúng tôi chỉ thu thập thông tin cần thiết (tên, email, số điện thoại, địa chỉ giao hàng) để xử lý đơn hàng và hỗ trợ dịch vụ. Thông tin sẽ không được chia sẻ cho bên thứ ba trừ khi có yêu cầu pháp lý hoặc sự đồng ý của bạn.</p>
          </section>

          <section>
            <h4>4. Chính sách giao nhận và kiểm tra</h4>
            <p>Sau khi hàng được giao, bạn có quyền kiểm tra sản phẩm trước khi nhận. Nếu phát hiện sản phẩm không đúng mô tả, hỏng hóc hoặc thiếu phụ kiện, vui lòng từ chối nhận hàng và liên hệ bộ phận chăm sóc khách hàng trong vòng 48 giờ kể từ lúc giao hàng.</p>
          </section>

          <section>
            <h4>5. Chính sách đổi trả và bảo hành</h4>
            <p>Hieu Boutique hỗ trợ đổi/trả trong trường hợp sản phẩm lỗi từ nhà sản xuất hoặc không đúng mô tả. Điều kiện đổi trả chi tiết (thời hạn, trạng thái sản phẩm, chi phí) được quy định tại trang chính sách đổi trả. Vui lòng giữ lại hóa đơn và bao bì gốc khi yêu cầu đổi/trả.</p>
          </section>

          <section>
            <h4>6. Quyền và nghĩa vụ</h4>
            <p>Bạn có quyền yêu cầu cung cấp thông tin về đơn hàng, yêu cầu sửa đổi hoặc xóa dữ liệu cá nhân theo quy định pháp luật. Đồng thời, bạn có nghĩa vụ cung cấp thông tin chính xác, thanh toán đầy đủ và tuân thủ quy định khi sử dụng dịch vụ.</p>
          </section>

          <section>
            <h4>7. Thay đổi chính sách</h4>
            <p>Hieu Boutique có quyền cập nhật hoặc thay đổi nội dung điều khoản/chính sách. Mọi thay đổi sẽ có hiệu lực sau khi được đăng trên trang web; chúng tôi khuyến nghị bạn kiểm tra định kỳ.</p>
          </section>

          <section>
            <h4>8. Liên hệ</h4>
            <p>Nếu bạn có câu hỏi hoặc khiếu nại liên quan đến điều khoản và chính sách, vui lòng liên hệ bộ phận chăm sóc khách hàng: <strong>cskh@hieuboutique.com</strong> hoặc Hotline: <strong>0869.600.976</strong>.</p>
          </section>
        </div>
        <footer className="terms-modal__footer">
          <button className="btn-close" onClick={onClose}>Đóng</button>
        </footer>
      </div>
    </div>
  )
}

export default TermsModal
