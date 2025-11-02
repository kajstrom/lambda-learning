import { useState, useEffect } from 'react'
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google'
import './App.css'

interface DecodedCredential {
  email: string
  name: string
  picture: string
  sub: string
}

function AppContent() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<DecodedCredential | null>(null)
  const [jwtToken, setJwtToken] = useState<string | null>(null)

  // Decode JWT token to get user info
  const decodeJwtResponse = (token: string): DecodedCredential => {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  }

  // Fetch data from API after user is authenticated
  useEffect(() => {
    if (!user || !jwtToken) {
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    setLoading(true)
    
    fetch(`${apiUrl}/`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setMessage(data.message)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [user, jwtToken])

  // Handle sign out
  const handleSignOut = () => {
    googleLogout()
    setUser(null)
    setJwtToken(null)
    setMessage('')
  }

  return (
    <div className="App">
      <h1>React + FastAPI on AWS via Github Actions</h1>
      
      <div style={{ marginTop: '2rem' }}>
        {user ? (
          <div>
            <h2>Welcome, {user.name}!</h2>
            <img src={user.picture} alt={user.name} style={{ borderRadius: '50%', width: '100px' }} />
            <p>Email: {user.email}</p>
            
            <div style={{ marginTop: '1rem' }}>
              <h3>API Response:</h3>
              {loading ? <p>Loading...</p> : <p>{message}</p>}
            </div>
            
            <button onClick={handleSignOut}>Sign Out</button>
          </div>
        ) : (
          <div>
            <h2>Please sign in</h2>
            <p>You must authenticate before accessing the API</p>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  const userObject = decodeJwtResponse(credentialResponse.credential)
                  setUser(userObject)
                  setJwtToken(credentialResponse.credential)
                  console.log('Logged in user:', userObject)
                }
              }}
              onError={() => {
                console.log('Login Failed')
              }}
              theme="outline"
              size="large"
              text="signin_with"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AppContent />
    </GoogleOAuthProvider>
  )
}

export default App