require('dotenv').config()

const connectToDatabase = require('./db')
const startServer = require('./server')

const username = encodeURIComponent(process.env.MONGO_USERNAME)
const password = encodeURIComponent(process.env.MONGO_PASSWORD)
const database =
  process.env.NODE_ENV === 'test'
    ? process.env.MONGO_DATABASE_TEST
    : process.env.MONGO_DATABASE

const params = new URLSearchParams({
  ssl: 'true',
  replicaSet: process.env.MONGO_REPLICA_SET,
  authSource: process.env.MONGO_AUTH_SOURCE,
  appName: process.env.MONGO_APP_NAME,
})

const mongoUri =
  `mongodb://${username}:${password}` +
  `@${process.env.MONGO_HOSTS}` +
  `/${database}` +
  `?${params}`

const PORT = process.env.PORT || 4000

const main = async () => {
  await connectToDatabase(mongoUri)
  startServer(PORT)
}

main()
