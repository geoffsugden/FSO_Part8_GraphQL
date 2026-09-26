import { ALL_BOOKS } from '../queries'
import { useQuery } from '@apollo/client/react'
import { useState, useEffect } from 'react'

const Books = (props) => {
  const [genreFilter, setGenreFilter] = useState('')
  const { data, loading, refetch } = useQuery(ALL_BOOKS, {
    variables: { genre: genreFilter },
  })

  const favoriteGenre = props.currentUser?.data?.me?.favoriteGenre

  useEffect(() => {
    setGenreFilter(favoriteGenre)
  }, [favoriteGenre])

  const handleGenreChange = async (genre) => {
    console.log('3: genre clicked', genre)
    setGenreFilter(genre)
    const gResult = await refetch({ genre })
    console.log(
      '4: genre refetch returned',
      gResult.data.filteredBooks.map((book) => book.title),
    )
  }

  if (!props.show) {
    return null
  }
  if (loading) {
    return <div>loading...</div>
  }

  const books = data.filteredBooks

  const genres = new Set(data.allGenres.flatMap((book) => book.genres))

  const inGenre = genreFilter && !favoriteGenre
  const recommend = genreFilter && favoriteGenre

  return (
    <div>
      {!favoriteGenre && <h2>books</h2>}
      {inGenre && (
        <div>
          <div>
            in genre <strong>{genreFilter}</strong>
          </div>
        </div>
      )}
      {recommend && (
        <div>
          <h2>recommendations</h2>
          <div>
            books in your favorite genre <strong>{genreFilter}</strong>
          </div>
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
      {!props.currentUser && (
        <div>
          <h2>Genres</h2>
          <div>
            {[...genres].map((genre) => (
              <button key={genre} onClick={() => handleGenreChange(genre)}>
                {genre}
              </button>
            ))}
            <button onClick={() => handleGenreChange('')}>all genres</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Books
