import { createContext, useState } from "react";
import PropTypes from 'prop-types';

const globalContext = createContext();

const GlobalProvider = ({ children }) => {
    const [ ctUserID, setCtUserID] = useState(sessionStorage.getItem("userID"));

    function getUserID (){
        setCtUserID(sessionStorage.getItem("userID"))
    }

    const value = {
        ctUserID,
        getUserID
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
  
export { GlobalProvider, globalContext }