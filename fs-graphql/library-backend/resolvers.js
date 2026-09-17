const { GraphQLError } = require('graphql')
const Book = require('./models/Book')
const Author = require('./models/Author')
const { BOOK_TITLE_MIN_LENGTH, AUTHOR_NAME_MIN_LENGTH } = require('./constants')

let authors = [
  {
    name: 'Robert Martin',
    id: 'afa51ab0-344d-11e9-a414-719c6709cf3e',
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: 'afa5b6f0-344d-11e9-a414-719c6709cf3e',
    born: 1963,
  },
  {
    name: 'Fyodor Dostoevsky',
    id: 'afa5b6f1-344d-11e9-a414-719c6709cf3e',
    born: 1821,
  },
  {
    name: 'Joshua Kerievsky', // birthyear not known
    id: 'afa5b6f2-344d-11e9-a414-719c6709cf3e',
  },
  {
    name: 'Sandi Metz', // birthyear not known
    id: 'afa5b6f3-344d-11e9-a414-719c6709cf3e',
  },
]

/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
 *
 * Spanish:
 * Podría tener más sentido asociar un libro con su autor almacenando la id del autor en el contexto del libro en lugar del nombre del autor
 * Sin embargo, por simplicidad, almacenaremos el nombre del autor en conexión con el libro
 */

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: 'afa5b6f4-344d-11e9-a414-719c6709cf3e',
    genres: ['refactoring'],
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: 'afa5b6f5-344d-11e9-a414-719c6709cf3e',
    genres: ['agile', 'patterns', 'design'],
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: 'afa5de00-344d-11e9-a414-719c6709cf3e',
    genres: ['refactoring'],
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: 'afa5de01-344d-11e9-a414-719c6709cf3e',
    genres: ['refactoring', 'patterns'],
  },
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: 'afa5de02-344d-11e9-a414-719c6709cf3e',
    genres: ['refactoring', 'design'],
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: 'afa5de03-344d-11e9-a414-719c6709cf3e',
    genres: ['classic', 'crime'],
  },
  {
    title: 'Demons',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: 'afa5de04-344d-11e9-a414-719c6709cf3e',
    genres: ['classic', 'revolution'],
  },
]

const resolvers = {
  Query: {
    bookCount: async () => await Book.collection.countDocuments(),
    authorCount: async () => await Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      const filter = {}
      if (args.genre) {
        filter.genres = args.genre
      }

      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        if (!author) {
          return []
        }
        filter.author = author._id
      }

      return await Book.find(filter).populate('author')
    },
    allAuthors: async () => await Author.find({}),
  },
  Author: {
    bookCount: async (root) => {
      return await Book.countDocuments({ author: root._id })
    },
  },
  Mutation: {
    addBook: async (root, args) => {
      if (
        args.title.length < BOOK_TITLE_MIN_LENGTH ||
        args.author.length < AUTHOR_NAME_MIN_LENGTH
      ) {
        const validationErrors = { messages: [], invalidArgs: [] }
        if (args.title.length < BOOK_TITLE_MIN_LENGTH) {
          validationErrors.messages.push(
            `Title must be ${BOOK_TITLE_MIN_LENGTH} characters or longer: '${args.title}'`,
          )
          validationErrors.invalidArgs.push(args.title)
        }
        if (args.author.length < AUTHOR_NAME_MIN_LENGTH) {
          validationErrors.messages.push(
            `Author name must be ${AUTHOR_NAME_MIN_LENGTH} characters or longer: '${args.author}'`,
          )
          validationErrors.invalidArgs.push(args.author)
        }

        throw new GraphQLError(validationErrors.messages, {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: validationErrors.invalidArgs,
          },
        })
      }
      try {
        let author = await Author.findOne({ name: args.author })
        if (!author) {
          author = new Author({ name: args.author })
          author = await author.save()
        }
        const book = new Book({ ...args, author: author })
        return await book.save()
      } catch (error) {
        if (error.code === 11000) {
          throw new GraphQLError(`Book title must be unique: '${args.title}'`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.title,
            },
          })
        }
        throw error
      }
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({ name: args.name })
      if (!author) {
        return null
      }
      author.born = args.setBornTo

      return await author.save()
    },
  },
}
module.exports = resolvers
