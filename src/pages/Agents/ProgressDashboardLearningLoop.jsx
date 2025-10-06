import React, { useState } from 'react';

const InterviewFeedbackDashboard = () => {
  const [feedbackData, setFeedbackData] = useState(null);
  const [noFeedbackAvailable, setNoFeedbackAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, type: '', text: '' });

  const API_BASE = "https://delightful-passion-production.up.railway.app/progress";

  const showMessage = (type, text) => {
    setMessage({ show: true, type, text });
    setTimeout(() => {
      setMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const triggerDataGeneration = async () => {
    setIsLoading(true);
    setFeedbackData(null); // Reset feedback data for new request
    setNoFeedbackAvailable(false); // Reset no-feedback state
    showMessage('info', 'Fetching your interview feedback...');

    try {
      const response = await fetch(`${API_BASE}/progress-data-req`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { message: responseMessage, data } = await response.json();
      console.debug("Backend response:", data);

      if (data && (data.weaknesses || data.suggestions || data.review)) {
        const parsedData = {
          user_id: data.user_id,
          average_rating: data.average_rating || 0,
          review: data.review || '',
          weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        };

        // Check for no-data case based on review content
        const isNoData = parsedData.review.toLowerCase().includes('no interview data was found');
        setNoFeedbackAvailable(isNoData);
        setFeedbackData(parsedData);
        showMessage(isNoData ? 'info' : 'success', responseMessage || (isNoData ? 'No feedback available for your account.' : 'Feedback data loaded successfully!'));
      } else {
        throw new Error('Invalid feedback data format');
      }
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      showMessage('error', error.message === 'Login or register first' 
        ? 'Please login or register first.' 
        : 'Failed to retrieve feedback data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Message Notification */}
        {message.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : message.type === 'error'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Interview Feedback Dashboard
          </h1>
          <p className="text-gray-600">
            Review your interview performance and get personalized suggestions for improvement
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Your Interview Feedback</h2>
              <p className="text-gray-600">
                {feedbackData 
                  ? "Review your performance and areas for improvement" 
                  : noFeedbackAvailable 
                  ? "No feedback yet. Complete an interview to receive personalized feedback!" 
                  : "Click below to retrieve your personalized interview feedback"}
              </p>
            </div>
            <button 
              onClick={triggerDataGeneration}
              disabled={isLoading}
              className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {isLoading ? 'Fetching Feedback...' : 'Show Progress'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <span className="text-gray-600">
                Retrieving your feedback...
              </span>
              <p className="text-sm text-gray-500 mt-2">
                This may take a few moments while we process your interview data
              </p>
            </div>
          </div>
        )}

        {/* Feedback Data */}
        {feedbackData && (
          <div className="space-y-6">
            {/* Average Rating */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 001.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Average Rating
              </h2>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-gray-700">
                  {feedbackData.average_rating}
                </p>
              </div>
            </div>

            {/* Overall Review */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Overall Review
              </h2>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-gray-700">
                  {feedbackData.review || 'No review provided.'}
                </p>
              </div>
            </div>

            {/* Weaknesses */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Areas for Improvement
              </h2>
              <div className="space-y-3">
                {feedbackData.weaknesses && feedbackData.weaknesses.length > 0 ? (
                  feedbackData.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-start bg-red-50 p-3 rounded-lg">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mt-1">
                        <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">{weakness}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No areas for improvement identified.</p>
                )}
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Recommendations
              </h2>
              <div className="space-y-3">
                {feedbackData.suggestions && feedbackData.suggestions.length > 0 ? (
                  feedbackData.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start bg-green-50 p-3 rounded-lg">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">{suggestion}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No recommendations provided.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty/No Feedback State */}
        {!feedbackData && !isLoading && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No feedback yet
            </h3>
            <p className="mt-2 text-gray-500">
              Click "Show Progress" to retrieve your personalized interview feedback.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewFeedbackDashboard;