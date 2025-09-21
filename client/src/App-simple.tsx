import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import Home from './pages/Home-simple';

function App() {
  console.log('🚀 Ultra-simple React 16 app starting...');
  
  return (
    <HashRouter>
      <div className="App">
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>🎯 King Ezekiel Academy - React 16 Test</h1>
          <p>This is a minimal React 16 app to test mini browser compatibility.</p>
          <p>If you can see this, React 16 is working in mini browsers!</p>
          
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="*" component={Home} />
          </Switch>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;