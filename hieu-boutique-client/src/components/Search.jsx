
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { searchProducts } from '../services/products.api'

import './componentStyle/Cart.scss'

const Search = ({ setSearchControl, searchKeyWork, setSearchKeyWork })=>{
    // navigation not used here
    const [searchData, SetSearchData] = useState([])

    useEffect(()=>{
        // if keyword is empty, clear results and don't call backend
        if (!searchKeyWork || String(searchKeyWork).trim() === ''){
            SetSearchData([])
            return
        }
        // fetch matching products
        getSearchData(searchKeyWork)
    },[searchKeyWork])

    async function getSearchData(keyword){
        try{
            const res = await searchProducts(keyword)
            // if backend returns wrapper like { data: [...] } or array fallback
            SetSearchData((res && res.data) ? res.data : (Array.isArray(res) ? res : []))
        }catch(e){
            SetSearchData([])
        }
    }

    // if (SetSearchData) return(
    //     div.
    // )

    return(
        <section className="cart">
            <div className="coating pointer" onClick={()=>{setSearchKeyWork('');setSearchControl(false)}} />
                <div className="cart-detail">
                    <h2 className="cart-title">Sản phẩm tương ứng</h2>
                    <div className="prod-list">
                        {
                            !searchData && <p style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Đang tải</p>
                        }
                        {
                            searchData?.length === 0 && <p style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Không tìm được sản phẩm</p>
                        }
                        {
                            searchData?.map((data, index)=>{
                                return(
                                    <Link to={`/productdetail/${data?.category}/${data?._id}`} className="card" key={index} onClick={()=>{setSearchKeyWork('');setSearchControl(false)}}>
                                        <div className="card-img">
                                            <img src={data?.img} alt="hieu boutique" />
                                        </div>
                                        <div className="infor">
                                            <div className="title">
                                                <h4>{data?.title}</h4>
                                            </div>
                                            <div className="des">
                                                <p className="quantity">
                                                    Số lượng: <span>{data?.warehouse}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })
                        }
                    </div>
                </div>
        </section>
    )
}

Search.propTypes = {
    setSearchControl: PropTypes.func.isRequired,
    searchKeyWork: PropTypes.string.isRequired,
    setSearchKeyWork: PropTypes.func.isRequired,
};

export default Search;