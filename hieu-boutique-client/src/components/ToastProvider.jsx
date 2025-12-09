/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import './componentStyle/ToastProvider.scss'

const ToastContext = createContext({ showToast: () => {} })

export const useToast = () => useContext(ToastContext)

const Icon = ({ type }) => {
  if (type === 'success') return (
    <svg className="hb-toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (type === 'error') return (
    <svg className="hb-toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  return (
    <svg className="hb-toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M13 16h-1v-4h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((text = '', type = 'info', ttl = 3600) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl)
  }, [])

  const removeToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="hb-toast-root" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`hb-toast ${t.type || 'info'}`} role="status">
            <div className="hb-toast-left"><Icon type={t.type} /></div>
            <div className="hb-toast-body">{t.text}</div>
            <button aria-label="Close notification" className="hb-toast-close" onClick={() => removeToast(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
