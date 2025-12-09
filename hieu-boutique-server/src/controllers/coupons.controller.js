const coupons = [
  { id: 'c50k', title: 'Giảm 50.000₫', sub: 'Đơn tối thiểu 899.000₫', code: 'HB50K', expiry: '2025-12-02', remaining: 283, discount: 50000 },
  { id: 'c20k', title: 'Giảm 20.000₫', sub: 'Đơn tối thiểu 400.000₫', code: 'HB20K', expiry: '2025-12-01', remaining: 32, discount: 20000 }
]

export const getCoupons = (req, res) => {
  // return a shallow copy to avoid accidental mutation
  res.json(coupons.map(c => ({ ...c })))
}

export const applyCoupon = (req, res) => {
  const { code } = req.body || {}
  if (!code) return res.status(400).json({ error: 'Missing code' })
  const found = coupons.find(c => c.code.toUpperCase() === String(code).toUpperCase())
  if (!found) return res.status(404).json({ error: 'Coupon not found' })

  // simple remaining decrement simulation
  if (found.remaining > 0) found.remaining = Math.max(0, found.remaining - 1)

  // return current coupon info
  return res.json({ id: found.id, code: found.code, discount: found.discount, title: found.title, expiry: found.expiry })
}
