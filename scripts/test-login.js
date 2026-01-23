#!/usr/bin/env node
(async () => {
  try {
    const email = process.argv[2] || 'user@easier.com'
    const password = process.argv[3] || 'password123'

    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const text = await res.text()
    console.log('HTTP', res.status)
    try { console.log(JSON.parse(text)) } catch { console.log(text) }
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
})()
