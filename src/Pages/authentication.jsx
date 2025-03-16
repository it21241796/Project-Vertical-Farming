import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../Components/ui/card';
import { Input } from '../Components/ui/input';
import { Button } from '../Components/ui/button';
import { useToast } from '../Components/ui/toast';

const AuthPage = () => {
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

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (user) {
      navigate("/dashboard", { replace: true })
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log(formData)
    try {
      // Bypass the authentication process
      // const mockUser = {
      //   id: 1,
      //   email: 'test@example.com',
      //   name: 'Test User'
      // };

      // sessionStorage.setItem('user', JSON.stringify(mockUser));
      // addToast('Logged in successfully', 'success');
        const response = await fetch('http://localhost:30001/api/login/userlogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }
      sessionStorage.setItem('user', JSON.stringify(data.user));
      addToast('Logged in successfully', 'success');

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err) {
      addToast(err.message || 'An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
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
                Smart Green House
              </h1>
              <p className="text-center text-gray-600">
                Please login to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="w-full">
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="w-full">
                <Input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : 'LOG IN'}
              </Button>
            </form>

            <p className="mt-4 text-center text-gray-600">
              Are you an administrator?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => navigate('/admin-login')}
              >
                Admin Login
              </button>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Gradient Background with Text */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-500 to-blue-500 items-center justify-center p-12">
        <div className="text-white w-full ">
          {/* Adjusted Heading */}
          <h2 className="text-6xl font-bold mb-6 mt-4 text-center leading-tight">
            Welcome to <br />
            <span className="block text-5xl">Green Life Solutions</span>
          </h2>


          {/* Subtext in one line */}
          <p className="text-2xl  mb-8 text-left pl-0">
            Monitor and control your greenhouse environment with our advanced dashboard.
          </p>


          {/* Eye-catching Feature Highlights */}
          <div className="mb-10 max-w-lg ml-20">
            <h3 className="text-2xl font-semibold mb-2"> <br />Why Choose Us?</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>🌱 Real-time monitoring of greenhouse conditions.</li>
              <li>⚡ Energy-efficient automation solutions.</li>
              <li>📊 Data-driven insights to optimize crop yield.<br /><br /></li>
            </ul>
          </div>

          {/* Contact Us Section */}
          <div className=" border-t border-white mt-12 pt-6 ">
            <h3 className="text-xl font-semibold mb-2"><br /><br /><br />Contact Us</h3>
            <p className="text-lg opacity-90 mb-1">
              📞 Phone: <a href="tel:+1234567890" className="underline">+1 234 567 890</a>
            </p>
            <p className="text-lg opacity-90 mb-1">
              📧 Email: <a href="mailto:info@greenlifesolutions.com" className="underline">info@greenlifesolutions.com</a>
            </p>
            <p className="text-lg opacity-90">
              🌐 Visit: <a href="https://greenlifesolutions.com" target="_blank" rel="noopener noreferrer" className="underline">www.greenlifesolutions.com</a>
            </p>
          </div>
        </div>


      </div>
    </div>
  );
};

export default AuthPage;