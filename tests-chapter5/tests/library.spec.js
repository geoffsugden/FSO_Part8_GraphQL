const { test, expect, describe, beforeEach } = require('@playwright/test')
const { loginWith, createBook, seedDatabase } = require('./helper')

describe('Library app', () => {
  beforeEach(async ({ page, request }) => {
    await seedDatabase(request)
    await page.goto('/')
  })

  test('front page shows authors by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'authors' })).toBeVisible()
    await expect(page.getByText('Robert Martin')).toBeVisible()
    await expect(page.getByText('Martin Fowler')).toBeVisible()
    await expect(page.getByText('Fyodor Dostoevsky')).toBeVisible()
  })

  test('books page shows all books', async ({ page }) => {
    await page.getByRole('button', { name: 'books' }).click()
    await expect(page.getByRole('heading', { name: 'books' })).toBeVisible()
    await expect(page.getByText('Clean Code')).toBeVisible()
    await expect(page.getByText('Crime and punishment')).toBeVisible()
    await expect(page.getByText('Refactoring, edition 2')).toBeVisible()
  })

  describe('Login', () => {
    test('login button is shown when not logged in', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'login' })).toBeVisible()
    })

    test('add book button is not shown when not logged in', async ({
      page,
    }) => {
      await expect(
        page.getByRole('button', { name: 'add book' }),
      ).not.toBeVisible()
    })

    test('recommend button is not shown when not logged in', async ({
      page,
    }) => {
      await expect(
        page.getByRole('button', { name: 'recommend' }),
      ).not.toBeVisible()
    })

    test('logout button is not shown when not logged in', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: 'logout' }),
      ).not.toBeVisible()
    })

    test('set birthyear form is not shown when not logged in', async ({
      page,
    }) => {
      await expect(
        page.getByRole('heading', { name: /set birth ?year/i }),
      ).not.toBeVisible()
    })

    test('login succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'testuser', 'secret')

      await expect(page.getByRole('button', { name: 'add book' })).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'recommend' }),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'logout' })).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'login' }),
      ).not.toBeVisible()
    })

    test('login fails with wrong password', async ({ page }) => {
      await loginWith(page, 'testuser', 'wrong')

      await expect(page.getByText(/login failed/i)).toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'testuser', 'secret')
      await expect(page.getByRole('button', { name: 'logout' })).toBeVisible()
    })

    test('a new book can be added', async ({ page }) => {
      await createBook(page, {
        title: 'Test Book',
        author: 'Test Author',
        published: 2024,
        genres: ['test'],
      })

      await page.getByRole('button', { name: 'books' }).click()
      await expect(page.getByText('Test Book')).toBeVisible()
      await expect(page.getByText('Test Author')).toBeVisible()
    })

    test('author birth year can be updated', async ({ page }) => {
      await page.getByRole('button', { name: 'authors' }).click()
      await expect(
        page.getByRole('heading', { name: 'Set birthyear' }),
      ).toBeVisible()

      await page.locator('select[name="name"]').selectOption('Martin Fowler')
      await page.getByLabel('born').fill('1965')
      await page.getByRole('button', { name: 'update author' }).click()

      const fowlerRow = page.locator('tr', { hasText: 'Martin Fowler' })
      await expect(fowlerRow.getByText('1965')).toBeVisible()
    })

    describe('Genre filtering', () => {
      test('genre filter buttons are shown', async ({ page }) => {
        await page.getByRole('button', { name: 'books' }).click()

        await expect(
          page.getByRole('button', { name: 'refactoring' }),
        ).toBeVisible()
        await expect(
          page.getByRole('button', { name: 'classic' }),
        ).toBeVisible()
        await expect(
          page.getByRole('button', { name: 'all genres' }),
        ).toBeVisible()
      })

      test('filtering by genre works', async ({ page }) => {
        await page.getByRole('button', { name: 'books' }).click()
        await page.getByRole('button', { name: 'refactoring' }).click()

        await expect(page.getByText('in genre')).toBeVisible()
        await expect(page.getByText('Clean Code')).toBeVisible()
        await expect(page.getByText('Refactoring, edition 2')).toBeVisible()
        await expect(page.getByText('Refactoring to patterns')).toBeVisible()
        await expect(page.getByText('Crime and punishment')).not.toBeVisible()
      })

      test('all genres button shows all books', async ({ page }) => {
        await page.getByRole('button', { name: 'books' }).click()
        await page.getByRole('button', { name: 'refactoring' }).click()
        await expect(page.getByText('Crime and punishment')).not.toBeVisible()

        await page.getByRole('button', { name: 'all genres' }).click()
        await expect(page.getByText('Crime and punishment')).toBeVisible()
        await expect(page.getByText('Clean Code')).toBeVisible()
      })
    })

    test('recommendations shows books in favorite genre', async ({ page }) => {
      await page.getByRole('button', { name: 'recommend' }).click()

      await expect(
        page.getByRole('heading', { name: 'recommendations' }),
      ).toBeVisible()
      await expect(page.getByText('books in your favorite genre')).toBeVisible()
      await expect(page.getByText('refactoring', { exact: true })).toBeVisible()
      await expect(page.getByText('Clean Code')).toBeVisible()
      await expect(page.getByText('Crime and punishment')).not.toBeVisible()
    })

    test('new book appears in genre filtered view', async ({ page }) => {
      await createBook(page, {
        title: 'Classic Test Book',
        author: 'Classic Author',
        published: 2024,
        genres: ['classic'],
      })

      await page.getByRole('button', { name: 'books' }).click()
      await page.getByRole('button', { name: 'classic' }).click()

      await expect(page.getByText('Classic Test Book')).toBeVisible()
      await expect(page.getByText('Crime and punishment')).toBeVisible()
    })
  })
})
