import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

const ConfirmDiscardModal = ({ isOpen, title, message, confirmLabel = "Continue", onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[340px] overflow-hidden transform animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-5 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 mb-3 bg-amber-50 rounded-full">
            <FiAlertTriangle className="w-5 h-5 text-amber-500" />
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>

          <p className="text-xs text-gray-500 mb-5 leading-relaxed">{message}</p>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDiscardModal;
