'use client';

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#FF3B30] text-white hover:bg-[#FF5247] focus:ring-[#FF3B30] active:scale-95 shadow-[0_2px_8px_rgba(255,59,48,0.3)] hover:shadow-[0_4px_12px_rgba(255,59,48,0.4)]',
    secondary: 'bg-[#1f1f1f] text-[#e5e5e5] border border-[#2a2a2a] hover:bg-[#252525] hover:border-[#FF3B30] focus:ring-[#FF3B30] active:scale-95',
    ghost: 'bg-transparent text-[#e5e5e5] hover:bg-[#1f1f1f] focus:ring-[#FF3B30] active:scale-95',
    icon: 'bg-transparent text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] focus:ring-[#FF3B30] active:scale-95 rounded-full p-2',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-[12px]',
    md: 'px-4 py-2 text-base rounded-[12px]',
    lg: 'px-6 py-3 text-lg rounded-[16px]',
  };
  
  const iconSize = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };
  
  const sizeClass = variant === 'icon' ? iconSize[size] : sizes[size];
  
  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
