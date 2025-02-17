// import React, { useState } from 'react';

// export const Tabs = ({ defaultValue, children }) => {
//   const [selectedTab, setSelectedTab] = useState(defaultValue);
//   return React.Children.map(children, (child) => 
//     React.cloneElement(child, { selectedTab, setSelectedTab })
//   );
// };

// export const TabsList = ({ children }) => (
//   <div className="flex border-b border-gray-200">
//     {children}
//   </div>
// );

// export const TabsTrigger = ({ value, setSelectedTab, selectedTab, children }) => (
//   <button
//     className={`px-4 py-2 ${
//       selectedTab === value ? 'border-b-2 border-green-500' : 'text-gray-500'
//     }`}
//     onClick={() => setSelectedTab(value)}
//   >
//     {children}
//   </button>
// );

// export const TabsContent = ({ value, selectedTab, children }) => {
//   return selectedTab === value ? <div>{children}</div> : null;
// };

// src/components/ui/tabs.js
import React, { useState } from 'react';

export const Tabs = ({ defaultValue, children, value, onValueChange }) => {
  const [selectedTab, setSelectedTab] = useState(defaultValue || value);

  const handleTabChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setSelectedTab(newValue);
    }
  };

  const currentValue = value !== undefined ? value : selectedTab;

  return (
    <div>
      {React.Children.map(children, (child) => {
        if (!child) return null;

        return React.cloneElement(child, {
          selectedTab: currentValue,
          onTabChange: handleTabChange
        });
      })}
    </div>
  );
};

export const TabsList = ({ children, selectedTab, onTabChange }) => (
  <div className="flex border-b border-gray-200 mb-4">
    {React.Children.map(children, (child) => {
      if (!child) return null;

      return React.cloneElement(child, {
        selectedTab,
        onTabChange
      });
    })}
  </div>
);

export const TabsTrigger = ({ value, selectedTab, onTabChange, children }) => (
  <button
    className={`px-4 py-2 font-medium transition-colors ${selectedTab === value
        ? 'border-b-2 border-green-500 text-green-600'
        : 'text-gray-500 hover:text-gray-700'
      }`}
    onClick={() => onTabChange(value)}
  >
    {children}
  </button>
);

export const TabsContent = ({ value, selectedTab, children }) => {
  if (value !== selectedTab) return null;
  return <div>{children}</div>;
};