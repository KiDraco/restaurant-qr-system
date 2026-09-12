import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import AdminApp from './AdminApp';
import Login from './pages/admin/Login';
import Dashboard from './components/admin/Dashboard';
import PendingRequests from './components/admin/PendingRequests';
import TableStatus from './components/admin/TableStatus';
import MenuManager from './components/admin/MenuManager';
import PromotionManager from './components/admin/PromotionManager';
import Statistics from './components/admin/Statistics';
import ThemesManager from './components/admin/ThemesManager';
import CanvasEditor from './pages/admin/CanvasEditor';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminApp />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="requests" element={<PendingRequests />} />
          <Route path="tables" element={<TableStatus />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="promotions" element={<PromotionManager />} />
          <Route path="themes" element={<ThemesManager />} />
          <Route path="stats" element={<Statistics />} />
          <Route path="themes/new" element={<CanvasEditor />} />
          <Route path="themes/:id/edit" element={<CanvasEditor />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
        <Route path="/table/:qrCode" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);