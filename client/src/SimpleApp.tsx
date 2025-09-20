import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import SimpleHome from './SimpleHome';

const SimpleApp: React.FC = () => {
  return (
    <HashRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<SimpleHome />} />
          <Route path="*" element={<SimpleHome />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default SimpleApp;