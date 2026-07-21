export function isFigmaFileUrl(value: string) {
  try {
    const url = new URL(value.trim())
    const host = url.hostname.toLowerCase()
    const isFigmaHost = host === 'figma.com' || host.endsWith('.figma.com')
    return isFigmaHost && /^\/(file|design)\/[^/]+/.test(url.pathname)
  } catch {
    return false
  }
}
