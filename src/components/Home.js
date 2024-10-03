import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { TOTP } from 'otpauth'; // Import TOTP từ otpauth
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './Home.css';

const Home = () => {
  const [codes, setCodes] = useState([]);
  const [copied, setCopied] = useState(null); // Để theo dõi trạng thái sao chép
  const [codeToDelete, setCodeToDelete] = useState(null); // Mã cần xóa
  const [showDeletePopup, setShowDeletePopup] = useState(false); // Hiển thị popup xác nhận
  const [timeLeft, setTimeLeft] = useState(30); // Thời gian đếm ngược

  // Lấy danh sách mã 2FA cho user hiện tại
  const fetch2FACodes = async () => {
    if (!auth.currentUser) {
      console.error("User not logged in");
      return;
    }

    const userId = auth.currentUser.uid; // Lấy UID của user hiện tại
    const querySnapshot = await getDocs(collection(db, 'users', userId, '2fa-codes')); // Lấy mã 2FA từ collection riêng của user

    let fetchedCodes = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    // Sắp xếp danh sách theo priority (ưu tiên tăng dần)
    fetchedCodes = fetchedCodes.sort((a, b) => a.priority - b.priority);

    setCodes(fetchedCodes);
  };

  // Tạo mã 2FA từ secret key sử dụng otpauth
  const generateOTP = (secret) => {
    const totp = new TOTP({
      secret: secret,  // Secret key của mã 2FA (cần ở định dạng Base32)
      digits: 6,       // Số chữ số của mã 2FA
      period: 30       // Thời gian chu kỳ là 30 giây
    });

    // Tạo mã OTP
    return totp.generate();
  };

  // Cập nhật thời gian đếm ngược
  const calculateTimeLeft = () => {
    const epoch = Math.floor(Date.now() / 1000); // Lấy thời gian hiện tại theo giây
    const timeRemaining = 30 - (epoch % 30); // Phần dư của thời gian trong chu kỳ 30 giây
    return timeRemaining;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000); // Cập nhật mỗi giây

    return () => clearInterval(interval); // Hủy bỏ bộ đếm thời gian khi component unmount
  }, []);

  // Hàm xử lý sao chép
  const handleCopy = (codeId) => {
    setCopied(codeId); // Đặt trạng thái đã sao chép
    setTimeout(() => setCopied(null), 2000); // Sau 2 giây, reset lại trạng thái
  };

  // Hàm hiển thị popup xác nhận xóa
  const confirmDelete = (codeId) => {
    setCodeToDelete(codeId);
    setShowDeletePopup(true); // Hiển thị popup
  };

  // Hàm xử lý xóa
  const handleDelete = async () => {
    try {
      const userId = auth.currentUser.uid; // Lấy UID của user hiện tại
      await deleteDoc(doc(db, 'users', userId, '2fa-codes', codeToDelete)); // Xóa mã 2FA từ collection riêng của user
      setShowDeletePopup(false); // Đóng popup sau khi xóa
      fetch2FACodes(); // Tải lại danh sách sau khi xóa
    } catch (error) {
      console.error("Lỗi khi xóa: ", error);
    }
  };

  useEffect(() => {
    fetch2FACodes(); // Lấy danh sách mã 2FA khi trang được load lần đầu
  }, []);

  return (
    <div className="container mt-5">
      <h2>Danh sách mã 2FA</h2>
      <Link to="/add" className="btn btn-success mb-3">Thêm mã 2FA mới</Link>
      <ul className="list-group">
        {codes.map((code) => {
          const otp = generateOTP(code.secret); // Tạo mã OTP

          return (
            <li key={code.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <p><strong>Title:</strong> {code.title}</p>
                <p>
                  <strong>2FA Code:  </strong>
                  <CopyToClipboard text={otp} onCopy={() => handleCopy(code.id)}>
                    <span style={{ cursor: 'pointer', color: 'red' }} title="Click để sao chép">
                      {otp} <i className="fa-solid fa-copy" style={{ marginLeft: '5px' }}></i>
                    </span>
                  </CopyToClipboard>

                  {/* Thời gian đếm ngược thiết kế lại */}
                  <span className="badge countdown-timer" style={{ marginLeft: '10px' }}>
                    {timeLeft} giây
                  </span>
                </p>
                <p><strong>Priority:</strong> {code.priority}</p>
              </div>

              {/* Thông báo khi sao chép */}
              {
                copied === code.id && (
                  <div style={popupStyle}>
                    <span>Đã sao chép!</span>
                  </div>
                )
              }

              <button className="btn btn-danger" onClick={() => confirmDelete(code.id)}>Xóa</button>
            </li>
          );
        })}
      </ul>

      {/* Popup xác nhận xóa */}
      {
        showDeletePopup && (
          <div className="popup">
            <div className="popup-content">
              <h5>Bạn có chắc chắn muốn xóa?</h5>
              <button className="btn btn-danger me-3" onClick={handleDelete}>Xóa</button>
              <button className="btn btn-secondary" onClick={() => setShowDeletePopup(false)}>Không</button>
            </div>
          </div>
        )
      }
    </div >
  );
};

const popupStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#d4edda',
  padding: '5px 10px',
  borderRadius: '5px',
  color: '#155724',
  fontSize: '12px',
  boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
  zIndex: 1,
};

export default Home;
