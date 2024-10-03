import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { TOTP } from 'otpauth'; // Import TOTP từ otpauth
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './Home.css';

const Home = () => {
  const [codes, setCodes] = useState([]); // Lưu danh sách mã 2FA
  const [copied, setCopied] = useState(null); // Theo dõi trạng thái sao chép mã
  const [codeToDelete, setCodeToDelete] = useState(null); // Mã cần xóa
  const [showDeletePopup, setShowDeletePopup] = useState(false); // Hiển thị popup xác nhận
  const [timeLeft, setTimeLeft] = useState(30); // Thời gian đếm ngược

  // Lấy danh sách mã 2FA của user hiện tại từ Firestore
  const fetch2FACodes = async () => {
    if (!auth.currentUser) {
      console.error("User not logged in");
      return;
    }

    const userId = auth.currentUser.uid; // Lấy UID của user hiện tại
    const querySnapshot = await getDocs(collection(db, 'users', userId, '2fa-codes')); // Lấy mã 2FA từ collection riêng của user

    let fetchedCodes = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    // Sắp xếp danh sách theo priority (ưu tiên tăng dần)
    fetchedCodes = fetchedCodes.sort((a, b) => Number(a.priority) - Number(b.priority));

    setCodes(fetchedCodes); // Cập nhật danh sách mã
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

  // Hàm xử lý sao chép mã
  const handleCopy = (codeId) => {
    setCopied(codeId); // Đánh dấu mã đã được sao chép
    setTimeout(() => setCopied(null), 2000); // Sau 2 giây, reset lại trạng thái sao chép
  };

  // Hàm hiển thị popup xác nhận xóa
  const confirmDelete = (codeId) => {
    setCodeToDelete(codeId);
    setShowDeletePopup(true); // Hiển thị popup xác nhận xóa
  };

  // Hàm xử lý xóa mã
  const handleDelete = async () => {
    try {
      const userId = auth.currentUser.uid; // Lấy UID của user hiện tại
      await deleteDoc(doc(db, 'users', userId, '2fa-codes', codeToDelete)); // Xóa mã từ Firestore
      setShowDeletePopup(false); // Đóng popup sau khi xóa
      fetch2FACodes(); // Tải lại danh sách mã sau khi xóa
    } catch (error) {
      console.error("Lỗi khi xóa: ", error);
    }
  };

  useEffect(() => {
    fetch2FACodes(); // Lấy danh sách mã 2FA khi component được load lần đầu
  }, []);

  return (
    <div className="container mt-5">
      <h2>Danh sách mã 2FA</h2>
      <Link to="/add" className="btn btn-success mb-3">Thêm mã 2FA mới</Link>
      <ul className="list-group">
        {codes.map((code) => {
          const otp = generateOTP(code.secret); // Tạo mã OTP từ secret

          return (
            <li key={code.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <p><strong>Tiêu đề:</strong> {code.title}</p>
                <p>
                  <strong>Mã 2FA: </strong>
                  <CopyToClipboard text={otp} onCopy={() => handleCopy(code.id)}>
                    <span style={{ cursor: 'pointer', color: 'red' }} title="Click để sao chép">
                      {otp} <i className="fa-solid fa-copy" style={{ marginLeft: '5px' }}></i>
                    </span>
                  </CopyToClipboard>

                  {/* Hiển thị thời gian đếm ngược */}
                  <span className="badge countdown-timer" style={{ marginLeft: '10px' }}>
                    {timeLeft} giây
                  </span>
                </p>
                <p><strong>Độ ưu tiên:</strong> {code.priority}</p>
              </div>

              {/* Thông báo khi sao chép mã */}
              {copied === code.id && (
                <div style={popupStyle}>
                  <span>Đã sao chép!</span>
                </div>
              )}

              {/* Nút xóa mã */}
              <button className="btn btn-danger" onClick={() => confirmDelete(code.id)}>Xóa</button>
            </li>
          );
        })}
      </ul>

      {/* Popup xác nhận xóa */}
      {showDeletePopup && (
        <div className="popup">
          <div className="popup-content">
            <h5>Bạn có chắc chắn muốn xóa?</h5>
            <button className="btn btn-danger me-3" onClick={handleDelete}>Xóa</button>
            <button className="btn btn-secondary" onClick={() => setShowDeletePopup(false)}>Không</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Style cho thông báo sao chép mã
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
