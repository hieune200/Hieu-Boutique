// React import not required with the JSX runtime
import './staticPages.scss'

import hero from '../../assets/imgs/anh bia/anhbia1.png'
import team1 from '../../assets/imgs/home/coll1.png'
import team2 from '../../assets/imgs/home/coll2.png'
import team3 from '../../assets/imgs/home/coll3.png'

const Jobs = [
  {
    id: 'sales-1',
    title: 'Nhân viên bán hàng cửa hàng',
    location: 'Toàn quốc (ưu tiên Đà Nẵng)',
    salary: 'Thương lượng + hoa hồng',
    responsibilities: [
      'Tư vấn và chăm sóc khách hàng tại cửa hàng, đảm bảo doanh số cá nhân và cửa hàng.',
      'Thực hiện trưng bày, sắp xếp sản phẩm theo tiêu chuẩn thương hiệu.',
      'Xử lý thanh toán, xuất hóa đơn và cập nhật tồn kho cơ bản.'
    ],
    requirements: [
      'Tốt nghiệp THPT trở lên.',
      'Giao tiếp tốt, thân thiện, ngoại hình ưa nhìn là lợi thế.',
      'Có kỹ năng bán hàng, chịu được áp lực doanh số.'
    ]
  },
  {
    id: 'content-1',
    title: 'Content & Social Media',
    location: 'Làm việc tại văn phòng / remote một phần',
    salary: 'Theo thỏa thuận (môi trường sáng tạo)',
    responsibilities: [
      'Lên kế hoạch nội dung cho website và mạng xã hội (Facebook, Instagram).',
      'Sản xuất bài viết, chụp ảnh sản phẩm cơ bản và chỉnh sửa hình ảnh.',
      'Theo dõi hiệu quả chiến dịch, tối ưu nội dung và tương tác với khách hàng.'
    ],
    requirements: [
      'Kinh nghiệm 1+ năm ở vị trí tương đương.',
      'Sử dụng thành thạo công cụ thiết kế (Canva, Photoshop) và nền tảng MXH.',
      'Tư duy sáng tạo, có portfolio/content mẫu.'
    ]
  },
  {
    id: 'designer-1',
    title: 'Thiết kế thời trang / Mẫu',
    location: 'Văn phòng thiết kế',
    salary: 'Theo năng lực, cộng tác lâu dài',
    responsibilities: [
      'Thiết kế mẫu, bản vẽ kỹ thuật và phối màu cho bộ sưu tập.',
      'Làm việc với xưởng may để thử mẫu và sửa mẫu theo feedback.',
      'Nghiên cứu xu hướng thời trang và đề xuất ý tưởng mới.'
    ],
    requirements: [
      'Đã có portfolio thiết kế thời trang.',
      'Hiểu biết về cấu trúc quần áo, vật liệu và kỹ thuật may.',
      'Khả năng vẽ tay hoặc dùng phần mềm thiết kế (Adobe Illustrator).'
    ]
  }
]

