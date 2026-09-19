const {
  ApolloServer,
} = require('../library-backend/node_modules/@apollo/server')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('../library-backend/node_modules/mongoose')

const typeDefs = require('../library-backend/schema')
const resolvers = require('../library-backend/resolvers')
const Author = require('../library-backend/models/author')
const Book = require('../library-backend/models/book')
const User = require('../library-backend/models/user')

process.env.JWT_SECRET = 'test-secret-key'

const initialAuthors = [
  { name: 'Robert Martin', born: 1952 },
  { name: 'Martin Fowler', born: 1963 },
  { name: 'Fyodor Dostoevsky', born: 1821 },
]

const initialBooks = [
  {
    title: 'Clean Code',
    published: 2008,
    authorName: 'Robert Martin',
    genres: ['refactoring'],
  },
  {
    title: 'Agile software development',
    published: 2002,
    authorName: 'Robert Martin',
    genres: ['agile', 'patterns', 'design'],
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    authorName: 'Martin Fowler',
    genres: ['refactoring'],
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    authorName: 'Joshua Kerievsky',
    genres: ['refactoring', 'patterns'],
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    authorName: 'Fyodor Dostoevsky',
    genres: ['classic', 'crime'],
  },
]

let mongoServer

const setupDatabase = async () => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)
}

const teardownDatabase = async () => {
  await mongoose.connection.close()
  if (mongoServer) {
    await mongoServer.stop()
  }
}

const seedDatabase = async () => {
  await Author.deleteMany({})
  await Book.deleteMany({})
  await User.deleteMany({})

  const authorDocs = {}
  for (const authorData of initialAuthors) {
    const author = new Author(authorData)
    await author.save()
    authorDocs[authorData.name] = author
  }

  for (const bookData of initialBooks) {
    let author = authorDocs[bookData.authorName]
    if (!author) {
      author = new Author({ name: bookData.authorName })
      await author.save()
      authorDocs[bookData.authorName] = author
    }

    const book = new Book({
      title: bookData.title,
      published: bookData.published,
      author: author._id,
      genres: bookData.genres,
    })
    await book.save()
  }
}

const createTestUser = async (
  username = 'testuser',
  favoriteGenre = 'refactoring',
) => {
  const user = new User({ username, favoriteGenre })
  await user.save()
  return user
}

const createServer = () => {
  return new ApolloServer({ typeDefs, resolvers })
}

module.exports = {
  initialAuthors,
  initialBooks,
  setupDatabase,
  teardownDatabase,
  seedDatabase,
  createTestUser,
  createServer,
  Author,
  Book,
  User,
}
