import { X } from 'lucide-react';

const GenericModal = ({ isOpen, onClose, title, children, theme }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-md mx-4 rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-zinc-900' : 'bg-white'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            theme === 'dark' ? 'border-zinc-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className={`transition-colors ${
                theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default GenericModal;
