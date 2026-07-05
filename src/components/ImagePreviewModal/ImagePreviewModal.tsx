import { Modal } from '../Modal/Modal';

interface Props {
  imageUrl: string | null;
  imageName?: string;
  onClose: () => void;
}

const ImagePreviewModal = ({ imageUrl, imageName, onClose }: Props) => {
  return (
    <Modal
      show={!!imageUrl}
      onClose={onClose}
      title={imageName ?? 'Anteprima immagine'}
      size="xl"
      centered
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={imageName ?? 'Anteprima allegato'}
          style={{
            display: 'block',
            width: '100%',
            maxHeight: '75vh',
            objectFit: 'contain',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-sunken)',
          }}
        />
      )}
    </Modal>
  );
};

export default ImagePreviewModal;
