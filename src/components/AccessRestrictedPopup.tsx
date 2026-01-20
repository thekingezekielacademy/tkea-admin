import React from 'react';

interface AccessRestrictedPopupProps {
  sessionNumber: number;
  onClose: () => void;
}

const AccessRestrictedPopup: React.FC<AccessRestrictedPopupProps> = ({
  sessionNumber,
  onClose
}) => {
  const paymentDetails = {
    amount: '₦10,000',
    bank: 'POLARIS BANK',
    accountNumber: '4092109073',
    accountName: 'THE KING EZEKIEL ACADEMY'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Only users who have <strong>full access</strong> can replay Class {sessionNumber} and beyond.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Classes 1-2 are free for all enrolled users. Classes 3+ require full access.
          </p>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-purple-900 mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Amount:</span>
                <span className="font-semibold text-gray-900">{paymentDetails.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Bank:</span>
                <span className="font-semibold text-gray-900">{paymentDetails.bank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Account Number:</span>
                <span className="font-semibold text-gray-900 font-mono">{paymentDetails.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Account Name:</span>
                <span className="font-semibold text-gray-900">{paymentDetails.accountName}</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> After payment, send proof of payment to get your access upgraded.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Copy payment details to clipboard
              const text = `Amount: ${paymentDetails.amount}\nBank: ${paymentDetails.bank}\nAccount Number: ${paymentDetails.accountNumber}\nAccount Name: ${paymentDetails.accountName}`;
              navigator.clipboard.writeText(text);
              alert('Payment details copied to clipboard!');
            }}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Copy Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessRestrictedPopup;
