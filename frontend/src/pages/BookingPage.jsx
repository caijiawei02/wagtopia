import { useEffect, useState } from 'react'

const DEFAULT_FORM = {
  parent_id:  '',
  dog_id:     '',
  service_id: '',
  groomer_id: '',
  date:       '',
  time:       '',
}

export default function BookingPage() {
  const [parents,  setParents]  = useState([])
  const [dogs,     setDogs]     = useState([])
  const [services, setServices] = useState([])
  const [groomers, setGroomers] = useState([])

  const [form,        setForm]        = useState(DEFAULT_FORM)
  const [bookedSlots, setBookedSlots] = useState(new Set())
  const [loading,     setLoading]     = useState(false)
  const [success,     setSuccess]     = useState(null)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/parents').then((r) => r.json()),
      fetch('/api/services').then((r) => r.json()),
      fetch('/api/groomers').then((r) => r.json()),
    ]).then(([p, s, g]) => { setParents(p); setServices(s); setGroomers(g) })
  }, [])

  useEffect(() => {
    const { groomer_id, date } = form
    if (!groomer_id || !date) { setBookedSlots(new Set()); return }
    fetch(`/api/groomers/${groomer_id}/bookings`)
      .then((r) => r.json())
      .then((bookings) => {
        const taken = new Set(
          bookings
            .filter((b) => b.start_time.startsWith(date))
            .map((b) => b.start_time.slice(11, 16))
        )
        setBookedSlots(taken)
        setForm((prev) => ({ ...prev, time: taken.has(prev.time) ? '' : prev.time }))
      })
  }, [form.groomer_id, form.date])

  function handleChange(e) {
    const { name, value } = e.target
    setSuccess(null)
    setError(null)

    if (name === 'parent_id') {
      setForm((prev) => ({ ...prev, parent_id: value, dog_id: '' }))
      setDogs([])
      if (value) {
        fetch(`/api/parents/${value}/dogs`)
          .then((r) => r.json())
          .then(setDogs)
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const { parent_id, dog_id, service_id, groomer_id, date, time } = form
    if (!parent_id)  { setError('Please select a parent.'); return }
    if (!dog_id)     { setError('Please select a dog.'); return }
    if (!service_id) { setError('Please select a service.'); return }
    if (!groomer_id) { setError('Please select a groomer.'); return }
    if (!date)       { setError('Please select a date.'); return }
    if (!time)       { setError('Please select a time.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id:  Number(parent_id),
          dog_id:     Number(dog_id),
          service_id: Number(service_id),
          groomer_id: Number(groomer_id),
          start_time: `${date} ${time}`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Booking failed. Please try again.')
      } else {
        setSuccess(
          `Booked! ${data.start_time} – ${data.end_time.slice(11, 16)} · ${data.dog_name} · ${data.service_name} · ${data.groomer_name}`
        )
        setForm(DEFAULT_FORM)
        setDogs([])
      }
    } catch {
      setError('Network error. Please check the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">Book an Appointment</h2>

      {success && <div className="alert alert-success">{success}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <label className="form-label">
          Dog Parent
          <select name="parent_id" value={form.parent_id} onChange={handleChange} className="form-select">
            <option value="">— Select parent —</option>
            {parents.map((p) => (
              <option key={p.parent_id} value={p.parent_id}>{p.parent_name}</option>
            ))}
          </select>
        </label>

        <label className="form-label">
          Dog
          <select
            name="dog_id"
            value={form.dog_id}
            onChange={handleChange}
            className="form-select"
            disabled={!form.parent_id}
          >
            <option value="">— Select dog —</option>
            {dogs.map((d) => (
              <option key={d.dog_id} value={d.dog_id}>
                {d.dog_name}{d.breed ? ` (${d.breed})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="form-label">
          Service
          <select name="service_id" value={form.service_id} onChange={handleChange} className="form-select">
            <option value="">— Select service —</option>
            {services.map((s) => (
              <option key={s.service_id} value={s.service_id}>
                {s.service_name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-label">
          Groomer
          <select name="groomer_id" value={form.groomer_id} onChange={handleChange} className="form-select">
            <option value="">— Select groomer —</option>
            {groomers.map((g) => (
              <option key={g.groomer_id} value={g.groomer_id}>{g.groomer_name}</option>
            ))}
          </select>
        </label>

        <label className="form-label">
          Date
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="form-input"
            min={new Date().toISOString().split('T')[0]}
          />
        </label>

        <label className="form-label">
          Time
          <select name="time" value={form.time} onChange={handleChange} className="form-select">
            <option value="">— Select time —</option>
            {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map((t) => {
              const now = new Date()
              const isToday = form.date === now.toISOString().split('T')[0]
              const slotHour = parseInt(t, 10)
              if (isToday && slotHour <= now.getHours()) return null
              const unavailable = bookedSlots.has(t)
              return (
                <option key={t} value={t} disabled={unavailable}>
                  {t}{unavailable ? ' — Unavailable' : ''}
                </option>
              )
            })}
          </select>
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Booking…' : 'Book Appointment'}
        </button>
      </form>
    </div>
  )
}
