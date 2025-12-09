import { useState, useRef, useEffect } from 'react'
import './componentStyle/ForgotPasswordModal.scss'
import { forgotPasswordRequest, resetPassword } from '../services/Auth.api'
import { useToast } from './ToastProvider'

const ForgotPasswordModal = ({ open, onClose }) => {
  const { showToast } = useToast()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const CODE_LENGTH = 6
  const [codeDigits, setCodeDigits] = useState(Array(CODE_LENGTH).fill(''))
  const codeRefs = useRef([])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [resendAttempts, setResendAttempts] = useState(0)
  const MAX_RESEND = 3

  // render is conditional on `open` below; keep all hooks declared above this check

  const sendEmail = async () => {
    setEmailError('')
    if (!email) { setEmailError('Vui lòng nhập email'); return }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i
    if (!emailRe.test(String(email).toLowerCase())) { setEmailError('Vui lòng nhập email hợp lệ'); return }
    setSubmitting(true)
    const res = await forgotPasswordRequest({ email })
    setSubmitting(false)
    // Only proceed to step 2 when the server explicitly confirms a code was sent.
    // Some servers may return 200 even when the email isn't registered; prefer an explicit flag
    // or a clear success message. Otherwise show an inline error and stay on step 1.
    const okStatus = res && res.status && (res.status === 200 || res.status === 201)
    const explicitSent = okStatus && (res.emailSent === true || res.sent === true || /gửi|sent|đã gửi/i.test(res.message || ''))
    if (explicitSent) {
      showToast(res.message || 'Đã gửi mã xác minh tới email của bạn', 'success')
      setCodeDigits(Array(CODE_LENGTH).fill(''))
      setCodeError('')
      setPassword('')
      setConfirmPassword('')
      setResendAttempts(0)
      setSecondsLeft(60)
      setStep(2)
    } else if (okStatus && !explicitSent) {
      // server returned generic OK but didn't confirm sending a code — show message inline
      const msg = res && res.message ? res.message : 'Không thể gửi mã. Vui lòng kiểm tra email và thử lại.'
      setEmailError(msg)
      showToast(msg, 'error')
    } else {
      const msg = res && res.message ? res.message : 'Không thể gửi email. Vui lòng thử lại'
      setEmailError(msg)
      showToast(msg, 'error')
    }
  }

  const doReset = async () => {
    setCodeError('')
    setPasswordError('')
    const code = codeDigits.join('')
    if (!code || code.length !== CODE_LENGTH) { setCodeError('Vui lòng nhập mã xác minh đầy đủ'); return }
    if (!password) { setPasswordError('Vui lòng nhập mật khẩu mới'); return }
    if (!confirmPassword) { setPasswordError('Vui lòng xác nhận mật khẩu mới'); return }
    if (password !== confirmPassword) { setPasswordError('Mật khẩu xác nhận không khớp'); return }
    setSubmitting(true)
    const res = await resetPassword({ email, code, password })
    setSubmitting(false)
    if (res && res.status === 200){
      showToast(res.message || 'Đổi mật khẩu thành công', 'success')
      onClose()
    } else {
      setCodeError(res.message || 'Mã xác minh sai hoặc đã hết hạn')
      showToast(res.message || 'Không thể đổi mật khẩu. Mã xác minh có thể sai hoặc đã hết hạn.', 'error')
    }
  }

  const resendCode = async () => {
    if (resendAttempts >= MAX_RESEND) { showToast('Bạn đã vượt quá số lần gửi lại', 'error'); return }
    setSubmitting(true)
    const res = await forgotPasswordRequest({ email })
    setSubmitting(false)
    const okStatus = res && res.status && (res.status === 200 || res.status === 201)
    const explicitSent = okStatus && (res.emailSent === true || res.sent === true || /gửi|sent|đã gửi/i.test(res.message || ''))
    if (explicitSent) {
      setResendAttempts(prev => prev + 1)
      setSecondsLeft(60)
      showToast(res.message || 'Đã gửi lại mã xác minh', 'success')
    } else if (okStatus && !explicitSent) {
      const msg = res && res.message ? res.message : 'Không thể gửi lại mã. Vui lòng kiểm tra email.'
      setEmailError(msg)
      showToast(msg, 'error')
    } else {
      const msg = res && res.message ? res.message : 'Không thể gửi lại mã. Vui lòng thử sau'
      showToast(msg, 'error')
    }
  }

  useEffect(()=>{
    if (secondsLeft <= 0) return
    const t = setInterval(()=> setSecondsLeft(s => {
      if (s <= 1){ clearInterval(t); return 0 }
      return s - 1
    }), 1000)
    return ()=> clearInterval(t)
  }, [secondsLeft])

  useEffect(()=>{
    if (step === 2){ setTimeout(()=>{ codeRefs.current[0]?.focus() }, 80) }
  }, [step])

  const handleDigitChange = (index, val) => {
    if (!/^[0-9]?$/.test(val)) return
    const next = [...codeDigits]
    next[index] = val
    setCodeDigits(next)
    if (val && index < CODE_LENGTH - 1){ codeRefs.current[index+1]?.focus() }
  }

  const handleDigitKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0){ codeRefs.current[index-1]?.focus() }
    if (e.key === 'ArrowLeft' && index > 0){ codeRefs.current[index-1]?.focus() }
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1){ codeRefs.current[index+1]?.focus() }
  }

  if (!open) return null

  return (
    <div className="forgot-overlay" role="dialog" aria-modal>
      <div className="forgot-modal">
        <header className="forgot-header">
          <h3>Quên mật khẩu</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </header>
        <div className="forgot-body">
          {step === 1 && (
            <div className="step">
              <p>Nhập email đã đăng ký để nhận mã xác minh qua email.</p>
              <input type="email" placeholder="Email của bạn" value={email} onChange={e=>{ setEmail(e.target.value); setEmailError('') }} />
              {emailError && <div className="inline-error">{emailError}</div>}
              <button className="btn-primary" onClick={sendEmail} disabled={submitting}>{submitting? 'Đang gửi...' : 'Gửi mã'}</button>
            </div>
          )}
          {step === 2 && (
            <div className="step">
              <p>Nhập mã xác minh đã nhận và đặt mật khẩu mới.</p>
              <div className="code-box">
                {codeDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => codeRefs.current[i] = el}
                    value={d}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    onChange={e => handleDigitChange(i, e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={e => handleDigitKeyDown(e, i)}
                  />
                ))}
              </div>
              {codeError && <div className="inline-error">{codeError}</div>}
              <div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'center'}}>
                <button className="btn-primary" onClick={doReset} disabled={submitting}>{submitting? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</button>
                <button className="btn-primary" onClick={resendCode} disabled={secondsLeft>0 || submitting || resendAttempts>=MAX_RESEND} style={{background:'transparent',color:'var(--brand-red)',boxShadow:'none',border:'none'}}>
                  { secondsLeft>0 ? `Gửi lại (${secondsLeft}s)` : (resendAttempts>=MAX_RESEND ? 'Đã quá số lần' : 'Gửi lại mã') }
                </button>
              </div>
              <input placeholder="Mật khẩu mới" type="password" value={password} onChange={e=>{ setPassword(e.target.value); setPasswordError('') }} />
              <input placeholder="Xác nhận mật khẩu mới" type="password" value={confirmPassword} onChange={e=>{ setConfirmPassword(e.target.value); setPasswordError('') }} />
              {passwordError && <div className="inline-error">{passwordError}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordModal
