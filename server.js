const express = require('express')

const app = express()
app.use(express.json({ limit: '2kb' }))

const events = []

app.get('/', (req, res) => {
  res.json({
    project: 'Cyber Lab',
    status: 'online',
  })
})

app.post('/api/heartbeat', (req, res) => {
  const { lab_id, version } = req.body ?? {}

  if (
    typeof lab_id !== 'string' ||
    lab_id.length < 1 ||
    lab_id.length > 64 ||
    typeof version !== 'string' ||
    version.length > 32
  ) {
    return res.status(400).json({
      error: 'Dados de laboratório inválidos',
    })
  }

  const event = {
    lab_id,
    version,
    received_at: new Date().toISOString(),
  }

  events.push(event)

  console.log('Evento recebido:', event)

  res.status(200).json({
    status: 'ok',
    message: 'Evento de laboratório recebido',
  })
})

app.get('/api/events', (req, res) => {
  res.json(events)
})

const PORT = process.env.PORT || 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cyber Lab disponível na porta ${PORT}`)
})
