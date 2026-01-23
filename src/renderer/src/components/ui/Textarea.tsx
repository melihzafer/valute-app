// src/renderer/src/components/ui/Textarea.tsx

import React, { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea: React.FC<TextareaProps> = ({ className, ...props }) => {
  return (
    <textarea
      className={`mt-1 block w-full p-3 border border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors sm:text-sm ${className}`}
      {...props}
    />
  );
};

export default Textarea;
export { Textarea };
