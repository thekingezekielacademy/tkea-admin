/**
 * SIMPLE APP - Instagram/Facebook Browser Compatible
 * 
 * This is a minimal, ES5-compatible App component that will work
 * in Instagram and Facebook in-app browsers.
 */

import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

// Simple Home component
function SimpleHome() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>King Ezekiel Academy</h1>
          <p>Loading your educational experience...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>King Ezekiel Academy</h1>
          <nav>
            <a href="#/" style={{ color: 'white', textDecoration: 'none', margin: '0 1rem' }}>Home</a>
            <a href="#/courses" style={{ color: 'white', textDecoration: 'none', margin: '0 1rem' }}>Courses</a>
            <a href="#/about" style={{ color: 'white', textDecoration: 'none', margin: '0 1rem' }}>About</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              Transform Your Career
            </h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
              Learn digital skills that matter in today's world
            </p>
            <button style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f8f9fa';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              Start Learning Now
            </button>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '2rem',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Digital Marketing</h3>
              <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                Master the art of digital marketing with our comprehensive courses designed for real-world success.
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '2rem',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Sales Training</h3>
              <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                Learn proven sales techniques and strategies that will help you close more deals and grow your business.
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '2rem',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Programming</h3>
              <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                Build technical skills with our programming courses that take you from beginner to professional.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div style={{
            textAlign: 'center',
            background: 'rgba(255,255,255,0.1)',
            padding: '3rem',
            borderRadius: '10px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to Get Started?</h3>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
              Join thousands of students who have transformed their careers with our courses.
            </p>
            <div>
              <button style={{
                background: 'white',
                color: '#667eea',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold',
                margin: '0 10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                View Courses
              </button>
              <button style={{
                background: 'transparent',
                color: 'white',
                border: '2px solid white',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold',
                margin: '0 10px'
              }}>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(0,0,0,0.2)',
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <p style={{ opacity: 0.8, margin: 0 }}>
          © 2024 King Ezekiel Academy. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// Simple Courses component
function SimpleCourses() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
          Our Courses
        </h1>
        <p style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '3rem', opacity: 0.9 }}>
          Choose from our comprehensive range of digital skills courses
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {[
            { title: 'Digital Marketing Mastery', description: 'Complete guide to digital marketing strategies' },
            { title: 'Sales Excellence', description: 'Master the art of selling and closing deals' },
            { title: 'Web Development', description: 'Build modern websites and web applications' },
            { title: 'Data Analytics', description: 'Analyze data to make informed business decisions' },
            { title: 'Social Media Marketing', description: 'Grow your brand on social media platforms' },
            { title: 'E-commerce Success', description: 'Build and scale successful online stores' }
          ].map((course, index) => (
            <div key={index} style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '2rem',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{course.title}</h3>
              <p style={{ opacity: 0.9, lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {course.description}
              </p>
              <button style={{
                background: 'white',
                color: '#667eea',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}>
                Enroll Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple About component
function SimpleAbout() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
          About King Ezekiel Academy
        </h1>
        
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '3rem',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Our Mission</h2>
          <p style={{ fontSize: '1.2rem', lineHeight: 1.6, marginBottom: '2rem', opacity: 0.9 }}>
            We are dedicated to providing world-class digital skills education that empowers individuals 
            to transform their careers and achieve their dreams. Our comprehensive courses are designed 
            by industry experts and delivered through cutting-edge technology.
          </p>
          
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Why Choose Us?</h3>
          <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
            <li style={{ marginBottom: '0.5rem', opacity: 0.9 }}>Expert instructors with real-world experience</li>
            <li style={{ marginBottom: '0.5rem', opacity: 0.9 }}>Hands-on projects and practical exercises</li>
            <li style={{ marginBottom: '0.5rem', opacity: 0.9 }}>Flexible learning schedules</li>
            <li style={{ marginBottom: '0.5rem', opacity: 0.9 }}>Industry-recognized certificates</li>
            <li style={{ marginBottom: '0.5rem', opacity: 0.9 }}>Lifetime access to course materials</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Main App component
function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Simple routing without React Router for maximum compatibility
  const renderPage = () => {
    switch (currentPath) {
      case '#/courses':
        return <SimpleCourses />;
      case '#/about':
        return <SimpleAbout />;
      default:
        return <SimpleHome />;
    }
  };

  return (
    <div>
      {renderPage()}
    </div>
  );
}

export default App;
