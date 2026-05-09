/**
 * fetchWithTimeout — wrap global fetch with an AbortController so an upstream
 * that hangs can never wedge a Netlify Function past its execution budget.
 *
 * Default budget is 15s, well below Netlify's 26s synchronous timeout but
 * long enough to absorb a slow PageSpeed run.
 *
 * Throws a UpstreamTimeoutError on abort so callers can map cleanly to a
 * 504 Gateway Timeout response. Other errors propagate unchanged.
 */

class UpstreamTimeoutError extends Error {
  constructor(message) {
    super(message || 'Upstream request timed out');
    this.name = 'UpstreamTimeoutError';
    this.code = 'ETIMEDOUT';
  }
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new UpstreamTimeoutError(`Upstream did not respond within ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  fetchWithTimeout,
  UpstreamTimeoutError
};
