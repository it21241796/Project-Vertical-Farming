import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../Components/ui/card";
import { database } from "../firebase";
import { ref, onValue } from "firebase/database";

const PlantAnalysis = () => {
    const [plantImage, setPlantImage] = useState(null);
    const [plantLabel, setPlantLabel] = useState("Loading...");

    useEffect(() => {
        const fetchPlantData = () => {
            const plantRef = ref(database, "plant_analysis");
            onValue(plantRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setPlantImage(data.image);
                    setPlantLabel(data.label);
                }
            });
        };

        fetchPlantData();
        const interval = setInterval(fetchPlantData, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="w-full h-56 flex flex-col justify-between">
            <CardHeader>
                <CardTitle>Plant Analysis</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
                {plantImage ? (
                    <img
                        src={plantImage}
                        alt="Plant"
                        className="w-32 h-32 object-cover rounded-md"
                    />
                ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-md flex items-center justify-center">
                        No Image
                    </div>
                )}
                <span className="mt-2 text-sm font-medium">{plantLabel}</span>
            </CardContent>
        </Card>
    );
};

const AnalysisPanel = () => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
            <PlantAnalysis />
            <Card className="w-full h-56 bg-gray-100"></Card>
            <Card className="w-full h-56 bg-gray-100"></Card>
            <Card className="w-full h-56 bg-gray-100"></Card>
        </div>
    );
};

export default AnalysisPanel;