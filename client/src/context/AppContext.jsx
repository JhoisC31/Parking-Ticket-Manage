import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [tickets, setTickets]           = useState([])
  const [availability, setAvailability] = useState({ total: 50, occupied: 0, available: 50 })
  const [error, setError]               = useState(null)

  const fetchTickets = useCallback(async () => {
    try {
      const res  = await fetch('/api/tickets')
      const data = await res.json()
      setTickets(data)
    } catch { setError('No se pudo conectar con el servidor') }
  }, [])

  const fetchAvailability = useCallback(async () => {
    try {
      const res  = await fetch('/api/tickets/availability')
      const data = await res.json()
      setAvailability(data)
    } catch {}
  }, [])

  const registerEntry = useCallback(async (payload) => {
    const res = await fetch('/api/tickets/entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
    const data = await res.json()
    setTickets(prev => [data, ...prev])
    setAvailability(prev => ({ ...prev, occupied: prev.occupied + 1, available: prev.available - 1 }))
    return data
  }, [])

  const registerExit = useCallback(async (ticketId) => {
    const res = await fetch(`/api/tickets/${ticketId}/exit`, { method: 'PUT' })
    if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
    const data = await res.json()
    setTickets(prev => prev.map(t => t.id === ticketId ? data : t))
    setAvailability(prev => ({ ...prev, occupied: prev.occupied - 1, available: prev.available + 1 }))
    return data
  }, [])

  const activeTickets = tickets.filter(t => t.status === 'active')

  return (
    <AppContext.Provider value={{
      tickets, activeTickets, availability, error,
      fetchTickets, fetchAvailability, registerEntry, registerExit,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
