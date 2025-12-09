import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './homepageStyle/SeasonCollection.scss'
import banner1 from '../../assets/imgs/Banner/banner1.jpg'
import { hotProductsList, collectionProducts } from '../../services/products.api'
import Productcard from '../../components/ProductCard'

const SeasonCollection = ()=>{
    const [products, setProducts] = useState([])

    // We will fetch the collection products by slug 'thu-dong-2025'.
    const collectionSlug = 'thu-dong-2025'
    // featuredIds removed (not used)

    useEffect(()=>{
        let mounted = true
        async function load(){
            // try to load collection products (we keep product IDs in state)
            const cRes = await collectionProducts(collectionSlug)
            if (!mounted) return
            if (cRes && cRes.status !== 500 && Array.isArray(cRes.data) && cRes.data.length){
                return setProducts(cRes.data || [])
            }

            // fallback to hot products
            const res = await hotProductsList()
            if (!mounted) return
            if (res && res.status !== 500){
                setProducts(res.data || [])
            }
        }
        load()
        return ()=> mounted = false
    },[])

    const preview = products?.slice(0,4) || []

    return(
        <section className="season-collection">
            <div className="season_inner">
                    <div className="season_header">
                        <h2 className="season_heading">BST THU ĐÔNG 2025</h2>
                        <Link to="/collections/thu-dong-2025" className="season_link">Xem tất cả</Link>
                    </div>

                    <Link to="/collections/thu-dong-2025" className="season_banner">
                        <img src={banner1} alt="BST Thu Đông 2025" />
                    </Link>

                <div className="season_products">
                    {preview.map((p, i)=> (
                        <Productcard id={p} key={i} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default SeasonCollection
