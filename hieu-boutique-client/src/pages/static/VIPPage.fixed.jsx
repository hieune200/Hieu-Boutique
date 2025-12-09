import { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import './staticPages.scss'

import imgSilver from '../../assets/imgs/the/thesliver.jpg'
import imgGold from '../../assets/imgs/the/thegold.jpg'
import imgPlatinum from '../../assets/imgs/the/theplatium.jpg'
import icoShip from '../../assets/imgs/common/ship-icon.png'
import icoVoucher from '../../assets/imgs/common/voucher.png'
import icoStar from '../../assets/imgs/common/green-star.png'
import icoReturn from '../../assets/imgs/common/return-icon.png'
import { globalContext } from '../../context/globalContext'
import { getInfor } from '../../services/Auth.api'

function formatCurrency(v){
  try{ return Number(v).toLocaleString('it-IT', {style: 'currency', currency: 'VND'}) }catch(e){ return v }
}

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
  const { ctUserID } = useContext(globalContext)
  const [ userData, setUserData ] = useState(null)
  const [ userTier, setUserTier ] = useState(null)
  const [ cardModal, setCardModal ] = useState({visible:false, img:null, title:null, details:null})

  useEffect(()=>{
    async function fetchUser(){
      if (!ctUserID) return setUserData(null)
      const resp = await getInfor()
      if (resp && resp.status == 201 && resp.data){
        setUserData(resp.data)
        const total = resp.data.totalOder || resp.data.totalOrder || resp.data.totalSpent || resp.data.total || 0
        // determine tier by thresholds (same as tiers definitions)
        if (Number(total) >= 20000000) setUserTier('platinum')
        else if (Number(total) >= 5000000) setUserTier('gold')
        else setUserTier('silver')
      } else {
        setUserData(null)
      }
    }
    fetchUser()
  }, [ctUserID])

  return (
    <main className="static-page container vip-page">
      <section className="vip-hero">
        <div className="vip-hero_inner">
          <h1>Hội viên VIP</h1>
          <p className="lead">Chương trình thành viên của Hieu Boutique mang đến quyền lợi gia tăng theo từng hạng để tri ân khách hàng trung thành. Tìm hiểu cách tích điểm, nâng hạng và những ưu đãi đặc quyền dành riêng cho bạn.</p>
          {userData ? (
            <>
              <p className="muted">Tổng chi tiêu (12 tháng): <strong>{formatCurrency(userData.totalOder || userData.totalOrder || userData.totalSpent || userData.total || 0)}</strong></p>
              <div className="vip-user-panel">
                <div className="vip-user-avatar">
                  <img src={userData.avatar || '/ava.svg'} alt="avatar" />
                </div>
                <div className="vip-user-info">
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <strong style={{fontSize:16}}>{userData.name || userData.username || 'Khách hàng'}</strong>
                    {userTier && <span className="tier-badge">{userTier.toUpperCase()}</span>}
                  </div>
                  <div className="muted" style={{fontSize:13,marginTop:6}}>Mã thành viên: <strong style={{fontWeight:700}}>{userData._id || userData.id || '-'}</strong></div>
                </div>
                <div className="vip-card-preview">
                  {tiers.find(t=>t.id === userTier) ? (
                    <img src={tiers.find(t=>t.id === userTier).img} alt="card" />
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <p className="muted">Đăng nhập để xem hạng và quyền lợi của bạn.</p>
          )}
          <div className="vip-hero_cta">
            {userData ? (
              <>
                <a className="btn-apply" href="#tiers" onClick={(e)=>{e.preventDefault(); document.getElementById('tiers')?.scrollIntoView({behavior:'smooth'})}}>Xem chi tiết hạng</a>
                <Link className="btn-apply-secondary" to="/user">Quản lý tài khoản</Link>
              </>
            ) : (
              <>
                <Link className="btn-apply" to="/login">Đăng nhập / Đăng ký</Link>
                <a className="btn-apply-secondary" href="#tiers" onClick={(e)=>{e.preventDefault(); document.getElementById('tiers')?.scrollIntoView({behavior:'smooth'})}}>Xem chi tiết hạng</a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Modal for card preview */}

      <section className="vip-showcase">
        <div className="showcase-inner">
          <h2>Hình ảnh thẻ</h2>
          <p className="muted">Nhấn vào thẻ để xem chi tiết và hình lớn.</p>
          <div className="showcase-grid">
            {tiers.map(t => (
              <figure key={t.id} className="showcase-item" onClick={()=>setCardModal({visible:true,img:t.img,title:t.name,details:t.benefits})}>
                <img src={t.img} alt={t.name} loading="lazy" />
                <figcaption>{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>


      <section className="vip-intro">
        <h2 id="tiers">Hạng hội viên & Lợi ích</h2>
        <p className="muted">Tích lũy theo tổng chi tiêu trong 12 tháng gần nhất. Hệ thống tự động cập nhật hạng khi đạt ngưỡng.</p>
        <div className="vip-cards">
          {tiers.map((t,i) => (
            <article className={`vip-card vip-card--${t.id} ${userTier===t.id ? 'vip-card--active' : ''}`} key={t.id} style={{animationDelay: `${i * 120}ms`}}>
              <div className="vip-card_media">
                <img src={t.img} alt={t.name} loading="lazy" />
              </div>
              <div className="vip-card_body">
                {userTier === t.id && <div className="tier-badge">Hạng của bạn</div>}
                <button className="btn-detail" onClick={()=>setCardModal({visible:true,img:t.img,title:t.name,details:t.benefits})}>Xem chi tiết thẻ</button>
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
                  {userData ? (
                    <>
                      <Link to="/user" className="btn-apply small">Quản lý</Link>
                      <a href="#contact-hr" className="btn-apply-secondary small">Liên hệ</a>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="btn-apply small">Tham gia ngay</Link>
                      <a href="#contact-hr" className="btn-apply-secondary small">Liên hệ</a>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="vip-compare">
          <h3>Bảng so sánh lợi ích theo hạng</h3>
          <div className="compare-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Lợi ích</th>
                  {tiers.map(t => <th key={t.id}>{t.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tỉ lệ tích điểm</td>
                  <td>1 / 1.000₫</td>
                  <td>1.2 / 1.000₫</td>
                  <td>1.5 / 1.000₫</td>
                </tr>
                <tr>
                  <td>Ưu đãi thành viên</td>
                  <td>3%</td>
                  <td>7%</td>
                  <td>12%</td>
                </tr>
                <tr>
                  <td>Quà sinh nhật</td>
                  <td>50.000₫</td>
                  <td>200.000₫</td>
                  <td>500.000₫</td>
                </tr>
                <tr>
                  <td>Miễn phí giao hàng</td>
                  <td>-</td>
                  <td>Đơn &gt; 500.000₫</td>
                  <td>Đơn &gt; 0₫</td>
                </tr>
                <tr>
                  <td>Quyền lợi đặc biệt</td>
                  <td>Thông báo ưu đãi</td>
                  <td>Truy cập sớm bộ sưu tập</td>
                  <td>Stylist cá nhân & sự kiện riêng</td>
                </tr>
              </tbody>
            </table>
          </div>
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

      {cardModal.visible && (
        <div className="card-modal">
          <div className="card-modal_backdrop" onClick={()=>setCardModal({visible:false,img:null,title:null,details:null})} />
          <div className="card-modal_content">
            <button className="card-modal_close" onClick={()=>setCardModal({visible:false,img:null,title:null,details:null})}>✕</button>
            <div className="card-modal_media">
              <img src={cardModal.img} alt={cardModal.title} />
            </div>
            <div className="card-modal_body">
              <h3>{cardModal.title}</h3>
              <ul>
                {Array.isArray(cardModal.details) ? cardModal.details.map((d, ix)=>(<li key={ix}>{d}</li>)) : <li>{cardModal.details}</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default VIPPage
