# User Settings Backend - Implementation Complete

## Overview
Complete backend implementation for user settings/preferences management in the Blood Donation Application. Allows users to customize notifications, security, appearance, privacy, and regional preferences.

---

## 🎯 Features Implemented

### Settings Categories

#### 1. **Notifications**
- ✅ Email notifications
- ✅ SMS notifications
- ✅ Push notifications
- ✅ Donation reminders
- ✅ Marketing emails

#### 2. **Security**
- ✅ Two-factor authentication toggle

#### 3. **Appearance**
- ✅ Dark mode toggle
- ✅ Language selection (English, Hindi, Spanish, French)

#### 4. **Privacy**
- ✅ Profile visibility (Public, Private, Friends)
- ✅ Show/Hide email
- ✅ Show/Hide phone number

#### 5. **Regional**
- ✅ Timezone selection
- ✅ Date format preference

---

## 📁 Files Created/Modified

### Backend Files

#### 1. **User Model** (`backend/Models/User`)
**Added:** Settings schema with nested structure

```javascript
settings: {
  notifications: {
    email: Boolean (default: true),
    sms: Boolean (default: false),
    push: Boolean (default: true),
    donationReminders: Boolean (default: true),
    marketing: Boolean (default: false),
  },
  security: {
    twoFactorAuth: Boolean (default: false),
  },
  appearance: {
    darkMode: Boolean (default: false),
    language: String (default: 'en'),
  },
  privacy: {
    profileVisibility: String (default: 'public'),
    showEmail: Boolean (default: false),
    showPhone: Boolean (default: false),
  },
  regional: {
    timezone: String (default: 'Asia/Kolkata'),
    dateFormat: String (default: 'DD/MM/YYYY'),
  },
}
```

#### 2. **Settings Controller** (`backend/controllers/settingsController.js`)
**Functions:**
- `getSettings()` - Get user settings (GET /api/settings)
- `updateSettings()` - Update all settings (PUT /api/settings)
- `resetSettings()` - Reset to defaults (POST /api/settings/reset)
- `updateSettingCategory()` - Update specific category (PATCH /api/settings/:category)

**Features:**
- ✅ Validation for enum values (language, date format, profile visibility)
- ✅ Default value handling
- ✅ Partial updates supported
- ✅ Category-specific updates

#### 3. **Settings Routes** (`backend/Route/settingsRoutes.js`)
**Endpoints:**
```
GET    /api/settings              - Get user settings
PUT    /api/settings              - Update all settings
POST   /api/settings/reset        - Reset to defaults
PATCH  /api/settings/:category    - Update specific category
```

**Protection:** All routes require authentication (protect middleware)

#### 4. **App Configuration** (`backend/app.js`)
**Added:** Settings route registration
```javascript
app.use('/api/settings', require('./Route/settingsRoutes'));
```

### Frontend Files

#### 5. **API Library** (`frontend/src/lib/api.js`)
**Added Functions:**
- `getSettings()` - Fetch user settings
- `updateSettings(settingsData)` - Update all settings
- `resetSettings()` - Reset to defaults
- `updateSettingCategory(category, data)` - Update specific category

---

## 🔌 API Endpoints

### 1. Get Settings
```http
GET /api/settings
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "notifications": {
        "email": true,
        "sms": false,
        "push": true,
        "donationReminders": true,
        "marketing": false
      },
      "security": {
        "twoFactorAuth": false
      },
      "appearance": {
        "darkMode": false,
        "language": "en"
      },
      "privacy": {
        "profileVisibility": "public",
        "showEmail": false,
        "showPhone": false
      },
      "regional": {
        "timezone": "Asia/Kolkata",
        "dateFormat": "DD/MM/YYYY"
      }
    },
    "user": {
      "username": "user@example.com",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### 2. Update Settings (All)
```http
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "notifications": {
    "email": true,
    "sms": true,
    "push": true,
    "donationReminders": true,
    "marketing": false
  },
  "security": {
    "twoFactorAuth": true
  },
  "appearance": {
    "darkMode": true,
    "language": "hi"
  },
  "privacy": {
    "profileVisibility": "private",
    "showEmail": false,
    "showPhone": true
  },
  "regional": {
    "timezone": "America/New_York",
    "dateFormat": "MM/DD/YYYY"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "settings": { /* updated settings */ }
  }
}
```

### 3. Update Specific Category
```http
PATCH /api/settings/notifications
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": true,
  "sms": true,
  "marketing": false
}
```

**Valid Categories:**
- `notifications`
- `security`
- `appearance`
- `privacy`
- `regional`

**Response:**
```json
{
  "success": true,
  "message": "Notifications settings updated",
  "data": {
    "notifications": {
      "email": true,
      "sms": true,
      "push": true,
      "donationReminders": true,
      "marketing": false
    }
  }
}
```

### 4. Reset Settings
```http
POST /api/settings/reset
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Settings reset to defaults",
  "data": {
    "settings": { /* default settings */ }
  }
}
```

---

## 🎨 Frontend Integration Example

### Using in UserDashboard

```javascript
import { getSettings, updateSettings, updateSettingCategory } from '../lib/api';

