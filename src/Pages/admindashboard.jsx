// src/pages/AdminDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../Components/ui/card';
import { Input } from '../Components/ui/input';
import { Button } from '../Components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Components/ui/tabs';
import { useToast } from '../Components/ui/toast';
import { LogOut, Edit, Trash2, Search, Lock } from 'lucide-react';

const AdminDashboard = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("users");
    const [users, setUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isPasswordReset, setIsPasswordReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        mobile: '',
        isAdmin: false
    });

    useEffect(() => {
        const checkAuth = async () => {
            const admin = sessionStorage.getItem('admin');
            if (!admin) {
                navigate('/admin-login');
                return;
            }
            await fetchUsers();
            await fetchAdmins();
        };

        checkAuth();
    }, [navigate]);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3001/api/admin/users', {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            addToast('Error fetching users', 'error');
        }
    }, [addToast]);

    const fetchAdmins = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3001/api/admin/admins', {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch admins');
            const data = await response.json();
            setAdmins(data);
        } catch (err) {
            addToast('Error fetching admins', 'error');
        }
    }, [addToast]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newUser,
                    isAdmin: activeTab === 'admins'
                }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to create user');

            addToast(`Created successfully`, 'success');
            setNewUser({ username: '', email: '', password: '', mobile: '', isAdmin: false });
            fetchUsers();
            fetchAdmins();
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const type = editingItem.isAdmin ? 'admin' : 'user';
            const data = {
                username: editingItem.USERNAME,
                email: editingItem.EMAIL,
                mobile: editingItem.MOBILE
            };

            const response = await fetch(`http://localhost:3001/api/admin/update/${type}/${editingItem.ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to update');

            addToast('Updated successfully', 'success');
            setEditingItem(null);
            if (type === 'admin') {
                fetchAdmins();
            } else {
                fetchUsers();
            }
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:3001/api/admin/reset-password/${editingItem.ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to reset password');

            addToast('Password reset successfully', 'success');
            setIsPasswordReset(false);
            setNewPassword('');
            setEditingItem(null);
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`http://localhost:3001/api/admin/delete/${type}/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to delete');

            addToast('Deleted successfully', 'success');
            fetchUsers();
            fetchAdmins();
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:3001/api/admin/logout', {
                method: 'POST',
                credentials: 'include'
            });
            sessionStorage.removeItem('admin');
            navigate('/admin-login');
        } catch (err) {
            addToast('Error logging out', 'error');
        }
    };

    // Add debounce function
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    // Search functions
    const searchUsers = async (query) => {
        try {
            const response = await fetch(
                `http://localhost:3001/api/admin/users/search?query=${encodeURIComponent(query)}`,
                { credentials: 'include' }
            );
            if (!response.ok) throw new Error('Search failed');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            addToast('Error searching users', 'error');
        }
    };

    const searchAdmins = async (query) => {
        try {
            const response = await fetch(
                `http://localhost:3001/api/admin/admins/search?query=${encodeURIComponent(query)}`,
                { credentials: 'include' }
            );
            if (!response.ok) throw new Error('Search failed');
            const data = await response.json();
            setAdmins(data);
        } catch (err) {
            addToast('Error searching admins', 'error');
        }
    };

    // Create debounced search handler
    const debouncedSearch = React.useCallback(
        debounce((query) => {
            if (query) {
                setIsSearching(true);
                if (activeTab === 'users') {
                    searchUsers(query);
                } else {
                    searchAdmins(query);
                }
            } else {
                setIsSearching(false);
                if (activeTab === 'users') {
                    fetchUsers();
                } else {
                    fetchAdmins();
                }
            }
        }, 300),
        [activeTab]
    );

    // Handle search input change
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };

    // Reset search when switching tabs
    useEffect(() => {
        setSearchQuery('');
        setIsSearching(false);
    }, [activeTab]);

    const UsersListContent = () => (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Users List</CardTitle>
                </div>
                <div className="mt-4">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search users by name, email, or mobile..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="pl-10"
                        />
                        <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="divide-y">
                    {isSearching && users.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No users found</p>
                    ) : users.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No users available</p>
                    ) : (
                        users.map(user => (
                            <div key={user.ID} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{user.USERNAME}</p>
                                    <p className="text-sm text-gray-500">{user.EMAIL}</p>
                                    <p className="text-sm text-gray-500">{user.MOBILE}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setIsPasswordReset(false);
                                            setEditingItem({ ...user, isAdmin: false });
                                        }}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setIsPasswordReset(true);
                                            setEditingItem({ ...user, isAdmin: false });
                                        }}
                                    >
                                        <Lock className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        className="bg-red-500 hover:bg-red-500"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete('user', user.ID)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );

    // Update the Admins List Card content
    const AdminsListContent = () => (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Admins List</CardTitle>
                </div>
                <div className="mt-4">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search admins by name or email..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="pl-10"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="divide-y">
                    {isSearching && admins.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No admins found</p>
                    ) : admins.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No admins available</p>
                    ) : (
                        admins.map(admin => (
                            <div key={admin.ID} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{admin.USERNAME}</p>
                                    <p className="text-sm text-gray-500">{admin.EMAIL}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingItem({ ...admin, isAdmin: true })}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button className="bg-red-500 hover:bg-red-500"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete('admin', admin.ID)}
                                    >
                                        <Trash2 className="h-4 w-4 bg-red-500 hover:bg-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="flex items-center space-x-2"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="users">
                    <TabsList>
                        <TabsTrigger value="users">Manage Users</TabsTrigger>
                        <TabsTrigger value="admins">Manage Admins</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" selectedTab={activeTab}>
                        <div className="grid gap-6">
                            {/* Create New User Form */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Create New User</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreate} className="space-y-4 space-x-4">
                                        <Input
                                            placeholder="Username"
                                            value={newUser.username}
                                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                            required
                                        />
                                        <Input
                                            type="email"
                                            placeholder="Email"
                                            value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            required
                                        />
                                        <Input
                                            type="tel"
                                            placeholder="Mobile Number"
                                            value={newUser.mobile}
                                            onChange={e => setNewUser({ ...newUser, mobile: e.target.value })}
                                            required
                                        />
                                        <Input
                                            type="password"
                                            placeholder="Password"
                                            value={newUser.password}
                                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                            required
                                        />
                                        <Button type="submit">Create User</Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Users List */}
                            {/* <Card>
                                <CardHeader>
                                    <CardTitle>Users List</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="divide-y">
                                        {users.length === 0 ? (
                                            <p className="text-center text-gray-500 py-4">No users found</p>
                                        ) : (
                                            users.map(user => (
                                                <div key={user.ID} className="py-4 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">{user.USERNAME}</p>
                                                        <p className="text-sm text-gray-500">{user.EMAIL}</p>
                                                        <p className="text-sm text-gray-500">{user.MOBILE || 'No mobile number'}</p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEditingItem({ ...user, isAdmin: false })}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setIsPasswordReset(true);
                                                                setEditingItem({ ...user, isAdmin: false });
                                                            }}
                                                        >
                                                            <Lock className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            className="bg-red-500 hover:bg-red-500"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete('user', user.ID)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card> */}
                            <UsersListContent />
                        </div>
                    </TabsContent>

                    <TabsContent value="admins">
                        <div className="grid gap-6">
                            {/* Create New Admin Form */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Create New Admin</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreate} className="space-y-4 space-x-4">
                                        <Input
                                            placeholder="Username"
                                            value={newUser.username}
                                            onChange={e => setNewUser({ ...newUser, username: e.target.value, isAdmin: true })}
                                            required
                                        />
                                        <Input
                                            type="email"
                                            placeholder="Email"
                                            value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value, isAdmin: true })}
                                            required
                                        />
                                        <Input
                                            type="password"
                                            placeholder="Password"
                                            value={newUser.password}
                                            onChange={e => setNewUser({ ...newUser, password: e.target.value, isAdmin: true })}
                                            required
                                        />
                                        <Button type="submit">Create Admin</Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Admins List */}
                            {/* <Card>
                                <CardHeader>
                                    <CardTitle>Admins List</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="divide-y">
                                        {admins.length === 0 ? (
                                            <p className="text-center text-gray-500 py-4">No admins found</p>
                                        ) : (
                                            admins.map(admin => (
                                                <div key={admin.ID} className="py-4 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">{admin.USERNAME}</p>
                                                        <p className="text-sm text-gray-500">{admin.EMAIL}</p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEditingItem({ ...admin, isAdmin: true })}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button className="bg-red-500 hover:bg-red-500"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete('admin', admin.ID)}
                                                        >
                                                            <Trash2 className="h-4 w-4 bg-red-500 hover:bg-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card> */}
                            <AdminsListContent />
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Edit Modal */}
                {editingItem && !isPasswordReset && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>Edit {editingItem.isAdmin ? 'Admin' : 'User'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <Input
                                        placeholder="Username"
                                        value={editingItem.USERNAME}
                                        onChange={e => setEditingItem({ ...editingItem, USERNAME: e.target.value })}
                                        required
                                    />
                                    <Input
                                        type="email"
                                        placeholder="Email"
                                        value={editingItem.EMAIL}
                                        onChange={e => setEditingItem({ ...editingItem, EMAIL: e.target.value })}
                                        required
                                    />
                                    <Input
                                        type="tel"
                                        placeholder="Mobile"
                                        value={editingItem.MOBILE || ''}
                                        onChange={e => setEditingItem({ ...editingItem, MOBILE: e.target.value })}
                                        required
                                    />
                                    <div className="flex space-x-2">
                                        <Button type="submit">Save</Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingItem(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Password Reset Modal */}
                {editingItem && isPasswordReset && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>Reset Password for {editingItem.USERNAME}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordReset} className="space-y-4">
                                    <Input
                                        type="password"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <div className="flex space-x-2">
                                        <Button type="submit">Reset Password</Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsPasswordReset(false);
                                                setNewPassword('');
                                                setEditingItem(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;