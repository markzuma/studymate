import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SmartRefresh from './components/SmartRefresh.jsx'
import InstallApp from './components/InstallApp.jsx'
import AuthGate from './components/AuthGate.jsx'
import { ThemeProvider } from './context/ThemeProvider.jsx'
import { NavigationProvider } from './context/NavigationProvider.jsx'
import './MobileRefinement.css'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import './components/AppErrorBoundary.css'

const App = lazy(() => import('./App.jsx'))

const AndroidReleaseNotice = lazy(() =>
  import('./components/AndroidReleaseNotice.jsx')
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
    <ThemeProvider>
      <NavigationProvider>
        <Suspense fallback={
          <div role="status" style={{
            minHeight: '100dvh',
            display: 'grid',
            placeItems: 'center',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            fontSize: '14px'
          }}>
            Opening PERIAK…
          </div>
        }>
          <AuthGate>
            <App />
          </AuthGate>
        </Suspense>
        <SmartRefresh />
        <InstallApp />
        <Suspense fallback={null}>
          <AndroidReleaseNotice />
        </Suspense>
      </NavigationProvider>
    </ThemeProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
