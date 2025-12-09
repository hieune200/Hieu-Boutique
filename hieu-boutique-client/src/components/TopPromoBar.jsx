import './componentStyle/TopPromoBar.scss'
import { Link } from 'react-router-dom'

const TopPromoBar = ()=>{
  return (
    <div className="top-promo">
      <div className="top-promo__inner">
        <div className="top-promo__left">
          <span className="promo-text">BST Thu-Đông 2025 - Giá Trải Nghiệm -30%</span>
          <button className="promo-cta" aria-label="see-more">➜</button>
        </div>
        <div className="top-promo__right">
          <span className="hotline">☎ Hotline: <strong>0869600976</strong></span>
          <span className="shop">🛍️ Shop: <strong><Link to="/address">Hệ thống cửa hàng</Link></strong></span>
        </div>
      </div>
    </div>
  )
}

export default TopPromoBar
