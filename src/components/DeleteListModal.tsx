interface DeleteListModalProps {
  isOpen: boolean;
  listName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteListModal({ 
  isOpen,  
  onClose, 
  onConfirm 
}: DeleteListModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 sm:mt-0">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
              Are you sure want to delete this List?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <p className="text-gray-600 mb-6 text-sm sm:text-base">
          This action cannot be undone. All tasks associated with this list will be lost.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#D52121] hover:bg-[#B91C1C] text-white rounded-lg transition-colors font-medium order-1 sm:order-2"
          >
            Delete List
          </button>
        </div>
      </div>
    </div>
  );
}
