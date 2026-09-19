const { describe, test, before, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const {
  setupDatabase,
  teardownDatabase,
  seedDatabase,
  createTestUser,
  createServer,
  initialBooks,
  Author,
  Book,
  User,
} = require('./test_helper')

let server

before(async () => {
  await setupDatabase()
  server = createServer()
})

beforeEach(async () => {
  await seedDatabase()
})

after(async () => {
  await teardownDatabase()
})

// --- createUser ---

describe('createUser', () => {
  const CREATE_USER = `
    mutation ($username: String!, $favoriteGenre: String!) {
      createUser(username: $username, favoriteGenre: $favoriteGenre) {
        username
        favoriteGenre
        id
      }
    }
  `

  test('succeeds with valid data', async () => {
    const response = await server.executeOperation({
      query: CREATE_USER,
      variables: { username: 'newuser', favoriteGenre: 'classic' },
    })

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.createUser.username, 'newuser')
    assert.strictEqual(result.data.createUser.favoriteGenre, 'classic')
    assert.ok(result.data.createUser.id)
  })

  test('fails with too short username', async () => {
    const response = await server.executeOperation({
      query: CREATE_USER,
      variables: { username: 'ab', favoriteGenre: 'classic' },
    })

    const result = response.body.singleResult
    assert.ok(result.errors, 'should have errors')
    assert.ok(result.errors.length > 0)
  })
})

// --- login ---

describe('login', () => {
  const LOGIN = `
    mutation ($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        value
      }
    }
  `

  test('returns token with correct credentials', async () => {
    await createTestUser('loginuser', 'crime')

    const response = await server.executeOperation({
      query: LOGIN,
      variables: { username: 'loginuser', password: 'secret' },
    })

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.ok(result.data.login.value, 'should return a token')
    assert.strictEqual(typeof result.data.login.value, 'string')
  })

  test('fails with wrong password', async () => {
    await createTestUser('loginuser2', 'crime')

    const response = await server.executeOperation({
      query: LOGIN,
      variables: { username: 'loginuser2', password: 'wrongpassword' },
    })

    const result = response.body.singleResult
    assert.ok(result.errors, 'should have errors')
  })

  test('fails with non-existent user', async () => {
    const response = await server.executeOperation({
      query: LOGIN,
      variables: { username: 'nonexistent', password: 'secret' },
    })

    const result = response.body.singleResult
    assert.ok(result.errors, 'should have errors')
  })
})

// --- addBook ---

