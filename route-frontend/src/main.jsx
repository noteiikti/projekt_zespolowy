// Import SharedRoutePage można usunąć.
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Standardowe otwarcie strony */}
        <Route path="/" element={<App />} />
        
        {/* Otwarcie udostępnionej trasy (obsługuje ją ten sam komponent App) */}
        <Route path="/shared-route/:id" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)