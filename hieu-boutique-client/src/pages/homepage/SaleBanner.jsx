import { Link } from 'react-router-dom'
import './homepageStyle/SaleBanner.scss'

const SaleBanner = ()=>{
  return (
    <section className="sale-banner">
      <div className="sale-inner">
        <Link to="/collections/hot-products" className="sale-btn" aria-label="Sale collection">
          <span className="sale-icon" aria-hidden>
            {/* simple tag icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 11L11 3L21 13L13 21L3 11Z" fill="currentColor" />
              <circle cx="7.5" cy="7.5" r="1.5" fill="#fff" />
            </svg>
          </span>
          <span className="sale-text">SALE</span>
        </Link>
      </div>
    </section>
  )
}

export default SaleBanner
