import React from 'react';
import { isInstagramBrowser, safeLog, safeError } from '../utils/instagramMinimalMode';

const InstagramMinimalApp: React.FC = () => {
  React.useEffect(() => {
    safeLog('Instagram Minimal App loaded');
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          color: '#2c3e50', 
          marginBottom: '10px',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          King Ezekiel Academy
        </h1>
        <p style={{ 
          color: '#7f8c8d', 
          fontSize: '16px',
          margin: '0'
        }}>
          Digital Skills for Success
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ 
          color: '#2c3e50', 
          marginBottom: '20px',
          fontSize: '24px'
        }}>
          Welcome to King Ezekiel Academy
        </h2>
        
        <p style={{ 
          color: '#34495e', 
          lineHeight: '1.6',
          marginBottom: '20px',
          fontSize: '16px'
        }}>
          We provide comprehensive digital skills training to help you succeed in today's technology-driven world.
        </p>

        <div style={{
          backgroundColor: '#e8f4fd',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #bee5eb'
        }}>
          <h3 style={{ 
            color: '#0c5460', 
            marginBottom: '10px',
            fontSize: '18px'
          }}>
            📱 For the Best Experience
          </h3>
          <p style={{ 
            color: '#0c5460', 
            margin: '0',
            fontSize: '14px'
          }}>
            Instagram's browser has limited features. For the full experience with videos, courses, and interactive content, please open this link in your main browser.
          </p>
        </div>

        {/* Call to Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginTop: '30px'
        }}>
          <a 
            href="https://thekingezekielacademy.com"
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '15px 30px',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'block'
            }}
          >
            🚀 Open Full Website
          </a>
          
          <a 
            href="https://thekingezekielacademy.com/courses"
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '15px 30px',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'block'
            }}
          >
            📚 View Courses
          </a>
        </div>
      </div>

      {/* Features Preview */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          color: '#2c3e50', 
          marginBottom: '20px',
          fontSize: '20px',
          textAlign: 'center'
        }}>
          What You'll Find in the Full Website
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px'
        }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎥</div>
            <div style={{ fontSize: '14px', color: '#495057' }}>Video Courses</div>
          </div>
          
          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📖</div>
            <div style={{ fontSize: '14px', color: '#495057' }}>Blog Articles</div>
          </div>
          
          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏆</div>
            <div style={{ fontSize: '14px', color: '#495057' }}>Certificates</div>
          </div>
          
          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>💼</div>
            <div style={{ fontSize: '14px', color: '#495057' }}>Resume Builder</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        color: '#6c757d',
        fontSize: '14px'
      }}>
        <p style={{ margin: '0 0 10px 0' }}>
          King Ezekiel Academy - Empowering Digital Success
        </p>
        <p style={{ margin: '0' }}>
          Open in your browser for the complete experience
        </p>
      </div>
    </div>
  );
};

export default InstagramMinimalApp;
