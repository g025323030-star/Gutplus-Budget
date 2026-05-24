import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SnapshotPage from './pages/SnapshotPage';
import ExpensesPage from './pages/ExpensesPage';
import IncomePage from './pages/IncomePage';
import WelcomePage from './pages/WelcomePage';
import './styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage key="login" />} />
          <Route path="/reset-password" element={<LoginPage key="reset-password" />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/welcome" element={<WelcomePage />} />
            <Route element={<Layout />}>
              <Route path="/snapshot" element={<SnapshotPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/income" element={<IncomePage />} />
            </Route>
            <Route path="/dashboard" element={<Navigate to="/snapshot" replace />} />
            <Route path="/" element={<Navigate to="/snapshot" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
