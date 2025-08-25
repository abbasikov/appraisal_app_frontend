import React from 'react';
import Layout from '../components/Layout';
import OTPSettings from '../components/OTPSettings';

const Settings = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences.</p>
        </div>

        {/* Security Settings */}
        <OTPSettings />
      </div>
    </Layout>
  );
};

export default Settings;