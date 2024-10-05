import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import Add2FA from './Add2FA'; // Import Add2FA component for adding/editing

const Manage2FA = () => {
    const [codes, setCodes] = useState([]);
    const [categories, setCategories] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [editingCode, setEditingCode] = useState(null); // State to store the code being edited
    const [codeToDelete, setCodeToDelete] = useState(null); // State to store code for deletion
    const [searchKeyword, setSearchKeyword] = useState(''); // State to store search keyword
    const [sortBy, setSortBy] = useState({ field: 'DateCreate', order: 'desc' }); // State for sorting field and order
    const [selectedCategory, setSelectedCategory] = useState(''); // State to store selected category

    // Fetch all 2FA codes and their associated categories
    const fetchCodes = async () => {
        if (!auth.currentUser) {
            console.error("User not logged in");
            return;
        }

        const userId = auth.currentUser.uid;
        try {
            // Fetch categories first to avoid fetching them individually for each code
            const categorySnapshot = await getDocs(collection(db, 'users', userId, 'categories'));
            const fetchedCategories = {};
            categorySnapshot.forEach(doc => {
                fetchedCategories[doc.id] = doc.data().CategoryTitle;
            });

            setCategories(fetchedCategories); // Store categories in state

            // Fetch 2FA codes
            const querySnapshot = await getDocs(collection(db, 'users', userId, '2fa-codes'));
            const fetchedCodes = querySnapshot.docs.map((doc) => {
                const codeData = doc.data();
                return {
                    ...codeData,
                    id: doc.id,
                    CategoryTitle: fetchedCategories[codeData.CategoryID] || 'N/A' // Get CategoryTitle
                };
            });

            setCodes(fetchedCodes); // Update the codes list
        } catch (error) {
            console.error("Error fetching 2FA codes or categories:", error);
        }
    };

    // Handle delete confirmation modal
    const confirmDelete = (code) => {
        setCodeToDelete(code); // Store code to be deleted
    };

    const handleDelete = async () => {
        try {
            const userId = auth.currentUser.uid;
            await deleteDoc(doc(db, 'users', userId, '2fa-codes', codeToDelete.id));
            await fetchCodes(); // Refetch codes after deletion
            setCodeToDelete(null); // Clear after deletion
        } catch (error) {
            console.error('Lỗi khi xóa mã 2FA:', error);
        }
    };
    

    // Handle opening the form for editing
    const handleEdit = (code) => {
        setEditingCode(code);
        setShowForm(true); // Open the form for editing
    };

    // Handle adding a new code
    const handleAddNew = () => {
        setEditingCode(null); // Clear editing data
        setShowForm(true); // Show form for adding a new code
    };

    // Close form handler (doesn't reload anything)
    const handleCloseForm = () => {
        setShowForm(false); // Close the form without reload
    };

    // Handle success after adding or editing (only updates the table)
    const handleAddSuccess = async (newCode) => {
        // Refetch the codes after successfully adding or editing a 2FA code
        await fetchCodes();
        setShowForm(false); // Close form after success
    };
    

    // Handle sorting logic
    const handleSort = (field) => {
        setSortBy((prevSort) => ({
            field,
            order: prevSort.field === field && prevSort.order === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Sort and filter codes
    const sortedAndFilteredCodes = codes
        .filter((code) => {
            return (
                (code.Title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                    code.Email.toLowerCase().includes(searchKeyword.toLowerCase())) &&
                (selectedCategory === '' || code.CategoryTitle === selectedCategory)
            );
        })
        .sort((a, b) => {
            if (sortBy.field === 'DateCreate') {
                const dateA = a.DateCreate ? new Date(a.DateCreate.seconds * 1000) : new Date(0); // Default to epoch if undefined
                const dateB = b.DateCreate ? new Date(b.DateCreate.seconds * 1000) : new Date(0);
                return sortBy.order === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (sortBy.field === 'Priority') {
                return sortBy.order === 'asc' ? a.Priority - b.Priority : b.Priority - a.Priority;
            }
            return 0;
        });


    useEffect(() => {
        fetchCodes(); // Fetch the codes when the component mounts
    }, []);

    return (
        <div className="container mt-3">
            <h4>Danh sách mã 2FA</h4>

            {/* Search and Sort Options */}
            <div className="d-flex justify-content-between mb-3">
                <input
                    type="text"
                    className="form-control w-50"
                    placeholder="Tìm theo tiêu đề, email..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                />

                {/* Category Dropdown */}
                <select
                    className="form-select w-25"
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

            {/* Button to Add New 2FA Code */}
            <button className="btn btn-success mb-3" onClick={handleAddNew}>
                <i className="fas fa-plus"></i> Thêm mã 2FA mới
            </button>

            {/* Add or Edit 2FA Form */}
            {showForm && (
                <Add2FA
                    onClose={handleCloseForm}
                    onAddSuccess={handleAddSuccess}
                    isEdit={!!editingCode} // Check if editing
                    initialData={editingCode} // Pass code data if editing
                />
            )}

            {/* Table for Displaying 2FA Codes */}
            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Tiêu đề</th>
                            <th>Email</th>
                            <th onClick={() => handleSort('Priority')} style={{ cursor: 'pointer' }}>
                                Độ ưu tiên {sortBy.field === 'Priority' && (sortBy.order === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleSort('DateCreate')} style={{ cursor: 'pointer' }}>
                                Ngày tạo {sortBy.field === 'DateCreate' && (sortBy.order === 'asc' ? '▲' : '▼')}
                            </th>
                            <th>Danh mục</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredCodes.length === 0 ? (
                            <tr>
                                <td colSpan="6">Không tìm thấy mã 2FA nào</td>
                            </tr>
                        ) : (
                            sortedAndFilteredCodes.map((code) => (
                                <tr key={code.id}>
                                    <td>{code.Title}</td>
                                    <td>{code.Email}</td>
                                    <td>{code.Priority}</td>
                                    <td>{code.DateCreate ? new Date(code.DateCreate.seconds * 1000).toLocaleString() : 'No Date Available'}</td>
                                    <td>{code.CategoryTitle || 'No Category'}</td>
                                    <td>
                                        {/* Edit button */}
                                        <button className="btn btn-primary me-2" onClick={() => handleEdit(code)}>
                                            <i className="fas fa-edit"></i> Sửa
                                        </button>
                                        {/* Delete button */}
                                        <button className="btn btn-danger" onClick={() => confirmDelete(code)}>
                                            <i className="fas fa-trash"></i> Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>

                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {codeToDelete && (
                <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }} aria-labelledby="deleteModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="deleteModalLabel">Xác nhận xóa</h5>
                                <button type="button" className="btn-close" onClick={() => setCodeToDelete(null)}></button>
                            </div>
                            <div className="modal-body">
                                Bạn có chắc chắn muốn xóa mã 2FA <strong>{codeToDelete.Title}</strong> không?
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setCodeToDelete(null)}>
                                    Hủy
                                </button>
                                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Manage2FA;
