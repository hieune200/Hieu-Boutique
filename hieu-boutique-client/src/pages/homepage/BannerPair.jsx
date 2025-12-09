import './homepageStyle/BannerPair.scss'
import banner5 from '../../assets/imgs/Banner/banner5.jpg'
import banner6 from '../../assets/imgs/Banner/banner6.jpg'
import { Link } from 'react-router-dom'

const BannerPair = ()=>{
    return (
        <section className="banner-pair">
            <div className="pair-inner">
                <Link to="/collections/banner-5" className="pair-item">
                    <img src={banner5} alt="Banner 5" />
                </Link>
                <Link to="/collections/banner-6" className="pair-item">
                    <img src={banner6} alt="Banner 6" />
                </Link>
            </div>
        </section>
    )
}

export default BannerPair
