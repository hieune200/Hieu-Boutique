

import { useEffect } from 'react'

import Slide from './Sliders'
import StoreBanner from './StoreBanner'
import Collections from './Collection'
import HotProducts from './HotProducts'
import SeasonCollection from './SeasonCollection'
import JacketSection from './JacketSection'
import BestSellers from './BestSellers'
import TopDiscounts from './TopDiscounts'
import News from './News'
import HoodieSection from './HoodieSection'
import BannerPair from './BannerPair'
import PromoFeatures from './PromoFeatures'
import './homepageStyle/Homepage.scss'

const Homepage = ()=>{
    useEffect(() => {
        scrollTo({top: 0, behavior: 'smooth'})
    }, [])
    return(
        <main className="homepage">
            <StoreBanner />
            <Slide />
            <PromoFeatures />
            <h2 className='header-title title1'> Bộ sưu tập đáng chú ý  </h2>
            <Collections />
            <div className="combined-hot">
                <input type="radio" id="tab-best" name="hottab" defaultChecked />
                <input type="radio" id="tab-discount" name="hottab" />
                <div className="combined-header">
                    <label htmlFor="tab-best" className="tab">Bán chạy nhất</label>
                    <div className="divider" />
                    <label htmlFor="tab-discount" className="tab">Giảm giá nhiều nhất</label>
                </div>
                <div className="combined-lists">
                    <div className="list best"><BestSellers /></div>
                    <div className="list discount"><TopDiscounts /></div>
                </div>
            </div>
            <HotProducts />
            <SeasonCollection />
            <JacketSection />
            <HoodieSection />
            <BannerPair />
            <News />
        </main>
    )
}

export default Homepage;