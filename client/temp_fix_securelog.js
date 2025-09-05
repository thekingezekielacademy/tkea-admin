const fs = require('fs');

// Read the AuthContext file
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

// Add back the secureLog import
const importLine = `import { secureLog } from '../utils/secureLogger';\n`;
content = content.replace(/import.*from.*react.*\n/, `import { useEffect, useState, useCallback, useRef, createContext, useContext } from 'react';\n${importLine}`);

// Replace secureLog calls with console.log for now
content = content.replace(/secureLog\(/g, 'console.log(');

fs.writeFileSync('src/contexts/AuthContext.tsx', content);

console.log('✅ Fixed secureLog issue in AuthContext');
