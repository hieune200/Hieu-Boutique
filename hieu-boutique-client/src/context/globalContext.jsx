import { createContext, useState } from "react";
import PropTypes from 'prop-types';

const globalContext = createContext();

const GlobalProvider = ({ children }) => {
    const initialUser = (localStorage.getItem("userID") || sessionStorage.getItem("userID") || null)
    const [ ctUserID, setCtUserID] = useState(initialUser);
    const [ serverError, setServerError ] = useState(null)
    const [ appliedCoupon, setAppliedCoupon ] = useState(() => {
        try{
            const raw = localStorage.getItem('appliedCoupon')
            return raw ? JSON.parse(raw) : null
        }catch(e){ console.warn('failed parse appliedCoupon', e); return null }
    })

    function getUserID (){
        setCtUserID(localStorage.getItem('userID') || sessionStorage.getItem('userID'))
    }

    function applyCoupon(couponObj){
        try{
            const payload = typeof couponObj === 'string' ? { code: couponObj } : couponObj
            localStorage.setItem('appliedCoupon', JSON.stringify(payload))
            setAppliedCoupon(payload)
        }catch(e){ console.warn('applyCoupon failed', e) }
    }

    function clearCoupon(){
        try{ localStorage.removeItem('appliedCoupon'); setAppliedCoupon(null) }catch(e){ console.warn('clearCoupon failed', e) }
    }

    const value = {
        ctUserID,
        getUserID
        , appliedCoupon, applyCoupon, clearCoupon
        , serverError, setServerError
    }

    return (
        <globalContext.Provider value={value} >
            {children}
        </globalContext.Provider>
    );
};

GlobalProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
  
// eslint-disable-next-line react-refresh/only-export-components
export { GlobalProvider, globalContext }