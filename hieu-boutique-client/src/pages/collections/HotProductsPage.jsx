import { useState, useEffect } from 'react';
import { hotProductsList } from '../../services/products.api';
import Productcard from '../../components/ProductCard';
import '../homepage/homepageStyle/HotProducts.scss'

const HotProductsPage = ()=>{
    const [hotProd, setHotProd] = useState([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 12; // 4 items per row x 3 rows per page

    useEffect(()=>{
        async function getHotProd (){
            const res = await hotProductsList()
            if (res.status == 500 ){
                return
            }
            setHotProd(res.data || []);
            setPage(1);
        }
        getHotProd()
    },[])

    const total = hotProd.length;
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    const start = (page - 1) * itemsPerPage;
    const pageItems = hotProd.slice(start, start + itemsPerPage);

    function goto(p){
        if (p < 1) p = 1;
        if (p > totalPages) p = totalPages;
        setPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return(
        <section className="hotproducts">
            <h2 className="section-title">Tất cả sản phẩm nổi bật</h2>
            <div className="hotproducts_list">
                {
                    pageItems?.map((product, index)=>{
                        return(
                            <Productcard id={product} key={start + index}/>
                        )
                    })
                }
            </div>

            { totalPages > 1 && (
                <div className="hotproducts_pagination">
                    <button className="page_btn" onClick={()=>goto(page-1)} disabled={page===1}>‹ Trước</button>
                    <div className="page_numbers">
                        {Array.from({length: totalPages}).map((_, i)=>{
                            const p = i+1;
                            return (
                                <button key={p} className={`page_num ${p===page? 'active':''}`} onClick={()=>goto(p)}>{p}</button>
                            )
                        })}
                    </div>
                    <button className="page_btn" onClick={()=>goto(page+1)} disabled={page===totalPages}>Tiếp ›</button>
                </div>
            )}
        </section>
    )
}

export default HotProductsPage;
