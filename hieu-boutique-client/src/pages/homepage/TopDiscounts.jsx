import { useState, useEffect } from 'react'
import { hotProductsList, productDetail } from '../../services/products.api'
import Productcard from '../../components/ProductCard'
import './homepageStyle/HotProductsLike.scss'

function deterministicDiscount(id){
    if (!id) return 0
    let s = 0
    for (let i=0;i<id.length;i++) s += id.charCodeAt(i)
    const buckets = [0,10,15,20,23,30,36]
    return buckets[s % buckets.length]
}

const TopDiscounts = ()=>{
    const [ids, setIds] = useState([])
    const [products, setProducts] = useState([])

    useEffect(()=>{
        async function load(){
            const res = await hotProductsList()
            if (res.status == 500) return
            setIds(res.data || [])
        }
        load()
    },[])

    useEffect(()=>{
        if (!ids.length) return
        let mounted = true
        async function fetchDetails(){
            const results = await Promise.all(ids.map(id=> productDetail(id)))
            const list = results.filter(r=> r && r.status != 500).map(r=> r.data)
            if (!mounted) return
            const withDiscount = list.map(p => ({...p, discount: deterministicDiscount(p._id)}))
            const sorted = withDiscount.sort((a,b)=> (b.discount||0) - (a.discount||0)).slice(0,4)
            setProducts(sorted)
        }
        fetchDetails()
        return ()=> mounted = false
    },[ids])

    return(
        <section className="hotproducts mini">
            <div className="hotproducts_header">
                <h2 className="section-title">Giảm giá nhiều nhất</h2>
            </div>
            <div className="hotproducts_list">
                {products.map((p, i)=> <Productcard key={p._id || i} id={p._id} />)}
            </div>
        </section>
    )
}

export default TopDiscounts
