import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#080808] font-sans antialiased text-[#fafafa]">
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={({
            style: {
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.10)',
              color: '#fafafa',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: 'Geist, sans-serif',
            },
            classNames: {
              toast: 'glass-card border border-white/[0.08] backdrop-blur-md',
              title: 'text-[#fafafa] font-bold tracking-tight',
              description: 'text-[#a1a1a1]',
              success: '!bg-emerald-500/10 !border-emerald-500/20 !text-emerald-400',
              error: '!bg-red-500/10 !border-red-500/20 !text-red-400',
              warning: '!bg-amber-500/10 !border-amber-500/20 !text-amber-400',
              info: '!bg-blue-500/10 !border-blue-500/20 !text-blue-400',
            }
          } as any)}
        />
      </div>
    </Router>
  );
}

export default App;

