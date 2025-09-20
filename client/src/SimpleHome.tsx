import React from 'react';

const SimpleHome: React.FC = () => {
  return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        🎉 KING EZEKIEL ACADEMY
      </h1>
      <p style={{ fontSize: '24px', marginBottom: '20px' }}>
        Simple Home Page - No Dependencies
      </p>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        Time: {new Date().toLocaleTimeString()}
      </p>
      <p style={{ fontSize: '16px' }}>
        If you can see this, the simple app works in mini browsers!
      </p>
    </div>
  );
};

export default SimpleHome;
