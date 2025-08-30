




import React from 'react'
import Header from './components/Header'
import "./config/connection"
import { ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home';
import PropertyForm from './components/PropertyForm';
import KYCForm from './components/KYCForm';
import KycAdminPanel from './pages/AdminPanel';
import AllProperties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import UpdateProperty from './components/UpdateProperty';
import MyProperties from './pages/MyProperties'
import ThunderSuccess from './components/ThunderSuccess';
import About from './components/About';

const App = () => {
  return (
    <div>
      <Header />
 
      <Routes>
         <Route path="/" element={<Home />} />
        <Route path="/form" element={<PropertyForm />} />
        <Route path="/kyc" element={<KYCForm />} />
        <Route path="/properties" element={<AllProperties  />} />
        <Route path="/me" element={<MyProperties  />} />
        <Route path="/success" element={<ThunderSuccess />} />

        <Route path="/properties/:id/update" element={<UpdateProperty />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/dashboard" element={<KycAdminPanel />} /> 


      </Routes>
      <ToastContainer position='bottom-center' theme='dark'/>
    </div>
  )
}

export default App