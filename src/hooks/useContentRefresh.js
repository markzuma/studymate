import { useEffect, useState } from 'react'

// PERIAK CONTENT AUTO-SYNC V2
export default function useContentRefresh() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const refresh = () => setVersion(value => value + 1)

    window.addEventListener('periak:content-refresh', refresh)

    return () => {
      window.removeEventListener('periak:content-refresh', refresh)
    }
  }, [])

  return version
}
