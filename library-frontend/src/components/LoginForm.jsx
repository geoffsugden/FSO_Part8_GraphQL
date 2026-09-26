import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { LOGIN } from '../queries'

const LoginForm = (props) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [login] = useMutation(LOGIN, {
    onCompleted: (data) => {
      const token = data.login.value
      localStorage.setItem('library-user-token', token)
      setUsername('')
      props.handleLogin(token)
    },
    onError: (error) => {
      console.log('Error in login', error.message)
    },
  })

  if (!props.show) return null

  const loginHandler = (event) => {
    event.preventDefault()
    login({ variables: { username: username, password: password } })

    setPassword('')
  }

  return (
    <form onSubmit={loginHandler}>
      <div>
        name
        <input value={username} onChange={({ target }) => setUsername(target.value)} />
      </div>
      <div>
        password
        <input value={password} type='password' onChange={({ target }) => setPassword(target.value)} />
      </div>
      <button type='submit'>login</button>
    </form>
  )
}
export default LoginForm
