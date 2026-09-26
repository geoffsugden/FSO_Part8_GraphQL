import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { LOGIN } from '../queries'

const LoginForm = (props) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginErrorMessage, setLoginErrorMessage] = useState('')

  const [login] = useMutation(LOGIN, {
    onCompleted: (data) => {
      const token = data.login.value
      localStorage.setItem('library-user-token', token)
      setUsername('')
      props.handleLogin(token)
    },
    onError: (error) => {
      console.log('Error in login', error.message)
      setLoginErrorMessage('login failed')
      setTimeout(() => setLoginErrorMessage(''), 5_000)
    },
  })

  if (!props.show) return null

  const loginHandler = (event) => {
    event.preventDefault()
    login({ variables: { username: username, password: password } })

    setPassword('')
  }

  return (
    <div>
      {loginErrorMessage && <div>{loginErrorMessage}</div>}
      <form onSubmit={loginHandler}>
        <div>
          <label htmlFor='username'>username</label>
          <input id='username' value={username} onChange={({ target }) => setUsername(target.value)} />
        </div>
        <div>
          <label htmlFor='password'>
            password
            <input
              id='password'
              value={password}
              type='password'
              onChange={({ target }) => setPassword(target.value)}
            />
          </label>
        </div>
        <button type='submit'>login</button>
      </form>
    </div>
  )
}
export default LoginForm
