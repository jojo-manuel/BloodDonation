# Profile Image Upload & OAuth Password Fix

## 🎉 Issues Fixed

### 1. ✅ Profile Image Upload Route (404 Error Fixed)
**Problem:** `POST /api/users/me/profile-image` returned 404

**Root Causes:**
- Multer middleware was being applied twice (in route and controller)
- Uploads directory path was incorrect (`backend/uploads/` instead of `uploads/`)
- Uploads directory wasn't being created automatically
- Static file serving wasn't configured for uploads

**Solutions Applied:**

#### Backend Changes:

**1. Fixed `backend/app.js`:**
- Added automatic uploads directory creation
- Configured Express to serve static files from `/uploads`
```javascript
// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

app.use('/uploads', express.static(uploadsDir));
```

**2. Fixed `backend/Route/userRoutes.js`:**
- Corrected upload path from `'backend/uploads/'` to `'uploads/'`
```javascript
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Fixed path
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + ext);
  }
});
```

**3. Fixed `backend/controllers/userController.js`:**
- Removed duplicate multer middleware from controller
- Simplified to single function instead of middleware array
```javascript
exports.uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded."
    });
  }

  const imagePath = `/uploads/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profileImage: imagePath },
    { new: true }
  ).select('-password');

  res.json({
    success: true,
    message: "Profile image uploaded successfully.",
    data: user
  });
});
```

---

### 2. ✅ Hide Password Update for Google OAuth Users
**Problem:** Password update section showed for users who signed in with Google

**Solution:**

**Updated `frontend/src/Pages/UserSettings.jsx`:**

1. Added `provider` field to user state to track authentication method:
```javascript
const [user, setUser] = useState({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  bloodGroup: '',
  profileImage: '',
  provider: '' // To check if user signed in with OAuth
});
```

2. Conditionally render password section only for local users:
```javascript
{/* Password Update Section - Only show for non-OAuth users */}
{(!user.provider || user.provider === 'local') && (
  <div className="mt-8 rounded-2xl border border-white/30...">
    <h2>🔐 Change Password</h2>
    {/* Password form fields */}
  </div>
)}
```

3. Added informative message for OAuth users:
```javascript
{/* Info message for OAuth users */}
{user.provider && user.provider !== 'local' && (
  <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6...">
    <div className="flex items-start gap-3">
      <span className="text-2xl">ℹ️</span>
      <div>
        <h3 className="font-bold">Google Sign-In Account</h3>
        <p>
          You signed in with Google. Password management is handled through 
          your Google account. To change your password, please visit your 
          Google Account settings.
        </p>
      </div>
    </div>
  </div>
)}
```

---

## 📋 How It Works Now

### Profile Image Upload Flow:

1. **User selects image** → Frontend validates (type, size)
2. **Click "Upload Image"** → `POST /api/users/me/profile-image`
3. **Backend receives file** → Multer saves to `backend/uploads/`
4. **Generate image path** → `/uploads/{userId}.{ext}`
5. **Update database** → Save path to user's `profileImage` field
6. **Return updated user** → Frontend displays image
7. **Image accessible** → `http://localhost:5000/uploads/{userId}.{ext}`

### OAuth User Detection:

1. **User logs in** → Backend sets `provider` field ('google', 'firebase', or 'local')
2. **Frontend loads profile** → Checks `user.provider`
3. **If OAuth provider** → Hide password section, show info message
4. **If local user** → Show password update form

---

## 🔧 Technical Details

### File Structure:
```
backend/
├── uploads/              ← Created automatically
│   └── {userId}.jpg/png  ← Profile images stored here
├── app.js                ← Serves static files from uploads
├── Route/
│   └── userRoutes.js     ← Upload route with multer
└── controllers/
    └── userController.js ← Upload handler
```

### Routes:
```
POST   /api/users/me/profile-image  ← Upload profile image
GET    /uploads/{userId}.{ext}       ← Access uploaded images
```

### Image URL Format:
```
Frontend stores: /uploads/{userId}.jpg
Backend serves:  http://localhost:5000/uploads/{userId}.jpg
Frontend accesses: Full URL via img src
```

---

## ✅ Testing

### Test Profile Image Upload:

1. **Navigate to:** `http://localhost:5173/user-settings`
2. **Click:** "Choose Image" button
3. **Select:** Any image file (JPG, PNG, GIF < 5MB)
4. **Click:** "Upload Image" button
5. **Verify:** 
   - Success message appears
   - Avatar updates with image
   - Image persists across refreshes

### Test OAuth User Password Hiding:

1. **Sign in with Google** (or use existing Google OAuth user)
2. **Navigate to:** `http://localhost:5173/user-settings`
3. **Verify:** 
   - Password section is hidden
   - Blue info message appears
   - Message explains Google password management

### Test Local User Password Update:

1. **Sign in with email/password** (local auth)
2. **Navigate to:** `http://localhost:5173/user-settings`
3. **Verify:** 
   - Password section is visible
   - Can update password successfully
   - No OAuth info message

---

## 🛠️ Files Modified

### Backend:
- ✅ `backend/app.js` - Added uploads directory creation and static serving
- ✅ `backend/Route/userRoutes.js` - Fixed upload path
- ✅ `backend/controllers/userController.js` - Simplified upload controller

### Frontend:
- ✅ `frontend/src/Pages/UserSettings.jsx` - Conditional password section, OAuth detection

---

## 🚀 Deployment Notes

### Production Considerations:

1. **Uploads Directory:**
   - Ensure uploads directory has write permissions
   - Consider using cloud storage (AWS S3, Google Cloud Storage) for production
   - Implement image optimization and resizing

2. **Security:**
   - Validate file types server-side (already implemented)
   - Limit file sizes (already set to 5MB)
   - Sanitize filenames (already using userId)
   - Scan uploaded files for malware

3. **Performance:**
   - Serve images through CDN in production
   - Implement image caching headers
   - Consider lazy loading for avatars

---

## 📝 Additional Features (Optional)

Consider adding:

1. **Image Cropping** - Let users crop before upload
2. **Image Compression** - Reduce file sizes automatically
3. **Multiple Sizes** - Generate thumbnail versions
4. **Image Validation** - Check image dimensions
5. **Progress Bar** - Show upload progress
6. **Drag & Drop** - More intuitive upload

---

## 🐛 Troubleshooting

### Image Upload Fails:

**Issue:** 404 error
- **Check:** Backend server is running
- **Check:** Uploads directory exists
- **Check:** File size is under 5MB

**Issue:** File not appearing
- **Check:** Browser console for errors
- **Check:** Network tab for 200 response
- **Check:** User object has profileImage field

### Password Section Visibility:

**Issue:** Password shown for Google user
- **Check:** User object has `provider` field
- **Check:** Provider value is 'google' or 'firebase'
- **Check:** Frontend properly checks provider

**Issue:** Password hidden for local user
- **Check:** User object provider is 'local' or null
- **Check:** Conditional rendering logic

---

## 🎯 Success Criteria

✅ **Profile Image Upload:**
- POST route responds with 200
- Image saved to uploads directory
- Image URL returned in response
- Image accessible via /uploads route
- Avatar displays uploaded image

✅ **OAuth Password Hiding:**
- Password section hidden for Google users
- Info message shown for OAuth users
- Password section shown for local users
- No errors in console

---

**Backend server restarted! All changes are now live! 🚀**

Test the features at:
- **User Settings:** `http://localhost:5173/user-settings`
- **Upload Image:** Choose file → Upload → See avatar update
- **OAuth Check:** Sign in with Google → No password section

