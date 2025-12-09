import { useState, useEffect } from 'react'
import Productcard from '../../components/ProductCard'
import { collectionProducts } from '../../services/products.api'
import '../homepage/homepageStyle/HotProducts.scss'

const SeasonPage = ()=>{
    const [items, setItems] = useState([])
    const [page, setPage] = useState(1)
    const itemsPerPage = 12

    useEffect(()=>{
        async function load(){
            const res = await collectionProducts('thu-dong-2025')
            if (res && res.status !== 500){
                setItems(res.data || [])
                setPage(1)
            }
        }
        load()
    },[])

    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage))
    const start = (page - 1) * itemsPerPage
    const pageItems = items.slice(start, start + itemsPerPage)

    function goto(p){
        if (p < 1) p = 1
        if (p > totalPages) p = totalPages
        setPage(p)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <section className="hotproducts">
            <h2 className="section-title">BST THU ĐÔNG 2025</h2>
            <div className="hotproducts_list">
                {pageItems.map((id, idx)=> <Productcard id={id} key={start + idx} />)}
            </div>
            { totalPages > 1 && (
                <div className="hotproducts_pagination">
                    <button className="page_btn" onClick={()=>goto(page-1)} disabled={page===1}>‹ Trước</button>
                    <div className="page_numbers">
                        {Array.from({length: totalPages}).map((_, i)=>{
                            const p = i+1
                            return <button key={p} className={`page_num ${p===page? 'active':''}`} onClick={()=>goto(p)}>{p}</button>
                        })}
                    </div>
                    <button className="page_btn" onClick={()=>goto(page+1)} disabled={page===totalPages}>Tiếp ›</button>
                </div>
            )}
        </section>
    )
}

export default SeasonPage
