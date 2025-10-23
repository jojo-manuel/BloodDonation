# MongoDB Atlas Authentication Fix Guide

## Problem
**Error:** `❌ MongoDB connection error: bad auth : authentication failed`

This means your MongoDB Atlas credentials are invalid.

---

## Solution Steps

### 1. Login to MongoDB Atlas
Go to: https://cloud.mongodb.com/

### 2. Fix Database User Credentials

#### Option A: Reset Existing User Password
1. Click **"Database Access"** (left sidebar under Security)
2. Find user: `jojomanuelp2026`
3. Click **"Edit"** button
4. Click **"Edit Password"**
5. Choose: **"Autogenerate Secure Password"** and COPY it
   - OR enter your own password (remember it!)
6. Click **"Update User"**

#### Option B: Create New User
1. Click **"Database Access"** (left sidebar under Security)
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `blooddonation_user` (or any name you like)
5. Password: Click **"Autogenerate Secure Password"** and COPY it
6. Database User Privileges: 
   - Select: **"Built-in Role"**
   - Choose: **"Atlas admin"** (or "Read and write to any database")
7. Click **"Add User"**

### 3. Whitelist Your IP Address

1. Click **"Network Access"** (left sidebar under Security)
2. Click **"Add IP Address"**
3. For testing, click: **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` (allows all IPs)
   - For production, use your specific IP
4. Click **"Confirm"**

### 4. Get Connection String

1. Click **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster (Cluster0)
3. Choose: **"Connect your application"**
4. Driver: **Node.js**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.iqr2jjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
6. Replace `<username>` with your username
7. Replace `<password>` with the password you copied earlier

### 5. Update .env File

1. Open: `backend\.env`
2. Update the `MONGO_URI` line:
   ```
   MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.iqr2jjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
3. Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with actual values
4. **Important:** If password has special characters, URL encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `/` → `%2F`
   - `:` → `%3A`
   - `%` → `%25`

### 6. Test Connection

Run the test script:
```bash
cd backend
node test-mongo-connection.js
```

If successful, you'll see:
```
✅ SUCCESS! Connected to MongoDB Atlas
```

### 7. Start Your Server

```bash
node server.js
```

---

## Quick Checklist

- [ ] MongoDB Atlas account logged in
- [ ] Database user exists with correct password
- [ ] User has "Atlas admin" or "Read/write" permissions
- [ ] IP address whitelisted (0.0.0.0/0 for testing)
- [ ] Connection string updated in `.env` file
- [ ] Special characters in password are URL-encoded
- [ ] Test connection works
- [ ] Server starts without errors

---

## Still Having Issues?

### Error: "bad auth"
- Password is wrong → Reset password in MongoDB Atlas
- User doesn't exist → Create new user
- Wrong username → Check spelling

### Error: "ENOTFOUND" or "ETIMEDOUT"
- IP not whitelisted → Add IP in Network Access
- No internet connection → Check your network
- Wrong cluster name → Verify connection string

### Error: "MongoNetworkError"
- Firewall blocking connection → Allow MongoDB ports
- VPN issues → Try disconnecting VPN

---

## Contact Info

If you continue having issues, provide:
1. Screenshot of Database Access page (hide passwords)
2. Screenshot of Network Access page
3. Error message from `node test-mongo-connection.js`

