# Google OAuth Setup Guide

## Issues Fixed

✅ **Invalid Button Width Error** - Removed `width="100%"` prop (Google button only accepts numeric values)
✅ **Missing Client ID Error** - Added validation and fallback UI
✅ **Client ID Not Found** - Added proper configuration instructions

## Setup Instructions

### Step 1: Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (if you don't have one)
3. Enable the "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (Vite dev server)
   - `http://localhost:3000` (if using different port)
   - Your production domain (when deployed)
7. Add authorized redirect URIs:
   - `http://localhost:5173/` (Vite dev)
   - Your production URL
8. Copy your **Client ID** (looks like: `xxx.apps.googleusercontent.com`)

### Step 2: Configure Frontend

1. Open `frontend/.env.local`
2. Replace `your-google-client-id-here` with your actual Client ID:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

**Note:** Make sure `.env.local` is in `.gitignore` to avoid committing secrets!

### Step 3: Configure Backend

1. Open `backend/.env`
2. Add your Google Client ID:

```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

### Step 4: Restart Development Servers

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Testing Google OAuth

### Before Configuration
You'll see a warning box:
```
⚠️ Google Sign-In not configured. 
   Please add VITE_GOOGLE_CLIENT_ID to .env.local
```

### After Configuration
1. Go to Login or Register page
2. Click "Continue with Google" button
3. Select your Google account
4. You should be logged in automatically

## Common Errors

### Error: "The given client ID is not found"
- **Cause:** Missing or invalid `VITE_GOOGLE_CLIENT_ID` in `.env.local`
- **Fix:** Check that Client ID is correctly copied without spaces

### Error: "Provided button width is invalid: 100%"
- **Cause:** Google button doesn't accept percentage widths
- **Fix:** Already fixed in the code - button is now properly centered

### Error: "ERR_INTERNET_DISCONNECTED"
- **Cause:** Network issue or Google API not accessible
- **Fix:** Check internet connection, ensure Google Cloud API is enabled

### Button not showing
- **Cause:** Client ID not configured
- **Fix:** Check `.env.local` file and ensure it's not using placeholder value

## Environment Variables Reference

| Variable | Where | Value |
|----------|-------|-------|
| `VITE_GOOGLE_CLIENT_ID` | `frontend/.env.local` | Your Google Client ID |
| `GOOGLE_CLIENT_ID` | `backend/.env` | Same Google Client ID |

## How It Works

### Registration Flow
1. User clicks "Continue with Google"
2. Google popup appears for authentication
3. User selects account and grants permissions
4. Backend verifies token and creates/updates user
5. User is logged in automatically

### Features
- Auto-creates user account if new
- Marks email as verified
- Sets random secure password
- Generates JWT token
- Redirects to home page

## Troubleshooting Checklist

- [ ] Google Client ID copied correctly (no spaces)
- [ ] `.env.local` has `VITE_GOOGLE_CLIENT_ID` (not placeholder)
- [ ] `.env.local` is NOT in `.gitignore` ❌ (should NOT be committed)
- [ ] Backend `.env` has `GOOGLE_CLIENT_ID`
- [ ] Internet connection is working
- [ ] Google Cloud API is enabled
- [ ] Localhost is in authorized origins
- [ ] Both servers are running (`npm start` and `npm run dev`)
- [ ] Browser cache cleared or using incognito mode
- [ ] No VPN/proxy interfering with Google API calls

## Security Notes

- Never commit `.env.local` to git
- Use different Client IDs for development and production
- Keep your Google Cloud project credentials secure
- Use environment variables for all secrets
- Enable OAuth consent screen verification for production

## Support

If Google Sign-In still doesn't work:
1. Check browser console for error messages
2. Open Network tab in DevTools to see API calls
3. Verify Client ID in Google Cloud Console is correct
4. Make sure localhost is in authorized origins
5. Clear browser cache and try incognito mode
