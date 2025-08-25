import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import OTPSetup from './OTPSetup';

const OTPSettings = () => {
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const showToast = (message, type) => {
    if (type === 'error') {
      alert('Error: ' + message);
    } else {
      alert(message);
    }
  };

  useEffect(() => {
    fetchOTPStatus();
  }, []);

  const fetchOTPStatus = async () => {
    try {
      const response = await api.get('/otp/status');
      setOtpEnabled(response.data.enabled);
    } catch (error) {
      showToast('Failed to fetch OTP status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableOTP = async () => {
    if (!disableCode || disableCode.length !== 6) {
      showToast('Please enter a 6-digit code', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/otp/disable', { otp_code: disableCode });
      setOtpEnabled(false);
      setShowDisable(false);
      setDisableCode('');
      showToast('Two-factor authentication disabled', 'success');
    } catch (error) {
      showToast('Invalid OTP code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Two-Factor Authentication
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {otpEnabled 
                ? 'Your account is protected with 2FA' 
                : 'Add an extra layer of security to your account'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              otpEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {otpEnabled ? 'Enabled' : 'Disabled'}
            </span>
            
            {otpEnabled ? (
              <button
                onClick={() => setShowDisable(true)}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={() => setShowSetup(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {otpEnabled && (
          <div className="mt-4 p-4 bg-green-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Your account is secured with two-factor authentication. You'll need your authenticator app to sign in.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showSetup && (
        <OTPSetup
          onClose={() => setShowSetup(false)}
          onSuccess={() => {
            setOtpEnabled(true);
            fetchOTPStatus();
          }}
        />
      )}

      {showDisable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-red-600">Disable Two-Factor Authentication</h2>
              <button 
                onClick={() => {
                  setShowDisable(false);
                  setDisableCode('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Enter your current 6-digit code to disable two-factor authentication:
              </p>
              
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisable(false);
                  setDisableCode('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableOTP}
                disabled={loading || disableCode.length !== 6}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Disabling...' : 'Disable OTP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OTPSettings;