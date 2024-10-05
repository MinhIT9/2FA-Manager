import React, { useState } from 'react';
import { auth } from '../firebaseConfig'; // Firebase config
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState(''); // Quản lý trạng thái email
  const [password, setPassword] = useState(''); // Quản lý trạng thái password
  const [error, setError] = useState(''); // Quản lý thông báo lỗi
  const [successMessage, setSuccessMessage] = useState(''); // Quản lý thông báo thành công
  const navigate = useNavigate(); // Điều hướng người dùng

  // Hàm xử lý đăng nhập
  const handleSignIn = async () => {
    try {
      // Firebase Auth - đăng nhập với email và password
      await signInWithEmailAndPassword(auth, email, password);

      // Thông báo đăng nhập thành công
      setSuccessMessage('Đăng nhập thành công!');
      setError(''); // Xóa thông báo lỗi

      // Sau 2 giây chuyển hướng về trang Home
      setTimeout(() => {
        navigate('/home');
      }, 2000); // Đợi 2 giây trước khi chuyển hướng để người dùng thấy thông báo
    } catch (err) {
      // Thông báo khi đăng nhập thất bại
      setError('Đăng nhập thất bại: ' + err.message);
      setSuccessMessage(''); // Xóa thông báo thành công
    }
  };

  return (
    <div className="container mt-5">
      <h2>Đăng nhập</h2>
      
      {/* Hiển thị thông báo lỗi nếu có */}
      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* Hiển thị thông báo thành công nếu có */}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      
      {/* Input email */}
      <input 
        type="email" 
        placeholder="Email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        className="form-control mb-3"
      />

      {/* Input password */}
      <input 
        type="password" 
        placeholder="Mật khẩu" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        className="form-control mb-3"
      />

      {/* Nút đăng nhập */}
      <button onClick={handleSignIn} className="btn btn-primary mb-3">Đăng nhập</button>
      
      {/* Liên kết tới trang đăng ký */}
      <p>Bạn chưa có tài khoản? <Link to="/signup">Đăng ký</Link></p>
    </div>
  );
};

export default SignIn;
