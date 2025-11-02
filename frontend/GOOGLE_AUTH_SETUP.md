# Google Authentication Setup

This application uses the `@react-oauth/google` npm package for frontend authentication and validates the JWT token on the backend using `google-auth` library.

## Setup Instructions

### 1. Get Google OAuth Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" → "OAuth client ID"
6. Select "Web application"
7. Add authorized JavaScript origins:
   - `http://localhost:5173` (for local development)
   - Your production domain
8. Copy the Client ID

### 2. Configure Environment Variables

#### Frontend

Create a `.env` file in the `frontend` directory:

```bash
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
```

#### Backend

Create a `.env` file in the `backend` directory:

```bash
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
```

**Important:** Use the same Google Client ID for both frontend and backend.

Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Google OAuth Client ID.

### 3. Install Dependencies and Run

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
pip install -r requirements.txt
# Set environment variable for local testing
$env:GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com"  # PowerShell
# or
export GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com"  # Bash

uvicorn main:app --reload
```

The `@react-oauth/google` package is already included in the frontend dependencies.
The `google-auth` package is included in the backend requirements.

## Features

- **Google Sign-In Button**: Users can sign in with their Google account
- **Protected Backend API**: All API endpoints require valid Google authentication
- **JWT Token Verification**: Backend validates the JWT token from Google
- **User Profile Display**: Shows user's name, email, and profile picture after login
- **Sign Out**: Users can sign out and clear their session
- **Authorization Header**: JWT token is automatically sent with all API requests

## How It Works

### Frontend
1. The `@react-oauth/google` package provides React components for Google authentication
2. The app is wrapped in `<GoogleOAuthProvider>` with your client ID
3. The `<GoogleLogin>` component renders a sign-in button
4. Upon successful authentication, Google returns a JWT credential
5. The JWT token is stored and included in the `Authorization: Bearer <token>` header for all API calls
6. User information is decoded from the JWT and displayed in the UI

### Backend
1. All protected endpoints use FastAPI's `Depends` to verify authentication
2. The `verify_google_token` function extracts the JWT from the Authorization header
3. The token is validated using Google's `id_token.verify_oauth2_token()` function
4. If valid, user information is extracted and passed to the endpoint
5. If invalid or missing, a 401 Unauthorized error is returned

### Authentication Flow
```
User → Google Sign-In → JWT Token → Frontend (stores token)
                                    ↓
Frontend → API Request with Authorization: Bearer <token>
                                    ↓
Backend → Verify token with Google → Extract user info → Return response
```

## Security Notes

- The JWT token is sent in the Authorization header for every API request
- The backend validates the JWT token with Google's servers on each request
- Never trust client-side JWT decoding for authorization - always validate on the backend
- The backend verifies the token's signature, expiration, and audience (client ID)
- User information extracted from the validated token can be trusted
- For production, ensure HTTPS is used to protect the JWT token in transit
- Set the `GOOGLE_CLIENT_ID` environment variable securely (use AWS Secrets Manager, etc.)
