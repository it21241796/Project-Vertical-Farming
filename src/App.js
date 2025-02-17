import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './Pages/authentication';
import Dashboard from './Pages/Dashboard';
//import Navbar from './Components/ui/Navbar';
import Footer from './Components/ui/footer';
import { ToastProvider } from './Components/ui/toast';
import AdminLogin from './Pages/adminlogin';
import AdminDashboard from './Pages/admindashboard';
import UserProfile from './Pages/userprofile';

const ProtectedRoute = ({ children }) => {
  const user = sessionStorage.getItem('user');
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const Layout = ({ children }) => {
  //const user = sessionStorage.getItem('user');
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-8 flex items-center justify-between">
      </div>
      {children}
      <Footer />
    </div>
  );
};

const App = () => {

  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route 
              path="/" 
              element={
                <AuthPage />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/userprofile" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
};
  
export default App;
