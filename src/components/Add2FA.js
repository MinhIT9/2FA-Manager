import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Add2FA = () => {
  const [title, setTitle] = useState('');
  const [secret, setSecret] = useState('');
  const [priority, setPriority] = useState(1000); // Mặc định là 1000
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Lấy giá trị priority thấp nhất khi tải trang
  useEffect(() => {
    const fetchPriorities = async () => {
      const querySnapshot = await getDocs(collection(db, '2fa-codes'));
      const fetchedCodes = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      if (fetchedCodes.length === 0) {
        setPriority(1000); // Nếu danh sách rỗng, mặc định priority là 1000
      } else {
        // Lấy giá trị priority nhỏ nhất và trừ đi 20
        const minPriority = Math.min(...fetchedCodes.map((code) => code.priority));
        const newPriority = Math.max(minPriority - 20, 0); // Không cho phép giá trị âm
        setPriority(newPriority);
      }
    };

    fetchPriorities();
  }, []);

  const handleAdd = async () => {
    if (!title || !secret) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    try {
      await addDoc(collection(db, '2fa-codes'), {
        title,
        secret,
        priority: Number(priority),
      });
      setTitle('');
      setSecret('');
      setPriority(1000); // Đặt lại giá trị priority mặc định sau khi thêm mã
      navigate('/home'); // Chuyển hướng về trang home sau khi thêm mã
    } catch (e) {
      setError('Lỗi khi thêm mã: ' + e.message);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-lg">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Thêm mã 2FA</h4>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="mb-3">
                <label htmlFor="title" className="form-label">Tiêu đề</label>
                <input
                  type="text"
                  id="title"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="secret" className="form-label">Khóa bí mật</label>
                <input
                  type="text"
                  id="secret"
                  className="form-control"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Nhập khóa bí mật"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="priority" className="form-label">Độ ưu tiên</label>
                <input
                  type="number"
                  id="priority"
                  className="form-control"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)} // Cho phép người dùng chỉnh sửa priority
                  placeholder="Nhập độ ưu tiên"
                />
              </div>
              <div className="d-grid">
                <button className="btn btn-primary" onClick={handleAdd}>
                  <i className="fas fa-plus-circle me-2"></i>Thêm mã
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Add2FA;
