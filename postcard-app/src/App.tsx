import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SetupPage from './components/SetupPage';
import PostCardPage from './components/PostCardPage';
import { UserContext } from './context/UserContext';

interface UserData {
  name: string;
  email: string;
  handle: string;
  profileImage: string | null;
}

interface EmailCheckResult {
  allowed: boolean;
  remaining: number | 'unlimited';
  isCreator: boolean;
  hasUsedPostcard: boolean;
  message: string;
}

// Page transition wrapper component
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Reset animation on route change
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div 
      className={`page-transition ${isVisible ? 'page-visible' : 'page-hidden'}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
      }}
    >
      {children}
    </div>
  );
};

function App() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckResult | null>(null);

  return (
    <UserContext.Provider value={{ userData, setUserData, emailCheckResult, setEmailCheckResult }}>
      <Router>
        <div className="App">
          <PageTransition>
            <Routes>
              <Route path="/" element={<SetupPage />} />
              <Route 
                path="/postcard" 
                element={userData ? <PostCardPage /> : <Navigate to="/" replace />} 
              />
            </Routes>
          </PageTransition>
        </div>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
