import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Components/ui/button';
import { UserCircle, Leaf, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useToast } from '../Components/ui/toast';
import { Select } from '../Components/ui/select';
import ControlPanel from './controlpanel';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../App.css';
import { database } from "../firebase";
import { ref, get } from "firebase/database";

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardHeader = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const userInfo = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    addToast('Logout successfully', 'success');
    navigate('/');
  };

  return (
    <div className="border-b bg-white shadow-sm">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex items-center">
          <Leaf className="h-8 w-8 text-green-600 mr-2" />
          <span className="text-xl font-bold text-green-800">Green Life Solutions</span>
        </div>
        <h1 className="text-2xl font-bold text-green-800">Smart Greenhouse</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-bold">Welcome, {userInfo.username}!</span>
          <Button
            onClick={() => navigate('/userprofile')}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <UserCircle className="h-4 w-4" />
            <span>Profile</span>
          </Button>
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
    </div>
  );
};

const TemperatureMeter = ({ temperatures, averageTemperature }) => {
  const getColor = (temp) => {
    if (temp <= 40) return 'bg-green-500';
    if (temp <= 70) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const scaledTemperature = Math.min(Math.max(averageTemperature, 0), 100);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-center">Temperature Monitoring</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="text-lg font-semibold mb-2 text-center">
            Average Temperature
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getColor(scaledTemperature)}`}
                style={{ width: `${scaledTemperature}%` }}
              ></div>
            </div>
            <div className="w-full flex justify-between mt-2">
              <span>0°C</span>
              <span>50°C</span>
              <span>100°C</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {averageTemperature.toFixed(1)}°C
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {temperatures.map((temp, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50">
              <div className="text-sm font-medium text-gray-600">
                Sensor {index + 1}
              </div>
              <div className={`text-xl font-bold ${getColor(temp).replace('bg-', 'text-')}`}>
                {temp.toFixed(1)}°C
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const MultiHumidityMeter = ({ humidities = [], averageHumidity = 0 }) => {
  const getColor = (hum) => {
    if (!hum && hum !== 0) return '#d1d5db';
    if (hum <= 30) return '#3b82f6';
    if (hum <= 60) return '#22c55e';
    return '#ef4444';
  };

  const validHumidities = Array.isArray(humidities) ? humidities : [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-center">Humidity Monitoring</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="text-lg font-semibold mb-2 text-center">
            Average Humidity
          </div>
          <div className="flex flex-col items-center">
            <svg viewBox="-10 -5 120 50" className="w-full mt-4">
              <path
                d="M5 45 A 40 40 0 0 1 95 45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <path
                d="M5 45 A 40 40 0 0 1 95 45"
                fill="none"
                stroke={getColor(averageHumidity)}
                strokeWidth="8"
                strokeDasharray={`${(Number(averageHumidity) || 0) * 1.45} 180`}
              />
              <text x="50" y="40" textAnchor="middle" fontSize="12" fill="currentColor">
                {typeof averageHumidity === 'number'
                  ? `${averageHumidity.toFixed(1)}%`
                  : 'N/A'}
              </text>
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {[0, 1, 2, 3].map((index) => {
            const humidity = validHumidities[index];
            return (
              <div key={index} className="p-2 rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-gray-600">
                  Sensor {index + 1}
                </div>
                <div className="text-xl font-bold" style={{ color: getColor(humidity) }}>
                  {typeof humidity === 'number'
                    ? `${humidity.toFixed(1)}%`
                    : 'N/A'}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export const MultiLightMeter = ({ lightLevels = [], averageLight = 0 }) => {
  const getLightColor = (lux) => {
    if (!lux && lux !== 0) return 'text-gray-400';
    if (lux < 500) return 'text-indigo-500';
    if (lux < 1000) return 'text-yellow-500';
    return 'text-amber-500';
  };

  const getLightStatus = (lux) => {
    if (!lux && lux !== 0) return 'No reading';
    if (lux < 500) return 'Low';
    if (lux < 1000) return 'Medium';
    return 'High';
  };

  const validLightLevels = Array.isArray(lightLevels) ? lightLevels : [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-center">Light Intensity Monitoring</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="text-lg font-semibold mb-2 text-center">
            Average Light Level
          </div>
          <div className="flex flex-col items-center">
            <div className={`text-3xl font-bold ${getLightColor(averageLight)}`}>
              {typeof averageLight === 'number'
                ? `${averageLight.toFixed(0)} lux`
                : 'N/A'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getLightStatus(averageLight)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {[0, 1, 2, 3].map((index) => {
            const light = validLightLevels[index];
            return (
              <div key={index} className="p-4 rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-gray-600">
                  Sensor {index + 1}
                </div>
                <div className={`text-xl font-bold ${getLightColor(light)}`}>
                  {typeof light === 'number'
                    ? `${light.toFixed(0)} lux`
                    : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getLightStatus(light)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const NPKMeter = ({ title, value }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold">{Number(value).toFixed(2)}</div>
        <div className="text-sm text-gray-500 mt-2">mg/kg</div>
      </div>
    </CardContent>
  </Card>
);

const TimeRangeSelector = ({ value, onChange }) => (
  <Select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="min-w-[140px]"
  >
    <option value="0">Latest Data</option>
    <option value="1">Last 24 Hours</option>
    <option value="7">Last 7 Days</option>
    <option value="30">Last 30 Days</option>
  </Select>
);

const ChartCard = ({ title, timeRange, onTimeRangeChange, children }) => (
  <Card className="h-full">
    <CardHeader>
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
      </div>
    </CardHeader>
    <CardContent className="h-[calc(100%-4rem)]">{children}</CardContent>
  </Card>
);

export const TemperatureChart = ({ data, timeRange, onTimeRangeChange }) => (
  <ChartCard title="Temperature Average" timeRange={timeRange} onTimeRangeChange={onTimeRangeChange}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tickFormatter={(timeStr) => {
            if (!timeStr) return '';
            const date = new Date(timeStr);
            return timeRange === '1'
              ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis domain={[0, 50]} label={{ value: '°C', position: 'insideLeft' }} />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleString()}
          formatter={(value) => [Number(value).toFixed(1), '°C']}
        />
        <Legend />
        <Line type="monotone" dataKey="temperature" stroke="#ff7300" name="Temperature" dot={true} />
      </LineChart>
    </ResponsiveContainer>
  </ChartCard>
);

export const HumidityChart = ({ data, timeRange, onTimeRangeChange }) => (
  <ChartCard title="Humidity Average" timeRange={timeRange} onTimeRangeChange={onTimeRangeChange}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tickFormatter={(timeStr) => {
            if (!timeStr) return '';
            const date = new Date(timeStr);
            return timeRange === '1'
              ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis domain={[0, 100]} label={{ value: '%', position: 'insideLeft' }} />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleString()}
          formatter={(value) => [Number(value).toFixed(1), '%']}
        />
        <Legend />
        <Line type="monotone" dataKey="humidity" stroke="#82ca9d" name="Humidity" dot={true} />
      </LineChart>
    </ResponsiveContainer>
  </ChartCard>
);

export const LightChart = ({ data, timeRange, onTimeRangeChange }) => (
  <ChartCard title="Light Intensity Average" timeRange={timeRange} onTimeRangeChange={onTimeRangeChange}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tickFormatter={(timeStr) => {
            if (!timeStr) return '';
            const date = new Date(timeStr);
            return timeRange === '1'
              ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis domain={[0, 'auto']} label={{ value: 'lux', position: 'insideLeft' }} />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleString()}
          formatter={(value) => [Number(value).toFixed(1), 'lux']}
        />
        <Legend />
        <Line type="monotone" dataKey="light" stroke="#ffc658" name="Light Intensity" dot={true} />
      </LineChart>
    </ResponsiveContainer>
  </ChartCard>
);

export const NPKChart = ({ data, timeRange, onTimeRangeChange }) => (
  <ChartCard title="NPK Levels" timeRange={timeRange} onTimeRangeChange={onTimeRangeChange}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tickFormatter={(timeStr) => {
            if (!timeStr) return '';
            const date = new Date(timeStr);
            return timeRange === '1'
              ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis domain={[0, 'auto']} label={{ value: 'mg/kg', position: 'insideLeft' }} />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleString()}
          formatter={(value) => [Number(value).toFixed(1), 'mg/kg']}
        />
        <Legend />
        <Line type="monotone" dataKey="nitrogen" stroke="#8884d8" name="Nitrogen" dot={true} />
        <Line type="monotone" dataKey="phosphorus" stroke="#82ca9d" name="Phosphorus" dot={true} />
        <Line type="monotone" dataKey="potassium" stroke="#ffc658" name="Potassium" dot={true} />
      </LineChart>
    </ResponsiveContainer>
  </ChartCard>
);

const Dashboard = () => {
  const { addToast } = useToast();
  const [chartData, setChartData] = useState({
    tempHumidity: [],
    light: [],
    npk: []
  });
  const [timeRanges, setTimeRanges] = useState({
    tempHumidity: "0",
    light: "0",
    npk: "0"
  });
  const [latestData, setLatestData] = useState({
    temperature: {
      sensor1: 0,
      sensor2: 0,
      sensor3: 0,
      sensor4: 0,
      average: 0
    },
    humidity: {
      sensor1: 0,
      sensor2: 0,
      sensor3: 0,
      sensor4: 0,
      average: 0
    },
    light: {
      sensor1: 0,
      sensor2: 0,
      sensor3: 0,
      sensor4: 0,
      average: 0
    },
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0
  });

  const [layouts, setLayouts] = useState({
    lg: [
      { i: 'temperature', x: 0, y: 0, w: 3, h: 4 },
      { i: 'humidity', x: 3, y: 0, w: 3, h: 4 },
      { i: 'light', x: 6, y: 0, w: 3, h: 4 },
      { i: 'nitrogen', x: 9, y: 0, w: 2, h: 2 },
      { i: 'phosphorus', x: 11, y: 0, w: 2, h: 2 },
      { i: 'potassium', x: 13, y: 0, w: 2, h: 2 },
      { i: 'temperatureChart', x: 0, y: 2, w: 16, h: 4 },
      { i: 'humidityChart', x: 0, y: 2, w: 16, h: 4 },
      { i: 'lightChart', x: 0, y: 2, w: 16, h: 4 },
      { i: 'NPKchart', x: 0, y: 2, w: 16, h: 4 }
    ]
  });

  const onLayoutChange = (layout, layouts) => {
    setLayouts(layouts);
  };

  const [activeTab, setActiveTab] = useState("dashboard");

  // Firebase polling every 1 second
  useEffect(() => {
    const latestRef = ref(database, 'sensorData/latest');
    const historyRef = ref(database, 'sensorData/history');

    const updateData = async () => {
      try {
        // Fetch latest sensor readings
        const latestSnapshot = await get(latestRef);
        const latest = latestSnapshot.val();
        if (latest) {
          setLatestData(latest);
        }
        // Fetch historical data for charts
        const historySnapshot = await get(historyRef);
        const history = historySnapshot.val();
        if (history) {
          setChartData({
            tempHumidity: history.tempHumidity || [],
            light: history.light || [],
            npk: history.npk || []
          });
        }
      } catch (err) {
        console.error('Error fetching data from Firebase:', err);
        addToast('Error fetching sensor data', 'error');
      }
    };

    updateData();
    const intervalId = setInterval(updateData, 1000);
    return () => clearInterval(intervalId);
  }, [addToast]);

  return (
    <div>
      <DashboardHeader />
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard" setSelectedTab={setActiveTab} selectedTab={activeTab}>
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="control" setSelectedTab={setActiveTab} selectedTab={activeTab}>
            Control Panel
          </TabsTrigger>
        </TabsList>
        {activeTab === "dashboard" ? (
          <TabsContent value="dashboard" selectedTab={activeTab}>
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              onLayoutChange={onLayoutChange}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 16, md: 12, sm: 8, xs: 4, xxs: 2 }}
              rowHeight={100}
            >
              <div key="temperature">
                <TemperatureMeter
                  temperatures={[
                    latestData.temperature.sensor1,
                    latestData.temperature.sensor2,
                    latestData.temperature.sensor3,
                    latestData.temperature.sensor4
                  ]}
                  averageTemperature={latestData.temperature.average}
                />
              </div>
              <div key="humidity">
                <MultiHumidityMeter
                  humidities={[
                    latestData.humidity.sensor1,
                    latestData.humidity.sensor2,
                    latestData.humidity.sensor3,
                    latestData.humidity.sensor4
                  ]}
                  averageHumidity={latestData.humidity.average}
                />
              </div>
              <div key="light">
                <MultiLightMeter
                  lightLevels={[
                    latestData.light.sensor1,
                    latestData.light.sensor2,
                    latestData.light.sensor3,
                    latestData.light.sensor4
                  ]}
                  averageLight={latestData.light.average}
                />
              </div>
              <div key="nitrogen">
                <NPKMeter title="Nitrogen (N)" value={latestData.nitrogen} />
              </div>
              <div key="phosphorus">
                <NPKMeter title="Phosphorus (P)" value={latestData.phosphorus} />
              </div>
              <div key="potassium">
                <NPKMeter title="Potassium (K)" value={latestData.potassium} />
              </div>
              <div key="temperatureChart">
                <TemperatureChart
                  data={chartData.tempHumidity}
                  timeRange={timeRanges.tempHumidity}
                  onTimeRangeChange={(value) =>
                    setTimeRanges((prev) => ({ ...prev, tempHumidity: value }))
                  }
                />
              </div>
              <div key="humidityChart">
                <HumidityChart
                  data={chartData.tempHumidity}
                  timeRange={timeRanges.tempHumidity}
                  onTimeRangeChange={(value) =>
                    setTimeRanges((prev) => ({ ...prev, tempHumidity: value }))
                  }
                />
              </div>
              <div key="lightChart">
                <LightChart
                  data={chartData.light}
                  timeRange={timeRanges.light}
                  onTimeRangeChange={(value) =>
                    setTimeRanges((prev) => ({ ...prev, light: value }))
                  }
                />
              </div>
              <div key="NPKchart">
                <NPKChart
                  data={chartData.npk}
                  timeRange={timeRanges.npk}
                  onTimeRangeChange={(value) =>
                    setTimeRanges((prev) => ({ ...prev, npk: value }))
                  }
                />
              </div>
            </ResponsiveGridLayout>
          </TabsContent>
        ) : (
          <TabsContent value="control" selectedTab={activeTab}>
            <ControlPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;