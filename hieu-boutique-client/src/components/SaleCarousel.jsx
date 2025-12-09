import { useState, useEffect, useRef, useContext } from 'react'
import { Link } from 'react-router-dom'
import { globalContext } from '../context/globalContext'
import b1 from '../assets/imgs/Banner/banner1.jpg'
import b2 from '../assets/imgs/Banner/banner2.jpg'
import b3 from '../assets/imgs/Banner/banner3.jpg'
import './SaleCarousel.scss'
import { useToast } from './ToastProvider'

const slides = [
  { src: b1, to: '/collections/sale' },
  { src: b2, to: '/collections/hot-products' },
  { src: b3, to: 'coupon:HB50K' },
]

const SaleCarousel = ()=>{
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef(null)
  const { applyCoupon } = useContext(globalContext)
  const { showToast } = useToast()

  useEffect(()=>{
    if (paused) return
    intervalRef.current = setInterval(()=>{
      setIndex(i => (i + 1) % slides.length)
    }, 3600)
    return ()=> clearInterval(intervalRef.current)
  },[paused])

  async function handleCouponClick(code){
    try{
      if (navigator && navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(code)
      }
    }catch(e){/* ignore clipboard failures */}
    try{ applyCoupon && applyCoupon(code) }catch(e){ console.warn(e) }
    showToast('Mã ' + code + ' đã áp dụng / sao chép vào clipboard.', 'success')
  }

  return (
    <div className="sale-carousel" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
      <div className="sale-carousel-inner">
        {slides.map((s, i)=> (
          <div className={`sale-slide ${i===index ? 'active' : ''}`} key={i} aria-hidden={i!==index}>
            { s.to && String(s.to).startsWith('coupon:') ? (
                <button className="slide-link" onClick={()=> handleCouponClick(String(s.to).replace(/^coupon:/i,''))}>
                  <img src={s.src} alt={`Sale banner ${i+1}`} />
                </button>
              ) : s.to ? (
                <Link to={s.to} className="slide-link">
                  <img src={s.src} alt={`Sale banner ${i+1}`} />
                </Link>
              ) : (
                <img src={s.src} alt={`Sale banner ${i+1}`} />
              ) }
          </div>
        ))}
      </div>
      <div className="sale-dots" aria-hidden>
        {slides.map((_, i)=> (
          <button key={i} className={`dot ${i===index? 'on' : ''}`} onClick={()=> setIndex(i)} aria-label={`Go to slide ${i+1}`} />
        ))}
      </div>
    </div>
  )
}

export default SaleCarousel
