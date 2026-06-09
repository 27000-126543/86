import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import Purchase from './pages/Purchase';
import Kitchen from './pages/Kitchen';
import Maintenance from './pages/Maintenance';
import Logistics from './pages/Logistics';
import Inspection from './pages/Inspection';
import Recall from './pages/Recall';
import Members from './pages/Members';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import System from './pages/System';
import { Loading } from './components/Loading';

function ProtectedRoute({ children, minLevel }: { children: React.ReactNode; minLevel?: number }) {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return <Loading fullscreen type="spinner" />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (minLevel && user.roleLevel < minLevel) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function AppLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function AppRoutes() {
  const { user } = useAuthStore();
  
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={
          <ProtectedRoute minLevel={1}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="forecast" element={
          <ProtectedRoute minLevel={2}>
            <Forecast />
          </ProtectedRoute>
        } />
        
        <Route path="purchase" element={
          <ProtectedRoute minLevel={2}>
            <Purchase />
          </ProtectedRoute>
        } />
        
        <Route path="kitchen" element={
          <ProtectedRoute minLevel={2}>
            <Kitchen />
          </ProtectedRoute>
        } />
        
        <Route path="maintenance" element={
          <ProtectedRoute minLevel={2}>
            <Maintenance />
          </ProtectedRoute>
        } />
        
        <Route path="logistics" element={
          <ProtectedRoute minLevel={2}>
            <Logistics />
          </ProtectedRoute>
        } />
        
        <Route path="inspection" element={
          <ProtectedRoute minLevel={2}>
            <Inspection />
          </ProtectedRoute>
        } />
        
        <Route path="recall" element={
          <ProtectedRoute minLevel={2}>
            <Recall />
          </ProtectedRoute>
        } />
        
        <Route path="members" element={
          <ProtectedRoute minLevel={2}>
            <Members />
          </ProtectedRoute>
        } />
        
        <Route path="finance" element={
          <ProtectedRoute minLevel={4}>
            <Finance />
          </ProtectedRoute>
        } />
        
        <Route path="reports" element={
          <ProtectedRoute minLevel={3}>
            <Reports />
          </ProtectedRoute>
        } />
        
        <Route path="system" element={
          <ProtectedRoute minLevel={5}>
            <System />
          </ProtectedRoute>
        } />
        
        <Route path="production" element={
          <ProtectedRoute minLevel={2}>
            <Kitchen />
          </ProtectedRoute>
        } />
        
        <Route path="delivery" element={
          <ProtectedRoute minLevel={2}>
            <Logistics />
          </ProtectedRoute>
        } />
        
        <Route path="equipment" element={
          <ProtectedRoute minLevel={2}>
            <Maintenance />
          </ProtectedRoute>
        } />
        
        <Route path="stores" element={
          <ProtectedRoute minLevel={3}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="regions" element={
          <ProtectedRoute minLevel={4}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="alerts" element={
          <ProtectedRoute minLevel={2}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
