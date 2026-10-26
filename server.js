const express = require('express')
const rateLimit = require('express-rate-limit')
const crypto = require('node:crypto')
const path = require('node:path')

const app = express()
app.use(express.json({ limit: '2kb' }))

const events = []

app.use(express.static(path.join(__dirname, 'public')))

app.set('trust proxy', 1)

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

function tokenValido(tokenRecebido, tokenEsperado) {
  if (!tokenEsperado || !tokenRecebido) {
    return false
  }

  const recebido = Buffer.from(tokenRecebido)
  const esperado = Buffer.from(tokenEsperado)

  return (
    recebido.length === esperado.length &&
    crypto.timingSafeEqual(recebido, esperado)
  )
}

function exigirToken(nomeVariavel) {
  return (req, res, next) => {
    const authorization = req.get('authorization') || ''
    const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]

    if (!tokenValido(token, process.env[nomeVariavel])) {
      return res.status(401).json({
        error: 'Não autorizado',
      })
    }

    next()
  }
}

app.get('/', (req, res) => {
  res.json({
    project: 'Cyber Lab',
    status: 'online',
  })
})

app.post('/api/heartbeat', exigirToken('LAB_API_TOKEN'), (req, res) => {
  const { lab_id, version, nome } = req.body ?? {}

  if (
    typeof lab_id !== 'string' ||
    lab_id.length < 1 ||
    lab_id.length > 64 ||
    typeof version !== 'string' ||
    version.length < 1 ||
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
  console.log('Evento de laboratório recebido:', event)

  res.status(200).json({
    status: 'ok',
    message: 'Evento de laboratório recebido',
    nome: nome,
  })
})

app.get('/api/events', exigirToken('ADMIN_API_TOKEN'), (req, res) => {
  res.json(events)
})

const PORT = process.env.PORT || 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cyber Lab disponível na porta ${PORT}`)
})
