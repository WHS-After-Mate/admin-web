import React from 'react';
import '../../styles/modal.css';

// 💡 export default가 붙어있는지 확인해 주세요!
export default function Modal({ isOpen, onClose, title, subtitle, size = 'default', children }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-container ${size === 'large' ? 'large' : size === 'xlarge' ? 'xlarge' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div>
                        {title && <h2 className="modal-title">{title}</h2>}
                        {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                    </div>
                    <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}