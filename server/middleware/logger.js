import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '../../logs');

// Create logs directory
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const LOG_LEVEL = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LOG_LEVEL[process.env.LOG_LEVEL?.toUpperCase() || 'INFO'];

const pad = (n) => String(n).padStart(2, '0');
const timestamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const writeLog = (level, message, meta = {}) => {
  const entry = JSON.stringify({ timestamp: timestamp(), level, message, ...meta }) + '\n';
  const file = path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFile(file, entry, () => {});
  if (process.env.NODE_ENV !== 'test') {
    const colors = { DEBUG: '\x1b[36m', INFO: '\x1b[32m', WARN: '\x1b[33m', ERROR: '\x1b[31m' };
    console.log(`${colors[level] || ''}[${timestamp()}] [${level}] ${message}\x1b[0m`, Object.keys(meta).length ? meta : '');
  }
};

export const logger = {
  debug: (msg, meta) => CURRENT_LEVEL <= LOG_LEVEL.DEBUG && writeLog('DEBUG', msg, meta),
  info:  (msg, meta) => CURRENT_LEVEL <= LOG_LEVEL.INFO  && writeLog('INFO',  msg, meta),
  warn:  (msg, meta) => CURRENT_LEVEL <= LOG_LEVEL.WARN  && writeLog('WARN',  msg, meta),
  error: (msg, meta) => CURRENT_LEVEL <= LOG_LEVEL.ERROR && writeLog('ERROR', msg, meta),
};

// Request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;

  res.on('finish', () => {
    const dur = Date.now() - start;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    writeLog(level, `${method} ${url} ${res.statusCode} ${dur}ms`, {
      ip,
      user: req.user?.email || 'anon',
      statusCode: res.statusCode,
      durationMs: dur,
    });
  });
  next();
};

// Slow query logger (> 300ms)
export const logSlowQuery = (query, durationMs, params = []) => {
  if (durationMs > 300) {
    writeLog('WARN', 'Slow DB query detected', { query: query.slice(0, 200), durationMs, paramCount: params.length });
  }
};
