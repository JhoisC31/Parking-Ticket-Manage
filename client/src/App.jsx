import { Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import RegisterEntry from './pages/RegisterEntry'
import ActiveTickets from './pages/ActiveTickets'
import TicketHistory from './pages/TicketHistory'

function Layout() {
  const location = useLocation()
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar pathname={location.pathname} />
        <Routes>
          <Route path="/"        element={<Dashboard />}     />
          <Route path="/entry"   element={<RegisterEntry />} />
          <Route path="/active"  element={<ActiveTickets />} />
          <Route path="/history" element={<TicketHistory />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  )
}
