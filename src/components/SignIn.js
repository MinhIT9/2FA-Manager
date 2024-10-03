import React, { useState } from 'react';
import { auth } from '../firebaseConfig'; // Firebase config
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Đăng nhập thành công!');
      navigate('/home'); // Điều hướng về trang Home sau khi đăng nhập thành công
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Đăng nhập</h2>
      {error && <div className="alert alert-danger">{error}</div>}
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
