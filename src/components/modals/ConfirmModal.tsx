import React from 'react';
import { Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[90] flex justify-center items-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-stone-200 overflow-hidden transform transition-all scale-100">
        <div className="p-6 sm:p-8 flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-inner">
            <Trash2 size={24} />
          </div>
          <div className="flex-1 mt-1">
            <h3 className="text-lg font-bold text-stone-900 mb-2">{title}</h3>
            <p className="text-sm text-stone-500 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="bg-stone-50 px-6 py-4 flex justify-end gap-3 border-t border-stone-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 hover:text-stone-900 transition-colors shadow-sm"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors ring-1 ring-red-700 ring-offset-1"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
};
