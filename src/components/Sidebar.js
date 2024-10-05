import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import './Sidebar.css'; // Import CSS cho sidebar

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Lấy URL hiện tại
  const [isOpen, setIsOpen] = useState(false); // Trạng thái mở/đóng của sidebar
  const [userRole, setUserRole] = useState(''); // Quản lý role của người dùng

  // eslint-disable-next-line no-unused-vars
  const [categories, setCategories] = useState([]); // Quản lý danh mục

  // Lấy danh sách danh mục từ Firestore
  const fetchCategories = async () => {
    try {
      const userId = auth.currentUser.uid; // Lấy UID của user hiện tại
      const querySnapshot = await getDocs(collection(db, 'users', userId, 'categories')); // Lấy danh sách danh mục của người dùng
      const fetchedCategories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(fetchedCategories); // Cập nhật danh sách danh mục
    } catch (error) {
      console.error('Lỗi khi lấy danh mục:', error);
    }
  };

  const fetchUserRole = async () => {
    try {
      const userId = auth.currentUser.uid; // Lấy UID của user hiện tại
      const userDoc = await getDoc(doc(db, 'users', userId)); // Lấy thông tin user từ Firestore
      if (userDoc.exists()) {
        setUserRole(userDoc.data().Role); // Cập nhật state với giá trị role
      }
    } catch (error) {
      console.error('Lỗi khi lấy role người dùng:', error);
    }
  };
  

  useEffect(() => {
    if (auth.currentUser) {
      fetchCategories(); // Gọi hàm lấy danh mục khi người dùng đã đăng nhập
      fetchUserRole(); // Gọi hàm lấy role khi người dùng đã đăng nhập
    }
  }, []);

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
              to="/manage-2fa"
              className={`nav-link ${isActive('/manage-2fa') ? 'active-link' : ''}`}
              onClick={toggleSidebar}
            >
              <i className="fas fa-key"></i> Quản lý mã 2FA
            </Link>
          </li>


          {/* Quản lý danh mục */}
          <li className="nav-item">
            <Link
              to="/categories"
              className={`nav-link ${isActive('/categories') ? 'active-link' : ''}`} // Bôi đậm khi active
              onClick={toggleSidebar} // Đóng sidebar khi click
            >
              <i className="fas fa-folder-plus"></i> Thêm danh mục
            </Link>
          </li>

          {/* Kiểm tra và hiển thị danh mục nếu có */}
          {/* {categories.length > 0 ? (
            categories.map(category => (
              <li key={category.id} className="nav-item">
                <Link
                  to={`/category/${category.id}`}
                  className={`nav-link ${isActive(`/category/${category.id}`) ? 'active-link' : ''}`}
                  onClick={toggleSidebar}
                >
                  <i className="fas fa-folder"></i> {category.CategoryTitle}
                </Link>
              </li>
            ))
          ) : (
            <li className="nav-item">
              <span className="nav-link">Chưa có danh mục</span>
            </li>
          )} */}
        </ul>
        <hr />

        {/* Hiển thị email người dùng */}
        <div className="email-container p-3">
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>
            {auth.currentUser?.email}
          </span>
          <p>
            Role: 
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#555', marginLeft:'2px' }}>
              {userRole}
            </span>
          </p>
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
