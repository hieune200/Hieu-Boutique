import { Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { productDetail } from '../../services/products.api'


function OrderItem ({item, index: _index}){
    const [data,  setData] = useState()
    const getData = useCallback(async ()=>{
        const res = await productDetail(item.id)
        setData(res.data)
    }, [item.id])
    useEffect(()=>{
        getData()
    }, [getData])
    return(
        <Link to={`/productdetail/${item.category}/${item.id}`} className='item'>
            <img src={data?.img} className='pointer' alt="item" />
            <p className="infor">
                <span>{data?.title}</span>
                <span>Size: {item?.size}</span>
                <span>Số lượng: x{item?.quantity}</span>
                <span className='free'>Trả hàng miễn phí 15 ngày</span>
            </p>
            <p className='price'>{data?.price?.toLocaleString('it-IT', {style :"currency", currency : "VND"})}</p>
        </Link>
    )
}

OrderItem.propTypes = {
    item: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
};

export default OrderItem;