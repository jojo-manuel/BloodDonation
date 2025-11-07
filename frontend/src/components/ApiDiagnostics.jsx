import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export default function ApiDiagnostics() {
  const [diagnostics, setDiagnostics] = useState({
    apiUrl: '',
    baseUrl: '',
    envVar: '',
    testResult: null,
    error: null
  });

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const API_BASE_URL = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
    
    setDiagnostics({
      apiUrl: API_URL,
      baseUrl: API_BASE_URL,
      envVar: import.meta.env.VITE_API_URL || 'NOT SET',
      testResult: null,
      error: null
    });

    // Test API connection
    testApiConnection(API_BASE_URL);
  }, []);

  const testApiConnection = async (baseUrl) => {
    try {
      // Try a simple health check or root endpoint
      const response = await fetch(`${baseUrl.replace('/api', '')}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setDiagnostics(prev => ({
        ...prev,
        testResult: {
          status: response.status,
          data: data,
          success: response.ok
        }
      }));
    } catch (error) {
      setDiagnostics(prev => ({
        ...prev,
        error: error.message,
        testResult: {
          success: false,
          error: error.message
        }
      }));
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#1a1a1a', 
      color: '#fff', 
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '800px',
      margin: '20px auto',
      borderRadius: '8px'
    }}>
      <h2 style={{ color: '#4CAF50', marginBottom: '20px' }}>🔧 API Diagnostics</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <strong style={{ color: '#FFC107' }}>VITE_API_URL Environment Variable:</strong>
        <div style={{ 
          background: '#2a2a2a', 
          padding: '10px', 
          marginTop: '5px',
          borderRadius: '4px',
          color: diagnostics.envVar === 'NOT SET' ? '#f44336' : '#4CAF50'
        }}>
          {diagnostics.envVar}
        </div>
        {diagnostics.envVar === 'NOT SET' && (
          <div style={{ color: '#f44336', marginTop: '5px', fontSize: '11px' }}>
            ⚠️ VITE_API_URL is not set! Set it in Vercel Dashboard → Settings → Environment Variables
          </div>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong style={{ color: '#FFC107' }}>API URL (Resolved):</strong>
        <div style={{ 
          background: '#2a2a2a', 
          padding: '10px', 
          marginTop: '5px',
          borderRadius: '4px'
        }}>
          {diagnostics.apiUrl}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong style={{ color: '#FFC107' }}>API Base URL (with /api):</strong>
        <div style={{ 
          background: '#2a2a2a', 
          padding: '10px', 
          marginTop: '5px',
          borderRadius: '4px'
        }}>
          {diagnostics.baseUrl}
        </div>
      </div>

      {diagnostics.testResult && (
        <div style={{ marginTop: '20px' }}>
          <strong style={{ color: '#FFC107' }}>Connection Test:</strong>
          <div style={{ 
            background: diagnostics.testResult.success ? '#1b5e20' : '#b71c1c',
            padding: '10px', 
            marginTop: '5px',
            borderRadius: '4px'
          }}>
            {diagnostics.testResult.success ? '✅ Connected' : '❌ Failed'}
            {diagnostics.testResult.status && (
              <div style={{ marginTop: '5px' }}>Status: {diagnostics.testResult.status}</div>
            )}
            {diagnostics.testResult.error && (
              <div style={{ marginTop: '5px', color: '#ffcdd2' }}>
                Error: {diagnostics.testResult.error}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '4px' }}>
        <strong style={{ color: '#2196F3' }}>📋 Instructions:</strong>
        <ol style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Open Vercel Dashboard</li>
          <li>Go to your project → Settings → Environment Variables</li>
          <li>Add: <code style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: '3px' }}>VITE_API_URL</code></li>
          <li>Value: Your backend API URL (e.g., <code style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: '3px' }}>https://your-backend.vercel.app</code>)</li>
          <li>Redeploy your frontend</li>
        </ol>
      </div>
    </div>
  );
}

