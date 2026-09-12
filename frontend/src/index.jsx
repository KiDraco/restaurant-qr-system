import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import AdminApp from './AdminApp';
import Login from './pages/admin/Login';
import CanvasEditor from './pages/admin/CanvasEditor';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="/admin/themes/new" element={<AdminApp />} />
        <Route path="/admin/themes/:id/edit" element={<AdminApp />} />
        <Route path="/table/:qrCode" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);