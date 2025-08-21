import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [waitTime, setWaitTime] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const { toasts, showSuccess, showError, removeToast } = useToast();

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }
    checkVerificationStatus();
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (waitTime > 0) {
      interval = setInterval(() => {
        setWaitTime(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [waitTime]);

  const checkVerificationStatus = async () => {
    try {
      const status = await authService.getVerificationStatus(email);
      if (status.is_verified) {
        setSuccess(true);
      } else {
        setCanResend(status.can_resend);
        setWaitTime(status.wait_time || 0);
      }
    } catch (error) {
      console.error('Failed to check verification status:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.verifyEmail(email, code);
      setSuccess(true);
      showSuccess('Email verified successfully! Redirecting to login...', 3000);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (error) {
      if (error.response?.status === 400) {
        showError('Invalid or expired verification code', 4000);
      } else {
        showError('Verification failed. Please try again.', 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);

    try {
      await authService.resendVerification(email);
      setCanResend(false);
      setWaitTime(120); // 2 minutes
      showSuccess('Verification code sent successfully!', 3000);
    } catch (error) {
      if (error.response?.status === 429) {
        const waitTime = error.response.data.detail.match(/\d+/)?.[0];
        setWaitTime(parseInt(waitTime) || 120);
        setCanResend(false);
        showError(`Please wait ${waitTime} seconds before requesting a new code`, 5000);
      } else {
        showError('Failed to resend verification code', 4000);
      }
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
          <p className="text-gray-600">Your email has been successfully verified. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verify your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a verification code to <strong>{email}</strong>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              maxLength="6"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg tracking-widest"
              placeholder="000000"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend code'}
                </button>
              ) : (
                <span className="flex items-center justify-center text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Resend in {waitTime}s
                </span>
              )}
            </p>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default VerifyEmail;