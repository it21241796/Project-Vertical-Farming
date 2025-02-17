import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown';
import { User, Leaf } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(sessionStorage.getItem('user') || '{}');

  return (
    <div className="border-b bg-white shadow-sm">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex items-center">
          <Leaf className="h-8 w-8 text-green-600 mr-2" />
          <span className="text-xl font-bold text-green-800">GreenHouse</span>
          <h1 className="text-2xl font-bold text-green-800 ml-8">
            Smart Greenhouse
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center mr-2">
            <span className="text-gray-700">Hi, {userInfo.username}!</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{userInfo.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Navbar;