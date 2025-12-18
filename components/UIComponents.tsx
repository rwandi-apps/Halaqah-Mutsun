import React from 'react';
import { LucideIcon } from 'lucide-react';

// --- Logo Component ---
export const LogoSDQ: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
      SDQ
    </div>
    <span className="text-xl font-bold tracking-tight">Halaqah<span className="text-primary-600">App</span></span>
  </div>
);

// --- Stat Card Component ---
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color = "bg-white" }) => (
  <div className={`${color} p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between transition-transform hover:-translate-y-1 duration-200`}>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      {trend && <p className="text-xs text-green-600 mt-2 font-medium">{trend}</p>}
    </div>
    <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
      <Icon size={24} />
    </div>
  </div>
);

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = "", 
  disabled, 
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 focus:ring-gray-200",
    outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : children}
    </button>
  );
};

// --- Input Component ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${className}`} 
    {...props} 
  />
);

// --- Badge Component ---
export const Badge: React.FC<{ children: React.ReactNode, variant?: 'success' | 'warning' | 'error' | 'neutral' }> = ({ 
  children, variant = 'neutral' 
}) => {
  const styles = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {children}
    </span>
  );
};