const CareersPage = ()=>{
  return (
    <main className="static-page container careers-page">
      <section className="careers-hero">
        <img src={hero} alt="Về chúng tôi" loading="lazy"/>
        <div className="careers-hero_text">
          <h1>Tuyển dụng</h1>
          <p className="lead">Chúng tôi tìm kiếm đồng đội cùng chia sẻ đam mê thời trang, sáng tạo và tinh thần cầu tiến. Gia nhập Hieu Boutique để phát triển nghề nghiệp trong môi trường năng động, thân thiện và chuyên nghiệp.</p>
          <div className="hero-cta">
            <a className="btn-apply" href="mailto:hr@hieuboutique.com?subject=Ứng tuyển - Thông tin chung">Gửi hồ sơ ngay</a>
            <a className="btn-apply-secondary" href="#open-positions" onClick={(e)=>{e.preventDefault(); document.getElementById('open-positions')?.scrollIntoView({behavior:'smooth'})}}>Xem vị trí</a>
          </div>
        </div>
      </section>

      <section className="company-culture">
        <h2>Văn hóa & Giá trị</h2>
        <div className="culture-grid">
          <div className="culture-card">
            <img src={team1} alt="Team" loading="lazy"/>
            <h4>Khách hàng làm trung tâm</h4>
            <p>Luôn lắng nghe và trao trải nghiệm mua sắm thân thiện, tận tâm. Mọi quyết định đều hướng tới giá trị cho khách hàng.</p>
          </div>
          <div className="culture-card">
            <img src={team2} alt="Team" loading="lazy"/>
            <h4>Sáng tạo & Hợp tác</h4>
            <p>Khuyến khích sáng tạo, làm việc theo nhóm chặt chẽ giữa thiết kế, marketing và bán hàng để tạo nên bộ sưu tập chất lượng.</p>
          </div>
          <div className="culture-card">
            <img src={team3} alt="Team" loading="lazy"/>
            <h4>Phát triển nghề nghiệp</h4>
            <p>Đào tạo nội bộ, định hướng nghề nghiệp và cơ hội thăng tiến cho nhân viên có năng lực.</p>
          </div>
        </div>
      </section>

      <section className="open-positions">
        <h2>Vị trí đang tuyển</h2>
        <p className="muted">Dưới đây là các mô tả công việc chi tiết để bạn cân nhắc trước khi ứng tuyển. Ứng viên phù hợp sẽ được mời phỏng vấn trực tiếp.</p>
        <div className="jobs-grid">
          {Jobs.map(job => (
            <article className="job-card" key={job.id} id={job.id}>
              <h3>{job.title}</h3>
              <div className="job-meta"><strong>Địa điểm:</strong> {job.location} — <strong>Mức lương:</strong> {job.salary}</div>
              <h4>Nhiệm vụ chính</h4>
              <ul>
                {job.responsibilities.map((r, idx)=> <li key={idx}>{r}</li>)}
              </ul>
              <h4>Yêu cầu</h4>
              <ul>
                {job.requirements.map((r, idx)=> <li key={idx}>{r}</li>)}
              </ul>
              <div className="apply-row">
                <a className="btn-apply" href={`mailto:hr@hieuboutique.com?subject=Ứng tuyển - ${encodeURIComponent(job.title)}`} >Ứng tuyển vị trí này</a>
                <a className="btn-apply-secondary" href="#" onClick={(e)=>{e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'})}}>Gửi hồ sơ chung</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="benefits-process">
        <div className="benefits">
          <h2>Quyền lợi nổi bật</h2>
          <ul>
            <li>Mức lương cạnh tranh + thưởng theo hiệu suất và KPI.</li>
            <li>Chế độ BHXH/BHYT theo quy định, nghỉ phép năm, phúc lợi lễ tết.</li>
            <li>Đào tạo kỹ năng bán hàng, chụp ảnh sản phẩm, marketing và phát triển nghề nghiệp.</li>
            <li>Môi trường trẻ trung, năng động, đồng nghiệp thân thiện.</li>
            <li>Ưu đãi mua hàng cho nhân viên và chính sách thưởng theo doanh số.</li>
          </ul>
        </div>
        <div className="process">
          <h2>Quy trình tuyển dụng</h2>
          <ol>
            <li>Gửi CV + portfolio (nếu có) tới <a href="mailto:hr@hieuboutique.com">hr@hieuboutique.com</a> (tiêu đề: Ứng tuyển - [Vị trí] - Họ Tên).</li>
            <li>Sơ tuyển hồ sơ và liên hệ phỏng vấn (online/onsite) trong vòng 7-10 ngày làm việc.</li>
            <li>Phỏng vấn trực tiếp với quản lý bộ phận; có thể kèm bài test với một số vị trí.</li>
            <li>Nhận offer thử việc và chính thức sau giai đoạn thử việc (thông thường 1-2 tháng).</li>
            <li>Hỗ trợ onboarding, đào tạo ban đầu và đánh giá định kỳ.</li>
          </ol>
        </div>
      </section>

      <section className="faq">
        <h2>Câu hỏi thường gặp (FAQ)</h2>
        <details>
          <summary>Bạn có nhận ứng viên mới ra trường không?</summary>
          <p>Chúng tôi hoan nghênh ứng viên mới tốt nghiệp; với các vị trí chuyên môn, portfolio/portfolio thực tập sẽ là điểm cộng để xem xét.</p>
        </details>
        <details>
          <summary>Thời gian phản hồi hồ sơ là bao lâu?</summary>
          <p>Thời gian xét hồ sơ thường từ 5-10 ngày làm việc; đối với nhu cầu gấp, chúng tôi sẽ ưu tiên liên hệ sớm hơn.</p>
        </details>
        <details>
          <summary>Tôi có thể nộp hồ sơ trực tiếp tại cửa hàng không?</summary>
          <p>Có, bạn có thể nộp hồ sơ trực tiếp tại các cửa hàng, nhưng nộp qua email giúp bộ phận HR xử lý nhanh và chính xác hơn.</p>
        </details>
      </section>

      <section className="contact-hr">
        <h2>Liên hệ Nhân sự</h2>
        <p>Nếu có câu hỏi thêm, vui lòng liên hệ với bộ phận Nhân sự:</p>
        <p><strong>Email:</strong> <a href="mailto:hr@hieuboutique.com">hr@hieuboutique.com</a> — <strong>Hotline:</strong> 0869.600.976</p>
      </section>
    </main>
  )
}

export default CareersPage
