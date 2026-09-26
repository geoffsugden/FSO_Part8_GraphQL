import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import { CURRENT_USER } from './queries'

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(localStorage.getItem('library-user-token'))
  const curUser = useQuery(CURRENT_USER)

  const handleLogin = (token) => {
    setToken(token)
    setPage('authors')
  }
  const handleLogout = () => {
    localStorage.removeItem('library-user-token')
    setToken('')
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token && <button onClick={() => setPage('add')}>add book</button>}
        {token && <button onClick={() => setPage('recommend')}>recommend</button>}
        {!token && <button onClick={() => setPage('login')}>login</button>}
        {token && <button onClick={() => handleLogout()}>logout</button>}
      </div>

      <Authors show={page === 'authors'} token={token} />

      <Books show={page === 'books'} />

      <NewBook show={page === 'add'} />

      <Books show={page === 'recommend'} curUser={curUser} />

      <LoginForm show={page === 'login'} handleLogin={handleLogin} />
    </div>
  )
}

export default App
