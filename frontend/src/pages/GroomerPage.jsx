import { useEffect, useState } from 'react'

function fmtTime(t) {
  return t ? t.slice(0, 16) : ''
}

export default function GroomerPage() {
  const [groomers,  setGroomers]  = useState([])
  const [groomerId, setGroomerId] = useState('')
  const [bookings,  setBookings]  = useState([])
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    fetch('/api/groomers').then((r) => r.json()).then(setGroomers)
  }, [])

  useEffect(() => {
    if (!groomerId) { setBookings([]); return }
    setLoading(true)
    fetch(`/api/groomers/${groomerId}/bookings`)
      .then((r) => r.json())
      .then((data) => { setBookings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [groomerId])

  const groomerName = groomers.find((g) => String(g.groomer_id) === groomerId)?.groomer_name

  return (
    <div className="card">
      <h2 className="card-title">Groomer Schedule</h2>

      <label className="form-label">
        Select Groomer
        <select
          value={groomerId}
          onChange={(e) => setGroomerId(e.target.value)}
          className="form-select"
        >
          <option value="">— Select groomer —</option>
          {groomers.map((g) => (
            <option key={g.groomer_id} value={g.groomer_id}>{g.groomer_name}</option>
          ))}
        </select>
      </label>

      {groomerId && (
        <div className="bookings-section">
          <h3 className="bookings-heading">
            {groomerName}'s Bookings
            <span className="badge">{bookings.length}</span>
          </h3>

          {loading && <p className="muted">Loading…</p>}

          {!loading && bookings.length === 0 && (
            <p className="muted">No bookings yet.</p>
          )}

          {!loading && bookings.map((b) => {
            const isPast = new Date(b.end_time) < new Date()
            return (
              <div key={b.booking_id} className={`booking-card${isPast ? ' booking-card--past' : ''}`}>
                <div className="booking-time">
                  {fmtTime(b.start_time)} – {fmtTime(b.end_time).slice(11)}
                </div>
                <div className="booking-detail">Parent: <strong>{b.parent_name}</strong></div>
                <div className="booking-detail">Dog: <strong>{b.dog_name}</strong></div>
                <div className="booking-detail">Service: <strong>{b.service_name}</strong></div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
