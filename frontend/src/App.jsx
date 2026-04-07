import { useState } from 'react'
import BookingPage from './pages/BookingPage'
import GroomerPage from './pages/GroomerPage'
import './index.css'

const TABS = [
  { key: 'book',    label: 'Book Appointment' },
  { key: 'groomer', label: 'Groomer Schedule' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('book')

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-logo">Wagtopia</div>
      </header>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="page-content">
        {activeTab === 'book'    && <BookingPage />}
        {activeTab === 'groomer' && <GroomerPage />}
      </main>
    </div>
  )
}
