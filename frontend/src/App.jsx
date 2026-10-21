import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ActiveCars from './pages/ActiveCars';
import Subscribers from './pages/Subscribers';
import Devices from './pages/Devices';
import Tariffs from './pages/Tariffs';
import Logs from './pages/Logs';
import Login from './pages/Login';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#0084ff] border-t-transparent shadow-lg shadow-[#0084ff]/20"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
          Burgood yuklanmoqda...
        </p>
      </div>
    );
  }

  // Redirect to Login if not authenticated
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden bg-[#f1f5f9] text-[#0f172a]">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Right Content Space */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top AppBar */}
          <Header />

          {/* Main Pages Router */}
          <main className="flex-1 overflow-y-auto bg-[#f1f5f9]">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sessions" element={<ActiveCars />} />
              <Route path="/subscribers" element={<Subscribers />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/tariffs" element={<Tariffs />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
