import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 font-sans antialiased text-slate-200">
        <AppRoutes />
        <Toaster position="top-right" expand={false} richColors />
      </div>
    </Router>
  );
}

export default App;
