# GitHub Actions Workflows

## Deploy to GitHub Pages

This workflow automatically builds and deploys the React application to GitHub Pages whenever code is pushed to the main branch.

### What it does:

1. **Triggers**: On push to main branch or manual dispatch
2. **Builds**: React app from the `client/` directory
3. **Deploys**: Built files to GitHub Pages
4. **Uses**: Latest Node.js 18 and npm caching for optimal performance

### Workflow Steps:

1. **Checkout**: Gets the latest code
2. **Setup Node.js**: Installs Node.js 18 with npm caching
3. **Install Dependencies**: Runs `npm ci` in the client directory
4. **Build**: Runs `npm run build` to create production build
5. **Setup Pages**: Configures GitHub Pages deployment
6. **Upload Artifact**: Uploads the built files
7. **Deploy**: Deploys to GitHub Pages

### Benefits:

- ✅ **Correct Build Directory**: Builds from `client/` not root
- ✅ **Automatic Deployment**: No manual intervention needed
- ✅ **Optimized Caching**: Faster builds with npm cache
- ✅ **Proper Permissions**: Secure deployment with minimal permissions
- ✅ **Concurrency Control**: Prevents deployment conflicts

### Manual Trigger:

You can manually trigger this workflow from the GitHub Actions tab in your repository.
