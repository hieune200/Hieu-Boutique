import '../static/staticPages.scss'
import hero from '../../assets/imgs/home/slide12.png'
import returnIcon from '../../assets/imgs/common/return-icon.png'
import shipIcon from '../../assets/imgs/common/ship-icon.png'
import starIcon from '../../assets/imgs/common/green-star.png'
// removed unused logos to avoid lint warnings

const WarrantyPolicy = ()=>{
  return (
    <main className="static-page container warranty-page">
      <section className="policy-hero">
        <img src={hero} alt="Bảo hành - Hieu Boutique" />
        <div className="policy-hero_text">
          <h1>Chính sách bảo hành & đổi trả</h1>
          <p>Hieu Boutique cam kết chất lượng sản phẩm và hỗ trợ khách hàng trong trường hợp sản phẩm gặp lỗi kỹ thuật hoặc không đúng mô tả.</p>
        </div>
      </section>

      <section className="warranty-icons-row">
        <div className="icon-item">
          <img src={returnIcon} alt="Đổi trả" />
          <p>Đổi trả trong 7 ngày</p>
        </div>
        <div className="icon-item">
          <img src={shipIcon} alt="Giao nhận" />
          <p>Giao nhận an toàn</p>
        </div>
        <div className="icon-item">
          <img src={starIcon} alt="Bảo hành" />
          <p>Chính sách bảo hành</p>
        </div>
      </section>

      <h2>Đổi trả</h2>
      <p>Khách hàng có thể yêu cầu đổi hoặc trả hàng trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm có lỗi do nhà sản xuất, sai mẫu mã hoặc không đúng kích thước đã thỏa thuận.</p>

      <h2>Điều kiện đổi trả</h2>
      <ul>
        <li>Sản phẩm chưa qua sử dụng, giữ nguyên nhãn mác và bao bì.</li>
        <li>Không áp dụng đổi trả do sử dụng sai hướng dẫn, hư hỏng do va đập.</li>
        <li>Khách hàng cần cung cấp ảnh/video chứng minh lỗi và hóa đơn mua hàng.</li>
      </ul>

      <h2>Bảo hành</h2>
      <div className="warranty-row">
        <p>Một số sản phẩm có chính sách bảo hành riêng (ví dụ: phụ kiện điện tử), thông tin chi tiết được ghi trên trang sản phẩm hoặc kèm theo phiếu bảo hành.</p>
        </div>
    </main>
  )
}

export default WarrantyPolicy
