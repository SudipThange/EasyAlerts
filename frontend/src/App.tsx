import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import DetectHazard from './pages/DetectHazard';
import History from './pages/History';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/how-to-use" element={<Navigate to="/#how-it-works" replace />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/detect"
                element={(
                  <ProtectedRoute>
                    <DetectHazard />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/history"
                element={(
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                )}
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
