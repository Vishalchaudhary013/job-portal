import React from 'react';
import { Icons } from '../ui/ui-icons';

const ConfirmReplaceModal = ({ isOpen, onConfirm, onCancel, oldType, newType }) => {
  if (!isOpen) return null;

  const typeLabels = {
    'bannerUpload': 'Banner',
    'pdfUpload': 'PDF',
    'carouselUpload': 'Carousel'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[340px] overflow-hidden transform animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-5 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 mb-3 bg-amber-50 rounded-full">
            <Icons.AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Replace {typeLabels[oldType]}?
          </h3>
          
          <p className="text-xs text-gray-500 mb-5 leading-relaxed">
            Adding a <span className="font-semibold text-gray-800">{typeLabels[newType]}</span> will remove your current <span className="font-semibold text-gray-800">{typeLabels[oldType]}</span>.
          </p>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
            >
              Keep Old
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
            >
              Yes, Replace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmReplaceModal;
