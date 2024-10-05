import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig'; // Firebase config
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

const AddCategory = () => {
    const [title, setTitle] = useState(''); // Lưu trữ tiêu đề danh mục
    const [categories, setCategories] = useState([]); // Lưu trữ danh sách danh mục
    const [editingCategory, setEditingCategory] = useState(null); // Lưu trữ thông tin danh mục đang được chỉnh sửa
    const [error, setError] = useState(''); // Lưu thông báo lỗi
    const [showDeletePopup, setShowDeletePopup] = useState(false); // Hiển thị popup xác nhận xóa
    const [categoryToDelete, setCategoryToDelete] = useState(null); // Lưu trữ danh mục cần xóa
    const [isDefault, setIsDefault] = useState(false); // Trường isDefault mặc định là False
    const [isAdmin, setIsAdmin] = useState(false); // Biến kiểm tra quyền admin

    // Kiểm tra vai trò admin
    const checkAdminRole = async () => {
        const userId = auth.currentUser.uid; // Lấy UID của người dùng hiện tại
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();

        if (userData && userData.Role === 'Admin') {
            setIsAdmin(true); // Người dùng là admin
        } else {
            setIsAdmin(false); // Người dùng không phải admin
        }
    };

    // Hàm lấy danh sách danh mục từ Firestore
    const fetchCategories = async () => {
        try {
            const userId = auth.currentUser.uid; // Lấy UID của người dùng hiện tại

            // Lấy danh mục của người dùng hiện tại
            const userCategoriesSnapshot = await getDocs(collection(db, 'users', userId, 'categories'));
            let userCategories = userCategoriesSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

            // Lấy tất cả các danh mục mặc định (isDefault: true)
            const defaultCategoriesSnapshot = await getDocs(collection(db, 'categoryDefault'));
            const defaultCategories = defaultCategoriesSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

            // Kết hợp danh mục cá nhân và danh mục mặc định
            const combinedCategories = [...defaultCategories, ...userCategories];

            // Lọc trùng lặp danh mục (nếu có)
            const uniqueCategories = combinedCategories.reduce((acc, current) => {
                const x = acc.find(item => item.id === current.id);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, []);
            console.log("Danh mục sau khi lọc trùng lặp:", uniqueCategories); // Log danh mục sau khi lọc trùng lặp

            // Cập nhật danh sách danh mục trong state
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Lỗi khi lấy danh mục:', error);
        }
    };

    useEffect(() => {
        checkAdminRole(); // Kiểm tra quyền admin khi component được load
        fetchCategories(); // Lấy danh sách danh mục khi component được load lần đầu
    }, []);

    // Hàm thêm hoặc cập nhật danh mục
    const handleAddOrUpdateCategory = async () => {
        if (!title) {
            setError('Vui lòng nhập tiêu đề danh mục.');
            return;
        }

        try {
            const userId = auth.currentUser.uid; // Lấy UID của người dùng hiện tại

            if (editingCategory) {
                // Nếu đang chỉnh sửa, cập nhật danh mục
                const categoryRef = doc(db, 'users', userId, 'categories', editingCategory.id);
                await updateDoc(categoryRef, {
                    CategoryTitle: title,
                    isDefault: isAdmin ? isDefault : false // Chỉ admin mới có thể chỉnh sửa isDefault
                });

                // Nếu danh mục là mặc định, cập nhật trạng thái vào collection categoryDefault
                if (isDefault) {
                    const defaultCategoryRef = doc(db, 'categoryDefault', editingCategory.id);
                    await setDoc(defaultCategoryRef, {
                        CategoryTitle: title,
                        isDefault: true,
                        UserID: userId,
                        CategoryDateCreate: new Date()
                    });
                } else {
                    // Nếu admin chỉnh isDefault thành false, xóa khỏi collection categoryDefault
                    const defaultCategoryRef = doc(db, 'categoryDefault', editingCategory.id);
                    await deleteDoc(defaultCategoryRef); // Xóa danh mục khỏi categoryDefault
                }

                setEditingCategory(null); // Reset chế độ chỉnh sửa
            } else {
                // Nếu không, thêm mới danh mục
                const newCategoryRef = await addDoc(collection(db, 'users', userId, 'categories'), {
                    CategoryTitle: title,
                    CategoryDateCreate: new Date(),
                    UserID: userId,
                    isDefault: false
                });

                // Nếu danh mục là mặc định, lưu vào collection categoryDefault
                if (isDefault) {
                    const defaultCategoryRef = doc(db, 'categoryDefault', newCategoryRef.id);
                    await setDoc(defaultCategoryRef, {
                        CategoryTitle: title,
                        isDefault: true,
                        UserID: userId,
                        CategoryDateCreate: new Date()
                    });
                }
            }

            setTitle(''); // Reset tiêu đề
            setIsDefault(false); // Reset isDefault về False
            fetchCategories(); // Cập nhật danh sách danh mục sau khi thêm hoặc cập nhật
        } catch (error) {
            setError('Lỗi khi thêm hoặc cập nhật danh mục: ' + error.message);
        }
    };


    // Hàm xử lý khi muốn chỉnh sửa danh mục
    const handleEditCategory = (category) => {
        // Kiểm tra nếu danh mục là mặc định và người dùng không phải admin
        if (category.isDefault && !isAdmin) {
            setError('Chỉ admin mới có quyền chỉnh sửa danh mục mặc định.');
            return;
        }

        setEditingCategory(category); // Đặt danh mục cần chỉnh sửa
        setTitle(category.CategoryTitle); // Hiển thị tiêu đề của danh mục cần chỉnh sửa
        setIsDefault(category.isDefault); // Hiển thị isDefault của danh mục cần chỉnh sửa
    };

    // Hàm hiển thị popup xác nhận xóa
    const confirmDelete = (category) => {
        // Kiểm tra nếu danh mục là mặc định và người dùng không phải admin
        if (category.isDefault && !isAdmin) {
            setError('Chỉ admin mới có quyền xóa danh mục mặc định.');
            return;
        }

        setCategoryToDelete(category);
        setShowDeletePopup(true); // Hiển thị popup xác nhận xóa
    };

    // Hàm xóa danh mục
    const handleDelete = async () => {
        try {
            const userId = auth.currentUser.uid; // Lấy UID của người dùng hiện tại

            // Xóa danh mục khỏi collection của người dùng
            await deleteDoc(doc(db, 'users', userId, 'categories', categoryToDelete.id));

            // Nếu danh mục là mặc định, xóa danh mục khỏi collection categoryDefault
            if (categoryToDelete.isDefault) {
                await deleteDoc(doc(db, 'categoryDefault', categoryToDelete.id));
            }

            // Cập nhật danh sách danh mục sau khi xóa
            setShowDeletePopup(false); // Đóng popup sau khi xóa
            fetchCategories(); // Cập nhật danh sách danh mục sau khi xóa
        } catch (error) {
            console.error('Lỗi khi xóa danh mục:', error);
            setError('Lỗi khi xóa danh mục: ' + error.message);
        }
    };


    // Sắp xếp danh mục có isDefault === true lên trên cùng
    // eslint-disable-next-line no-unused-vars
    const sortedCategories = categories.sort((a, b) => {
        if (a.isDefault === b.isDefault) return 0;
        return a.isDefault ? -1 : 1;
    });

    return (
        <div className="container mt-5">
            <h2>{editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h2>

            {/* Hiển thị thông báo lỗi nếu có */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Form thêm hoặc chỉnh sửa danh mục */}
            <div className="mb-3">
                <label htmlFor="title" className="form-label">Tiêu đề danh mục</label>
                <input
                    type="text"
                    id="title"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề danh mục"
                />
            </div>

            {/* Trường isDefault, chỉ admin có thể chỉnh sửa */}
            {isAdmin && (
                <div className="mb-3">
                    <label htmlFor="isDefault" className="form-label">Danh mục mặc định</label>
                    <select
                        id="isDefault"
                        className="form-select"
                        value={isDefault}
                        onChange={(e) => setIsDefault(e.target.value === 'true')}
                    >
                        <option value="false">False</option>
                        <option value="true">True</option>
                    </select>
                </div>
            )}

            <button onClick={handleAddOrUpdateCategory} className="btn btn-primary mb-3">
                {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục'}
            </button>

            {/* Danh sách danh mục hiện tại */}
            <div className="container mt-4">
                <div className="card shadow-sm">
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <h3 className="mb-0"><i className="fas fa-list-alt me-2"></i>Danh sách danh mục</h3>
                    </div>
                    <ul className="list-group">
                        {categories.length === 0 ? (
                            <li className="list-group-item">Không có danh mục nào</li>
                        ) : (
                            categories.map((category) => (
                                <li key={category.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <span className="fw-bold">{category.CategoryTitle}</span>

                                        {/* Hiển thị "Default" nếu danh mục là Default, hiển thị "Public" nếu không phải Default */}
                                        <small style={{ marginLeft: '5px' }} className={`badge ${category.isDefault === true ? 'bg-success' : 'bg-info'}`}>
                                            {category.isDefault === true ? "Default" : "Public"}
                                        </small>
                                    </div>

                                    {/* Chỉ hiển thị nút Edit và Delete nếu người dùng là admin hoặc họ là người tạo ra danh mục */}
                                    {isAdmin || category.UserID === auth.currentUser.uid ? (
                                        <div>
                                            <button className="btn btn-warning me-2" onClick={() => handleEditCategory(category)}>
                                                <i className="fa-solid fa-pen-to-square me-1"></i> Sửa
                                            </button>
                                            <button className="btn btn-danger" onClick={() => confirmDelete(category)}>
                                                <i className="fa-solid fa-trash-can me-1"></i> Xóa
                                            </button>
                                        </div>
                                    ) : null}

                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Popup xác nhận xóa */}
            {showDeletePopup && (
                <div className="popup">
                    <div className="popup-content">
                        <h5>Bạn có chắc chắn muốn xóa danh mục này?</h5>
                        <button className="btn btn-danger me-3" onClick={handleDelete}>Xóa</button>
                        <button className="btn btn-secondary" onClick={() => setShowDeletePopup(false)}>Không</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddCategory;
