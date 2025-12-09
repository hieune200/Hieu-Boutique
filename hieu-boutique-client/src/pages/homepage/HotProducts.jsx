
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hotProductsList } from '../../services/products.api';
import Productcard from '../../components/ProductCard';
import './homepageStyle/HotProducts.scss'

const HotProducts = () => {
    const [hotProd, setHotProd] = useState([]);
    useEffect(()=>{
        async function getHotProd (){
            const res = await hotProductsList()
            if (res.status == 500 ){
                return
            }
            setHotProd(res.data);
        }
        getHotProd()
    },[])
    const preview = hotProd?.slice(0,4) || [];

    return(
        <section className="hotproducts">
            <h2 className="section-title">Sản phẩm nổi bật</h2>
            <div className="hotproducts_list">
                {
                    preview.map((product, index)=>{
                        return(
                            <Productcard id={product} key={index}/>
                        )
                    })
                }
            </div>
            {hotProd && hotProd.length > 4 && (
                <>
                    <div className="hotproducts_footer">
                        <Link className="hotproducts_viewall" to="/collections/hot-products" aria-label="Xem tất cả">
                            <span>Xem tất cả</span>
                        </Link>
                    </div>

                    {/* banner removed from hot products - moved to a separate season collection section */}
                </>
            )}
        </section>
    )
}

export default HotProducts