/**
 * Instagram/Facebook Mini Browser Compatibility Script
 */

(function() {
    'use strict';
    
    console.log('🚀 Instagram Compatibility Script Loading...');
    
    // Detect mini browsers
    function isMiniBrowser() {
        if (typeof navigator === 'undefined') return false;
        const ua = navigator.userAgent.toLowerCase();
        return /fban|fbav|fbios|instagram|line|twitter|linkedin|whatsapp|telegram|wv\)/i.test(ua);
    }
    
    // Check if React app has loaded successfully
    function hasReactAppLoaded() {
        const root = document.getElementById('root');
        if (!root) return false;
        return root.children.length > 0 || root.innerHTML.trim() !== '';
    }
    
    // Create mini browser fallback content
    function createMiniBrowserFallback() {
        console.log('📱 Creating mini browser fallback...');
        
        const fallbackHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>King Ezekiel Academy - Educational Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #333; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; padding: 20px;
        }
        .container { 
            max-width: 600px; margin: 0 auto; background: white; border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white;
            padding: 40px 30px; text-align: center;
        }
        .logo { font-size: 2.5rem; font-weight: bold; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .tagline { font-size: 1.1rem; opacity: 0.9; margin-bottom: 20px; }
        .content { padding: 40px 30px; }
        h1 { color: #1e3a8a; font-size: 2rem; margin-bottom: 20px; text-align: center; }
        p { color: #666; margin-bottom: 20px; text-align: center; }
        .browser-instructions { 
            background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;
        }
        .browser-instructions h3 { color: #92400e; margin-bottom: 15px; font-size: 1.2rem; }
        .browser-instructions p { color: #92400e; text-align: left; margin-bottom: 10px; }
        .browser-instructions ol { color: #92400e; margin-left: 20px; }
        .browser-instructions li { margin-bottom: 8px; }
        .btn { 
            display: inline-block; background: #3b82f6; color: white; padding: 15px 30px;
            border: none; border-radius: 8px; text-decoration: none; font-size: 1.1rem;
            font-weight: 600; margin: 10px; transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }
        .btn:hover { background: #2563eb; transform: translateY(-2px); }
        .btn-secondary { background: #6b7280; }
        .btn-secondary:hover { background: #4b5563; }
        .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
        .footer p { color: #d1d5db; margin-bottom: 10px; }
        @media (max-width: 480px) {
            body { padding: 10px; }
            .header { padding: 30px 20px; }
            .logo { font-size: 2rem; }
            .content { padding: 30px 20px; }
            h1 { font-size: 1.5rem; }
            .btn { display: block; margin: 10px 0; width: 100%; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">👑 King Ezekiel Academy</div>
            <div class="tagline">Transform Your Career with Digital Skills</div>
        </div>
        <div class="content">
            <h1>Welcome to King Ezekiel Academy</h1>
            <p>We're sorry, but this app requires a full browser to work properly. Instagram and Facebook's built-in browsers have limited functionality that prevents our educational platform from loading correctly.</p>
            <div class="browser-instructions">
                <h3>📱 How to Open in Your Regular Browser</h3>
                <p><strong>On Instagram:</strong></p>
                <ol>
                    <li>Tap the three dots (⋯) in the top right corner</li>
                    <li>Select "Open in Browser" or "Open in Safari/Chrome"</li>
                    <li>Enjoy the full experience!</li>
                </ol>
                <p><strong>On Facebook:</strong></p>
                <ol>
                    <li>Tap the three dots (⋯) in the top right corner</li>
                    <li>Select "Open in Browser" or "Open in Safari/Chrome"</li>
                    <li>Enjoy the full experience!</li>
                </ol>
            </div>
            <div style="text-align: center; margin: 40px 0;">
                <a href="https://app.thekingezekielacademy.com" class="btn">Open in Browser</a>
                <a href="javascript:window.location.reload()" class="btn btn-secondary">Refresh Page</a>
            </div>
        </div>
        <div class="footer">
            <p>© 2024 King Ezekiel Academy. All rights reserved.</p>
            <p>For the best experience, please use a regular browser.</p>
        </div>
    </div>
</body>
</html>`;
        
        document.open();
        document.write(fallbackHTML);
        document.close();
    }
    
    // Main execution
    function init() {
        console.log('🔍 Checking browser compatibility...');
        const isMini = isMiniBrowser();
        console.log('Is Mini Browser:', isMini);
        
        if (isMini) {
            console.log('📱 Mini browser detected, setting up fallback...');
            setTimeout(function() {
                if (!hasReactAppLoaded()) {
                    console.log('❌ React app failed to load, showing fallback...');
                    createMiniBrowserFallback();
                } else {
                    console.log('✅ React app loaded successfully');
                }
            }, 3000);
        } else {
            console.log('🌐 Regular browser detected, allowing normal flow');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();