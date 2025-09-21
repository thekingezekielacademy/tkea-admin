# Security Guidelines for King Ezekiel Academy

## 🚨 CRITICAL SECURITY ISSUES FIXED

### Directory Listing Exposure (FIXED)
- **Issue**: Python HTTP server was exposing directory listing on port 3000
- **Risk**: Sensitive files and configuration details were accessible
- **Fix**: Killed Python server and started proper React development server

## 🔒 Development Server Security

### Always Use Proper Development Servers
- ✅ **React Development Server**: `npm start` (port 3000)
- ✅ **Vite Development Server**: `npm run dev` (if using Vite)
- ❌ **Python HTTP Server**: `python -m http.server` (exposes directory listing)
- ❌ **Node HTTP Server**: `http-server` (can expose directory listing)

### Port Management
- **Port 3000**: React development server only
- **Port 5000**: API server only
- **Never run multiple servers on same port**

## 🛡️ Security Best Practices

### 1. Development Environment
- Always use `npm start` for React development
- Never use `python -m http.server` or similar tools
- Check running processes: `lsof -i :3000`
- Kill conflicting processes: `kill <PID>`

### 2. Production Environment
- Use proper web servers (Nginx, Apache)
- Disable directory listing in server configuration
- Use HTTPS in production
- Implement proper CORS policies

### 3. File Access Control
- Never expose sensitive files in public directories
- Use `.env` files for environment variables
- Keep API keys and secrets secure
- Use `.gitignore` to exclude sensitive files

## 🚨 Emergency Response

### If Directory Listing is Exposed
1. **Immediately kill the process**: `kill <PID>`
2. **Check what's running**: `lsof -i :3000`
3. **Start proper server**: `npm start`
4. **Verify fix**: Check localhost:3000

### Security Checklist
- [ ] No directory listing exposed
- [ ] Proper development server running
- [ ] No sensitive files in public directories
- [ ] Environment variables secured
- [ ] HTTPS enabled in production

## 📞 Contact
If you discover any security issues, immediately:
1. Stop the development server
2. Document the issue
3. Fix the problem
4. Update these guidelines

---
**Last Updated**: January 21, 2025
**Status**: ✅ SECURE
