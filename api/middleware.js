// Custom middleware to handle rate limiting and IP blocking
export default function middleware(req) {
  // Get client IP
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
  
  // Allow all requests - we'll handle rate limiting in the app instead
  // This prevents Vercel's aggressive DDoS protection from blocking legitimate users
  
  // Add headers to help with debugging
  const response = new Response(null, {
    status: 200,
    headers: {
      'X-Client-IP': ip,
      'X-Forwarded-For': req.headers['x-forwarded-for'] || '',
      'X-Real-IP': req.headers['x-real-ip'] || '',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  return response;
}

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|static/).*)',
  ],
}
