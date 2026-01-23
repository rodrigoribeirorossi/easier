async function run() {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@easier.com', password: 'password123' }),
  })
  const loginData = await loginRes.json()
  console.log('Login status', loginRes.status)
  console.log('Login body', loginData)
  const token = loginData.token
  if (!token) return

  const headers = { Authorization: `Bearer ${token}` }
  const acc = await fetch('http://localhost:3001/api/accounts', { headers })
  console.log('/api/accounts', acc.status, await acc.text())

  const tx = await fetch('http://localhost:3001/api/transactions', { headers })
  console.log('/api/transactions', tx.status, await tx.text())
}

run().catch(e=>{ console.error(e); process.exit(1) })
