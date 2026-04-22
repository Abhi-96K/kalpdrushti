import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import CreatePrompt from './pages/CreatePrompt';
import Processing from './pages/Processing';
import Result from './pages/Result';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import About from './pages/About';
import Premium from './pages/Premium';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <div className="bg-mesh">
        <div className="bg-aurora aurora-1"></div>
        <div className="bg-aurora aurora-2"></div>
        <div className="bg-aurora aurora-3"></div>
      </div>
      <div className="app-wrapper">
        <Header />
        <main className="main-content container">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/create" element={<CreatePrompt />} />
            <Route path="/processing/:id" element={<Processing />} />
            <Route path="/result/:id" element={<Result />} />
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              )}
            />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
