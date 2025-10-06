
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PerformanceAnalyzer = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [noPerformanceData, setNoPerformanceData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });

  const API_BASE = "https://delightful-passion-production.up.railway.app/performance";

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const generatePerformanceAnalysis = async () => {
    setIsLoading(true);
    setPerformanceData(null);
    setNoPerformanceData(false);
    showWebhookMessage('info', 'Generating performance analysis...');

    try {
      const response = await fetch(`${API_BASE}/performance-req`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const { message: responseMessage, data } = await response.json();
      console.debug("Backend response:", data);

      if (data === null || typeof data !== "string" || data.trim() === "") {
        setNoPerformanceData(true);
        showWebhookMessage('info', responseMessage || 'No performance data available for your account.');
      } else {
        setPerformanceData(data);
        showWebhookMessage('success', responseMessage || 'Performance analysis retrieved successfully!');
      }
    } catch (error) {
      console.error('Error generating performance analysis:', error);
      showWebhookMessage('error', error.message === 'Login or Register first' 
        ? 'Please login or register first.' 
        : 'Failed to retrieve performance analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPerformanceData = (text) => {
    if (!text) return null;

    return (
      <div className="prose prose-blue max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h3: ({ ...props }) => (
              <h3 className="text-xl font-semibold text-gray-800 mb-4" {...props} />
            ),
            p: ({ ...props }) => (
              <p className="text-gray-600 mb-3 leading-relaxed" {...props} />
            ),
            li: ({ ...props }) => (
              <li className="mb-2 text-gray-600" {...props} />
            ),
            ul: ({ ...props }) => (
              <ul className="list-disc pl-6 mb-4" {...props} />
            ),
            ol: ({ ...props }) => (
              <ol className="list-decimal pl-6 mb-4" {...props} />
            ),
            strong: ({ ...props }) => (
              <strong className="font-semibold text-gray-800" {...props} />
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="px-4 md:px-8 lg:px-12 py-8">
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

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 glass-card text-blue-700 shadow px-3 py-2 rounded-full text-xs font-semibold mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-trending-up h-4 w-4"
            >
              <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
              <polyline points="16,7 22,7 22,13" />
            </svg>
            Performance Analyzer
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Performance Optimizer
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Unlock actionable insights with our AI-powered Performance Analyzer. Instantly retrieve and analyze your
            YouTube channel or Google Ads campaign performance metrics to identify key trends, opportunities, and
            recommendations for growth. Click below to generate a comprehensive report tailored to your data.
          </p>
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
              backgroundColor: '#2563eb'
            }}
            whileTap={{ scale: 0.95 }}
            animate={{
              y: [0, -5, 0],
              transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' }
            }}
            onClick={generatePerformanceAnalysis}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-base px-8 py-4 rounded-xl shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Performance...
              </span>
            ) : (
              'Generate Performance Report'
            )}
          </motion.button>
        </motion.div>

        {/* Performance Data Display */}
        <AnimatePresence>
          {performanceData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Performance Analysis Report</h2>
              <div className="bg-blue-50 p-6 rounded-2xl prose prose-blue max-w-none">
                {renderPerformanceData(performanceData)}
              </div>
            </motion.div>
          )}
          {noPerformanceData && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8 text-center"
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Performance Data Available</h3>
              <p className="mt-2 text-gray-500">
                Try generating a report again to receive performance analysis!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PerformanceAnalyzer;
