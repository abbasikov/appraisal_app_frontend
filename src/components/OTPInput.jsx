import React, { useState } from 'react';

const OTPInput = ({ onSubmit, loading, error }) => {
  const [otpCode, setOtpCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      onSubmit(otpCode);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter 6-digit code from your authenticator app
        </label>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={6}
            autoComplete="one-time-code"
          />
          
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Open your authenticator app to get the current code
        </p>
      </div>
    </div>
  );
};

export default OTPInput;