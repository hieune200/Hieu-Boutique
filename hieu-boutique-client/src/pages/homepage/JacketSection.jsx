import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './homepageStyle/SeasonCollection.scss'
import banner2 from '../../assets/imgs/Banner/banner2.jpg'
import { hotProductsList, collectionProducts } from '../../services/products.api'
import Productcard from '../../components/ProductCard'

const JacketSection = ()=>{
    const [products, setProducts] = useState([])
    const collectionSlug = 'ao-khoac'

    useEffect(()=>{
        let mounted = true
        async function load(){
            const cRes = await collectionProducts(collectionSlug)
            if (!mounted) return
            if (cRes && cRes.status !== 500 && Array.isArray(cRes.data) && cRes.data.length){
                return setProducts(cRes.data || [])
            }

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
                        <h2 className="season_heading">BST ÁO KHOÁC</h2>
                        <Link to={`/collections/${collectionSlug}`} className="season_link">Xem tất cả</Link>
                    </div>

                    <Link to={`/collections/${collectionSlug}`} className="season_banner">
                        <img src={banner2} alt="BST ÁO KHOÁC" />
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

export default JacketSection