describe('addBook', () => {
  const ADD_BOOK = `
    mutation ($title: String!, $author: String!, $published: Int!, $genres: [String!]!) {
      addBook(title: $title, author: $author, published: $published, genres: $genres) {
        title
        published
        author { name }
        genres
        id
      }
    }
  `

  test('succeeds when authenticated', async () => {
    const testUser = await createTestUser('bookadder', 'refactoring')

    const response = await server.executeOperation(
      {
        query: ADD_BOOK,
        variables: {
          title: 'New Test Book',
          author: 'Robert Martin',
          published: 2020,
          genres: ['testing'],
        },
      },
      { contextValue: { currentUser: testUser } },
    )

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.addBook.title, 'New Test Book')
    assert.strictEqual(result.data.addBook.author.name, 'Robert Martin')
    assert.strictEqual(result.data.addBook.published, 2020)
    assert.deepStrictEqual(result.data.addBook.genres, ['testing'])
    assert.ok(result.data.addBook.id)

    const booksInDb = await Book.countDocuments()
    assert.strictEqual(booksInDb, initialBooks.length + 1)
  })

  test('auto-creates new author if not found', async () => {
    const testUser = await createTestUser('bookadder2', 'refactoring')

    const authorsBefore = await Author.countDocuments()

    const response = await server.executeOperation(
      {
        query: ADD_BOOK,
        variables: {
          title: 'Brand New Book',
          author: 'Completely New Author',
          published: 2023,
          genres: ['new'],
        },
      },
      { contextValue: { currentUser: testUser } },
    )

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.addBook.author.name, 'Completely New Author')

    const authorsAfter = await Author.countDocuments()
    assert.strictEqual(authorsAfter, authorsBefore + 1)

    const newAuthor = await Author.findOne({ name: 'Completely New Author' })
    assert.ok(newAuthor, 'new author should exist in database')
  })

  test('uses existing author without creating duplicate', async () => {
    const testUser = await createTestUser('bookadder3', 'refactoring')

    const authorsBefore = await Author.countDocuments()

    const response = await server.executeOperation(
      {
        query: ADD_BOOK,
        variables: {
          title: 'Another Martin Book',
          author: 'Robert Martin',
          published: 2021,
          genres: ['design'],
        },
      },
      { contextValue: { currentUser: testUser } },
    )

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.addBook.author.name, 'Robert Martin')

    const authorsAfter = await Author.countDocuments()
    assert.strictEqual(authorsAfter, authorsBefore)
  })

  test('fails without authentication', async () => {
    const response = await server.executeOperation({
      query: ADD_BOOK,
      variables: {
        title: 'Unauthorized Book',
        author: 'Some Author',
        published: 2020,
        genres: ['test'],
      },
    })

    const result = response.body.singleResult
    assert.ok(result.errors, 'should have errors')

    const errorMessages = result.errors.map((e) => e.message.toLowerCase())
    assert.ok(
      errorMessages.some(
        (msg) =>
          msg.includes('not authenticated') || msg.includes('authentication'),
      ),
      `expected "not authenticated" error, got: ${errorMessages.join(', ')}`,
    )

    const booksInDb = await Book.countDocuments()
    assert.strictEqual(booksInDb, initialBooks.length)
  })

  test('fails with too short title', async () => {
    const testUser = await createTestUser('bookadder4', 'refactoring')

    const response = await server.executeOperation(
      {
        query: ADD_BOOK,
        variables: {
          title: 'Ab',
          author: 'Robert Martin',
          published: 2020,
          genres: ['test'],
        },
      },
      { contextValue: { currentUser: testUser } },
    )

    const result = response.body.singleResult
    assert.ok(result.errors, 'should have errors for too short title')
  })

  test('fails with duplicate title', async () => {
    const testUser = await createTestUser('bookadder5', 'refactoring')

    const response = await server.executeOperation(
      {
        query: ADD_BOOK,
        variables: {
          title: 'Clean Code',
          author: 'Robert Martin',
          published: 2020,
          genres: ['test'],
        },
      },
      { contextValue: { currentUser: testUser } },
    )

    const result = response.body.singleResult
    assert.ok(result.errors, 'should have errors for duplicate title')
  })

  test('fails with too short author name', async () => {
    const testUser = await createTestUser('bookadder6', 'refactoring')

    const response = await server.executeOperation(
      {
        query: ADD_BOOK,
        variables: {
          title: 'Valid Title Here',
          author: 'Ab',
          published: 2020,
          genres: ['test'],
        },
      },
      { contextValue: { currentUser: testUser } },
    )

    const result = response.body.singleResult
    assert.ok(result.errors, 'should have errors for too short author name')
  })
})

// --- editAuthor ---

describe('editAuthor', () => {
  const EDIT_AUTHOR = `
    mutation ($name: String!, $setBornTo: Int!) {
      editAuthor(name: $name, setBornTo: $setBornTo) {
        name
        born
        id
      }
    }
  `

  test('succeeds when authenticated', async () => {
    const testUser = await createTestUser('editor', 'refactoring')

    const response = await server.executeOperation(
      {
        query: EDIT_AUTHOR,
        variables: { name: 'Martin Fowler', setBornTo: 1965 },
      },
      { contextValue: { currentUser: testUser } },
    )

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.editAuthor.name, 'Martin Fowler')
    assert.strictEqual(result.data.editAuthor.born, 1965)
    assert.ok(result.data.editAuthor.id)

    const authorInDb = await Author.findOne({ name: 'Martin Fowler' })
    assert.strictEqual(authorInDb.born, 1965)
  })

  test('fails without authentication', async () => {
    const response = await server.executeOperation({
      query: EDIT_AUTHOR,
      variables: { name: 'Martin Fowler', setBornTo: 1965 },
    })

    const result = response.body.singleResult
    assert.ok(result.errors, 'should have errors')

    const errorMessages = result.errors.map((e) => e.message.toLowerCase())
    assert.ok(
      errorMessages.some(
        (msg) =>
          msg.includes('not authenticated') || msg.includes('authentication'),
      ),
      `expected "not authenticated" error, got: ${errorMessages.join(', ')}`,
    )
  })

  test('returns null for non-existent author', async () => {
    const testUser = await createTestUser('editor2', 'refactoring')

    const response = await server.executeOperation(
      {
        query: EDIT_AUTHOR,
        variables: { name: 'Non Existent Author', setBornTo: 2000 },
      },
      { contextValue: { currentUser: testUser } },
    )

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.editAuthor, null)
  })
})
