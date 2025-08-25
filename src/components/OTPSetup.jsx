import React, { useState } from 'react';
import { api } from '../services/api';

const OTPSetup = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: QR Code, 2: Verify
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const showToast = (message, type) => {
    // Simple alert for now - you can integrate with your toast system
    if (type === 'error') {
      alert('Error: ' + message);
    } else {
      alert(message);
    }
  };

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const response = await api.post('/otp/setup');
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setStep(2);
    } catch (error) {
      showToast('Failed to generate QR code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!otpCode || otpCode.length !== 6) {
      showToast('Please enter a 6-digit code', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/otp/enable', { otp_code: otpCode });
      showToast('OTP enabled successfully!', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      if (error.response?.status === 400) {
        showToast('Invalid OTP code. Please try again.', 'error');
      } else {
        showToast('Failed to enable OTP. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (step === 1) {
      generateQRCode();
    }
  }, [step]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Enable Two-Factor Authentication</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {step === 1 && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Generating QR code...</p>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                1. Install an authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <p className="text-sm text-gray-600 mb-3">
                2. Scan this QR code with your app:
              </p>
              
              {qrCode && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={`data:image/png;base64,${qrCode}`} 
                    alt="QR Code" 
                    className="border rounded"
                  />
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">
                  Or enter this code manually:
                </p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm break-all">
                  {secret}
                </code>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                3. Enter the 6-digit code from your app:
              </p>
              
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={verifyAndEnable}
                disabled={loading || otpCode.length !== 6}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Enable OTP'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OTPSetup;