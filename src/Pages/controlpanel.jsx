import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Components/ui/card';
import { Button } from '../Components/ui/button';
import { Fan, Lightbulb, Droplets, PipetteIcon } from 'lucide-react';
import { database } from "../firebase";
import { ref, onValue, update } from "firebase/database";

// A button component that changes style based on whether it's active.
const ControlButton = ({ active, onClick, children, variant = 'default' }) => {
    const getButtonStyle = () => {
        if (variant === 'off' && active) {
            return 'bg-red-500 hover:bg-red-600 text-white';
        }
        if (active) {
            return 'bg-green-500 hover:bg-green-600 text-white';
        }
        return '';
    };

    return (
        <Button
            onClick={onClick}
            variant={active ? "default" : "outline"}
            className={`w-24 ${getButtonStyle()}`}
        >
            {children}
        </Button>
    );
};

// DeviceControl listens to Firebase for the given equipment type and allows live control.
const DeviceControl = ({ title, icon: Icon, count = 1, type }) => {
    // Local states for the equipment. These will be synced with Firebase.
    const [states, setStates] = useState(Array(count).fill('off'));
    const [modes, setModes] = useState(Array(count).fill('manual'));

    // Convert the device type to the Firebase key (e.g., "Fan" becomes "fans").
    const equipmentKey = type.toLowerCase() + (type.toLowerCase().endsWith('s') ? '' : 's');

    // Subscribe to the Firebase data for this equipment type.
    useEffect(() => {
        const equipmentRef = ref(database, `equipment/${equipmentKey}`);
        const unsubscribe = onValue(equipmentRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // If data is an object, convert it to an array sorted by index.
                const newStates = [];
                const newModes = [];
                Object.keys(data).forEach((key) => {
                    newStates[parseInt(key)] = data[key].status;
                    newModes[parseInt(key)] = data[key].mode;
                });
                setStates(newStates);
                setModes(newModes);
            }
        });
        return () => unsubscribe();
    }, [equipmentKey]);

    // Helper to update the equipment state in Firebase.
    const updateEquipment = (index, newStatus, newMode) => {
        const equipmentRef = ref(database, `equipment/${equipmentKey}/${index}`);
        const updates = {};
        if (newStatus !== undefined) {
            updates['status'] = newStatus;
        }
        if (newMode !== undefined) {
            updates['mode'] = newMode;
        }
        update(equipmentRef, updates);
    };

    const handleStateChange = (index, newState) => {
        updateEquipment(index, newState, undefined);
    };

    const handleModeChange = (index) => {
        const newMode = modes[index] === 'manual' ? 'auto' : 'manual';
        updateEquipment(index, undefined, newMode);
    };

    const getStatusStyle = (state) => {
        return state === 'on'
            ? 'text-green-500 font-medium'
            : 'text-red-500 font-medium';
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <span>{title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4">
                    {Array.from({ length: count }, (_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{type} {i + 1}</span>
                                <span className={`text-sm ${getStatusStyle(states[i])}`}>
                                    Status: {states[i] === 'on' ? 'Running' : 'Stopped'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <ControlButton
                                    active={states[i] === 'on'}
                                    onClick={() => handleStateChange(i, 'on')}
                                >
                                    On
                                </ControlButton>
                                <ControlButton
                                    active={states[i] === 'off'}
                                    onClick={() => handleStateChange(i, 'off')}
                                    variant="off"
                                >
                                    Off
                                </ControlButton>
                                <ControlButton
                                    active={modes[i] === 'auto'}
                                    onClick={() => handleModeChange(i)}
                                >
                                    {modes[i] === 'auto' ? 'Auto On' : 'Auto Off'}
                                </ControlButton>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const ControlPanel = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 p-6">
            <DeviceControl
                title="Fans"
                icon={Fan}
                count={4}
                type="Fan"
            />
            <DeviceControl
                title="Lights"
                icon={Lightbulb}
                count={4}
                type="Light"
            />
            <DeviceControl
                title="Humidifiers"
                icon={Droplets}
                count={2}
                type="Humidifier"
            />
            <DeviceControl
                title="Valves"
                icon={PipetteIcon}
                count={4}
                type="Valve"
            />
        </div>
    );
};

export default ControlPanel;