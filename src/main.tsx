import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from '@/context/auth-context';
import { GlobalContextProvider } from '@/context/global-context';
import { AttendanceProvider } from '@/context/attendance-context';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <GlobalContextProvider>
          <AuthProvider>
            <AttendanceProvider>
              <App />
              <Toaster position="top-center" />
            </AttendanceProvider>
          </AuthProvider>
        </GlobalContextProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
