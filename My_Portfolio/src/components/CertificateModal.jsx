import React from 'react';

function CertificateModal({ selectedCertificate, onClose, asset }) {
  return (
    <div
      className={selectedCertificate ? 'certificate-modal active' : 'certificate-modal'}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content">
        <button className="close-modal" type="button" onClick={onClose}>x</button>
        {selectedCertificate && <img src={asset(selectedCertificate)} alt="Certificate" />}
      </div>
    </div>
  );
}

export default CertificateModal;
