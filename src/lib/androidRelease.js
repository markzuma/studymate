import { useEffect, useState } from 'react'

const API =
  'https://api.github.com/repos/markzuma/studymate/releases?per_page=30'

const DOWNLOAD_BASE =
  'https://github.com/markzuma/studymate/releases/download/'

export const BASE_ANDROID_RELEASE = {
  version: '1.0.1',
  url: DOWNLOAD_BASE +
    'android-v1.0.1/PERIAK-1.0.1.apk',
  size: null
}

const CACHE_KEY = 'periak_android_release_v1'
const TTL = 30 * 60 * 1000

let cached = null
let pending = null
let checkedAt = 0

export function compareVersions(a, b) {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) {
      return left[i] - right[i]
    }
  }

  return 0
}

function validRelease(item) {
  return item &&
    /^\d+\.\d+\.\d+$/.test(item.version) &&
    item.url === DOWNLOAD_BASE +
      `android-v${item.version}/PERIAK-${item.version}.apk`
}

function readCache() {
  try {
    const value = JSON.parse(
      localStorage.getItem(CACHE_KEY) || 'null'
    )

    if (
      validRelease(value?.release) &&
      compareVersions(
        value.release.version,
        BASE_ANDROID_RELEASE.version
      ) >= 0
    ) {
      return value
    }
  } catch {
    // Storage is optional.
  }

  return null
}

export async function loadAndroidRelease() {
  if (!cached) {
    const stored = readCache()

    if (stored) {
      cached = stored.release
      checkedAt = Number(stored.checkedAt || 0)
    }
  }

  if (cached && Date.now() - checkedAt < TTL) {
    return cached
  }

  if (pending) return pending

  pending = (async () => {
    try {
      const response = await fetch(API, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: typeof AbortSignal.timeout === 'function'
          ? AbortSignal.timeout(10000)
          : undefined
      })

      if (!response.ok) {
        throw new Error('Release lookup unavailable')
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        throw new Error('Invalid release response')
      }

      const releases = data
        .filter(item =>
          !item.draft &&
          !item.prerelease &&
          /^android-v\d+\.\d+\.\d+$/.test(item.tag_name)
        )
        .map(item => {
          const version = item.tag_name.slice(9)

          const apk = item.assets?.find(asset =>
            asset.name === `PERIAK-${version}.apk`
          )

          return {
            version,
            url: apk?.browser_download_url,
            size: apk?.size
          }
        })
        .filter(validRelease)
        .filter(item =>
          compareVersions(
            item.version,
            BASE_ANDROID_RELEASE.version
          ) >= 0
        )
        .sort((a, b) =>
          compareVersions(b.version, a.version)
        )

      if (!releases.length) {
        throw new Error('No valid Android release')
      }

      cached = releases[0]
      checkedAt = Date.now()

      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            release: cached,
            checkedAt
          })
        )
      } catch {
        // Memory cache remains available.
      }

      return cached
    } catch {
      checkedAt = Date.now()
      return cached || BASE_ANDROID_RELEASE
    }
  })()

  try {
    return await pending
  } finally {
    pending = null
  }
}

export function useAndroidRelease(enabled = true) {
  const [release, setRelease] = useState(
    () => readCache()?.release || BASE_ANDROID_RELEASE
  )

  useEffect(() => {
    if (!enabled) return

    let active = true

    const refresh = () => {
      loadAndroidRelease().then(value => {
        if (active) setRelease(value)
      })
    }

    refresh()

    const timer = setInterval(refresh, TTL)

    window.addEventListener('focus', refresh)

    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [enabled])

  return release
}
