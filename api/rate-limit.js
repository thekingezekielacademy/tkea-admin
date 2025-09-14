// Custom rate limiting implementation
const rateLimitMap = new Map();

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get client IP
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
  
  // Rate limiting: 100 requests per minute per IP
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const data = rateLimitMap.get(ip);
    
    if (now > data.resetTime) {
      // Reset the window
      data.count = 1;
      data.resetTime = now + windowMs;
    } else {
      data.count++;
    }
    
    if (data.count > maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((data.resetTime - now) / 1000)
      });
      return;
    }
  }

  // Clean up old entries (basic cleanup)
  if (Math.random() < 0.01) { // 1% chance
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  // Return success
  res.status(200).json({
    status: 'ok',
    ip: ip,
    remaining: maxRequests - rateLimitMap.get(ip).count,
    resetTime: rateLimitMap.get(ip).resetTime
  });
}
