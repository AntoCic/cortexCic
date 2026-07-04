import React, { useEffect } from 'react';
import styles from './Modal.module.css';

export interface ModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'lg' | 'xl';
  centered?: boolean;
  scrollable?: boolean;
  fullscreen?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  show,
  onClose,
  title,
  headerActions,
  children,
  footer,
  size,
  centered = false,
  scrollable = false,
  fullscreen = false,
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
  const fullscreenClass = fullscreen ? 'modal-fullscreen' : '';

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className="modal show d-block" role="dialog">
        <div className={`modal-dialog ${sizeClass} ${centeredClass} ${scrollableClass} ${fullscreenClass}`.trim()}>
          <div className="modal-content">
            {title && (
              <div className="modal-header">
                <h5 className="modal-title">{title}</h5>
                <div className="d-flex align-items-center" style={{ gap: '1.75rem' }}>
                  {headerActions}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={onClose}
                    aria-label="Close"
                  />
                </div>
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
