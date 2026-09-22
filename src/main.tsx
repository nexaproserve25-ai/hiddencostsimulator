import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from '@/context/AuthContext';
import { PaymentProvider } from '@/context/PaymentContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <PaymentProvider>
        <App />
      </PaymentProvider>
    </AuthProvider>
  </StrictMode>
);
