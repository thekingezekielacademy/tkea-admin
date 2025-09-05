const fs = require('fs');

// Read the App.tsx file
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix the JSX structure
const oldClosing = `    </AuthProvider>
  );
}`;

const newClosing = `    </AuthProvider>
    </SafeErrorBoundary>
  );
}`;

// Replace the closing
content = content.replace(oldClosing, newClosing);

// Write the fixed content
fs.writeFileSync('src/App.tsx', content);

console.log('✅ Fixed JSX structure in App.tsx');
