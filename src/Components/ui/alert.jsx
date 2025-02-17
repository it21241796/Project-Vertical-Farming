import React from 'react';

export const AlertDialog = ({ open, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">{children}</div>
    </div>
  );
};

export const AlertDialogContent = ({ children }) => <div>{children}</div>;

export const AlertDialogHeader = ({ children }) => (
  <div className="mb-4">{children}</div>
);

export const AlertDialogFooter = ({ children }) => (
  <div className="mt-6 flex justify-end">{children}</div>
);

export const AlertDialogTitle = ({ children }) => (
  <h2 className="text-xl font-semibold mb-2">{children}</h2>
);

export const AlertDialogDescription = ({ children }) => (
  <p className="text-gray-600">{children}</p>
);

export const AlertDialogAction = ({ children, onClick }) => (
  <button
    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    onClick={onClick}
  >
    {children}
  </button>
);

export const AlertDialogCancel = ({ children, onClick }) => (
  <button
    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 "
    onClick={onClick}
  >
    {children}
  </button>
);