const express = require('express');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');
const { randomBytes } = require('crypto');

dotenv.config();

const app = express();

// Generate a random secret
const generateSecret = () => {
  return randomBytes(32).toString('hex');
};

const SESSION_SECRET = generateSecret();

// Middleware to set Content-Type: application/json for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));


// User sign-in endpoint
app.post('/api/login/userlogin', async (req, res) => {
  try {
    const response = await fetch('http://34.81.61.11:30001/api/login/userlogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.responseCode == 0) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    res.json({
      message: 'Login successful',
      user: {
        id: data.comment, // Extract `comment` from the parsed JSON
        name: data.name,
       
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
  if (req.session.user) {
    res.json({ isAuthenticated: true, user: req.session.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Logout route
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get user profile
app.get('/api/user/profile', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json(userProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
app.put('/api/user/profile/update', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // If no fields to update, return early
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Simulate updating user profile
    const updatedUser = {
      ...req.session.user,
      ...updates
    };

    req.session.user = updatedUser;

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user password
app.put('/api/user/profile/password', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    const { newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    // Simulate password update
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login endpoint
app.post('/api/login/adminlogin', async (req, res) => {
  try {

    const response = await fetch('http://34.81.61.11:30001/api/login/adminlogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      credentials: 'include'
    });

    const data = await response.json(); // Parse response JSON
    if (data.responseCode == 0) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    res.json({
      message: 'Login successful',
      admin: {
        id: data.comment, // Extract `comment` from the parsed JSON
        name: data.name,

      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Check admin auth status
app.get('/api/admin/auth/status', (req, res) => {
  if (req.session.admin) {
    res.json({ isAuthenticated: true, admin: req.session.admin });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Helper middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.admin) {
    return res.status(401).json({ message: 'Admin access required' });
  }
  next();
};

// Get all users (simulated)
app.get('/api/admin/ghuser', async (req, res) => {
  try {
    const userId = req.query.userId;

    const response = await fetch('http://34.81.61.11:30001/api/admin/ghuser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:  JSON.stringify( {
        "UserID": userId
      }), 
      credentials: 'include'
  })
 
    const data = await response.json()
    
    const users = data.map(user => ({
      id: user.userId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      greenhouseId: user.greenhouseId,
      status: user.status
    }));
    
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update user with mobile number (simulated)
app.put('/api/admin/update/:type/:id', isAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { name, email, mobile } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Simulate update
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password endpoint (simulated)
app.put('/api/admin/reset-password/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Simulate password reset
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users (simulated)
app.get('/api/admin/users/search', isAdmin, async (req, res) => {
  try {
    const { query } = req.query;

    // Simulate search results
    // const users = [
    //   { id: 1, name: 'user1', email: 'user1@example.com', mobile: '1234567890' },
    //   { id: 2, name: 'user2', email: 'user2@example.com', mobile: '0987654321' }
    // ];

    const filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.mobile.includes(query)
    );

    res.json(filteredUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Create new user (simulated)
app.post('/api/login/ghuseronboarding', async (req, res) => {
  try {
    const userId = req.query.userId;

    const response = await fetch('http://34.81.61.11:30001/api/login/ghuseronboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:  JSON.stringify(req.body), 
      credentials: 'include'
  })
 
  const data = await response.json();

  res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new admin (simulated)
app.post('/api/login/adminuseronboarding', async (req, res) => {
  try {
    const userId = req.query.userId;

    const response = await fetch('http://34.81.61.11:30001/api/login/adminuseronboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:  JSON.stringify(req.body), 
      credentials: 'include'
  })
 
  const data = await response.json();

    // Simulate user creation
    res.status(201).json({ message: 'Created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all admins (simulated)
app.get('/api/admin/adminuser', async (req, res) => {
  try {
    const userId = req.query.userId;

    const response = await fetch('http://34.81.61.11:30001/api/admin/adminuser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:  JSON.stringify( {
        "UserID": userId
      }), 
      credentials: 'include'
  })
 
    const data = await response.json()
    const users = data.map(user => ({
      id:user.userId,
      name: user.name,
      email: user.email,
      status: user.status,
      //mobile: user.mobile
    }));

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching admins' });
  }
});

// Delete user or admin
app.post('/api/admin/:endpoint',async (req, res) => {
  try {

    const { UserID, deleteUserID } = req.body; // Extract user IDs from request body
    const { endpoint } = req.params; // Get endpoint type (userdelete or admindelete)
    // Determine the correct API endpoint based on the type
    const apiUrl = endpoint === 'userdelete'
      ? 'http://34.81.61.11:30001/api/admin/userdelete'
      : 'http://34.81.61.11:30001/api/admin/admindelete';

    // Forward the request to the actual deletion API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "UserID":UserID,
        "deleteUeserID": deleteUserID
    }),
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to delete user');

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Search admins (simulated)
app.get('/api/admin/admins/search', isAdmin, async (req, res) => {
  try {
    const { query } = req.query;

    // Simulate search results
    // const admins = [
    //   { id: 1, name: 'admin1', email: 'admin1@example.com' },
    //   { id: 2, name: 'admin2', email: 'admin2@example.com' }
    // ];

    const filteredAdmins = admins.filter(admin => 
      admin.name.toLowerCase().includes(query.toLowerCase()) ||
      admin.email.toLowerCase().includes(query.toLowerCase())
    );

    res.json(filteredAdmins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error searching admins' });
  }
});

// Temperature and humidity endpoint for latest data (simulated)
app.get('/api/sensor-data/history/temp-humidity/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days);

    // Simulate temperature and humidity data
    // const data = [
    //   { time: '2023-10-01 12:00:00', temperature: 25.5, humidity: 60.0 },
    //   { time: '2023-10-01 12:05:00', temperature: 26.0, humidity: 59.5 }
    // ];

    res.json(data);
  } catch (err) {
    console.error('Error fetching temperature and humidity history:', err);
    res.status(500).json({ message: 'Error fetching temperature and humidity data' });
  }
});

// Light data endpoint for latest data (simulated)
app.get('/api/sensor-data/history/light/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days);

    // Simulate light data
    // const data = [
    //   { time: '2023-10-01 12:00:00', light: 1200 },
    //   { time: '2023-10-01 12:05:00', light: 1250 }
    // ];

    res.json(data);
  } catch (err) {
    console.error('Error fetching light history:', err);
    res.status(500).json({ message: 'Error fetching light data' });
  }
});

// NPK data endpoint for latest data (simulated)
app.get('/api/sensor-data/history/npk/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days);

    // Simulate NPK data
    // const data = [
    //   { time: '2023-10-01 12:00:00', nitrogen: 150, phosphorus: 100, potassium: 200 },
    //   { time: '2023-10-01 12:05:00', nitrogen: 155, phosphorus: 105, potassium: 205 }
    // ];

    res.json(data);
  } catch (err) {
    console.error('Error fetching NPK history:', err);
    res.status(500).json({ message: 'Error fetching NPK data' });
  }
});

const PORT = process.env.PORT || 30001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});