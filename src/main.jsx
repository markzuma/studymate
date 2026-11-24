import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SmartRefresh from './components/SmartRefresh.jsx'
import InstallApp from './components/InstallApp.jsx'
import AuthGate from './components/AuthGate.jsx'
import { ThemeProvider } from './context/ThemeProvider.jsx'
import { NavigationProvider } from './context/NavigationProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <NavigationProvider>
        <AuthGate>
          <App />
        </AuthGate>
        <SmartRefresh />
        <InstallApp />
      </NavigationProvider>
    </ThemeProvider>
  </StrictMode>,
)
