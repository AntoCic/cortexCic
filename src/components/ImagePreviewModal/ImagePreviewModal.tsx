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
            borderRadius: 12,
            background: '#f8f9fa',
          }}
        />
      )}
    </Modal>
  );
};

export default ImagePreviewModal;
