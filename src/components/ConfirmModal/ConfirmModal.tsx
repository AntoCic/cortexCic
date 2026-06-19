import { useState, type ReactNode } from 'react';
import { Modal } from '../Modal/Modal';
import { Btn } from '../Btn/Btn';

type BtnColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

interface Props {
  show: boolean;
  onClose: () => void;
  /**
   * Action to run when the user confirms. If it throws, the modal stays open
   * (so the caller can surface the error via toast); otherwise the modal closes.
   */
  onConfirm: () => void | Promise<void>;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: BtnColor;
  confirmIcon?: string;
}

const ConfirmModal = ({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  confirmColor = 'danger',
  confirmIcon,
}: Props) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // The caller is responsible for surfacing the error (toast); keep modal open.
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onClose={loading ? () => {} : onClose}
      title={title}
      centered
      size="sm"
      footer={
        <>
          <Btn version="outline" color="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Btn>
          <Btn color={confirmColor} onClick={handleConfirm} loading={loading}>
            {confirmIcon && (
              <span className="material-symbols-outlined me-2" style={{ fontSize: 16, verticalAlign: 'text-bottom' }}>
                {confirmIcon}
              </span>
            )}
            {confirmLabel}
          </Btn>
        </>
      }
    >
      <div className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
        {message}
      </div>
    </Modal>
  );
};

export default ConfirmModal;
