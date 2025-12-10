
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

    const subtotal = Array.isArray(cartData) && cartData.length ? cartData.reduce((a,e)=>a+e.count,0) : 0
    const itemCount = Array.isArray(cartData) && cartData.length ? cartData.reduce((a,e)=>a+(e.quantity||1),0) : 0
    const SHIPPING_THRESHOLD = 499000
    const DEFAULT_SHIPPING_FEE = 25000
    // Do not apply coupon discount in the cart preview — only at checkout
    const previewDiscount = 0
    const afterDiscount = subtotal // keep subtotal unchanged for preview calculations
    // Apply shipping waiver based on subtotal (discount applied at checkout only)
    const shippingFee = afterDiscount >= SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE
    const finalTotal = afterDiscount + shippingFee

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
                                <div className="summary">
                                    <div className="line">
                                        <span className="label">Tạm tính</span>
                                        <span className="amount">{subtotal.toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}</span>
                                    </div>
                                    <div className="line">
                                        <span className="label">Số sản phẩm</span>
                                        <span className="amount">{itemCount}</span>
                                    </div>
                                    <div className="line">
                                        <span className="label">Giảm giá</span>
                                        <span className="amount">{appliedCoupon ? `${appliedCoupon.code} (áp dụng khi thanh toán)` : '0 VND'}</span>
                                    </div>
                                    <div className="line">
                                        <span className="label">Phí giao hàng</span>
                                        <span className="amount shipping-amount">{shippingFee === 0 ? '- Phí ship' : shippingFee.toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}</span>
                                    </div>
                                    <div className="line total">
                                        <strong className="label">Tổng</strong>
                                        <strong className="amount total-amount">{finalTotal.toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}</strong>
                                    </div>
                                    <div className="shipping-note">Miễn phí giao hàng cho đơn từ {SHIPPING_THRESHOLD.toLocaleString('it-IT')} VND (sau khi áp dụng mã giảm giá)</div>
                                </div>

                                <div className="actions">
                                    <Link to="/" className="btn secondary small pointer unselect" onClick={() => {setCartControl(false)}}>Trang chủ</Link>
                                    <Link to="/checkout" className="btn primary small pointer unselect" onClick={() => {setCartControl(false)}}>Đặt hàng</Link>
                                </div>
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