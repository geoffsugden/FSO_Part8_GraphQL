import { useState } from 'react'
import { ADD_BOOK, ALL_AUTHORS, ALL_BOOKS } from '../queries'
import { useMutation } from '@apollo/client/react'

const NewBook = (props) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [published, setPublished] = useState('')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])

  const [addBook, { loading }] = useMutation(ADD_BOOK, {
    refetchQueries: [{ query: ALL_AUTHORS }, { query: ALL_BOOKS }],
  })

  if (!props.show) {
    return null
  }

  if (loading) {
    props.onCreatingBookChange(true)
  }

  const submit = async (event) => {
    event.preventDefault()

    try {
      await addBook({ variables: { title, author, published: parseInt(published, 10), genres } })
    } finally {
      props.onCreatingBookChange(false)
    }

    setTitle('')
    setPublished('')
    setAuthor('')
    setGenres([])
    setGenre('')
  }

  const addGenre = () => {
    setGenres(genres.concat(genre))
    setGenre('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          <label>
            title
            <input value={title} onChange={({ target }) => setTitle(target.value)} />
          </label>
        </div>
        <div>
          <label>
            author
            <input value={author} onChange={({ target }) => setAuthor(target.value)} />
          </label>
        </div>
        <div>
          <label>
            published
            <input type='number' value={published} onChange={({ target }) => setPublished(target.value)} />
          </label>
        </div>
        <div>
          <label>
            <input value={genre} onChange={({ target }) => setGenre(target.value)} />
            <button onClick={addGenre} type='button'>
              add genre
            </button>
          </label>
        </div>
        <div>genres: {genres.join(' ')}</div>
        <button type='submit'>create book</button>
      </form>
    </div>
  )
}

export default NewBook
