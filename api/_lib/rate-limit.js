// @ts-check

/** @type {Map<string, {count: number, resetAt: number}>} */
const store = new Map();

const WINDOW_MS = 60 * 1000; // 1分
const MAX_REQUESTS = 5;

// 古いエントリを定期的にクリーンアップ
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.resetAt) {
      store.delete(key);
    }
  }
}, 60 * 1000);

/**
 * IPアドレスに基づくレート制限チェック
 * @param {import('http').IncomingMessage} req
 * @returns {{ allowed: boolean, remaining: number }}
 */
function checkRateLimit(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string"
    ? forwarded.split(",")[0].trim()
    : req.socket?.remoteAddress || "unknown";

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

module.exports = { checkRateLimit };
