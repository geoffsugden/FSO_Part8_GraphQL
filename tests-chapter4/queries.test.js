const { describe, test, before, after } = require('node:test')
const assert = require('node:assert')
const {
  setupDatabase,
  teardownDatabase,
  seedDatabase,
  createTestUser,
  createServer,
  initialBooks,
  initialAuthors,
} = require('./test_helper')

let server

before(async () => {
  await setupDatabase()
  await seedDatabase()
  server = createServer()
})

after(async () => {
  await teardownDatabase()
})

describe('bookCount', () => {
  test('returns correct number of books', async () => {
    const response = await server.executeOperation({
      query: '{ bookCount }',
    })

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.bookCount, initialBooks.length)
  })
})

describe('authorCount', () => {
  test('returns correct number of authors', async () => {
    const response = await server.executeOperation({
      query: '{ authorCount }',
    })

    // initialBooks includes 'Joshua Kerievsky' who is not in initialAuthors
    // but gets auto-created during seeding
    const uniqueAuthors = [...new Set(initialBooks.map((b) => b.authorName))]

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.authorCount, uniqueAuthors.length)
  })
})

describe('allBooks', () => {
  test('returns all books', async () => {
    const response = await server.executeOperation({
      query: `{
        allBooks {
          title
          published
          author { name }
          genres
          id
        }
      }`,
    })

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.allBooks.length, initialBooks.length)

    for (const book of result.data.allBooks) {
      assert.ok(book.title, 'book should have title')
      assert.ok(book.published, 'book should have published year')
      assert.ok(book.author, 'book should have author')
      assert.ok(book.author.name, 'book author should have name')
      assert.ok(book.id, 'book should have id')
      assert.ok(Array.isArray(book.genres), 'genres should be an array')
    }
  })

  test('filters books by genre', async () => {
    const response = await server.executeOperation({
      query: `query ($genre: String) {
        allBooks(genre: $genre) {
          title
          genres
        }
      }`,
      variables: { genre: 'refactoring' },
    })

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)

    const expectedBooks = initialBooks.filter((b) =>
      b.genres.includes('refactoring'),
    )
    assert.strictEqual(result.data.allBooks.length, expectedBooks.length)

    for (const book of result.data.allBooks) {
      assert.ok(
        book.genres.includes('refactoring'),
        `book "${book.title}" should have genre "refactoring"`,
      )
    }
  })

  test('returns empty array for non-existent genre', async () => {
    const response = await server.executeOperation({
      query: `query ($genre: String) {
        allBooks(genre: $genre) {
          title
        }
      }`,
      variables: { genre: 'nonexistentgenre' },
    })

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.allBooks.length, 0)
  })
})

describe('allAuthors', () => {
  test('returns all authors with correct fields', async () => {
    const response = await server.executeOperation({
      query: `{
        allAuthors {
          name
          born
          id
        }
      }`,
    })

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)

    const uniqueAuthors = [...new Set(initialBooks.map((b) => b.authorName))]
    assert.strictEqual(result.data.allAuthors.length, uniqueAuthors.length)

    for (const author of result.data.allAuthors) {
      assert.ok(author.name, 'author should have name')
      assert.ok(author.id, 'author should have id')
    }

    const robert = result.data.allAuthors.find(
      (a) => a.name === 'Robert Martin',
    )
    assert.strictEqual(robert.born, 1952)

    // Author created from book seed (Joshua Kerievsky) should have born: null
    const joshua = result.data.allAuthors.find(
      (a) => a.name === 'Joshua Kerievsky',
    )
    assert.strictEqual(joshua.born, null)
  })
})

describe('me', () => {
  test('returns null when not authenticated', async () => {
    const response = await server.executeOperation({
      query: '{ me { username favoriteGenre } }',
    })

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.me, null)
  })

  test('returns current user when authenticated', async () => {
    const testUser = await createTestUser('queryuser', 'classic')

    const response = await server.executeOperation(
      {
        query: '{ me { username favoriteGenre id } }',
      },
      {
        contextValue: { currentUser: testUser },
      },
    )

    const result = response.body.singleResult
    assert.strictEqual(result.errors, undefined)
    assert.strictEqual(result.data.me.username, 'queryuser')
    assert.strictEqual(result.data.me.favoriteGenre, 'classic')
    assert.ok(result.data.me.id)
  })
})
