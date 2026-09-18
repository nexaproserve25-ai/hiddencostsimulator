import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PaymentProvider } from '@/context/PaymentContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PaymentProvider>
      <App />
    </PaymentProvider>
  </StrictMode>
);
