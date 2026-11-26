import { useState } from 'react'
import {
  useAndroidRelease,
  compareVersions,
  BASE_ANDROID_RELEASE
} from '../lib/androidRelease'
import './AndroidReleaseNotice.css'

const DISMISS_KEY = 'periak_android_release_seen_v1'

export default function AndroidReleaseNotice() {
  const nativeLaunch =
    /^android-app:\/\/com\.periak\.app(?:\/|$)/
      .test(document.referrer)

  const release = useAndroidRelease(nativeLaunch)

  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) || ''
    } catch {
      return ''
    }
  })

  if (
    !nativeLaunch ||
    dismissed === release.version ||
    compareVersions(
      release.version,
      BASE_ANDROID_RELEASE.version
    ) <= 0
  ) {
    return null
  }

  function dismiss() {
    setDismissed(release.version)

    try {
      localStorage.setItem(
        DISMISS_KEY,
        release.version
      )
    } catch {
      // Dismiss for this session.
    }
  }

  return (
    <aside
      className="periak-release-notice"
      aria-label="Android release announcement"
    >
      <img src="/periak-icon.svg?v=3" alt="" />

      <div className="periak-release-copy">
        <strong>PERIAK {release.version} available</strong>
        <span>Check your installed version before updating.</span>
        <a href={release.url} onClick={dismiss}>
          Download latest APK
        </a>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss release announcement"
      >
        ×
      </button>
    </aside>
  )
}
