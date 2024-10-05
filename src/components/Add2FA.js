import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import Select from 'react-select';
import Webcam from "react-webcam";
import jsQR from 'jsqr';

const Add2FA = ({ onClose, onAddSuccess, isEdit = false, initialData = null }) => {
  const [title, setTitle] = useState(initialData?.Title || '');
  const [email, setEmail] = useState(initialData?.Email || '');
  const [secretKey, setSecretKey] = useState(initialData?.SecretKey || '');
  const [priority, setPriority] = useState(1000);
  const [categoryID, setCategoryID] = useState(initialData?.CategoryID || '');
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [isQrVisible, setIsQrVisible] = useState(false); // State to show or hide QR reader modal
  const [qrData, setQrData] = useState(null);

  const webcamRef = useRef(null);

  useEffect(() => {
    const fetchCategoriesAndPriority = async () => {
      const userId = auth.currentUser.uid;

      const categorySnapshot = await getDocs(collection(db, 'users', userId, 'categories'));
      const fetchedCategories = categorySnapshot.docs.map(doc => ({ id: doc.id, title: doc.data().CategoryTitle, isDefault: false }));

      const defaultCategorySnapshot = await getDocs(collection(db, 'categoryDefault'));
      const defaultCategories = defaultCategorySnapshot.docs
        .filter(doc => doc.data().isDefault === true)
        .map(doc => ({ id: doc.id, title: doc.data().CategoryTitle, isDefault: true }));

      const allCategories = [...fetchedCategories, ...defaultCategories];
      const uniqueCategories = Array.from(new Map(allCategories.map(item => [item.id, item])).values());

      setCategories(uniqueCategories);

      const codeSnapshot = await getDocs(collection(db, 'users', userId, '2fa-codes'));
      if (codeSnapshot.empty) {
        setPriority(1000); // Default priority
      } else {
        const priorities = codeSnapshot.docs.map(doc => doc.data().Priority);
        const lowestPriority = Math.min(...priorities);
        setPriority(lowestPriority - 10);
      }
    };

    fetchCategoriesAndPriority();
    if (initialData) {
      setTitle(initialData.Title);
      setEmail(initialData.Email);
      setSecretKey(initialData.SecretKey);
      setPriority(initialData.Priority);
      setCategoryID(initialData.CategoryID || '');
    }
  }, [initialData]);

  // Function to capture screenshot and scan QR code
  const captureAndScanQR = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const image = new Image();
        image.src = imageSrc;

        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, image.width, image.height);

          const imageData = context.getImageData(0, 0, image.width, image.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            try {
              const parsedData = JSON.parse(code.data);
              setSecretKey(parsedData.secretKey || '');
              setEmail(parsedData.email || '');
              setQrData(parsedData);
              setIsQrVisible(false); // Close modal after successful scan
            } catch (error) {
              console.error("Error parsing QR data:", error);
            }
          }
        };
      }
    }
  }, [webcamRef]);

  const validateForm = () => {
    let formErrors = {};
    if (!title) {
      formErrors.title = 'Tiêu đề là bắt buộc';
    } else if (title.length > 15) {
      formErrors.title = 'Tiêu đề không được vượt quá 15 ký tự';
    }
    if (!email) {
      formErrors.email = 'Email là bắt buộc';
    }
    if (!secretKey && !isEdit) {
      formErrors.secretKey = 'Khóa bí mật là bắt buộc';
    }
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const userId = auth.currentUser.uid;

      if (isEdit) {
        const docRef = doc(db, 'users', userId, '2fa-codes', initialData.id);
        await updateDoc(docRef, {
          Title: title,
          Email: email,
          Priority: Number(priority),
          CategoryID: categoryID || null,
        });
        onAddSuccess({ id: initialData.id, Title: title, Email: email, Priority: priority, CategoryID: categoryID });
      } else {
        const docRef = await addDoc(collection(db, 'users', userId, '2fa-codes'), {
          Title: title,
          Email: email,
          SecretKey: secretKey,
          Priority: Number(priority),
          DateCreate: new Date(),
          UserID: userId,
          CategoryID: categoryID || null,
        });
        onAddSuccess({ id: docRef.id, Title: title, Email: email, Priority: priority, CategoryID: categoryID });
      }

      setTitle('');
      setEmail('');
      setSecretKey('');
      setCategoryID('');
      setPriority(1000);
      setErrors({});
      onClose();
    } catch (e) {
      setErrors({ form: 'Lỗi khi thêm/sửa mã: ' + e.message });
    }
  };

  const categoryOptions = categories.map(category => ({
    value: category.id,
    label: category.isDefault ? (
      <span>{category.title} <span className="text-bg-info"> (Default)</span></span>
    ) : (
      <span>{category.title}</span>
    ),
  }));

  return (
    <div className="card mt-3">
      <div className="card-header">
        <h4>{isEdit ? 'Sửa mã 2FA' : 'Thêm mã 2FA'}</h4>
      </div>
      <div className="card-body">
        {errors.form && <div className="alert alert-danger">{errors.form}</div>}

        {/* Các trường nhập liệu của form */}
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Tiêu đề</label>
          <input
            type="text"
            id="title"
            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề"
          />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email"
          />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="secretKey" className="form-label">Khóa bí mật</label>
          <input
            type="text"
            id="secretKey"
            className={`form-control ${errors.secretKey ? 'is-invalid' : ''}`}
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Nhập khóa bí mật"
          />
          {errors.secretKey && <div className="invalid-feedback">{errors.secretKey}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="priority" className="form-label">Độ ưu tiên</label>
          <input
            type="number"
            id="priority"
            className={`form-control ${errors.priority ? 'is-invalid' : ''}`}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            placeholder="Nhập độ ưu tiên"
          />
          {errors.priority && <div className="invalid-feedback">{errors.priority}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="category" className="form-label">Danh mục (không bắt buộc)</label>
          <Select
            options={categoryOptions}
            value={categoryOptions.find(option => option.value === categoryID)}
            onChange={(selectedOption) => setCategoryID(selectedOption.value)}
          />
        </div>

        {/* Nút để gửi và quét QR */}
        <div className="d-flex justify-content-between">
          <button className="btn btn-primary me-2" onClick={handleSubmit}>
            {isEdit ? 'Sửa mã' : 'Thêm mã'}
          </button>
          <button className="btn btn-info me-2" onClick={() => setIsQrVisible(true)}>
            Quét QR
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
        </div>

        {/* Modal để quét mã QR */}
        {isQrVisible && (
          <div className="modal fade show" style={{ display: 'block' }} id="qrModal" tabIndex="-1" aria-labelledby="qrModalLabel" aria-hidden="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="qrModalLabel">Quét mã QR</h5>
                  <button type="button" className="btn-close" onClick={() => setIsQrVisible(false)} aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      facingMode: 'environment' // Sử dụng camera sau
                    }}
                  />
                  <button className="btn btn-success mt-3" onClick={captureAndScanQR}>Quét Mã QR</button>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsQrVisible(false)}>Đóng</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display QR data if available */}
        {qrData && (
          <div className="mt-3">
            <h5>Thông tin mã QR đã quét:</h5>
            <ul>
              <li><strong>Email:</strong> {qrData.email}</li>
              <li><strong>Khóa bí mật:</strong> {qrData.secretKey}</li>
              {Object.keys(qrData).map(key => (
                key !== 'email' && key !== 'secretKey' && (
                  <li key={key}><strong>{key}:</strong> {qrData[key]}</li>
                )
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Add2FA;
