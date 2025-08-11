import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SetupPage from './components/SetupPage';
import PostCardPage from './components/PostCardPage';
import { UserContext } from './context/UserContext';
import { useState } from 'react';

interface UserData {
  name: string;
  handle: string;
  profileImage: string | null;
}

function App() {
  const [userData, setUserData] = useState<UserData | null>(null);

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<SetupPage />} />
            <Route 
              path="/postcard" 
              element={userData ? <PostCardPage /> : <Navigate to="/" replace />} 
            />
          </Routes>
        </div>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
