/**
 * Check url and parse
 */
const checkUrl = (string) => {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  if (url.protocol === 'http:' || url.protocol === 'https:') {
    return url;
  }
  return false;
};

module.exports = {
  checkUrl,
};
