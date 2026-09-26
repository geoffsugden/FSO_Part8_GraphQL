import { ALL_BOOKS } from '../queries'
import { useQuery } from '@apollo/client/react'
import { useState, useEffect } from 'react'

const Books = (props) => {
  const [genreFilter, setGenreFilter] = useState('')
  const { data, loading, refetch } = useQuery(ALL_BOOKS, {
    variables: { genre: genreFilter },
  })

  const favoriteGenre = props.curUser?.data?.me?.favoriteGenre

  useEffect(() => {
    setGenreFilter(favoriteGenre)
  }, [favoriteGenre])

  const handleGenreChange = (genre) => {
    setGenreFilter(genre)
    refetch({ genre: genreFilter })
  }

  if (!props.show) {
    return null
  }
  if (loading) {
    return <div>loading...</div>
  }

  const books = data.filteredBooks

  const genres = new Set(data.allGenres.flatMap((book) => book.genres))

  const inGenre = genreFilter && !props.curUser
  const recommend = genreFilter && props.curUser

  return (
    <div>
      <h2>books</h2>

      {inGenre && (
        <div>
          in genre <strong>{genreFilter}</strong>
        </div>
      )}
      {recommend && (
        <div>
          books in your favorite genre <strong>{genreFilter}</strong>
        </div>
      )}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!props.curUser && (
        <div>
          <h2>Genres</h2>
          <button onClick={() => handleGenreChange('')}>show all</button>
          <div>
            {[...genres].map((genre) => (
              <button key={genre} onClick={() => handleGenreChange(genre)}>
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Books
