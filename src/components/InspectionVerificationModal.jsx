import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const InspectionVerificationModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleConfirm = () => {
    if (selectedOption !== null) {
      onConfirm(selectedOption === 'yes');
      setSelectedOption(null); // Reset for next time
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedOption(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Inspection Verification"
      size="md"
      closeOnOverlayClick={false}
    >
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-700 text-lg">
            Verify if you inspected the appraised subject and were present at that time.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setSelectedOption('yes')}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              selectedOption === 'yes'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-3">
              <CheckCircleIcon
                className={`w-6 h-6 ${
                  selectedOption === 'yes' ? 'text-green-500' : 'text-gray-400'
                }`}
              />
              <span
                className={`font-medium ${
                  selectedOption === 'yes' ? 'text-green-700' : 'text-gray-700'
                }`}
              >
                Yes, I inspected and was present
              </span>
            </div>
          </button>

          <button
            onClick={() => setSelectedOption('no')}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              selectedOption === 'no'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-3">
              <XCircleIcon
                className={`w-6 h-6 ${
                  selectedOption === 'no' ? 'text-red-500' : 'text-gray-400'
                }`}
              />
              <span
                className={`font-medium ${
                  selectedOption === 'no' ? 'text-red-700' : 'text-gray-700'
                }`}
              >
                No, I did not inspect or was not present
              </span>
            </div>
          </button>
        </div>

        <div className="flex justify-end space-x-3 form-actions-row pt-4 border-t border-gray-200">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="btn-responsive"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            disabled={selectedOption === null}
            className="btn-responsive"
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InspectionVerificationModal;

