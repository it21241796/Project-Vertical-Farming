
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const oracledb = require('oracledb');
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

// Oracle DB Configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING
};

// Initialize Oracle connection pool
async function initialize() {
  try {
    await oracledb.createPool({
      ...dbConfig,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1
    });
    console.log('Oracle DB Pool created');
  } catch (err) {
    console.error('Error creating connection pool:', err);
    process.exit(1);
  }
}

initialize();


app.post('/api/auth/signin', async (req, res) => {
  let connection;
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    connection = await oracledb.getConnection();

    // Get user
    const result = await connection.execute(
      `SELECT * FROM users WHERE email = :email`,
      [email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.PASSWORD);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set user session
    req.session.user = {
      id: user.ID,
      username: user.USERNAME,
      email: user.EMAIL
    };

    res.json({
      message: 'Login successful',
      // user: req.session.user
      user: {
        id: user.ID,
        username: user.USERNAME,
        email: user.EMAIL
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
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
  let connection;
  try {
    const userId = req.session.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT username, email, mobile 
       FROM users 
       WHERE id = :id`,
      [userId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Update user profile
app.put('/api/user/profile/update', async (req, res) => {
  let connection;
  try {
    const userId = req.session.user.id;
    const updates = req.body; 

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // If no fields to update, return early
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    connection = await oracledb.getConnection();

    // Dynamically build the update query based on which fields were provided
    const updateFields = [];
    const bindParams = { id: userId };

    if (updates.username !== undefined) {
      updateFields.push('username = :username');
      bindParams.username = updates.username;
    }

    if (updates.mobile !== undefined) {
      updateFields.push('mobile = :mobile');
      bindParams.mobile = updates.mobile;
    }

    // If no valid fields to update, return
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = :id
    `;

    await connection.execute(updateQuery, bindParams, { autoCommit: true });

    // Update session with only the changed fields
    req.session.user = {
      ...req.session.user,
      ...updates
    };

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        ...req.session.user,
        ...updates
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Update user password
app.put('/api/user/profile/password', async (req, res) => {
  let connection;
  try {
    const userId = req.session.user.id;
    const { newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    connection = await oracledb.getConnection();
    await connection.execute(
      `UPDATE users 
       SET password = :password 
       WHERE id = :id`,
      { password: hashedNewPassword, id: userId },
      { autoCommit: true }
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});


// Variable to store data generation interval
// let dataGenerationInterval = null;

// // Function to generate random sensor data with 2 decimal places
// function generateRandomData() {
//   const randomInRange = (min, max) => Number((Math.random() * (max - min) + min).toFixed(2));
  
//   return {
//     temperature_sensor1: { temperature: randomInRange(20, 30) },
//     temperature_sensor2: { temperature: randomInRange(20, 30) },
//     temperature_sensor3: { temperature: randomInRange(20, 30) },
//     temperature_sensor4: { temperature: randomInRange(20, 30) },
//     humidity_sensor1: { humidity: randomInRange(40, 80) },
//     humidity_sensor2: { humidity: randomInRange(40, 80) },
//     humidity_sensor3: { humidity: randomInRange(40, 80) },
//     humidity_sensor4: { humidity: randomInRange(40, 80) },
//     light_sensor1: { light_intensity: randomInRange(500, 1500) },
//     light_sensor2: { light_intensity: randomInRange(500, 1500) },
//     light_sensor3: { light_intensity: randomInRange(500, 1500) },
//     light_sensor4: { light_intensity: randomInRange(500, 1500) },
//     npk: {
//       nitrogen: randomInRange(100, 200),
//       phosphorus: randomInRange(50, 150),
//       potassium: randomInRange(150, 250)
//     }
//   };
// }

// // Function to insert sensor data into the database
// async function insertSensorData(connection, data) {
//   try {
//     // Insert temperature sensor data
//     for (let i = 1; i <= 4; i++) {
//       await connection.execute(
//         `INSERT INTO temperature_sensor${i} (id, timestamp, temperature) 
//          VALUES (temperature_sensor${i}_seq.NEXTVAL, CURRENT_TIMESTAMP, :temp)`,
//         [data[`temperature_sensor${i}`].temperature],
//         { autoCommit: true }
//       );
//     }

//     // Insert humidity sensor data
//     for (let i = 1; i <= 4; i++) {
//       await connection.execute(
//         `INSERT INTO humidity_sensor${i} (id, timestamp, humidity) 
//          VALUES (humidity_sensor${i}_seq.NEXTVAL, CURRENT_TIMESTAMP, :hum)`,
//         [data[`humidity_sensor${i}`].humidity],
//         { autoCommit: true }
//       );
//     }

//     // Insert light sensor data
//     for (let i = 1; i <= 4; i++) {
//       await connection.execute(
//         `INSERT INTO light_sensor${i} (id, timestamp, light_intensity) 
//          VALUES (light_sensor${i}_seq.NEXTVAL, CURRENT_TIMESTAMP, :light)`,
//         [data[`light_sensor${i}`].light_intensity],
//         { autoCommit: true }
//       );
//     }

//     // Insert NPK sensor data
//     await connection.execute(
//       `INSERT INTO npk_sensor (id, timestamp, nitrogen, phosphorus, potassium) 
//        VALUES (npk_sensor_seq.NEXTVAL, CURRENT_TIMESTAMP, :n, :p, :k)`,
//       [data.npk.nitrogen, data.npk.phosphorus, data.npk.potassium],
//       { autoCommit: true }
//     );

//     // Calculate and insert averages
//     const avgTemp = Object.keys(data)
//       .filter(key => key.startsWith('temperature_sensor'))
//       .reduce((sum, key) => sum + data[key].temperature, 0) / 4;

//     await connection.execute(
//       `INSERT INTO temperature_average (id, timestamp, avg_temperature) 
//        VALUES (temperature_average_seq.NEXTVAL, CURRENT_TIMESTAMP, :avg)`,
//       [avgTemp],
//       { autoCommit: true }
//     );

//     const avgHum = Object.keys(data)
//       .filter(key => key.startsWith('humidity_sensor'))
//       .reduce((sum, key) => sum + data[key].humidity, 0) / 4;

//     await connection.execute(
//       `INSERT INTO humidity_average (id, timestamp, avg_humidity) 
//        VALUES (humidity_average_seq.NEXTVAL, CURRENT_TIMESTAMP, :avg)`,
//       [avgHum],
//       { autoCommit: true }
//     );

//     const avgLight = Object.keys(data)
//       .filter(key => key.startsWith('light_sensor'))
//       .reduce((sum, key) => sum + data[key].light_intensity, 0) / 4;

//     await connection.execute(
//       `INSERT INTO light_average (id, timestamp, avg_light_intensity) 
//        VALUES (light_average_seq.NEXTVAL, CURRENT_TIMESTAMP, :avg)`,
//       [avgLight],
//       { autoCommit: true }
//     );

//     console.log('Data insertion completed:', new Date().toLocaleTimeString());
    
//   } catch (error) {
//     console.error('Error in insertSensorData:', error);
//     throw error;
//   }
// }

// // Function to start real-time data generation
// async function startDataGeneration() {
//   //console.log('Starting real-time data generation...');
  
//   //Clear any existing interval
//   if (dataGenerationInterval) {
//     clearInterval(dataGenerationInterval);
//   }

//   // Function to generate and insert one batch of data
//   async function generateAndInsertData() {
//     let connection;
//     try {
//       connection = await oracledb.getConnection();
//       const newData = generateRandomData();
//       await insertSensorData(connection, newData);
//     } catch (error) {
//       console.error('Error in data generation cycle:', error);
//     } finally {
//       if (connection) {
//         try {
//           await connection.close();
//         } catch (err) {
//           console.error('Error closing connection:', err);
//         }
//       }
//     }
//   }

//   // Generate initial data immediately
//   await generateAndInsertData();

//   // Set up interval for continuous data generation
//   dataGenerationInterval = setInterval(generateAndInsertData, 10000);
  
// }

// // Initialize database and start data generation
// async function initialize() {
//   try {
//     await oracledb.createPool({
//       ...dbConfig,
//       poolMin: 1,
//       poolMax: 5,
//       poolIncrement: 1
//     });
//     //console.log('Oracle DB Pool created');
    
//     // Start real-time data generation
//     await startDataGeneration();
//   } catch (err) {
//     console.error('Error during initialization:', err);
//     process.exit(1);
//   }
// }

// // Start initialization
// initialize();

// // Latest sensor data endpoint
// app.get('/api/sensor-data/latest', async (req, res) => {
//   let connection;
//   try {
//     connection = await oracledb.getConnection();
    
//     // Use a single optimized query to get all latest sensor data
//     const result = await connection.execute(`
//       WITH latest_data AS (
//         SELECT 
//           t1.temperature as temp1,
//           t2.temperature as temp2,
//           t3.temperature as temp3,
//           t4.temperature as temp4,
//           ta.avg_temperature,
//           h1.humidity as hum1,
//           h2.humidity as hum2,
//           h3.humidity as hum3,
//           h4.humidity as hum4,
//           ha.avg_humidity,
//           l1.light_intensity as light1,
//           l2.light_intensity as light2,
//           l3.light_intensity as light3,
//           l4.light_intensity as light4,
//           la.avg_light_intensity,
//           n.nitrogen,
//           n.phosphorus,
//           n.potassium
//         FROM 
//           (SELECT temperature FROM temperature_sensor1 WHERE id = (SELECT MAX(id) FROM temperature_sensor1)) t1,
//           (SELECT temperature FROM temperature_sensor2 WHERE id = (SELECT MAX(id) FROM temperature_sensor2)) t2,
//           (SELECT temperature FROM temperature_sensor3 WHERE id = (SELECT MAX(id) FROM temperature_sensor3)) t3,
//           (SELECT temperature FROM temperature_sensor4 WHERE id = (SELECT MAX(id) FROM temperature_sensor4)) t4,
//           (SELECT avg_temperature FROM temperature_average WHERE id = (SELECT MAX(id) FROM temperature_average)) ta,
//           (SELECT humidity FROM humidity_sensor1 WHERE id = (SELECT MAX(id) FROM humidity_sensor1)) h1,
//           (SELECT humidity FROM humidity_sensor2 WHERE id = (SELECT MAX(id) FROM humidity_sensor2)) h2,
//           (SELECT humidity FROM humidity_sensor3 WHERE id = (SELECT MAX(id) FROM humidity_sensor3)) h3,
//           (SELECT humidity FROM humidity_sensor4 WHERE id = (SELECT MAX(id) FROM humidity_sensor4)) h4,
//           (SELECT avg_humidity FROM humidity_average WHERE id = (SELECT MAX(id) FROM humidity_average)) ha,
//           (SELECT light_intensity FROM light_sensor1 WHERE id = (SELECT MAX(id) FROM light_sensor1)) l1,
//           (SELECT light_intensity FROM light_sensor2 WHERE id = (SELECT MAX(id) FROM light_sensor2)) l2,
//           (SELECT light_intensity FROM light_sensor3 WHERE id = (SELECT MAX(id) FROM light_sensor3)) l3,
//           (SELECT light_intensity FROM light_sensor4 WHERE id = (SELECT MAX(id) FROM light_sensor4)) l4,
//           (SELECT avg_light_intensity FROM light_average WHERE id = (SELECT MAX(id) FROM light_average)) la,
//           (SELECT nitrogen, phosphorus, potassium FROM npk_sensor WHERE id = (SELECT MAX(id) FROM npk_sensor)) n
//       )
//       SELECT * FROM latest_data
//     `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

//     // Format the response
//     const latestData = {
//       temperature: {
//         sensor1: result.rows[0]?.TEMP1 || 0,
//         sensor2: result.rows[0]?.TEMP2 || 0,
//         sensor3: result.rows[0]?.TEMP3 || 0,
//         sensor4: result.rows[0]?.TEMP4 || 0,
//         average: result.rows[0]?.AVG_TEMPERATURE || 0
//       },
//       humidity: {
//         sensor1: result.rows[0]?.HUM1 || 0,
//         sensor2: result.rows[0]?.HUM2 || 0,
//         sensor3: result.rows[0]?.HUM3 || 0,
//         sensor4: result.rows[0]?.HUM4 || 0,
//         average: result.rows[0]?.AVG_HUMIDITY || 0
//       },
//       light: {
//         sensor1: result.rows[0]?.LIGHT1 || 0,
//         sensor2: result.rows[0]?.LIGHT2 || 0,
//         sensor3: result.rows[0]?.LIGHT3 || 0,
//         sensor4: result.rows[0]?.LIGHT4 || 0,
//         average: result.rows[0]?.AVG_LIGHT_INTENSITY || 0
//       },
//       nitrogen: result.rows[0]?.NITROGEN || 0,
//       phosphorus: result.rows[0]?.PHOSPHORUS || 0,
//       potassium: result.rows[0]?.POTASSIUM || 0
//     };

//     res.json(latestData);
//   } catch (err) {
//     console.error('Error fetching latest sensor data:', err);
//     res.status(500).json({ 
//       message: 'Error fetching latest sensor data',
//       error: err.message 
//     });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (err) {
//         console.error('Error closing connection:', err);
//       }
//     }
//   }
// });


//sensor data
app.get('/api/sensor-data', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    
    // Fetch temperature data from all sensors
    const temp1Result = await connection.execute(
      `SELECT TO_CHAR(timestamp, 'HH24:MI') as time, temperature as temp1
       FROM temperature_sensor1
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const temp2Result = await connection.execute(
      `SELECT temperature as temp2
       FROM temperature_sensor2
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const temp3Result = await connection.execute(
      `SELECT temperature as temp3
       FROM temperature_sensor3
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const temp4Result = await connection.execute(
      `SELECT temperature as temp4
       FROM temperature_sensor4
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const avgTempResult = await connection.execute(
      `SELECT avg_temperature
       FROM temperature_average
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Fetch humidity data from all sensors
    const hum1Result = await connection.execute(
      `SELECT humidity as hum1
       FROM humidity_sensor1
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const hum2Result = await connection.execute(
      `SELECT humidity as hum2
       FROM humidity_sensor2
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const hum3Result = await connection.execute(
      `SELECT humidity as hum3
       FROM humidity_sensor3
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const hum4Result = await connection.execute(
      `SELECT humidity as hum4
       FROM humidity_sensor4
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const avgHumResult = await connection.execute(
      `SELECT avg_humidity
       FROM humidity_average
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Fetch light data from all sensors
    const light1Result = await connection.execute(
      `SELECT light_intensity as light1
       FROM light_sensor1
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const light2Result = await connection.execute(
      `SELECT light_intensity as light2
       FROM light_sensor2
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const light3Result = await connection.execute(
      `SELECT light_intensity as light3
       FROM light_sensor3
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const light4Result = await connection.execute(
      `SELECT light_intensity as light4
       FROM light_sensor4
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const avgLightResult = await connection.execute(
      `SELECT avg_light_intensity
       FROM light_average
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const npkResult = await connection.execute(
      `SELECT TO_CHAR(timestamp, 'HH24:MI') as time,
              nitrogen, phosphorus, potassium
       FROM npk_sensor
       ORDER BY timestamp DESC
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Combine all sensor data
    const combinedData = temp1Result.rows.map((row, index) => ({
      time: row.TIME,
      // Temperature sensors
      temperature: {
        sensor1: temp1Result.rows[index]?.TEMP1 || 0,
        sensor2: temp2Result.rows[index]?.TEMP2 || 0,
        sensor3: temp3Result.rows[index]?.TEMP3 || 0,
        sensor4: temp4Result.rows[index]?.TEMP4 || 0,
        average: avgTempResult.rows[index]?.AVG_TEMPERATURE || 0
      },
      // Humidity sensors
      humidity: {
        sensor1: hum1Result.rows[index]?.HUM1 || 0,
        sensor2: hum2Result.rows[index]?.HUM2 || 0,
        sensor3: hum3Result.rows[index]?.HUM3 || 0,
        sensor4: hum4Result.rows[index]?.HUM4 || 0,
        average: avgHumResult.rows[index]?.AVG_HUMIDITY || 0
      },
      // Light sensors
      light: {
        sensor1: light1Result.rows[index]?.LIGHT1 || 0,
        sensor2: light2Result.rows[index]?.LIGHT2 || 0,
        sensor3: light3Result.rows[index]?.LIGHT3 || 0,
        sensor4: light4Result.rows[index]?.LIGHT4 || 0,
        average: avgLightResult.rows[index]?.AVG_LIGHT_INTENSITY || 0
      },
      // NPK sensor
      nitrogen: npkResult.rows[index]?.NITROGEN || 0,
      phosphorus: npkResult.rows[index]?.PHOSPHORUS || 0,
      potassium: npkResult.rows[index]?.POTASSIUM || 0
    }));

    // Send the combined data
    res.json(combinedData);

  } catch (err) {
    console.error('Error fetching sensor data:', err);
    res.status(500).json({ message: 'Error fetching sensor data' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

app.get('/api/sensor-data/latest', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();

    // Get latest temperature readings
    const tempReadings = await connection.execute(`
      WITH latest_temps AS (
        SELECT temperature as sensor1, 
               (SELECT temperature FROM temperature_sensor2 WHERE id = (SELECT MAX(id) FROM temperature_sensor2)) as sensor2,
               (SELECT temperature FROM temperature_sensor3 WHERE id = (SELECT MAX(id) FROM temperature_sensor3)) as sensor3,
               (SELECT temperature FROM temperature_sensor4 WHERE id = (SELECT MAX(id) FROM temperature_sensor4)) as sensor4,
               (SELECT avg_temperature FROM temperature_average WHERE id = (SELECT MAX(id) FROM temperature_average)) as average
        FROM temperature_sensor1
        WHERE id = (SELECT MAX(id) FROM temperature_sensor1)
      )
      SELECT * FROM latest_temps`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Get latest humidity readings
    const humReadings = await connection.execute(`
      WITH latest_humidity AS (
        SELECT humidity as sensor1,
               (SELECT humidity FROM humidity_sensor2 WHERE id = (SELECT MAX(id) FROM humidity_sensor2)) as sensor2,
               (SELECT humidity FROM humidity_sensor3 WHERE id = (SELECT MAX(id) FROM humidity_sensor3)) as sensor3,
               (SELECT humidity FROM humidity_sensor4 WHERE id = (SELECT MAX(id) FROM humidity_sensor4)) as sensor4,
               (SELECT avg_humidity FROM humidity_average WHERE id = (SELECT MAX(id) FROM humidity_average)) as average
        FROM humidity_sensor1
        WHERE id = (SELECT MAX(id) FROM humidity_sensor1)
      )
      SELECT * FROM latest_humidity`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Get latest light readings
    const lightReadings = await connection.execute(`
      WITH latest_light AS (
        SELECT light_intensity as sensor1,
               (SELECT light_intensity FROM light_sensor2 WHERE id = (SELECT MAX(id) FROM light_sensor2)) as sensor2,
               (SELECT light_intensity FROM light_sensor3 WHERE id = (SELECT MAX(id) FROM light_sensor3)) as sensor3,
               (SELECT light_intensity FROM light_sensor4 WHERE id = (SELECT MAX(id) FROM light_sensor4)) as sensor4,
               (SELECT avg_light_intensity FROM light_average WHERE id = (SELECT MAX(id) FROM light_average)) as average
        FROM light_sensor1
        WHERE id = (SELECT MAX(id) FROM light_sensor1)
      )
      SELECT * FROM latest_light`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Get latest NPK readings
    const npkReadings = await connection.execute(`
      SELECT nitrogen, phosphorus, potassium
      FROM npk_sensor
      WHERE id = (SELECT MAX(id) FROM npk_sensor)`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Structure the response data
    const latestData = {
      temperature: {
        sensor1: tempReadings.rows[0]?.SENSOR1 || 0,
        sensor2: tempReadings.rows[0]?.SENSOR2 || 0,
        sensor3: tempReadings.rows[0]?.SENSOR3 || 0,
        sensor4: tempReadings.rows[0]?.SENSOR4 || 0,
        average: tempReadings.rows[0]?.AVERAGE || 0
      },
      humidity: {
        sensor1: humReadings.rows[0]?.SENSOR1 || 0,
        sensor2: humReadings.rows[0]?.SENSOR2 || 0,
        sensor3: humReadings.rows[0]?.SENSOR3 || 0,
        sensor4: humReadings.rows[0]?.SENSOR4 || 0,
        average: humReadings.rows[0]?.AVERAGE || 0
      },
      light: {
        sensor1: lightReadings.rows[0]?.SENSOR1 || 0,
        sensor2: lightReadings.rows[0]?.SENSOR2 || 0,
        sensor3: lightReadings.rows[0]?.SENSOR3 || 0,
        sensor4: lightReadings.rows[0]?.SENSOR4 || 0,
        average: lightReadings.rows[0]?.AVERAGE || 0
      },
      nitrogen: npkReadings.rows[0]?.NITROGEN || 0,
      phosphorus: npkReadings.rows[0]?.PHOSPHORUS || 0,
      potassium: npkReadings.rows[0]?.POTASSIUM || 0
    };

    res.json(latestData);
  } catch (err) {
    console.error('Error fetching latest sensor data:', err);
    res.status(500).json({ message: 'Error fetching latest sensor data' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});


// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  let connection;
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    connection = await oracledb.getConnection();

    // Get admin
    const result = await connection.execute(
      `SELECT * FROM admins WHERE email = :email`,
      [email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.PASSWORD);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set admin session
    req.session.admin = {
      id: admin.ID,
      username: admin.USERNAME,
      email: admin.EMAIL,
      isAdmin: true
    };

    res.json({
      message: 'Login successful',
      admin: {
        id: admin.ID,
        username: admin.USERNAME,
        email: admin.EMAIL
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
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

// Get all users
app.get('/api/admin/users', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    
    const result = await connection.execute(
      `SELECT id, username, email,  mobile 
       FROM users 
       ORDER BY id DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});


// Update user with mobile number
app.put('/api/admin/update/:type/:id', async (req, res) => {
  let connection;
  try {
    const { type, id } = req.params;
    const { username, email, mobile } = req.body;
    const table = type === 'admin' ? 'admins' : 'users';

    if (!username || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    connection = await oracledb.getConnection();

    await connection.execute(
      `UPDATE ${table} 
       SET username = :username, email = :email, mobile = :mobile 
       WHERE id = :id`,
      { username, email, mobile: mobile || null, id },
      { autoCommit: true }
    );

    res.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Reset password endpoint
app.put('/api/admin/reset-password/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    connection = await oracledb.getConnection();

    await connection.execute(
      `UPDATE users 
       SET password = :password 
       WHERE id = :id`,
      { password: hashedPassword, id },
      { autoCommit: true }
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Update the search users endpoint to include mobile
app.get('/api/admin/users/search', async (req, res) => {
  let connection;
  try {
    const { query } = req.query;
    connection = await oracledb.getConnection();
    
    const result = await connection.execute(
      `SELECT id, username, email, mobile 
       FROM users 
       WHERE LOWER(username) LIKE LOWER(:searchQuery) 
       OR LOWER(email) LIKE LOWER(:searchQuery)
       OR mobile LIKE :searchQuery
       ORDER BY id DESC`,
      { searchQuery: `%${query}%` },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error searching users' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Update the create user endpoint to include mobile
app.post('/api/admin/create-user', async (req, res) => {
  let connection;
  try {
    const { username, email, password, mobile, isAdmin } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    connection = await oracledb.getConnection();

    // Select table based on user type
    const table = isAdmin ? 'admins' : 'users';

    await connection.execute(
      `INSERT INTO ${table} (username, email, password, mobile) 
       VALUES (:username, :email, :password, :mobile)`,
      {
        username,
        email,
        password: hashedPassword,
        mobile: mobile || null
      },
      { autoCommit: true }
    );

    res.status(201).json({ message: 'Created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Get all admins
app.get('/api/admin/admins', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    
    const result = await connection.execute(
      `SELECT id, username, email 
       FROM admins 
       ORDER BY id DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching admins' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Create new user/admin
// app.post('/api/admin/create-user', async (req, res) => {
//   let connection;
//   try {
//     const { username, email, password, isAdmin } = req.body;
    
//     // Validate input
//     if (!username || !email || !password) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     connection = await oracledb.getConnection();

//     // Select table based on user type
//     const table = isAdmin ? 'admins' : 'users';

//     await connection.execute(
//       `INSERT INTO ${table} (username, email, password) 
//        VALUES (:username, :email, :password)`,
//       {
//         username,
//         email,
//         password: hashedPassword
//       },
//       { autoCommit: true }
//     );

//     res.status(201).json({ message: 'Created successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (err) {
//         console.error(err);
//       }
//     }
//   }
// });

// // Update user/admin
// app.put('/api/admin/update/:type/:id', async (req, res) => {
//   let connection;
//   try {
//     const { type, id } = req.params;
//     const { username, email } = req.body;
//     const table = type === 'admin' ? 'admins' : 'users';

//     if (!username || !email) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     connection = await oracledb.getConnection();

//     await connection.execute(
//       `UPDATE ${table} 
//        SET username = :username, email = :email 
//        WHERE id = :id`,
//       { username, email, id },
//       { autoCommit: true }
//     );

//     res.json({ message: 'Updated successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (err) {
//         console.error(err);
//       }
//     }
//   }
// });

// Delete user/admin
app.delete('/api/admin/delete/:type/:id', async (req, res) => {
  let connection;
  try {
    const { type, id } = req.params;
    const table = type === 'admin' ? 'admins' : 'users';

    connection = await oracledb.getConnection();

    await connection.execute(
      `DELETE FROM ${table} WHERE id = :id`,
      [id],
      { autoCommit: true }
    );

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});


// Search users
app.get('/api/admin/users/search', async (req, res) => {
  let connection;
  try {
    const { query } = req.query;
    connection = await oracledb.getConnection();
    
    const result = await connection.execute(
      `SELECT id, username, email 
       FROM users 
       WHERE LOWER(username) LIKE LOWER(:searchQuery) 
       OR LOWER(email) LIKE LOWER(:searchQuery)
       ORDER BY id DESC`,
      { searchQuery: `%${query}%` },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error searching users' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

app.get('/api/admin/admins/search', async (req, res) => {
  let connection;
  try {
    const { query } = req.query;
    connection = await oracledb.getConnection();
    
    const result = await connection.execute(
      `SELECT id, username, email 
       FROM admins 
       WHERE LOWER(username) LIKE LOWER(:searchQuery) 
       OR LOWER(email) LIKE LOWER(:searchQuery)
       ORDER BY id DESC`,
      { searchQuery: `%${query}%` },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error searching admins' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Temperature and humidity endpoint for latest data
app.get('/api/sensor-data/history/temp-humidity/:days', async (req, res) => {
  let connection;
  try {
    const days = parseInt(req.params.days);
    
    connection = await oracledb.getConnection();
    
    // Latest data query (last 30 readings)
    const query = `
      SELECT 
        TO_CHAR(t.timestamp, 'YYYY-MM-DD HH24:MI:SS') as time,
        t.avg_temperature as temperature,
        h.avg_humidity as humidity
      FROM (
        SELECT *
        FROM temperature_average 
        ORDER BY timestamp DESC 
        FETCH FIRST 30 ROWS ONLY
      ) t
      LEFT JOIN humidity_average h 
      ON h.timestamp BETWEEN t.timestamp - INTERVAL '30' SECOND 
      AND t.timestamp + INTERVAL '30' SECOND
      ORDER BY t.timestamp ASC
    `;

    const result = await connection.execute(
      query,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const formattedData = result.rows.map(row => ({
      time: row.TIME,
      temperature: parseFloat(row.TEMPERATURE),
      humidity: parseFloat(row.HUMIDITY)
    }));

    res.json(formattedData);

  } catch (err) {
    console.error('Error fetching temperature and humidity history:', err);
    res.status(500).json({ message: 'Error fetching temperature and humidity data' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Light data endpoint for latest data
app.get('/api/sensor-data/history/light/:days', async (req, res) => {
  let connection;
  try {
    const days = parseInt(req.params.days);
    
    connection = await oracledb.getConnection();
    
    // Latest data query (last 30 readings)
    const query = `
      SELECT 
        TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI:SS') as time,
        avg_light_intensity as light
      FROM (
        SELECT *
        FROM light_average
        ORDER BY timestamp DESC
        FETCH FIRST 30 ROWS ONLY
      )
      ORDER BY timestamp ASC
    `;

    const result = await connection.execute(
      query,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const formattedData = result.rows.map(row => ({
      time: row.TIME,
      light: parseFloat(row.LIGHT)
    }));

    res.json(formattedData);

  } catch (err) {
    console.error('Error fetching light history:', err);
    res.status(500).json({ message: 'Error fetching light data' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// NPK data endpoint for latest data
app.get('/api/sensor-data/history/npk/:days', async (req, res) => {
  let connection;
  try {
    const days = parseInt(req.params.days);
    
    connection = await oracledb.getConnection();
    
    // Latest data query (last 30 readings)
    const query = `
      SELECT 
        TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI:SS') as time,
        nitrogen,
        phosphorus,
        potassium
      FROM (
        SELECT *
        FROM npk_sensor
        ORDER BY timestamp DESC
        FETCH FIRST 30 ROWS ONLY
      )
      ORDER BY timestamp ASC
    `;

    const result = await connection.execute(
      query,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const formattedData = result.rows.map(row => ({
      time: row.TIME,
      nitrogen: parseFloat(row.NITROGEN),
      phosphorus: parseFloat(row.PHOSPHORUS),
      potassium: parseFloat(row.POTASSIUM)
    }));

    res.json(formattedData);

  } catch (err) {
    console.error('Error fetching NPK history:', err);
    res.status(500).json({ message: 'Error fetching NPK data' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});