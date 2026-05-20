export function getDeviceInfo() {
  const ua = navigator.userAgent

  // Browser
  let browser = 'Browser'
  let version = ''
  if (/Firefox\/(\d+)/.test(ua)) {
    browser = 'Firefox'; version = ua.match(/Firefox\/(\d+)/)[1]
  } else if (/Edg\/(\d+)/.test(ua)) {
    browser = 'Edge'; version = ua.match(/Edg\/(\d+)/)[1]
  } else if (/OPR\/(\d+)/.test(ua)) {
    browser = 'Opera'; version = ua.match(/OPR\/(\d+)/)[1]
  } else if (/Chrome\/(\d+)/.test(ua)) {
    browser = 'Chrome'; version = ua.match(/Chrome\/(\d+)/)[1]
  } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari'
    const m = ua.match(/Version\/(\d+)/); if (m) version = m[1]
  }

  // OS
  let os = 'Unknown OS'
  if (/Windows NT 10/.test(ua))       os = 'Windows 10'
  else if (/Windows NT 11/.test(ua))  os = 'Windows 11'
  else if (/Windows/.test(ua))        os = 'Windows'
  else if (/iPhone/.test(ua))         os = 'iPhone'
  else if (/iPad/.test(ua))           os = 'iPad'
  else if (/Android/.test(ua))        os = 'Android'
  else if (/Mac OS X/.test(ua))       os = 'macOS'
  else if (/Linux/.test(ua))          os = 'Linux'

  const deviceType = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop'
  const deviceName = `${browser}${version ? ` ${version}` : ''} on ${os}`

  return { deviceName, deviceType }
}
