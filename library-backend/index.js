require('dotenv').config()

const connectToDatabase = require('./db')
const startServer = require('./server')

const mongoUri = process.env.MONGODB_URI

const PORT = process.env.PORT || 4000

const main = async () => {
  await connectToDatabase(mongoUri)
  startServer(PORT)
}

main()
