import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../Components/ui/card';
import { Input } from '../Components/ui/input';
import { Button } from '../Components/ui/button';
import { useToast } from '../Components/ui/toast';
import { ArrowLeft } from 'lucide-react';

const UserProfile = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [originalData, setOriginalData] = useState({
        username: '',
        mobile: '',
    });
    const [userData, setUserData] = useState({
        username: '',
        mobile: '',
    });
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    // Load current user data when component mounts
    useEffect(() => {
        const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        const initialData = {
            username: currentUser.username || '',
            mobile: currentUser.mobile || '',
        };
        setOriginalData(initialData);
        setUserData(initialData);
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Create an object with only the changed fields
        const updatedFields = {};
        if (userData.username !== originalData.username) {
            updatedFields.username = userData.username;
        }
        if (userData.mobile !== originalData.mobile) {
            updatedFields.mobile = userData.mobile;
        }

        // If nothing has changed, don't make the API call
        if (Object.keys(updatedFields).length === 0) {
            addToast('No changes to update', 'info');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/user/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFields),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to update profile');

            // Update session storage with new data
            const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
            const updatedUser = { ...currentUser, ...updatedFields };
            sessionStorage.setItem('user', JSON.stringify(updatedUser));

            // Update original data to reflect new values
            setOriginalData({ ...originalData, ...updatedFields });

            addToast('Profile updated successfully', 'success');
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            addToast('New passwords do not match', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/user/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newPassword: passwords.newPassword
                }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to update password');
            addToast('Password updated successfully', 'success');
            setPasswords({ newPassword: '', confirmPassword: '' });
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <Button
                    onClick={() => navigate('/dashboard')}
                    variant="outline"
                    className="mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                <div className="space-y-6">
                    {/* Profile Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">Username</label>
                                    <Input
                                        type="text"
                                        placeholder="Username"
                                        value={userData.username}
                                        onChange={e => setUserData({ ...userData, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">Mobile Number</label>
                                    <Input
                                        type="tel"
                                        placeholder="Mobile Number"
                                        value={userData.mobile}
                                        onChange={e => setUserData({ ...userData, mobile: e.target.value })}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading || (
                                        userData.username === originalData.username &&
                                        userData.mobile === originalData.mobile
                                    )}
                                >
                                    {isLoading ? 'Updating...' : 'Update Profile'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Password Change */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div>
                                    <Input
                                        type="password"
                                        placeholder="New Password"
                                        value={passwords.newPassword}
                                        onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="password"
                                        placeholder="Confirm New Password"
                                        value={passwords.confirmPassword}
                                        onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Updating...' : 'Change Password'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;