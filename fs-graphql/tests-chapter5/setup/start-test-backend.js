const { spawn } = require('child_process')
const path = require('path')
const { MongoMemoryServer } = require('mongodb-memory-server')

const start = async () => {
  const mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()

  const backendDir = path.resolve(__dirname, '../../library-backend')

  const serverProcess = spawn('node', ['index.js'], {
    cwd: backendDir,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MONGODB_URI: uri,
      JWT_SECRET: 'test-secret-key',
      PORT: '4000',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString()
    process.stdout.write(output)
  })

  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(data.toString())
  })

  process.on('SIGTERM', () => {
    serverProcess.kill()
    mongoServer.stop()
  })

  process.on('SIGINT', () => {
    serverProcess.kill()
    mongoServer.stop()
  })
}

start()
