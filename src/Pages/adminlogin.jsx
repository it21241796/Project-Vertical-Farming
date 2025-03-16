// src/pages/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../Components/ui/card';
import { Input } from '../Components/ui/input';
import { Button } from '../Components/ui/button';
import { useToast } from '../Components/ui/toast';

const AdminLogin = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:30001/api/login/adminlogin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }
            // Store admin data in session storage
            sessionStorage.setItem('admin', data.admin.id);
            addToast('Logged in successfully', 'success');
            navigate('/admin-dashboard');
        } catch (err) {
            addToast(err.message || 'An error occurred', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Auth Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="mb-8">
                            <img
                                src="../sprout.png"
                                alt="Logo"
                                className="h-12 mx-auto mb-4"
                            />
                            <h1 className="text-2xl font-semibold text-center mb-2">
                                Admin Login
                            </h1>
                            <p className="text-center text-gray-600">
                                Please login to access admin dashboard
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                name="email"
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={{ width: '400px' }}
                            />

                            <Input
                                name="password"
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={{ width: '400px' }}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Please wait...' : 'LOGIN'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <Button
                                type="button"
                                variant="link"
                                className="text-blue-600 hover:underline"
                                onClick={() => navigate('/')}
                            >
                                Back to User Login
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Side - Gradient Background with Text */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-500 to-blue-500 items-center justify-center p-12">
                <div className="text-white w-full">
                    <h2 className="text-5xl font-bold mb-6 mt-4 text-center leading-tight">
                        Welcome to Admin Dashboard
                    </h2>
                    <p className="text-2xl opacity-90 mb-8 text-left pl-0">
                        Manage users and monitor system activities through the admin dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;