import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Schedule from './pages/Schedule';
import Sessions from './pages/Sessions';
import Calendar from './pages/Calendar';
import Import from './pages/Import';
import Assistant from './pages/Assistant';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';

const protect = (el) => <ProtectedRoute>{el}</ProtectedRoute>;
const page = (el) => <PageTransition>{el}</PageTransition>;

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={page(<Landing />)} />
        <Route path="/login" element={page(<Login />)} />
        <Route path="/register" element={page(<Register />)} />
        <Route path="/dashboard" element={page(protect(<Dashboard />))} />
        <Route path="/subjects" element={page(protect(<Subjects />))} />
        <Route path="/schedule" element={page(protect(<Schedule />))} />
        <Route path="/sessions" element={page(protect(<Sessions />))} />
        <Route path="/calendar" element={page(protect(<Calendar />))} />
        <Route path="/import" element={page(protect(<Import />))} />
        <Route path="/assistant" element={page(protect(<Assistant />))} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
