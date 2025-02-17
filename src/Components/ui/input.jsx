import React from 'react';

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    className={`px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    ref={ref}
    {...props}
  />
));

Input.displayName = 'Input';