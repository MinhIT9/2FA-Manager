import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig'; // Firebase config
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom'; // Thêm Link để điều hướng

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Thêm trường xác nhận mật khẩu
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Dùng để điều hướng người dùng

  const handleSignUp = async () => {
    // Kiểm tra mật khẩu và xác nhận mật khẩu
    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Lưu thông tin người dùng vào Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date(),
      });
      
      alert('Đăng ký thành công!');
      navigate('/home'); // Điều hướng tới trang home sau khi đăng ký thành công
    } catch (err) {
      setError(err.message); // Hiển thị lỗi
    }
  };

  return (
    <div className="container mt-5">
      <h2>Đăng ký</h2>
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
        placeholder="Mật khẩu" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        className="form-control mb-3"
      />
      <input 
        type="password" 
        placeholder="Xác nhận mật khẩu" 
        value={confirmPassword} 
        onChange={(e) => setConfirmPassword(e.target.value)} 
        className="form-control mb-3"
      />
      
      <button onClick={handleSignUp} className="btn btn-primary mb-3">Đăng ký</button>
      
      {/* Thêm liên kết tới trang đăng nhập */}
      <p>Đã có tài khoản? <Link to="/">Đăng nhập</Link></p>
    </div>
  );
};

export default SignUp;
