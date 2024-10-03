import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css'; // Import CSS cho sidebar

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Lấy URL hiện tại
  const [isOpen, setIsOpen] = useState(false); // Trạng thái mở/đóng của sidebar

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        navigate('/');
      })
      .catch((error) => {
        console.error('Lỗi khi đăng xuất: ', error);
      });
  };

  // Hàm xử lý mở/đóng sidebar
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Hàm để kiểm tra xem đường dẫn hiện tại có trùng với đường dẫn của một nút hay không
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Nút mở sidebar trên thiết bị nhỏ */}
      <button
        className="btn btn-light d-md-none"
        style={{ position: 'fixed', top: '10px', left: '10px', zIndex: '999' }}
        onClick={toggleSidebar}
      >
        <i className="fas fa-bars"></i> {/* Biểu tượng hamburger từ Font Awesome */}
      </button>

      {/* Sidebar */}
      <div
        className={`sidebar bg-light d-flex flex-column ${isOpen ? 'sidebar-open' : 'sidebar-closed'} d-md-block`}
      >
        <h4 className="p-3">Quản lý 2FA</h4>
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item">
            <Link
              to="/home"
              className={`nav-link ${isActive('/home') ? 'active-link' : ''}`} // Bôi đậm khi active
              onClick={toggleSidebar} // Đóng sidebar khi click
            >
              <i className="fas fa-home"></i> Home
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/add"
              className={`nav-link ${isActive('/add') ? 'active-link' : ''}`} // Bôi đậm khi active
              onClick={toggleSidebar} // Đóng sidebar khi click
            >
              <i className="fas fa-plus"></i> Thêm mã 2FA
            </Link>
          </li>
        </ul>
        <hr />

        {/* Hiển thị email người dùng */}
        <div className="email-container p-3">
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>
            {auth.currentUser?.email}
          </span>
        </div>

        {/* Nút logout di chuyển xuống cuối */}
        <button className="btn btn-danger mt-auto mb-3 p-2" onClick={handleLogout} style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto' }}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      {/* Nền mờ khi sidebar mở trên thiết bị nhỏ */}
      {isOpen && <div className="overlay" onClick={toggleSidebar} />}
    </>
  );
};

export default Sidebar;
