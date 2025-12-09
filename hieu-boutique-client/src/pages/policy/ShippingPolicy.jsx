import '../static/staticPages.scss'
import hero from '../../assets/imgs/home/slide12.png'
import shipIcon from '../../assets/imgs/common/ship-icon.png'
import returnIcon from '../../assets/imgs/common/return-icon.png'
import starIcon from '../../assets/imgs/common/green-star.png'


const ShippingPolicy = ()=>{
  return (
    <main className="static-page container policy-page">
      <section className="policy-hero">
        <img src={hero} alt="Giao nhận - Hieu Boutique" />
        <div className="policy-hero_text">
          <h1>Chính sách giao nhận & kiểm tra</h1>
          <p>Hieu Boutique hợp tác với các đơn vị vận chuyển uy tín để đảm bảo hàng đến tay khách hàng an toàn, đầy đủ và đúng thời hạn.</p>
        </div>
      </section>

      <section className="policy-overview">
        <h2>Thời gian giao hàng</h2>
        <p>Thời gian giao hàng thay đổi theo khu vực và hình thức vận chuyển; thông thường 1-5 ngày cho nội tỉnh và 3-10 ngày cho liên tỉnh. Thời gian chính xác sẽ được hiển thị khi tạo đơn hàng.</p>

        <h2>Kiểm tra khi nhận hàng</h2>
        <ul>
          <li>Kiểm tra ngoại quan kiện hàng trước khi ký nhận (hộp, nhãn, dấu vỡ).</li>
          <li>Nếu thấy bưu phẩm hư hỏng rõ ràng, khách hàng nên từ chối nhận hoặc ghi chú tình trạng trên biên bản giao nhận và chụp ảnh làm bằng chứng.</li>
          <li>Gửi ảnh/video chứng minh và mã đơn hàng cho CSKH để được hỗ trợ khiếu nại với đơn vị vận chuyển.</li>
        </ul>

        <h2>Phí vận chuyển</h2>
        <p>Phí vận chuyển được tính theo trọng lượng/khối lượng và khu vực giao. Các chương trình khuyến mãi có thể áp dụng miễn phí vận chuyển theo điều kiện đơn hàng.</p>
      </section>

      <section className="policy-cards">
        <article className="card">
          <img src={shipIcon} alt="Theo dõi" />
          <h3>Theo dõi đơn hàng</h3>
          <p>Sau khi đơn hàng được gửi, hệ thống sẽ cung cấp mã vận đơn để khách theo dõi. Vui lòng kiểm tra cập nhật từ đối tác vận chuyển.</p>
        </article>
        <article className="card">
          <img src={returnIcon} alt="Kiểm tra khi nhận" />
          <h3>Quy trình khiếu nại</h3>
          <p>Nếu có vấn đề về sản phẩm khi nhận, chụp ảnh/video, giữ nguyên trạng kiện hàng và báo CSKH trong vòng 48 giờ để được hướng dẫn đổi/trả hoặc khiếu nại với vận chuyển.</p>
        </article>
        <article className="card">
          <img src={starIcon} alt="Bảo hiểm" />
          <h3>Đảm bảo an toàn</h3>
          <p>Hieu Boutique đóng gói cẩn thận và có phương án bảo hiểm với các đơn giá trị cao; liên hệ CSKH để biết thêm chi tiết.</p>
        </article>
      </section>

      <section className="payment-faq card">
        <h3>Câu hỏi thường gặp</h3>
        <details>
          <summary>Hàng bị hư hỏng khi nhận, tôi phải làm gì?</summary>
          <p>Ghi lại tình trạng trên biên bản giao nhận, chụp ảnh/video, từ chối nhận nếu hư hỏng nặng và liên hệ CSKH để được hướng dẫn đổi/trả hoặc khiếu nại.</p>
        </details>
        <details>
          <summary>Thời gian nhận được hàng sau khi giao?</summary>
          <p>Thời gian nhận hàng phụ thuộc vào lịch trình và tuyến của đơn vị vận chuyển; vui lòng sử dụng mã vận đơn để kiểm tra trạng thái giao hàng.</p>
        </details>
        <details>
          <summary>Có thể yêu cầu giao hàng giờ cố định không?</summary>
          <p>Một số đơn vị vận chuyển hỗ trợ yêu cầu giao giờ cố định với phí bổ sung; vui lòng liên hệ CSKH khi cần dịch vụ này.</p>
        </details>
      </section>
    </main>
  )
}

export default ShippingPolicy
