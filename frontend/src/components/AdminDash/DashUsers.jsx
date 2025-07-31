import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Button, Modal, Spinner, Table, Card, Badge, TextInput, Label, Textarea, ToggleSwitch } from 'flowbite-react'
import { HiOutlineExclamationCircle, HiOutlinePencil, HiOutlineEye, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi'
import { FaCheck, FaTimes, FaUser, FaUserTie, FaUserCog, FaUserShield } from "react-icons/fa";

export default function DashUsers() {
    const { currentUser } = useSelector((state) => state.user)
    const [users, setUsers] = useState([])
    const [showMore, setShowMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editForm, setEditForm] = useState({
        staffId: '',
        firstName: '',
        lastName: '',
        password: '',
        profilePicture: '',
        isAdmin: false,
        isWaiter: false,
        isManager: false,
        isReception: false
    });
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/user/getusers')
                const data = await res.json()
                if (res.ok) {
                    setLoading(false);
                    setUsers(data.users)
                    if (data.users.length < 9) {
                        setShowMore(false);
                    }
                }
            } catch (error) {
                setLoading(true);
                console.log(error.message)
            }
        };
        if (currentUser.isAdmin) {
            fetchUsers();
        }
    }, [currentUser._id])

    const handleShowMore = async () => {
        const startIndex = users.length;
        try {
            const res = await fetch(`/api/user/getusers?startIndex=${startIndex}`);
            const data = await res.json();
            if (res.ok) {
                setUsers((prev) => [...prev, ...data.users]);
                if (data.users.length < 9) {
                    setShowMore(false);
                }
            }
        } catch (error) {
            console.log(error.message);
        }
    }

    const handleDeleteUser = async () => {
        try {
            const res = await fetch(`/api/user/delete/${selectedUser._id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok) {
                setUsers((prev) => prev.filter((user) => user._id !== selectedUser._id));
                setShowDeleteModal(false);
                setSelectedUser(null);
            } else {
                console.log(data.message);
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    const handleEditUser = async () => {
        setEditLoading(true);
        try {
            const res = await fetch(`/api/user/update/${selectedUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (res.ok) {
                setUsers((prev) => prev.map((user) =>
                    user._id === selectedUser._id ? data : user
                ));
                setShowEditModal(false);
                setSelectedUser(null);
                setEditForm({
                    staffId: '',
                    firstName: '',
                    lastName: '',
                    password: '',
                    profilePicture: '',
                    isAdmin: false,
                    isWaiter: false,
                    isManager: false,
                    isReception: false
                });
            } else {
                console.log(data.message);
            }
        } catch (error) {
            console.log(error.message);
        } finally {
            setEditLoading(false);
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setEditForm({
            staffId: user.staffId || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            password: '',
            profilePicture: user.profilePicture || '',
            isAdmin: user.isAdmin || false,
            isWaiter: user.isWaiter || false,
            isManager: user.isManager || false,
            isReception: user.isReception || false
        });
        setShowEditModal(true);
    };

    const openViewModal = (user) => {
        setSelectedUser(user);
        setShowViewModal(true);
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    if (loading) return (
        <div className='flex p-5 justify-center pb-96 items-center md:items-baseline min-h-screen'>
            <Spinner size='xl' />
            <p className='text-center text-gray-500 m-2'>Loading...</p>
        </div>
    );

    return (
        <div className='p-2 sm:p-4 max-w-7xl mx-auto'>
            <div className='mb-4 sm:mb-6 text-center mt-5'>
                <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2'>Staff Management</h1>
                <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>Manage all staff members and their permissions</p>
            </div>

            {currentUser.isAdmin && users.length > 0 ? (
                <>
                    <div className='grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 m-5'>
                        {users.map((user) => (
                            <Card key={user._id} className="hover:shadow-lg transition-shadow min-w-[280px]">
                                <div className="flex flex-col items-center">
                                    <img
                                        className="mb-3 h-16 w-16 sm:h-20 sm:w-20 rounded-full shadow-lg object-cover"
                                        src={user.profilePicture}
                                        alt={`${user.firstName} ${user.lastName}`}
                                    />
                                    <h5 className="mb-1 text-lg sm:text-xl font-medium text-gray-900 dark:text-white text-center">
                                        {user.firstName} {user.lastName}
                                    </h5>
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">
                                        ID: {user.staffId}
                                    </span>
                                    <div className="flex flex-col items-center gap-2 mb-1 border-y dark:border-none bg-white dark:bg-gray-700 p-2 dark:rounded-lg w-full">
                                        <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200'>Permissions</h2>
                                        <div className="flex flex-wrap gap-2 justify-center mb-1">
                                            {user.isAdmin && <span className="bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">Admin User <span className='text-sm'>🧑‍💻</span></span>}
                                            {user.isWaiter && <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">Waiter User <span className='text-sm'>🤵</span></span>}
                                            {user.isManager && <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">Manager User <span className='text-sm'>💼</span></span>}
                                            {user.isReception && <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">Reception User <span className='text-sm'>💁</span></span>}
                                            {!user.isAdmin && !user.isWaiter && !user.isManager && !user.isReception && <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">Undefined User <span className='text-xl'>👤</span></span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row mt-4 gap-2 w-full">
                                        <Button size="xs" color="gray" onClick={() => openViewModal(user)} className="flex-1">
                                            <HiOutlineEye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="inline">View</span>
                                        </Button>
                                        <Button size="xs" color="blue" onClick={() => openEditModal(user)} className="flex-1">
                                            <HiOutlinePencil className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="inline">Edit</span>
                                        </Button>
                                        <Button size="xs" color="failure" onClick={() => openDeleteModal(user)} className="flex-1">
                                            <HiOutlineTrash className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="inline">Delete</span>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {showMore && (
                        <div className="text-center mt-6 sm:mt-8">
                            <Button onClick={handleShowMore} color="gray" outline size="sm" className="px-4 py-2">
                                Show More Staff
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <Card className="text-center py-8 sm:py-12">
                    <HiOutlinePlus className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No Staff Members</h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">There are no staff members to display.</p>
                </Card>
            )}

            {/* View User Modal */}
            <Modal show={showViewModal} onClose={() => setShowViewModal(false)} size="sm" className="p-4 pt-16 md:pt-4 z-[9999]">
                <Modal.Header className="text-sm sm:text-base p-3">
                    Staff Details
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center">
                                <img
                                    className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover"
                                    src={selectedUser.profilePicture}
                                    alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <Label className="text-xs sm:text-sm font-medium">Staff ID</Label>
                                    <p className="text-sm sm:text-base text-gray-900 dark:text-white break-all">{selectedUser.staffId}</p>
                                </div>
                                <div>
                                    <Label className="text-xs sm:text-sm font-medium">Name</Label>
                                    <p className="text-sm sm:text-base text-gray-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</p>
                                </div>
                                <div>
                                    <Label className="text-xs sm:text-sm font-medium">Created</Label>
                                    <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs sm:text-sm font-medium">Roles</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedUser.isAdmin && <Badge color="red" size="sm">Admin</Badge>}
                                        {selectedUser.isManager && <Badge color="purple" size="sm">Manager</Badge>}
                                        {selectedUser.isWaiter && <Badge color="blue" size="sm">Waiter</Badge>}
                                        {selectedUser.isReception && <Badge color="green" size="sm">Reception</Badge>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* Edit User Modal */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} size="md" className="p-4 pt-16 md:pt-4 z-[9999]">
                <Modal.Header className="text-sm sm:text-base p-3">
                    Edit Staff Member
                </Modal.Header>
                <Modal.Body className="p-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <Label htmlFor="staffId" className="text-xs sm:text-sm">Staff ID</Label>
                                <TextInput
                                    id="staffId"
                                    value={editForm.staffId}
                                    onChange={(e) => setEditForm({ ...editForm, staffId: e.target.value })}
                                    placeholder="Enter staff ID"
                                    size="sm"
                                />
                            </div>
                            <div>
                                <Label htmlFor="firstName" className="text-xs sm:text-sm">First Name</Label>
                                <TextInput
                                    id="firstName"
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                    placeholder="Enter first name"
                                    size="sm"
                                />
                            </div>
                            <div>
                                <Label htmlFor="lastName" className="text-xs sm:text-sm">Last Name</Label>
                                <TextInput
                                    id="lastName"
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                    placeholder="Enter last name"
                                    size="sm"
                                />
                            </div>
                            <div>
                                <Label htmlFor="password" className="text-xs sm:text-sm">New Password (leave blank to keep current)</Label>
                                <TextInput
                                    id="password"
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    placeholder="Enter new password"
                                    size="sm"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="profilePicture" className="text-xs sm:text-sm">Profile Picture URL</Label>
                            <TextInput
                                id="profilePicture"
                                value={editForm.profilePicture}
                                onChange={(e) => setEditForm({ ...editForm, profilePicture: e.target.value })}
                                placeholder="Enter profile picture URL"
                                size="sm"
                            />
                        </div>
                        <div className="border-t pt-4">
                            <Label className="text-sm sm:text-base font-medium mb-3">Permissions</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="isAdmin" className="flex items-center gap-2 text-sm">
                                        <FaUserShield className="text-red-500" />
                                        <span className="hidden sm:inline">Admin Access</span>
                                        <span className="sm:hidden">Admin</span>
                                    </Label>
                                    <ToggleSwitch
                                        id="isAdmin"
                                        checked={editForm.isAdmin}
                                        onChange={(checked) => setEditForm({ ...editForm, isAdmin: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="isManager" className="flex items-center gap-2 text-sm">
                                        <FaUserTie className="text-purple-500" />
                                        <span className="hidden sm:inline">Manager Access</span>
                                        <span className="sm:hidden">Manager</span>
                                    </Label>
                                    <ToggleSwitch
                                        id="isManager"
                                        checked={editForm.isManager}
                                        onChange={(checked) => setEditForm({ ...editForm, isManager: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="isWaiter" className="flex items-center gap-2 text-sm">
                                        <FaUser className="text-blue-500" />
                                        <span className="hidden sm:inline">Waiter Access</span>
                                        <span className="sm:hidden">Waiter</span>
                                    </Label>
                                    <ToggleSwitch
                                        id="isWaiter"
                                        checked={editForm.isWaiter}
                                        onChange={(checked) => setEditForm({ ...editForm, isWaiter: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="isReception" className="flex items-center gap-2 text-sm">
                                        <FaUserCog className="text-green-500" />
                                        <span className="hidden sm:inline">Reception Access</span>
                                        <span className="sm:hidden">Reception</span>
                                    </Label>
                                    <ToggleSwitch
                                        id="isReception"
                                        checked={editForm.isReception}
                                        onChange={(checked) => setEditForm({ ...editForm, isReception: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="p-3">
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Button onClick={handleEditUser} size='sm' disabled={editLoading} className="flex-1">
                            {editLoading ? <Spinner size="sm" className="mr-2" /> : null}
                            Save Changes
                        </Button>
                        <Button color="gray" size='sm' onClick={() => setShowEditModal(false)} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} popup size="sm" className="p-4 pt-16 md:pt-4 z-[9999]">
                <Modal.Header className="p-3" />
                <Modal.Body className="p-4">
                    <div className="text-center">
                        <HiOutlineExclamationCircle className='h-12 w-12 sm:h-14 sm:w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-3 sm:mb-5 text-base sm:text-lg text-gray-500 dark:text-gray-400'>
                            Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}?
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-5">This action cannot be undone.</p>
                        <div className='flex flex-col sm:flex-row justify-center gap-3 sm:gap-6'>
                            <Button color='failure' size='sm' onClick={handleDeleteUser} className="flex-1 sm:flex-none">
                                Yes, Delete
                            </Button>
                            <Button color='gray' size='sm' onClick={() => setShowDeleteModal(false)} className="flex-1 sm:flex-none">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    )
}
