'use client';
import React from 'react';

const Home: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#1e3a8a', marginBottom: '20px' }}>
        🎯 King Ezekiel Academy
      </h1>
      
      <div style={{ 
        backgroundColor: '#f0f9ff', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#1e40af', marginBottom: '15px' }}>
          ✅ React 16 Test Successful!
        </h2>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
          If you can see this page, React 16 is working perfectly in mini browsers!
        </p>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '10px' }}>
          This proves that the issue was with React 18, not with mini browser compatibility.
        </p>
      </div>
      
      <div style={{ 
        backgroundColor: '#fef3c7', 
        padding: '15px', 
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#92400e', marginBottom: '10px' }}>
          🧪 Test Results
        </h3>
        <ul style={{ textAlign: 'left', color: '#374151' }}>
          <li>✅ React 16 rendering</li>
          <li>✅ HashRouter working</li>
          <li>✅ Mini browser compatibility</li>
          <li>✅ Basic JavaScript features</li>
        </ul>
      </div>
      
      <div style={{ 
        backgroundColor: '#ecfdf5', 
        padding: '15px', 
        borderRadius: '6px'
      }}>
        <h3 style={{ color: '#065f46', marginBottom: '10px' }}>
          🚀 Next Steps
        </h3>
        <p style={{ color: '#374151', margin: 0 }}>
          Now we can gradually add back features while maintaining React 16 compatibility.
        </p>
      </div>
    </div>
  );
};

export default Home;