// Fetch settings on component mount
useEffect(() => {
  const loadSettings = async () => {
    try {
      const response = await getSettings();
      if (response.success) {
        setSettingsData(response.data.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };
  
  loadSettings();
}, []);

// Update all settings
const handleSaveSettings = async () => {
  try {
    const response = await updateSettings(settingsData);
    if (response.success) {
      alert('Settings saved successfully!');
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    alert('Failed to save settings');
  }
};

// Update specific category (e.g., notifications only)
const handleNotificationToggle = async (key, value) => {
  try {
    const response = await updateSettingCategory('notifications', {
      [key]: value
    });
    if (response.success) {
      setSettingsData(prev => ({
        ...prev,
        notifications: response.data.notifications
      }));
    }
  } catch (error) {
    console.error('Failed to update notification settings:', error);
  }
};
```

---

## 🔐 Security Features

1. **Authentication Required** - All endpoints require valid JWT token
2. **User-Specific** - Users can only access/modify their own settings
3. **Validation** - Enum values validated (language, date format, etc.)
4. **Default Values** - Safe defaults prevent missing data
5. **Partial Updates** - Only changed fields are updated

---

## 📋 Default Settings

When a user is created or settings are reset:

```javascript
{
  notifications: {
    email: true,           // ✅ Enabled
    sms: false,            // ❌ Disabled
    push: true,            // ✅ Enabled
    donationReminders: true, // ✅ Enabled
    marketing: false       // ❌ Disabled
  },
  security: {
    twoFactorAuth: false   // ❌ Disabled
  },
  appearance: {
    darkMode: false,       // Light mode
    language: 'en'         // English
  },
  privacy: {
    profileVisibility: 'public', // Public profile
    showEmail: false,      // ❌ Hidden
    showPhone: false       // ❌ Hidden
  },
  regional: {
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY'
  }
}
```

---

## 🧪 Testing the Backend

### Test 1: Get Settings (Postman/curl)
```bash
curl -X GET http://localhost:5000/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Update Settings
```bash
curl -X PUT http://localhost:5000/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": {
      "email": true,
      "sms": true
    },
    "appearance": {
      "darkMode": true
    }
  }'
```

### Test 3: Update Specific Category
```bash
curl -X PATCH http://localhost:5000/api/settings/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": true,
    "sms": true,
    "marketing": false
  }'
```

### Test 4: Reset Settings
```bash
curl -X POST http://localhost:5000/api/settings/reset \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 Next Steps

### Immediate
1. ✅ Backend implementation complete
2. ⚠️ Update UserDashboard Settings tab to use new API
3. ⚠️ Test all endpoints
4. ⚠️ Add loading states in UI

### Future Enhancements
1. 🔔 Add email notification preferences (per notification type)
2. 📱 Implement SMS notifications
3. 🔐 Implement actual 2FA functionality
4. 🌍 Add more languages
5. 📊 Track setting change history
6. 💾 Export/Import settings

---

## 🐛 Troubleshooting

### Issue: Settings not persisting
**Solution:** Check if `user.markModified('settings')` is called before save

### Issue: Default values not showing
**Solution:** Controller includes default value handling with `??` operator

### Issue: Enum validation errors
**Solution:** Valid values:
- Language: `en`, `hi`, `es`, `fr`
- Profile Visibility: `public`, `private`, `friends`
- Date Format: `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`

### Issue: 401 Unauthorized
**Solution:** Ensure valid JWT token in Authorization header

---

## 📊 Database Schema

Settings are stored in the User collection as a nested object:

```javascript
{
  _id: ObjectId("..."),
  username: "user@example.com",
  name: "John Doe",
  role: "user",
  // ... other user fields ...
  settings: {
    notifications: { /* ... */ },
    security: { /* ... */ },
    appearance: { /* ... */ },
    privacy: { /* ... */ },
    regional: { /* ... */ }
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## ✅ Features Summary

| Feature | Backend | Frontend API | Status |
|---------|---------|--------------|---------|
| Get Settings | ✅ | ✅ | Complete |
| Update All Settings | ✅ | ✅ | Complete |
| Update Category | ✅ | ✅ | Complete |
| Reset Settings | ✅ | ✅ | Complete |
| Validation | ✅ | - | Complete |
| Default Values | ✅ | - | Complete |
| Authentication | ✅ | ✅ | Complete |

---

**Implementation Date:** October 2025  
**Version:** 1.0  
**Status:** ✅ Complete and Ready for Frontend Integration

