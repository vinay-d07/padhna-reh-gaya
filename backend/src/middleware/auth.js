const { clerkMiddleware, getAuth } = require('@clerk/express');

// Verifies the Clerk session token (Bearer header or cookie) and rejects the
// request if there isn't one. Must run after clerkMiddleware(). Downstream
// handlers read the verified identity off req.clerkId rather than trusting
// anything the client sent in the body/query.
function requireAuth(req, res, next) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  req.clerkId = userId;
  next();
}

module.exports = { clerkMiddleware, requireAuth, getAuth };
