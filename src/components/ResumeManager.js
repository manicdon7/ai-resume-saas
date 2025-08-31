import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useResumeService, useResumeAPI } from '../hooks/useResumeService';
import { getAuth } from 'firebase/auth';

/**
 * ResumeManager Component
 * Demonstrates how to use the ResumeService for managing resume data
 */
const ResumeManager = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  // Redux state
  const resumeState = useSelector(state => state.resume);
  
  // Resume service hooks
  const {
    saveResume,
    deleteResume,
    parseResumeText,
    syncResumeState,
    loading: serviceLoading,
    error: serviceError,
    clearError: clearServiceError
  } = useResumeService();

  const {
    saveResumeAPI,
    deleteResumeAPI,
    getResumeAPI,
    syncResumeAPI,
    parseResumeAPI,
    loading: apiLoading,
    error: apiError,
    clearError: clearAPIError
  } = useResumeAPI();

  // Local state
  const [resumeText, setResumeText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [message, setMessage] = useState('');

  // Load resume data on component mount
  useEffect(() => {
    if (user) {
      handleSyncResume();
    }
  }, [user]);

  // Handle save resume
  const handleSaveResume = async () => {
    if (!user) {
      setMessage('Please sign in to save resume');
      return;
    }

    try {
      const resumeData = {
        resumeText,
        fileName: 'resume.txt',
        fileSize: resumeText.length,
        fileType: 'text/plain',
        parsedData
      };

      // Save using service (updates Redux state)
      await saveResume(user.uid, resumeData);
      
      // Also save via API for persistence
      await saveResumeAPI(resumeData);
      
      setMessage('Resume saved successfully!');
    } catch (error) {
      setMessage(`Error saving resume: ${error.message}`);
    }
  };

  // Handle delete resume
  const handleDeleteResume = async () => {
    if (!user) {
      setMessage('Please sign in to delete resume');
      return;
    }

    if (!window.confirm('Are you sure you want to delete your resume?')) {
      return;
    }

    try {
      // Delete using service (clears Redux state)
      await deleteResume(user.uid);
      
      // Also delete via API
      await deleteResumeAPI();
      
      setResumeText('');
      setParsedData(null);
      setMessage('Resume deleted successfully!');
    } catch (error) {
      setMessage(`Error deleting resume: ${error.message}`);
    }
  };

  // Handle parse resume
  const handleParseResume = async () => {
    if (!resumeText.trim()) {
      setMessage('Please enter resume text to parse');
      return;
    }

    try {
      // Parse using service
      const parsed = await parseResumeText(resumeText);
      setParsedData(parsed);
      setMessage('Resume parsed successfully!');
    } catch (error) {
      setMessage(`Error parsing resume: ${error.message}`);
    }
  };

  // Handle sync resume
  const handleSyncResume = async () => {
    if (!user) {
      setMessage('Please sign in to sync resume');
      return;
    }

    try {
      // Sync using service (updates Redux state from MongoDB)
      const resumeData = await syncResumeState(user.uid);
      
      if (resumeData) {
        setResumeText(resumeData.resumeText || '');
        setParsedData(resumeData.parsedData || null);
        setMessage('Resume synced successfully!');
      } else {
        setMessage('No resume found to sync');
      }
    } catch (error) {
      setMessage(`Error syncing resume: ${error.message}`);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const isLoading = serviceLoading || apiLoading;
  const error = serviceError || apiError;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Resume Manager</h2>
      
      {/* Status Messages */}
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
          <button 
            onClick={() => {
              clearServiceError();
              clearAPIError();
            }}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Resume State Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Current Resume State (Redux):</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Sync Status:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              resumeState.syncStatus === 'synced' ? 'bg-green-100 text-green-800' :
              resumeState.syncStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {resumeState.syncStatus}
            </span>
          </div>
          <div><strong>File Name:</strong> {resumeState.fileName || 'None'}</div>
          <div><strong>Word Count:</strong> {resumeState.metadata?.wordCount || 0}</div>
          <div><strong>Version:</strong> {resumeState.version}</div>
          <div><strong>Last Modified:</strong> {resumeState.lastModified ? new Date(resumeState.lastModified).toLocaleString() : 'Never'}</div>
          <div><strong>Is Uploading:</strong> {resumeState.isUploading ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Resume Text Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resume Text:
        </label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Enter your resume text here..."
          className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleParseResume}
          disabled={isLoading || !resumeText.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Parse Resume'}
        </button>
        
        <button
          onClick={handleSaveResume}
          disabled={isLoading || !resumeText.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Resume'}
        </button>
        
        <button
          onClick={handleDeleteResume}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Deleting...' : 'Delete Resume'}
        </button>
        
        <button
          onClick={handleSyncResume}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Syncing...' : 'Sync Resume'}
        </button>
      </div>

      {/* Parsed Data Display */}
      {parsedData && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-3">Parsed Resume Data:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Name:</strong> {parsedData.name || 'Not found'}
            </div>
            <div>
              <strong>Email:</strong> {parsedData.email || 'Not found'}
            </div>
            <div>
              <strong>Phone:</strong> {parsedData.phone || 'Not found'}
            </div>
            <div>
              <strong>Location:</strong> {parsedData.location || 'Not found'}
            </div>
            <div className="col-span-full">
              <strong>Skills:</strong> {parsedData.skills?.join(', ') || 'None found'}
            </div>
            <div className="col-span-full">
              <strong>Summary:</strong> {parsedData.summary || 'Not found'}
            </div>
            {parsedData.experience && parsedData.experience.length > 0 && (
              <div className="col-span-full">
                <strong>Experience:</strong>
                <ul className="mt-1 ml-4">
                  {parsedData.experience.map((exp, index) => (
                    <li key={index} className="mb-1">
                      {exp.title} {exp.company && `at ${exp.company}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2 text-blue-800">How to Use:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Enter your resume text in the textarea above</li>
          <li>Click "Parse Resume" to extract structured data</li>
          <li>Click "Save Resume" to save to MongoDB and update Redux state</li>
          <li>Click "Sync Resume" to load data from MongoDB into Redux</li>
          <li>Click "Delete Resume" to remove all resume data</li>
        </ol>
      </div>
    </div>
  );
};

export default ResumeManager;