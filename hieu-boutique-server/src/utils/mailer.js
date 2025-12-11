import nodemailer from 'nodemailer'
import logger from './logger.js'

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465
const SMTP_SECURE = (process.env.SMTP_SECURE || 'true') === 'true'
const SMTP_USER = process.env.SMTP_USER || process.env.SMTP_EMAIL || process.env.MAIL_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASS || ''
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'no-reply@example.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || FROM_EMAIL

let transporter = null
function getTransporter(){
    if (transporter) return transporter
    try{
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE,
            auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
        })
    }catch(e){ logger.error('failed to create transporter', e) }
    return transporter
}

function buildOrderHtml(order){
    const items = Array.isArray(order.orderList) ? order.orderList.map(it => `
        <tr>
            <td style="padding:8px;border:1px solid #eee">${it.title || ''}</td>
            <td style="padding:8px;border:1px solid #eee">${it.quantity || 0}</td>
            <td style="padding:8px;border:1px solid #eee">${Number(it.unitPrice||0).toLocaleString()} ₫</td>
            <td style="padding:8px;border:1px solid #eee">${Number((it.unitPrice||0) * (it.quantity||0)).toLocaleString()} ₫</td>
        </tr>
    `).join('\n') : ''

    const html = `
    <div style="font-family:Arial, Helvetica, sans-serif; color:#222">
      <h2>Hóa đơn đơn hàng ${order.orderCode || ''}</h2>
      <p>Ngày: ${order.orderDay || ''}</p>
      <h3>Thông tin giao hàng</h3>
      <p>${order.shipping?.name || ''} — ${order.shipping?.phoneNumber || ''}</p>
      <p>${order.shipping?.email || ''}</p>
      <p>${order.shipping?.address || ''}</p>
      <h3>Chi tiết đơn hàng</h3>
      <table style="border-collapse:collapse;width:100%">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #eee;text-align:left">Sản phẩm</th>
            <th style="padding:8px;border:1px solid #eee">SL</th>
            <th style="padding:8px;border:1px solid #eee">Đơn giá</th>
            <th style="padding:8px;border:1px solid #eee">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${items}
        </tbody>
      </table>
      <h3>Tổng</h3>
      <p>Tiền hàng: ${Number(order.subtotal||0).toLocaleString()} ₫</p>
      <p>Giảm giá: ${Number(order.couponDiscount||0).toLocaleString()} ₫</p>
      <p>Phí vận chuyển: ${Number(order.shippingFee||0).toLocaleString()} ₫</p>
      <p><strong>Tổng thanh toán: ${Number(order.finalTotal||0).toLocaleString()} ₫</strong></p>
      <p>Trạng thái: ${order.orderStatus || 'pending'}</p>
      <hr />
      <p>Xin cảm ơn bạn đã mua hàng.</p>
    </div>
  `
    return html
}

export async function sendOrderConfirmationEmail(toEmail, order, opts = {}){
    const transport = getTransporter()
    if (!transport) {
        logger.warn('No mail transporter available, skipping sendOrderConfirmationEmail')
        return
    }
    const html = buildOrderHtml(order)
    const subject = `Hóa đơn đơn hàng ${order.orderCode || ''}`
    const mailOptions = {
        from: FROM_EMAIL,
        to: toEmail,
        bcc: opts.bcc || undefined,
        subject,
        html
    }
    try{
        const info = await transport.sendMail(mailOptions)
        logger.info('order confirmation sent', { to: toEmail, messageId: info.messageId })
    }catch(err){
        logger.error('sendOrderConfirmationEmail failed', err)
        throw err
    }
}

export async function notifyAdminOfOrder(order){
    const admin = ADMIN_EMAIL
    if (!admin) return
    try{
        await sendOrderConfirmationEmail(admin, order, { bcc: undefined })
    }catch(e){ logger.error('notifyAdminOfOrder failed', e) }
}

export async function sendContactEmail(toEmail, payload){
    const transport = getTransporter()
    if (!transport) {
        logger.warn('No mail transporter available, skipping sendContactEmail')
        return
    }
    const subject = payload.subject || `Liên hệ từ khách hàng về ${payload.orderCode || ''}`
    const html = `
      <div style="font-family:Arial, Helvetica, sans-serif; color:#222">
        <h3>Liên hệ từ khách hàng</h3>
        <p><strong>Đơn hàng:</strong> ${payload.orderCode || ''}</p>
        <p><strong>Khách hàng:</strong> ${payload.name || ''} — ${payload.phone || ''}</p>
        <p><strong>Email khách:</strong> ${payload.email || ''}</p>
        <h4>Nội dung</h4>
        <div style="white-space:pre-wrap">${payload.message || ''}</div>
      </div>
    `
    const mailOptions = {
        from: FROM_EMAIL,
        to: toEmail,
        subject,
        html
    }
    try{
        const info = await transport.sendMail(mailOptions)
        logger.info('contact email sent', { to: toEmail, messageId: info.messageId })
    }catch(err){
        logger.error('sendContactEmail failed', err)
        throw err
    }
}

export default { sendOrderConfirmationEmail, notifyAdminOfOrder }
