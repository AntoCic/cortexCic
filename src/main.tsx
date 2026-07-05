import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import './styles/main.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="top-center"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--surface-raised)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            fontWeight: 500,
            padding: '10px 14px',
            maxWidth: 380,
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
          error: { iconTheme: { primary: 'var(--danger)', secondary: '#fff' } },
          loading: { iconTheme: { primary: 'var(--primary)', secondary: '#fff' } },
        }}
      />
    </Provider>
  </StrictMode>,
);
