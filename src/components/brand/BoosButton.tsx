import React from 'react';

export type BoosButtonVariant = 'primary' | 'secondary' | 'premium' | 'ghost';
export type BoosButtonSize = 'sm' | 'md' | 'lg';

interface BoosButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BoosButtonVariant;
  size?: BoosButtonSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const BoosButton: React.FC<BoosButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconRight,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 min-h-[34px]',
    md: 'text-xs sm:text-sm px-5 py-2.5 gap-2 min-h-[42px]',
    lg: 'text-sm sm:text-base px-6 py-3.5 gap-2.5 min-h-[50px]'
  };

  const variantClasses: Record<BoosButtonVariant, string> = {
    // Primary CTA: Royal Sports Luxury metallic gold with #F7B500 radial glow on hover
    primary: 'boos-btn-primary boos-button-primary text-[#030D17]',
    // Secondary CTA: Transparent background with gold border and text
    secondary: 'bg-transparent text-[#F7B500] border border-[#F7B500]/60 hover:bg-[#F7B500]/10 hover:border-[#F7B500]',
    // Premium CTA: Elevated Royal Gold Metal
    premium: 'boos-btn-primary boos-button-primary text-[#030D17]',
    // Ghost: Navy subtle surface with luxury border
    ghost: 'bg-[#092237]/70 text-[#F5F7FA] border border-[#143A52] hover:bg-[#0D2940] hover:border-[#0D4C73]'
  };

  return (
    <button
      data-variant={variant}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};
