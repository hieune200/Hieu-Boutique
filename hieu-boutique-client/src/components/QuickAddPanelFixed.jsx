import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from './ToastProvider'
import PropTypes from 'prop-types'
import cartIcon from '../assets/imgs/common/cart-icon.png'
import './componentStyle/ProductCard.scss'

export default function QuickAddPanelFixed({ product, image, onClose }) {
  const nav = useNavigate()
  const { showToast } = useToast()
  const oldPrice = product?.oldPrice || null
  const price = product?.price || 0
  const imgs = Array.isArray(product?.img) ? product.img : (product?.img ? [product.img] : [])
  const swatches = imgs.slice(0, 5)
  const sizes = Array.isArray(product?.size) ? product.size : []
  const colors = Array.isArray(product?.colors) ? product.colors : (product?.colors ? [product.colors] : [])
  const colorVal = (c) => {
    if (!c && c !== 0) return ''
    return (typeof c === 'string') ? c : (c.hex || c.name || c.value || '')
  }

  const colorNameMap = {
    'đen': '#000000', 'den': '#000000', 'black': '#000000',
    'trắng': '#ffffff', 'trang': '#ffffff', 'white': '#ffffff',
    'đỏ': '#d32f2f', 'do': '#d32f2f', 'red': '#d32f2f',
    'vàng': '#f2c94c', 'vang': '#f2c94c', 'yellow': '#f2c94c',
    'xanh': '#1976d2', 'xanh dương': '#1976d2', 'xanh lá': '#2e7d32', 'xanhla': '#2e7d32', 'green': '#2e7d32', 'blue': '#1976d2'
  }

  const resolveColorHex = (c) => {
    if (!c && c !== 0) return ''
    if (typeof c === 'string') {
      const s = c.trim()
      // hex-like
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s
      const key = s.toLowerCase()
      return colorNameMap[key] || ''
    }
    if (typeof c === 'object') {
      if (c.hex && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.hex)) return c.hex
      if (c.value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.value)) return c.value
      if (c.name) {
        const key = String(c.name).toLowerCase()
        return colorNameMap[key] || ''
      }
    }
    return ''
  }

  const [selectedIndex, setSelectedIndex] = useState(imgs.indexOf(image) >= 0 ? imgs.indexOf(image) : 0)
  const selectedImg = imgs[selectedIndex] || ''
  const [selectedSize, setSelectedSize] = useState(sizes[0] || '')
  const [selectedColor, setSelectedColor] = useState(colors[0] || '')
  const [quantity, setQuantity] = useState(1)

  const changeQty = (delta) => setQuantity(q => Math.max(1, q + delta))

  const addToCart = (andClose = true) => {
    const cart = JSON.parse(localStorage.getItem('cart')) || []
    const defaultSize = selectedSize || ''
    const defaultColor = colorVal(selectedColor)

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
    // notify header and other components and show toast; stay on page
    try{
      const cur = JSON.parse(localStorage.getItem('cart'))
      try{ window.dispatchEvent(new CustomEvent('hb_cart_updated', { detail: { cart: cur, ts: Date.now() } })) }catch(e){}
    }catch(e){}
    try{ showToast(`Đã thêm ${product?.title} vào giỏ hàng`, 'success') }catch(e){}
    if (andClose) onClose && onClose()
  }

  return (
    <div className="quickadd-panel" role="dialog" aria-modal="true">
      <div className="quickadd-backdrop" onClick={onClose} />
      <div className="quickadd-inner">
        <button className="quickadd-close" onClick={onClose}>✕</button>
        <div className="quickadd-grid">
          <div className="quickadd-image">
            <button className="qa-arrow qa-prev" onClick={() => setSelectedIndex((selectedIndex - 1 + imgs.length) % imgs.length)} aria-label="Prev image">‹</button>
            <img src={selectedImg || imgs[0] || ''} alt={product?.title} />
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
                    <img src={s} alt={`swatch-${i}`} />
                  </button>
                ))}
              </div>
            )}

            {colors.length > 0 && (
              <div className="qa-colors" style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 6, fontSize: 14, fontWeight: 600 }}>{
                  // show selected color name if available, otherwise generic label
                  (() => {
                    if (!selectedColor) return 'Màu:'
                    if (typeof selectedColor === 'string') return selectedColor
                    return selectedColor.name || selectedColor.label || colorVal(selectedColor) || 'Màu:'
                  })()
                }</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-start' }}>
                  {colors.map((c, i) => {
                    const val = colorVal(c)
                    const colorHex = resolveColorHex(c)
                    const displayName = (typeof c === 'string') ? c : (c.name || c.label || val)
                    const imgForColor = (typeof c === 'object' && c.img) ? c.img : null
                    const isActive = colorVal(selectedColor) === val
                    return (
                      <div key={i} className="color-item">
                        <button
                          onClick={() => {
                            setSelectedColor(c)
                            if (imgForColor) {
                              const idx = imgs.indexOf(imgForColor)
                              if (idx >= 0) setSelectedIndex(idx)
                            }
                          }}
                          className={"color-swatch" + (isActive ? ' active' : '')}
                            style={imgForColor ? {} : { background: colorHex || val }}
                          aria-label={displayName}
                        >
                          {imgForColor ? <img src={imgForColor} alt={displayName} /> : (<span className="color-dot" />)}
                        </button>
                        <div className="color-name">{displayName}</div>
                      </div>
                    )
                  })}
                </div>
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
                <button className="qa-buy" onClick={() => addToCart(true)}>MUA NGAY</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

QuickAddPanelFixed.propTypes = {
  product: PropTypes.object,
  image: PropTypes.string,
  onClose: PropTypes.func
}
