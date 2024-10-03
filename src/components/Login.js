import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Xử lý đăng nhập
  const handleLogin = (e) => {
    e.preventDefault();
  
    // Thiết lập chế độ lưu trữ để giữ trạng thái đăng nhập khi tải lại trang
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        return signInWithEmailAndPassword(auth, email, password);
      })
      .then(() => {
        navigate('/home'); // Chuyển hướng sau khi đăng nhập
      })
      .catch((error) => {
        setError('Đăng nhập thất bại: ' + error.message);
      });
  };
  

  // Xử lý đăng xuất
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setUser(null); // Reset lại user khi đăng xuất
        navigate('/'); // Chuyển hướng về trang đăng nhập sau khi đăng xuất
      })
      .catch((error) => {
        console.error('Đăng xuất thất bại: ', error);
      });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-6">
          <h2>Đăng nhập</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Mật khẩu</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
            </div>
            <button type="submit" className="btn btn-primary">Đăng nhập</button>
          </form>
          {error && <p className="text-danger mt-2">{error}</p>}
          
          {/* Nút đăng xuất chỉ hiển thị khi người dùng đã đăng nhập */}
          {user && (
            <button onClick={handleLogout} className="btn btn-secondary mt-3">
              Đăng xuất
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
