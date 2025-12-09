
import { Link } from 'react-router-dom'
import { useState, useContext } from 'react'
import PropTypes from 'prop-types'
import trashIcon from '../assets/imgs/common/trash.png'
import './componentStyle/Cart.scss'
import { globalContext } from '../context/globalContext'

const Cart = ({ setCartControl })=>{
    
    const cartData = JSON.parse(localStorage.getItem("cart"))
    const [reload, setReload] = useState(true)
    const { appliedCoupon, clearCoupon } = useContext(globalContext)
    const handlRemoveItem = (index) => {
        cartData.splice(index,1)
        localStorage.setItem("cart",cartData.length > 0 ? JSON.stringify(cartData) : null)
        setReload(!reload)
    }
    const firstItem = Array.isArray(cartData) && cartData.length ? cartData[0] : null

    return(
        <section className="cart">
            <div className="coating pointer" onClick={()=>setCartControl(false)} />
            {
                [null, []].includes(cartData)
                ? 
                <div className="cart-detail centered">Giỏ hàng đang trống</div>
                :
                <div className="cart-detail modal-centered">
                    <button className="cart-close" onClick={()=>setCartControl(false)}>✕</button>
                    <div className="cart-body">
                        <div className="preview">
                            {firstItem ? (
                                <div className="preview-img">
                                    <img src={firstItem.img} alt={firstItem.title} />
                                </div>
                            ) : (
                                <div className="preview-empty">Không có sản phẩm</div>
                            )}
                        </div>
                        <div className="detail">
                            <h2 className="cart-title">Đơn hàng của bạn</h2>
                            <div className="prod-list">
                                {
                                    cartData.map((data, index)=>{
                                        return(
                                            <div className="card" key={index}>
                                                <div className="card-img">
                                                    <img src={data.img} alt="hieu boutique" />
                                                </div>
                                                <div className="infor">
                                                    <div className="title">
                                                        <h4>{data.title}</h4>
                                                    </div>
                                                    <div className="des">
                                                        <p className="size">
                                                            Size: <span>{data.size}</span>
                                                        </p>
                                                        {data.color && (
                                                            <p className="color">
                                                                Màu: <span className="color-swatch" style={{backgroundColor: data.color}}></span>
                                                                <span className="color-hex">{data.color.toUpperCase()}</span>
                                                            </p>
                                                        )}
                                                        <p className="quantity">
                                                            Số lượng: <span>{data.quantity}</span>
                                                        </p>
                                                    </div>
                                                    <div className="icon-recycle-bin">
                                                        <img src={trashIcon} alt="hieu boutique" className='pointer' onClick={()=>handlRemoveItem(index)}/>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                            <div className="pay">
                                <p className="total">
                                    Tổng tiền: <span>{cartData.reduce((a,e)=>a+e.count,0).toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}</span>
                                </p>
                                {appliedCoupon && (
                                    <div className="coupon-applied">
                                        <div className="coupon-line">
                                            <strong>Mã đã áp dụng:</strong> <span className="code">{appliedCoupon.code}</span>
                                            <button className="clear-coupon" onClick={()=>{ clearCoupon(); setReload(!reload) }}>Xóa</button>
                                        </div>
                                        <div className="discount-line">Giảm: <span>{(appliedCoupon.discount || 0).toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}</span></div>
                                        <div className="grand-total">Tổng sau giảm: <span>{Math.max(0, cartData.reduce((a,e)=>a+e.count,0) - (appliedCoupon.discount||0)).toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}</span></div>
                                    </div>
                                )}
                                <Link to="/checkout" className="btn pointer unselect" onClick={() => {setCartControl(false)}}>Mua hàng</Link>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </section>
    )
}

Cart.propTypes = {
    setCartControl: PropTypes.func.isRequired,
};

export default Cart;