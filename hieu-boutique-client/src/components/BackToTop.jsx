import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './componentStyle/BackToTop.scss'

const BackToTop = ()=>{
  const [visible, setVisible] = useState(false)
  const location = useLocation()

  useEffect(()=>{
    function onScroll(){
      const y = window.scrollY || window.pageYOffset
      setVisible(y > 300)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return ()=> window.removeEventListener('scroll', onScroll)
  },[])

  // Don't show on login/register pages
  const path = (location && location.pathname) || ''
  if (/^\/login/.test(path) || /^\/register/.test(path)) return null

  return (
    <button
      className={"back-to-top" + (visible ? ' visible' : '')}
      aria-label="Lên đầu trang"
      onClick={()=> window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8l-6 6h12l-6-6z" fill="#fff"/></svg>
    </button>
  )
}

export default BackToTop
