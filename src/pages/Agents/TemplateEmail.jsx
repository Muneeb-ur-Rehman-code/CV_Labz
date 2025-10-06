import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TemplateEmail = () => {
  const navigate = useNavigate();
  // State for campaign input
  const [campaignDetails, setCampaignDetails] = useState({
    email: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('single');
  // Dashboard and details state
  const [campaigns, setCampaigns] = useState([]);
  const [noCampaignData, setNoCampaignData] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  // State for success screen and messages
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE = "https://delightful-passion-production.up.railway.app/emails";

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
    console.debug(`[Input Change] Updated ${name}: ${value}`);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'text/csv') {
      showWebhookMessage('error', 'Please upload a valid CSV file.');
      return;
    }
    setSelectedFile(file);
    console.debug('[File Change] Selected file:', file?.name);
  };

  // Show webhook message
  const showWebhookMessage = (type, text) => {
    console.log(`[Webhook Message] ${type}: ${text}`);
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  // Reset interface to email type selection
  const resetInterface = () => {
    setCampaignDetails({ email: '' });
    setSelectedFile(null);
    setActiveTab('single');
    setShowDashboard(false);
    setSelectedCampaign(null);
    setShowSuccessScreen(false);
    setNoCampaignData(false);
    navigate('/email-marketing-campaigns');
    console.log('[Reset Interface] Navigated to email type selection');
  };

  // Handle tab change with reset
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setCampaignDetails({ email: '' });
      setSelectedFile(null);
      setShowSuccessScreen(false);
      console.debug(`[Tab Change] Switched to ${tab} tab with UI reset`);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showWebhookMessage('success', 'Content copied to clipboard!'))
      .catch(() => showWebhookMessage('error', 'Failed to copy content.'));
  };

  // Send template email request
  const sendTemplateEmail = async () => {
    if (activeTab === 'single' && !campaignDetails.email) {
      showWebhookMessage('error', 'Please enter a valid email address.');
      console.warn('[Send Template Email] Validation failed: Missing email');
      return;
    }
    if (activeTab === 'bulk' && !selectedFile) {
      showWebhookMessage('error', 'Please upload a CSV file.');
      console.warn('[Send Template Email] Validation failed: Missing CSV file');
      return;
    }
    setIsLoading(true);
    try {
      let response;
      if (activeTab === 'single') {
        const payload = { email: campaignDetails.email };
        response = await fetch(`${API_BASE}/single-email-template`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      } else {
        const formData = new FormData();
        formData.append('csvFile', selectedFile);
        response = await fetch(`${API_BASE}/bulk-email-template`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      }
      const data = await response.json();
      if (response.ok) {
        showWebhookMessage('success', data.message || (activeTab === 'single' ? 'Template email sent successfully!' : 'Template emails sent successfully!'));
        setShowSuccessScreen(true);
      } else {
        throw new Error(data.error || 'Request failed');
      }
    } catch (error) {
      console.error('[Send Template Email] Error:', error.message);
      showWebhookMessage('error', error.message === 'Login or Register first' 
        ? 'Please login or register first.' 
        : 'Failed to send template email(s).');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch campaigns
  const fetchCampaigns = async () => {
    setIsDashboardLoading(true);
    setShowDashboard(true);
    setShowSuccessScreen(false);
    setNoCampaignData(false);
    try {
      const response = await fetch(`${API_BASE}/dashboard-data-req`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Fetch campaigns failed: ${response.status}`);
      }
      const { message, data } = await response.json();
      if (!data) {
        setCampaigns([]);
        setNoCampaignData(true);
        showWebhookMessage('info', message || 'No campaign data available.');
      } else {
        const validCampaigns = [];
        data.forEach(item => {
          if (item.single_templates) {
            item.single_templates.forEach(template => {
              validCampaigns.push({
                type: 'single_template',
                campaignkey: template.campaignkey,
                campaign: template.campaign || 'Template Campaign',
                clicks: template.clicks || 0,
                userId: template.userId,
              });
            });
          }
          if (item.bulk_templates) {
            item.bulk_templates.forEach(template => {
              validCampaigns.push({
                type: 'bulk_template',
                campaignkey: template.campaignkey,
                campaign: template.campaign || 'Bulk Template Campaign',
                clicks: template.clicks || 0,
                userId: template.userId,
              });
            });
          }
        });
        setCampaigns(validCampaigns);
        showWebhookMessage('success', message || 'Campaign data retrieved successfully!');
      }
    } catch (error) {
      console.error('[Fetch Campaigns] Error:', error.message);
      showWebhookMessage('error', error.message === 'Login or Register first' 
        ? 'Please login or register first.' 
        : 'Failed to fetch campaigns.');
      setCampaigns([]);
      setNoCampaignData(true);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  // Group campaigns by campaignkey
  const groupCampaigns = (campaigns) => {
    const grouped = {};
    campaigns.forEach((camp) => {
      if (!camp || !camp.campaignkey || !camp.campaign) {
        console.warn('[Group Campaigns] Skipping invalid campaign:', camp);
        return;
      }
      const key = camp.campaignkey;
      if (!grouped[key]) {
        grouped[key] = {
          campaignName: camp.campaign,
          versions: [],
          isSingle: camp.type === 'single_template',
        };
      }
      grouped[key].versions.push(camp);
    });
    return Object.values(grouped).filter(group => group.versions.length > 0).map((group) => ({
      ...group,
      winner: null,
    }));
  };

  // Get campaign type display
  const getCampaignType = (type) => {
    return type === 'single_template' ? 'Single Template' : 'Bulk Template';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Webhook Message */}
        <AnimatePresence>
          {webhookMessage.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                webhookMessage.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : webhookMessage.type === 'error'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {webhookMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 glass-card text-purple-700 shadow px-3 py-2 rounded-full text-xs font-semibold mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Template Email Marketing Campaigns
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
              Template Email Expert
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your email marketing with AI-powered template campaigns.
          </p>
        </div>

        {/* Success Screen */}
        {showSuccessScreen && (
          <div className="glass-card rounded-3xl shadow-soft-lg p-8 mb-8">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {activeTab === 'single' ? 'Template Email Sent Successfully!' : 'Template Emails Sent Successfully!'}
              </h2>
              <p className="text-gray-600 mb-6">
                {activeTab === 'single' ? 'Your template email has been sent.' : 'Your template emails have been sent to the recipients in the CSV.'}
              </p>
              <div className="space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetInterface}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Start New Campaign
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchCampaigns}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Existing Campaigns
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Dashboard */}
        {showDashboard && !selectedCampaign && !showSuccessScreen && (
          <div className="glass-card rounded-3xl shadow-soft-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Template Campaigns Dashboard</h2>
              <div className="space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetInterface}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Start New Campaign
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchCampaigns}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Refresh Campaigns
                </motion.button>
              </div>
            </div>
            {isDashboardLoading ? (
              <div className="text-center text-gray-500">Loading campaigns...</div>
            ) : noCampaignData ? (
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Campaigns Available</h3>
                <p className="mt-2 text-gray-500">
                  Try generating a new campaign to see data here!
                </p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center text-gray-500">No campaigns found.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupCampaigns(campaigns).map((group, index) => (
                  <div key={index} className="glass-card rounded-xl shadow-soft p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{group.campaignName || 'Unnamed Campaign'}</h3>
                    <p className="text-gray-600 mb-1">Type: {getCampaignType(group.versions[0]?.type)}</p>
                    <p className="text-gray-600 mb-4">Clicks: {group.versions[0]?.clicks || 0}</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCampaign(group)}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Show Details
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Campaign Details View */}
        {showDashboard && selectedCampaign && !showSuccessScreen && (
          <div className="glass-card rounded-3xl shadow-soft-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">{selectedCampaign.campaignName || 'Unnamed Campaign'}</h2>
              <div className="space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCampaign(null)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Dashboard
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetInterface}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Start New Campaign
                </motion.button>
              </div>
            </div>
            <div className="text-center mb-6">
              <p className="text-lg font-semibold text-green-600">
                {selectedCampaign.isSingle ? 'Single Template Campaign' : 'Bulk Template Campaign'}
              </p>
            </div>
            {selectedCampaign.versions.length > 0 ? (
              <div className="max-w-2xl mx-auto">
                <div className="glass-card rounded-xl shadow-soft p-6 bg-gradient-to-br from-purple-50 to-white">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">{getCampaignType(selectedCampaign.versions[0].type)}</h3>
                  <p className="text-gray-600 mb-4">Clicks: {selectedCampaign.versions[0]?.clicks || 0}</p>
                  <p className="text-gray-600 mb-4">User ID: {selectedCampaign.versions[0]?.userId || 'N/A'}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyToClipboard(selectedCampaign.versions[0]?.userId || '')}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                    disabled={!selectedCampaign.versions[0]?.userId}
                  >
                    Copy User ID
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">No data available for this campaign.</div>
            )}
          </div>
        )}

        {/* Campaign Input Form */}
        {!showDashboard && !showSuccessScreen && (
          <div className="glass-card rounded-3xl shadow-soft-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Start Your Template Email Campaign</h2>
              <div className="space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetInterface}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Start New Campaign
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchCampaigns}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Existing Campaigns
                </motion.button>
              </div>
            </div>
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTabChange('single')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'single' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Single Email
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTabChange('bulk')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'bulk' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Bulk Emails
                </motion.button>
              </div>
            </div>
            <div className="max-w-md mx-auto">
              <div className="space-y-4">
                {activeTab === 'single' ? (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={campaignDetails.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter recipient's email"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700">
                      Upload CSV File
                    </label>
                    <input
                      type="file"
                      name="csvFile"
                      id="csvFile"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {selectedFile && <p className="mt-2 text-sm text-gray-600">Selected: {selectedFile.name}</p>}
                  </div>
                )}
              </div>
              <div className="text-center mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendTemplateEmail}
                  disabled={isLoading}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    activeTab === 'single' ? 'Send Template Email' : 'Send Template Emails'
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEmail;