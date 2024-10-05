import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Add2FA from './components/Add2FA';
import Sidebar from './components/Sidebar'; // Import Sidebar component
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import AddCategory from './components/AddCategory'; // Import AddCategory component
import { auth } from './firebaseConfig';
import Manage2FA from './components/Manage2FA';

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
              element={user ? <Navigate to="/home" /> : <SignIn />}
            />
            <Route
              path="/home"
              element={user ? <Home /> : <Navigate to="/" />}
            />
            <Route
              path="/add"
              element={user ? <Add2FA /> : <Navigate to="/" />}
            />
            <Route
              path="/categories"
              element={user ? <AddCategory /> : <Navigate to="/" />} // Thêm route mới cho quản lý Category
            />
            <Route
              path="/manage-2fa"
              element={user ? <Manage2FA /> : <Navigate to="/" />}
            />

            <Route
              path="/signup"
              element={<SignUp />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
