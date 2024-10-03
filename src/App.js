import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import Add2FA from './components/Add2FA';
import Sidebar from './components/Sidebar'; // Import Sidebar component
import { auth } from './firebaseConfig';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="d-flex">
        {user && <Sidebar />} {/* Chỉ hiển thị Sidebar khi người dùng đã đăng nhập */}
        <div className="flex-grow-1">
          <Routes>
            <Route
              path="/"
              element={user ? <Navigate to="/home" /> : <Login />}
            />
            <Route
              path="/home"
              element={user ? <Home /> : <Navigate to="/" />}
            />
            <Route
              path="/add"
              element={user ? <Add2FA /> : <Navigate to="/" />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
