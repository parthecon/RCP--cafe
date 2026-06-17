import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import OrderPage from './pages/OrderPage';
import ReceiptPage from './pages/ReceiptPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { generateTableSignature } from './utils/security';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect Root to Order Page */}
        <Route path="/" element={<Navigate to={`/order?table=1&token=${generateTableSignature(1)}`} replace />} />
        
        {/* Customer Facing */}
        <Route path="/order" element={<OrderPage />} />
        <Route path="/receipt/:orderId" element={<ReceiptPage />} />
        
        {/* Admin Facing */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#0f172a', // slate-900
            color: '#fff',
            border: '1px solid #1e293b', // slate-800
            borderRadius: '1rem',
            fontSize: '0.875rem',
            padding: '12px 18px',
          },
          success: {
            iconTheme: {
              primary: '#6366f1', // indigo-500
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
