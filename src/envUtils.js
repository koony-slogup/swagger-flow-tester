/**
 * Resolve {{API_HOST}} placeholders in a string using an environment's variable list.
 * Unresolved placeholders are left as-is.
 */
export function resolveVars(str, vars) {
  if (!str) return str
  if (!vars || vars.length === 0) return str
  return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const v = vars.find(v => v.key === key.trim())
    return v?.val !== undefined && v.val !== '' ? v.val : match
  })
}

/**
 * Ensure a URL has an http:// or https:// protocol prefix.
 * {{API_HOST}}:8080 → after resolution → localhost:8080 → http://localhost:8080
 */
export function normalizeUrl(url) {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  return 'http://' + url
}
