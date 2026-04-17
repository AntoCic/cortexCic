import React, { useEffect } from 'react';
import styles from './Modal.module.css';

export interface ModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'lg' | 'xl';
  centered?: boolean;
  scrollable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  show,
  onClose,
  title,
  children,
  footer,
  size,
  centered = false,
  scrollable = false,
}) => {
  useEffect(() => {
    if (show) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [show]);

  if (!show) {
    return null;
  }

  const sizeClass = size ? `modal-${size}` : '';
  const centeredClass = centered ? 'modal-dialog-centered' : '';
  const scrollableClass = scrollable ? 'modal-dialog-scrollable' : '';

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className="modal show d-block" role="dialog">
        <div className={`modal-dialog ${sizeClass} ${centeredClass} ${scrollableClass}`.trim()}>
          <div className="modal-content">
            {title && (
              <div className="modal-header">
                <h5 className="modal-title">{title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                />
              </div>
            )}
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
};
