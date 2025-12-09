import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'
import a1 from '../../assets/imgs/anh bia/anhbia1.png';
import a2 from '../../assets/imgs/anh bia/anhbia2.png';
import a3 from '../../assets/imgs/anh bia/anhbia3.png';
import './homepageStyle/StoreBanner.scss';


const images = [
  { src: a1, alt: 'Ảnh bìa 1' },
  { src: a2, alt: 'Ảnh bìa 2' },
  { src: a3, alt: 'Ảnh bìa 3' }
];

const StoreBanner = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (paused) return undefined;
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearTimeout(timeoutRef.current);
  }, [current, paused]);

  const goTo = (idx) => setCurrent(idx);

  return (
    <section className="store-banner">
      <div className="store-banner__main">
        <div className="store-banner__info">
          <h2 className="store-banner__title">HIEU BOUTIQUE – XIN CHÀO BẠN ĐẾN VỚI CHÚNG TÔI</h2>
          <div className="store-banner__desc">
            Đã có mặt trên website và hệ thống <span className="highlight">140+ cửa hàng</span> trên toàn quốc<br/>
            <span className="sub">Tự hào khi mang những sản phẩm chất lượng với dịch vụ tận tâm đến tay khách hàng trên khắp Việt Nam</span>
          </div>
          <Link to="/about" className="store-banner__btn">Khám phá ngay!</Link>
        </div>
        <div className="store-banner__images">
          <div className="store-banner__slide-wrap"
               onMouseEnter={() => setPaused(true)}
               onMouseLeave={() => setPaused(false)}>
              {images.map((img, idx) => (
                <img key={idx} className={"store-banner__slide " + (current===idx ? 'active' : '')} src={img.src} alt={img.alt} />
              ))}

              {/* navigation buttons removed per design request */}

              <div className="store-banner__dots">
                {images.map((_, idx) => (
                  <button key={idx} className={"store-banner__dot " + (current===idx? 'active':'')} onClick={()=>goTo(idx)} aria-label={`Go to slide ${idx+1}`}></button>
                ))}
              </div>
            </div>
        </div>
      </div>
      
    </section>
  );
};

export default StoreBanner;
