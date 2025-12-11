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
            {
                (() => {
                    // Prefer fresh product image from DB (data), fall back to image captured in order (item.img), then placeholder
                    let src = '/ava.svg'
                    if (data) {
                        if (Array.isArray(data.img) && data.img.length) src = data.img[0]
                        else if (typeof data.img === 'string' && data.img) src = data.img
                    } else if (item && item.img) {
                        if (Array.isArray(item.img) && item.img.length) src = item.img[0]
                        else if (typeof item.img === 'string' && item.img) src = item.img
                    }
                    return <img src={src} className='pointer' alt="item" onError={(e)=>{ try{ e.currentTarget.src = '/ava.svg' }catch(err){ console.warn(err) } }} />
                })()
            }
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