import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Btn.module.css';

type BtnColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
type BtnVersion = 'solid' | 'outline' | 'ghost';
type BtnSize = 'sm' | 'lg';

export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: BtnColor;
  version?: BtnVersion;
  size?: BtnSize;
  loading?: boolean;
  to?: string;
}

export const Btn = React.forwardRef<HTMLButtonElement, BtnProps>(
  (
    {
      color = 'primary',
      version = 'solid',
      size,
      loading = false,
      to,
      onClick,
      children,
      disabled,
      className,
      ...rest
    },
    ref
  ) => {
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (to) {
        navigate(to);
      }
      onClick?.(e);
    };

    const baseClass = 'btn';
    const colorClass = version === 'solid' ? `btn-${color}` : `btn-outline-${color}`;
    const versionClass = version === 'ghost' ? styles.ghost : '';
    const sizeClass = size ? `btn-${size}` : '';

    const classes = [baseClass, colorClass, versionClass, sizeClass, className]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        onClick={handleClick}
        {...rest}
      >
        {loading && <span className="spinner-border spinner-border-sm me-2" />}
        {children}
      </button>
    );
  }
);

Btn.displayName = 'Btn';
