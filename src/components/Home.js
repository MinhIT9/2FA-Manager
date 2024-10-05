import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebaseConfig'; // Firebase config
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { TOTP } from 'otpauth'; // Import TOTP from otpauth
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './Home.css';
import Add2FA from './Add2FA';

const Home = () => {
  const [codes, setCodes] = useState([]); // Store the list of 2FA codes
  const [categories, setCategories] = useState({}); // Store categories for filtering
  const [copied, setCopied] = useState(null); // Track the copied code
  const [codeToDelete, setCodeToDelete] = useState(null); // Track the code to delete
  const [showDeletePopup, setShowDeletePopup] = useState(false); // Show delete confirmation
  const [timeLeft, setTimeLeft] = useState(30); // Countdown timer
  const [currentOTPs, setCurrentOTPs] = useState({}); // Store OTP for each 2FA code
  const [showAddForm, setShowAddForm] = useState(false); // Toggle for add form
  const [searchKeyword, setSearchKeyword] = useState(''); // Search keyword
  const [selectedCategory, setSelectedCategory] = useState(''); // Selected category for filtering
  const [codeToEdit, setCodeToEdit] = useState(null); // Track code to edit

  // Fetch 2FA codes and categories
  const fetch2FACodes = async () => {
    if (!auth.currentUser) {
      console.error("User not logged in");
      return;
    }

    const userId = auth.currentUser.uid;

    try {
      // Fetch user's categories
      const categorySnapshot = await getDocs(collection(db, 'users', userId, 'categories'));
      const fetchedCategories = {};
      categorySnapshot.forEach(doc => {
        fetchedCategories[doc.id] = doc.data().CategoryTitle;
      });

      // Fetch default categories (from categoryDefault)
      const defaultCategorySnapshot = await getDocs(collection(db, 'categoryDefault'));
      defaultCategorySnapshot.forEach(doc => {
        fetchedCategories[doc.id] = doc.data().CategoryTitle;  // Add default categories to the category list
      });

      setCategories(fetchedCategories); // Update categories

      // Fetch 2FA codes
      const querySnapshot = await getDocs(collection(db, 'users', userId, '2fa-codes'));
      let fetchedCodes = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      // Get Category Title for each CategoryID (search in both user and default categories)
      const updatedCodes = await Promise.all(
        fetchedCodes.map(async (code) => {
          if (code.CategoryID) {
            const categoryDoc = await getDoc(doc(db, 'users', userId, 'categories', code.CategoryID));
            if (!categoryDoc.exists()) {
              // If not found in user's categories, check in default categories
              const defaultCategoryDoc = await getDoc(doc(db, 'categoryDefault', code.CategoryID));
              if (defaultCategoryDoc.exists()) {
                return { ...code, CategoryTitle: defaultCategoryDoc.data().CategoryTitle };
              }
            } else if (categoryDoc.exists()) {
              return { ...code, CategoryTitle: categoryDoc.data().CategoryTitle };
            }
          }
          return code;
        })
      );

      setCodes(updatedCodes); // Update the 2FA codes list
    } catch (error) {
      console.error("Error fetching 2FA codes:", error);
    }
  };


  // Generate OTP for each 2FA code
  const generateOTP = useCallback((secret) => {
    try {
      const totp = new TOTP({
        secret: secret,  // Secret key for 2FA (Base32 format)
        digits: 6,       // 6-digit OTP
        period: 30       // 30-second cycle
      });
      return totp.generate();
    } catch (error) {
      console.error("Error generating OTP: ", error);
      return "ERROR";
    }
  }, []);

  // Update the time left for OTP generation
  const calculateTimeLeft = () => {
    const epoch = Math.floor(Date.now() / 1000);
    const timeRemaining = 30 - (epoch % 30);
    return timeRemaining;
  };

  // Fetch codes on component mount
  useEffect(() => {
    fetch2FACodes();
  }, []);

  // Update OTPs every second
  useEffect(() => {
    const updateOTPs = () => {
      const updatedOTPs = {};
      codes.forEach((code) => {
        if (code.SecretKey) {
          updatedOTPs[code.id] = generateOTP(code.SecretKey);
        }
      });
      setCurrentOTPs(updatedOTPs);
    };

    updateOTPs();

    const interval = setInterval(() => {
      const timeRemaining = calculateTimeLeft();
      setTimeLeft(timeRemaining);

      if (timeRemaining === 30) {
        updateOTPs();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [codes, generateOTP]);

  // Handle search and filtering
  const filteredCodes = codes
    .filter((code) => (
      (code.Title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        code.Email.toLowerCase().includes(searchKeyword.toLowerCase())) &&
      (selectedCategory === '' || code.CategoryTitle === selectedCategory)
    ))
    .sort((a, b) => a.Priority - b.Priority); // Sort by Priority (ascending)

  // Handle copy
  const handleCopy = (codeId) => {
    setCopied(codeId);
    setTimeout(() => setCopied(null), 2000);
  };

  // Handle delete confirmation
  const confirmDelete = (codeId) => {
    setCodeToDelete(codeId);
    setShowDeletePopup(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      const userId = auth.currentUser.uid;
      await deleteDoc(doc(db, 'users', userId, '2fa-codes', codeToDelete));
      setShowDeletePopup(false);
      fetch2FACodes();
    } catch (error) {
      console.error("Error deleting 2FA code:", error);
    }
  };

  // Handle Edit
  const handleEdit = (code) => {
    setCodeToEdit(code); // Set the code to be edited
    setShowAddForm(true); // Open the form for editing
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center">
        {/* Tiêu đề */}
        <h2 className="d-none d-sm-block">Danh sách mã 2FA</h2>
        <h2 className="d-block d-sm-none">Danh sách mã</h2>

        {/* Nút Refresh */}
        <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
          <i className="fa-solid fa-arrows-rotate"></i>

          {/* Hiển thị nội dung theo kích thước màn hình */}
          <span className="d-md-inline"> Refresh</span>
          <span className="d-none d-lg-inline"> App</span>
        </button>

      </div>


      {/* Search and Category Filter */}

      <div className="row mb-3 mt-1">
        <div className="col-lg-8 col-md-6 col-6">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm theo tiêu đề, email..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <div className="col-lg-4 col-md-6 col-6">
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {Object.keys(categories).map((categoryID) => (
              <option key={categoryID} value={categories[categoryID]}>
                {categories[categoryID]}
              </option>
            ))}
          </select>
        </div>
      </div>


      {/* Add 2FA Button */}
      <button
        className="btn btn-success mb-3"
        onClick={() => setShowAddForm(true)}
      >
        Thêm mã 2FA mới
      </button>

      {/* Add2FA Form */}
      {showAddForm && (
        <Add2FA
          onClose={() => {
            setShowAddForm(false);
            setCodeToEdit(null); // Reset edit state
          }}
          onAddSuccess={() => {
            fetch2FACodes();
            setShowAddForm(false);
          }}
          isEdit={codeToEdit !== null}
          initialData={codeToEdit}
        />
      )}

      {/* Display 2FA Codes */}
      <div className="row">
        {filteredCodes.map((code) => {
          const otp = currentOTPs[code.id] || "Loading...";

          return (
            <div key={code.id} className="col-xl-3 col-lg-4 col-md-5 col-sm-6 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>

                    {/* Title and Category on the same line */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="card-title mb-0">{code.Title}</h5>
                      <span className="card-text text-muted">
                        <i className="fa-solid fa-folder me-1"></i> {code.CategoryTitle || "Null"}
                      </span>
                    </div>

                    {/* 2FA Code with Copy and Countdown */}
                    <div className="d-flex align-items-center mb-2">
                      <strong className="me-2">Code:</strong>
                      <CopyToClipboard text={otp} onCopy={() => handleCopy(code.id)}>
                        <span style={{ cursor: 'pointer', color: 'red', fontSize: '20px' }} title="Click để sao chép">
                          {otp} <i className="fa-solid fa-copy ms-1"></i>
                        </span>
                      </CopyToClipboard>
                    </div>

                    <p className="card-text mb-2">
                      <strong style={{ color: 'steelblue' }}>
                        <span
                          className="email"
                          onClick={(e) => emailHandler.toggle(e)}
                          style={{ cursor: 'pointer', display: 'inline-block' }}
                          title="Click để xem toàn bộ"
                          data-full-email={code.Email}
                          data-short-email={emailHandler.format(code.Email)}
                        >
                          {emailHandler.format(code.Email)}
                        </span>
                      </strong>
                    </p>

                    {/* Priority */}
                    <p className="card-text mb-2">
                      <strong>Priority:</strong> {code.Priority}
                      <span> ~ </span>
                      <span className="badge bg-info text-dark" style={{ opacity: '0.9' }}>{timeLeft} s</span>
                    </p>
                  </div>

                  {/* Copy Notification */}
                  {copied === code.id && (
                    <div style={popupStyle}>
                      <span>Đã sao chép!</span>
                    </div>
                  )}

                  {/* Edit and Delete Buttons */}
                  <div className="d-flex justify-content-between" style={{ opacity: '0.9' }}>
                    <button className="btn btn-primary" onClick={() => handleEdit(code)}>
                      <i className="fa-solid fa-edit me-1"></i> Sửa
                    </button>
                    <button className="btn btn-danger" onClick={() => confirmDelete(code.id)}>
                      <i className="fa-solid fa-trash me-1"></i> Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>

          );
        })}
      </div>

      {/* Delete Confirmation Popup */}
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

// JavaScript để xử lý việc click vào email
const emailHandler = {
  maxLength: 22, // Đặt số ký tự tối đa

  format(email) {
    return email.length > this.maxLength
      ? `${email.substring(0, this.maxLength)}...`
      : email;
  },

  toggle(e) {
    const emailElement = e.target;
    const isShort = emailElement.textContent.endsWith('...');

    if (isShort) {
      emailElement.textContent = emailElement.getAttribute('data-full-email');
    } else {
      emailElement.textContent = emailElement.getAttribute('data-short-email');
    }
  }
};


// Style for copy notification
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
