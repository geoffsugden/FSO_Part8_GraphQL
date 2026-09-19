const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const jwt = require('jsonwebtoken')

const resolvers = require('./resolvers')
const typeDefs = require('./schema')
const User = require('./models/user')

getUserFromAuthHeader = async (auth) => {
  const bearerPrefix = 'Bearer '
  if (!auth || !auth.startsWith(bearerPrefix)) {
    return null
  }

  const decodedToken = jwt.verify(
    auth.substring(bearerPrefix.length),
    process.env.JWT_SECRET,
  )

  const user = await User.findById(decodedToken.id)
  return user
}
const startServer = (port) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })

  startStandaloneServer(server, {
    listen: { port },
    context: async ({ req }) => {
      const auth = req.headers.authorization
      const currentUser = await getUserFromAuthHeader(auth)
      return { currentUser }
    },
  }).then(({ url }) => {
    console.log(`Server ready`)
  })
}
module.exports = startServer
