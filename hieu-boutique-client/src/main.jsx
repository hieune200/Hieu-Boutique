import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'


import TopPromoBar from './components/TopPromoBar'
import Header from './components/Header'
import Footer from './components/Footer'

import { GlobalProvider } from './context/globalContext'
import ServerErrorModal from './components/ServerErrorModal'
import { router } from './utils/Router'
import { ToastProvider } from './components/ToastProvider'
import './assets/g-style/main.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastProvider>
      <GlobalProvider>
        <ServerErrorModal />
        <div className="top-stacked">
          <TopPromoBar />
          <Header />
        </div>
        <Routes>
          {
            router.map((value, index)=><Route path={value.path} element = {<value.element />} key = {index}/> )
          }
        </Routes>
        <Footer />
      </GlobalProvider>
    </ToastProvider>
  </BrowserRouter>
)
