import React, { useState } from 'react';
import { auth } from '../firebaseConfig'; // Firebase config
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Thêm trạng thái để quản lý thông báo thành công
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMessage('Đăng nhập thành công!'); // Cập nhật thông báo thành công
      setError(''); // Xóa thông báo lỗi
      setTimeout(() => {
        navigate('/home'); // Điều hướng về trang Home sau khi đăng nhập thành công
      }, 2000); // Đợi 2 giây trước khi điều hướng để người dùng thấy thông báo
    } catch (err) {
      setError('Đăng nhập thất bại: ' + err.message); // Cập nhật thông báo lỗi
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
      
      <input 
        type="email" 
        placeholder="Email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        className="form-control mb-3"
      />
      <input 
        type="password" 
        placeholder="Password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        className="form-control mb-3"
      />
      <button onClick={handleSignIn} className="btn btn-primary mb-3">Đăng nhập</button>
      
      {/* Thêm liên kết tới trang đăng ký */}
      <p>Bạn chưa có tài khoản? <Link to="/signup">Đăng ký</Link></p>
    </div>
  );
};

export default SignIn;
