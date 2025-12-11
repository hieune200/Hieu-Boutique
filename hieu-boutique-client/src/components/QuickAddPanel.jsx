import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactDOM from 'react-dom'
import { useToast } from './ToastProvider'
import PropTypes from 'prop-types'
import cartIcon from '../assets/imgs/common/cart-icon.png'
import './componentStyle/ProductCard.scss'

function QuickAddPanel({ product, image, onClose }) {
  const nav = useNavigate()
    const { showToast } = useToast()

  const oldPrice = product?.oldPrice || null
  const price = product?.price || 0
  const imgs = Array.isArray(product?.img) ? product.img : (product?.img ? [product.img] : [])
  const swatches = imgs.slice(0, 5)
  const sizes = Array.isArray(product?.size) ? product.size : []

  const [selectedIndex, setSelectedIndex] = useState(imgs.indexOf(image) >= 0 ? imgs.indexOf(image) : 0)
  const selectedImg = imgs[selectedIndex] || ''
  const [selectedSize, setSelectedSize] = useState(sizes[0] || '')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // if no product provided, render nothing (hooks must run before return)
  if (!product) return null

  const changeQty = (delta) => setQuantity(q => Math.max(1, q + delta))

  const addToCart = (andClose = true) => {
    const cart = JSON.parse(localStorage.getItem('cart')) || []
    const defaultSize = selectedSize || ''
    const defaultColor = ''

    const idx = cart.findIndex(it => it.id === product?._id && (it.size || '') === defaultSize && (it.color || '') === defaultColor)

    if (idx === -1) {
      cart.unshift({
        id: product?._id,
        img: selectedImg || imgs[0] || '',
        title: product?.title,
        size: defaultSize,
        color: defaultColor,
        quantity,
        count: quantity * Number(product?.price || 0)
      })
    } else {
      const existing = cart[idx]
      const newQty = Math.min((existing.quantity || 0) + quantity, product?.warehouse || 9999)
      existing.quantity = newQty
      existing.count = newQty * Number(product?.price || 0)
      cart[idx] = existing
    }

    localStorage.setItem('cart', JSON.stringify(cart))
      try{
        const cur = JSON.parse(localStorage.getItem('cart'))
        try{ window.dispatchEvent(new CustomEvent('hb_cart_updated', { detail: { cart: cur, ts: Date.now() } })) }catch(e){}
      }catch(e){}
      try{ showToast(`Đã thêm ${product?.title} vào giỏ hàng`, 'success') }catch(e){}
    if (andClose) onClose && onClose()
  }

  const modal = (
    <div className="quickadd-panel" role="dialog" aria-modal="true">
      <div className="quickadd-backdrop" onClick={onClose} />
      <div className="quickadd-inner">
        <button className="quickadd-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="quickadd-grid">
          <div className="quickadd-image">
            <button className="qa-arrow qa-prev" onClick={() => setSelectedIndex((selectedIndex - 1 + imgs.length) % imgs.length)} aria-label="Prev image">‹</button>
            <img src={selectedImg || imgs[0] || '/ava.svg'} alt={product?.title} onError={(e)=>{ try{ e.currentTarget.src = '/ava.svg' }catch(err){ console.warn(err) } }} />
            <button className="qa-arrow qa-next" onClick={() => setSelectedIndex((selectedIndex + 1) % imgs.length)} aria-label="Next image">›</button>
          </div>

          <div className="quickadd-details">
            <h3 className="qa-title">{product?.title}</h3>
            <div className="qa-price">
              {price.toLocaleString('it-IT', { style: 'currency', currency: 'VND' })}
              {oldPrice && <span className="qa-old">{oldPrice.toLocaleString('it-IT', { style: 'currency', currency: 'VND' })}</span>}
            </div>

            {swatches.length > 0 && (
              <div className="qa-swatches" style={{ marginTop: 12 }}>
                {swatches.map((s, i) => (
                  <button key={i} className={"swatch" + (selectedIndex === i ? ' active' : '')} onClick={() => setSelectedIndex(i)} style={{ marginRight: 8 }}>
                    <img src={s || '/ava.svg'} alt={`swatch-${i}`} onError={(e)=>{ try{ e.currentTarget.src = '/ava.svg' }catch(err){ console.warn(err) } }} />
                  </button>
                ))}
              </div>
            )}

            {sizes.length > 0 && (
              <div className="qa-sizes" style={{ marginTop: 18 }}>
                <div style={{ marginBottom: 8 }}>Kích thước Áo:</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {sizes.map((sz, idx) => (
                    <button key={idx} onClick={() => setSelectedSize(sz)} className={"size-btn" + (selectedSize === sz ? ' active' : '')} style={{ padding: '10px 18px', borderRadius: 8 }}>{sz}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="qa-qty-actions" style={{ marginTop: 22, display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="qty-box" style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #ccc', padding: '6px 12px', borderRadius: 8 }}>
                <button onClick={() => changeQty(-1)} style={{ border: 0, background: 'transparent', fontSize: 18 }}>−</button>
                <div style={{ minWidth: 36, textAlign: 'center' }}>{quantity}</div>
                <button onClick={() => changeQty(1)} style={{ border: 0, background: 'transparent', fontSize: 18 }}>+</button>
              </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="qa-add" onClick={() => addToCart(true)}><img src={cartIcon} alt="cart" />&nbsp;Thêm giỏ hàng</button>
              <button className="qa-buy" onClick={() => { addToCart(true); nav('/checkout') }}>MUA NGAY</button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render into document.body using portal so modal sits above any stacking contexts
  return ReactDOM.createPortal(modal, document.body)
}

QuickAddPanel.propTypes = {
  product: PropTypes.object,
  image: PropTypes.string,
  onClose: PropTypes.func
}

export default QuickAddPanel
