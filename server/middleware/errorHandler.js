import { logger } from './logger.js';

export const corsOptions = {
  origin: (origin, cb) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Request-ID'],
  optionsSuccessStatus: 200,
};

export const securityHeaders = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
};

// In-memory rate limiter (replace with Redis in production)
const windows = new Map();
export const rateLimit = (maxReq = 1000, windowMs = 60_000) => (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const arr = (windows.get(key) || []).filter(t => t > now - windowMs);
  if (arr.length >= maxReq) {
    logger.warn('Rate limit exceeded', { ip: key, count: arr.length });
    return res.status(429).json({ success: false, error: 'Too many requests. Please slow down.', code: 'RATE_LIMIT', retryAfterMs: windowMs });
  }
  arr.push(now);
  windows.set(key, arr);
  next();
};

// Strict rate limiter for auth routes
export const authRateLimit = rateLimit(10, 60_000);

export const validate = (schema) => (req, res, next) => {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const val = req.body[field];
    if (rules.required && (val === undefined || val === null || val === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    if (val !== undefined && val !== null && val !== '') {
      if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) errors.push(`${field}: invalid email`);
      if (rules.type === 'number' && isNaN(Number(val))) errors.push(`${field}: must be a number`);
      if (rules.min !== undefined && Number(val) < rules.min) errors.push(`${field}: must be >= ${rules.min}`);
      if (rules.max !== undefined && Number(val) > rules.max) errors.push(`${field}: must be <= ${rules.max}`);
      if (rules.minLength && String(val).length < rules.minLength) errors.push(`${field}: min length ${rules.minLength}`);
      if (rules.maxLength && String(val).length > rules.maxLength) errors.push(`${field}: max length ${rules.maxLength}`);
      if (rules.pattern && !new RegExp(rules.pattern).test(String(val))) errors.push(`${field}: invalid format`);
    }
  }
  if (errors.length) return res.status(400).json({ success: false, error: 'Validation failed', code: 'VALIDATION_ERROR', details: errors });
  next();
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error(message, {
    status,
    method: req.method,
    url: req.url,
    ip: req.ip,
    user: req.user?.email || 'anon',
    stack: err.stack,
  });

  // Log to DB if pool available (non-blocking)
  if (req.app?.locals?.pool) {
    req.app.locals.pool.query(
      `INSERT INTO audit_log (action, module, description) VALUES ('ERROR','system',$1)`,
      [message.slice(0, 500)]
    ).catch(() => {});
  }

  res.status(status).json({
    success: false,
    error: status >= 500 ? 'Internal server error' : message,
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.headers['x-request-id'],
    ...(process.env.NODE_ENV === 'development' && { dev_message: message, stack: err.stack }),
  });
};

export const notFoundHandler = (req, res) => {
  logger.warn('404 Not Found', { method: req.method, url: req.url });
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.url} not found`, code: 'NOT_FOUND' });
};

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Request ID middleware
export const requestId = (req, _res, next) => {
  req.id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  next();
};
