# Create Admin User - Guide

The default admin user should be created automatically when the server starts. But if it doesn't exist, here are several ways to create it.

## Method 1: Automatic (Already Running)

The server automatically creates the admin user on startup. Check your Render logs to see:
- `✅ Default admin user created (chuahadmin / chuahchuah)`
- OR `✅ Default admin user already exists`

If you see these messages, the user is already created!

## Method 2: Use Register Endpoint (Easiest)

You can create the admin user by calling the register API endpoint:

### Using Browser Console:

1. Open your browser console (F12)
2. Go to your backend URL: `https://learning-app-cpdm.onrender.com`
3. Run this in the console:

```javascript
fetch('https://learning-app-cpdm.onrender.com/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'chuahadmin',
    password: 'chuahchuah',
    display_name: 'Admin'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
  console.log('Token:', data.token);
})
.catch(error => {
  console.error('Error:', error);
});
```

### Using curl (Terminal):

```bash
curl -X POST https://learning-app-cpdm.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chuahadmin",
    "password": "chuahchuah",
    "display_name": "Admin"
  }'
```

### Using Postman:

1. Method: `POST`
2. URL: `https://learning-app-cpdm.onrender.com/api/auth/register`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "email": "chuahadmin",
  "password": "chuahchuah",
  "display_name": "Admin"
}
```

## Method 3: Run Script Locally (If you have access to backend)

If you have the backend code locally and MongoDB connection:

```bash
cd backend
npm run create-admin
```

This will:
- Connect to your MongoDB
- Check if user exists
- Create the admin user if it doesn't exist

## Method 4: Check if User Already Exists

Test if the user exists by trying to login:

### Using Browser Console:

```javascript
fetch('https://learning-app-cpdm.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'chuahadmin',
    password: 'chuahchuah'
  })
})
.then(response => response.json())
.then(data => {
  if (data.token) {
    console.log('✅ Login successful! User exists.');
    console.log('Token:', data.token);
  } else {
    console.log('❌ Login failed. User might not exist.');
  }
})
.catch(error => {
  console.error('Error:', error);
});
```

## Default Credentials

- **Email/User ID**: `chuahadmin`
- **Password**: `chuahchuah`

## Troubleshooting

### "User already exists" error
- The user is already created! Just use the login endpoint.

### "Invalid credentials" error
- User exists but password is wrong
- Or user doesn't exist yet

### Connection errors
- Check if backend is running
- Check if MongoDB is connected
- Check Render logs for errors

## Quick Test

1. **Check if user exists** (try login):
   ```javascript
   fetch('https://learning-app-cpdm.onrender.com/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'chuahadmin', password: 'chuahchuah' })
   }).then(r => r.json()).then(console.log)
   ```

2. **If login fails, create user** (use register):
   ```javascript
   fetch('https://learning-app-cpdm.onrender.com/api/auth/register', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'chuahadmin', password: 'chuahchuah', display_name: 'Admin' })
   }).then(r => r.json()).then(console.log)
   ```

## Recommended: Use Method 2 (Register Endpoint)

This is the easiest way - just run the JavaScript code in your browser console on your backend URL. No need to access the server directly!

