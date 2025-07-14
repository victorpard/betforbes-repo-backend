import React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ children, ...props }) => {
  return (
    <label className="block text-silver text-sm font-medium mb-1" {...props}>
      {children}
    </label>
  );
};
