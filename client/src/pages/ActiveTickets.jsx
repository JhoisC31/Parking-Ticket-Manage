import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

export default function ActiveTickets() {
  const { activeTickets, fetchTickets, registerExit } = useApp()
  const [search, setSearch]       = useState('')
  const [exitModal, setExitModal] = useState(null)
  const [exitResult, setExitResult] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [now, setNow]             = useState(Date.now())

  useEffect(() => { fetchTickets() }, [])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(t) }, [])

  const filtered = activeTickets.filter(t =>
    t.plate?.toLowerCase().includes(search.toLowerCase()) ||
    String(t.spaceNumber).includes(search)
  )

  const handleExit = async () => {
    try {
      setLoading(true); setError(null)
      const result = await registerExit(exitModal.id)
      setExitResult(result)
      setExitModal(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tickets Activos</h1>
          <p className="page-subtitle">{activeTickets.length} vehículo(s) actualmente estacionados</p>
        </div>
        <span className="badge badge-green" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          <span className="badge-dot" style={{ width: 7, height: 7 }} />
          {activeTickets.length} activos
        </span>
      </div>

      {exitResult && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(34,197,94,0.3)' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--green)' }}>✓ Salida Registrada</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setExitResult(null)}>Cerrar</button>
          </div>
          <div className="card-body">
            <div className="ticket-receipt" style={{ maxWidth: 340 }}>
              <div className="ticket-receipt-title">COMPROBANTE DE SALIDA</div>
              <div className="receipt-row"><span className="key">TICKET #</span><span className="val">{String(exitResult.id).padStart(6,'0')}</span></div>
              <div className="receipt-row"><span className="key">PLACA</span><span className="val" style={{ color: 'var(--accent)' }}>{exitResult.plate}</span></div>
              <div className="receipt-row"><span className="key">ESPACIO</span><span className="val">#{exitResult.spaceNumber}</span></div>
              <div className="receipt-row"><span className="key">ENTRADA</span><span className="val">{fmtDt(exitResult.entryTime)}</span></div>
              <div className="receipt-row"><span className="key">SALIDA</span><span className="val">{fmtDt(exitResult.exitTime)}</span></div>
              <div className="receipt-row"><span className="key">DURACIÓN</span><span className="val">{duration(exitResult.entryTime, exitResult.exitTime)}</span></div>
              <div className="receipt-row total"><span className="key">TOTAL</span><span className="val">${(exitResult.totalCost || 0).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="filters-row">
        <div className="search-input-wrap" style={{ maxWidth: 300 }}>
          <SearchIcon className="search-icon" />
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por placa o espacio..." />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CarIcon className="empty-icon" />
            <p className="empty-title">{search ? 'Sin resultados' : 'Sin vehículos activos'}</p>
            <p className="empty-desc">{search ? `No se encontró "${search}"` : 'No hay vehículos estacionados actualmente.'}</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Ticket #</th><th>Placa</th><th>Tipo</th><th>Espacio</th><th>Entrada</th><th>Tiempo</th><th>Costo Est.</th><th>Acción</th></tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const mins  = Math.floor((now - new Date(t.entryTime)) / 60000)
                const hours = Math.max(1, Math.ceil(mins / 60))
                const rate  = t.vehicleType === 'motorcycle' ? 30 : t.vehicleType === 'truck' ? 60 : 50
                return (
                  <tr key={t.id}>
                    <td><span className="mono" style={{ color: 'var(--text-muted)' }}>#{String(t.id).padStart(6,'0')}</span></td>
                    <td><span className="mono" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>{t.plate}</span></td>
                    <td><span style={{ fontSize: '0.78rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{t.vehicleType}</span></td>
                    <td><span className="badge badge-blue">#{t.spaceNumber}</span></td>
                    <td><span className="mono">{fmtDt(t.entryTime)}</span></td>
                    <td><span className="mono" style={{ color: mins > 120 ? 'var(--red)' : mins > 60 ? 'var(--yellow)' : 'var(--text-primary)' }}>{elapsed(t.entryTime, now)}</span></td>
                    <td><span className="mono text-accent">${(hours * rate).toFixed(2)}</span></td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => { setExitModal(t); setError(null) }}>
                        <ExitIcon /> Salida
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {exitModal && (
        <div className="modal-overlay" onClick={() => setExitModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirmar Salida</span>
              <button className="modal-close" onClick={() => setExitModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="ticket-receipt">
                <div className="ticket-receipt-title">RESUMEN DE ESTADÍA</div>
                <div className="receipt-row"><span className="key">PLACA</span><span className="val" style={{ color: 'var(--accent)', fontSize: '1rem' }}>{exitModal.plate}</span></div>
                <div className="receipt-row"><span className="key">ESPACIO</span><span className="val">#{exitModal.spaceNumber}</span></div>
                <div className="receipt-row"><span className="key">ENTRADA</span><span className="val">{fmtDt(exitModal.entryTime)}</span></div>
                <div className="receipt-row"><span className="key">TIEMPO</span><span className="val">{elapsed(exitModal.entryTime, now)}</span></div>
                <div className="receipt-row total">
                  <span className="key">TOTAL EST.</span>
                  <span className="val">${(Math.max(1, Math.ceil((now - new Date(exitModal.entryTime)) / 3600000)) * (exitModal.vehicleType === 'motorcycle' ? 30 : exitModal.vehicleType === 'truck' ? 70 : 50)).toFixed(2)}</span>
                </div>
              </div>
              {error && <div className="alert alert-error"><WarnIcon /> {error}</div>}
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Al confirmar, el ticket se cerrará y el espacio quedará disponible.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setExitModal(null)} disabled={loading}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleExit} disabled={loading}>{loading ? 'Procesando...' : 'Confirmar Salida'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const fmtDt   = iso => iso ? new Date(iso).toLocaleString('es-DO', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'
const duration = (a, b) => { const m = Math.floor((new Date(b)-new Date(a))/60000); const h=Math.floor(m/60); return h>0?`${h}h ${m%60}m`:`${m}m` }
const elapsed  = (iso, now) => { const d=Math.floor((now-new Date(iso))/60000); return d<60?`${d}m`:`${Math.floor(d/60)}h ${d%60}m` }

function SearchIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> }
function CarIcon({ className })    { return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h16a2 2 0 012 2v6a2 2 0 01-2 2h-2"/><rect x="5" y="13" width="14" height="8" rx="1"/><path d="M5 9l2-4h10l2 4"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg> }
function ExitIcon()                { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
function WarnIcon()                { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> }
