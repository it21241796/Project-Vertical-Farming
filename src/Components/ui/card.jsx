import React from 'react';

export const Card = ({ className, children }) => (
  <div className={`bg-white shadow-md rounded-lg p-4 ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ className, children }) => (
  <div className={`border-b border-gray-200 pb-2 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ className, children }) => (
  <h2 className={`font-bold text-lg ${className}`}>
    {children}
  </h2>
);

export const CardContent = ({ className, children }) => (
  <div className={`mt-2 ${className}`}>
    {children}
  </div>
);
