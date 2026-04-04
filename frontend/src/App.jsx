import { useEffect, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [status, setStatus] = useState('Checking API...')

  useEffect(() => {
    async function checkApi() {
      try {
        const response = await fetch(`${apiBase}/api/health`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        setStatus(`API status: ${data.status}`)
      } catch (error) {
        setStatus(`API status: unavailable (${error.message})`)
      }
    }

    checkApi()
  }, [])

  return (
    <main className="app">
      <h1>Wagtopia</h1>
      <p>React + FastAPI starter is running.</p>
      <p className="status">{status}</p>
    </main>
  )
}

export default App
