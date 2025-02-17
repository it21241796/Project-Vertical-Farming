// src/components/ui/select.jsx
import React from 'react';

const Select = React.forwardRef(({
    className = '',
    children,
    ...props
}, ref) => (
    <select
        className={`
        px-3 py-2 text-sm
        bg-white border rounded-md
        focus:outline-none focus:ring-2 focus:ring-green-500
        disabled:cursor-not-allowed disabled:opacity-50
        border-gray-300
        ${className}
      `}
        ref={ref}
        {...props}
    >
        {children}
    </select>
));

Select.displayName = 'Select';

export { Select };