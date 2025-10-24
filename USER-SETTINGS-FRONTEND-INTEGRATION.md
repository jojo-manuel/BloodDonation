# User Settings - Frontend Integration Guide

## 🚀 Quick Integration for UserDashboard

### Step 1: Update Settings Tab in UserDashboard

Replace the existing settings state management with API integration:

```javascript
import { getSettings, updateSettings, resetSettings, updateSettingCategory } from '../lib/api';

// Inside UserDashboard component
const [settingsData, setSettingsData] = useState({
  notifications: {
    email: true,
    sms: false,
    push: true,
    donationReminders: true,
    marketing: false,
  },
  security: {
    twoFactorAuth: false,
  },
  appearance: {
    darkMode: false,
    language: 'en',
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
  },
  regional: {
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
  },
});
const [loadingSettings, setLoadingSettings] = useState(false);
const [savingSettings, setSavingSettings] = useState(false);

// Load settings on mount or when settings tab is active
useEffect(() => {
  if (activeTab === 'settings') {
    fetchSettings();
  }
}, [activeTab]);

// Fetch settings from backend
const fetchSettings = async () => {
  try {
    setLoadingSettings(true);
    const response = await getSettings();
    if (response.success) {
      setSettingsData(response.data.settings);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    alert('Failed to load settings. Using defaults.');
  } finally {
    setLoadingSettings(false);
  }
};

// Save all settings
const handleSaveSettings = async () => {
  try {
    setSavingSettings(true);
    const response = await updateSettings(settingsData);
    if (response.success) {
      alert('✅ Settings saved successfully!');
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    alert('❌ Failed to save settings. Please try again.');
  } finally {
    setSavingSettings(false);
  }
};

// Reset to defaults
const handleResetSettings = async () => {
  if (!window.confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }
  
  try {
    setSavingSettings(true);
    const response = await resetSettings();
    if (response.success) {
      setSettingsData(response.data.settings);
      alert('✅ Settings reset to defaults!');
    }
  } catch (error) {
    console.error('Failed to reset settings:', error);
    alert('❌ Failed to reset settings.');
  } finally {
    setSavingSettings(false);
  }
};

// Quick update for single toggle (optional - for instant save)
const handleQuickToggle = async (category, key, value) => {
  try {
    // Optimistic update
    setSettingsData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    
    // Save to backend
    await updateSettingCategory(category, { [key]: value });
  } catch (error) {
    console.error(`Failed to update ${category}.${key}:`, error);
    // Revert on error
    fetchSettings();
    alert('❌ Failed to update setting. Please try again.');
  }
};
```

---

## 📝 Settings UI Component Structure

### Notifications Section

```jsx
{activeTab === 'settings' && (
  <div className="space-y-6">
    {loadingSettings ? (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        <p className="mt-2">Loading settings...</p>
      </div>
    ) : (
      <>
        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">🔔 Notifications</h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Email Notifications</span>
              <input
                type="checkbox"
                checked={settingsData.notifications.email}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, email: e.target.checked }
                }))}
                className="toggle"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span>SMS Notifications</span>
              <input
                type="checkbox"
                checked={settingsData.notifications.sms}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, sms: e.target.checked }
                }))}
                className="toggle"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span>Push Notifications</span>
              <input
                type="checkbox"
                checked={settingsData.notifications.push}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, push: e.target.checked }
                }))}
                className="toggle"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span>Donation Reminders</span>
              <input
                type="checkbox"
                checked={settingsData.notifications.donationReminders}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, donationReminders: e.target.checked }
                }))}
                className="toggle"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span>Marketing Emails</span>
              <input
                type="checkbox"
                checked={settingsData.notifications.marketing}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, marketing: e.target.checked }
                }))}
                className="toggle"
              />
            </label>
          </div>
        </div>
        
        {/* Security */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">🔐 Security</h3>
          
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">Two-Factor Authentication</span>
              <p className="text-sm text-gray-500">Add extra security to your account</p>
            </div>
            <input
              type="checkbox"
              checked={settingsData.security.twoFactorAuth}
              onChange={(e) => setSettingsData(prev => ({
                ...prev,
                security: { ...prev.security, twoFactorAuth: e.target.checked }
              }))}
              className="toggle"
            />
          </label>
        </div>
        
        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">🎨 Appearance</h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span>Dark Mode</span>
              <input
                type="checkbox"
                checked={settingsData.appearance.darkMode}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, darkMode: e.target.checked }
                }))}
                className="toggle"
              />
            </label>
            
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select
                value={settingsData.appearance.language}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, language: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Privacy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">🔒 Privacy</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Profile Visibility</label>
              <select
                value={settingsData.privacy.profileVisibility}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, profileVisibility: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="public">Public (Everyone can see)</option>
                <option value="private">Private (Only you)</option>
                <option value="friends">Friends Only</option>
              </select>
            </div>
            
            <label className="flex items-center justify-between">
              <span>Show Email on Profile</span>
              <input
                type="checkbox"
                checked={settingsData.privacy.showEmail}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, showEmail: e.target.checked }
                }))}
                className="toggle"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span>Show Phone on Profile</span>
              <input
                type="checkbox"
                checked={settingsData.privacy.showPhone}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, showPhone: e.target.checked }
                }))}
                className="toggle"
              />
            </label>
          </div>
        </div>
        
        {/* Regional */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">🌍 Regional</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select
                value={settingsData.regional.timezone}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  regional: { ...prev.regional, timezone: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Date Format</label>
              <select
                value={settingsData.regional.dateFormat}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  regional: { ...prev.regional, dateFormat: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="flex-1 bg-pink-600 text-white py-3 px-6 rounded-lg hover:bg-pink-700 disabled:opacity-50 font-semibold"
          >
            {savingSettings ? 'Saving...' : '💾 Save Settings'}
          </button>
          
          <button
            onClick={handleResetSettings}
            disabled={savingSettings}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </>
    )}
  </div>
)}
```

---

## 🎯 Quick Toggle Implementation (Optional)

For instant save on toggle (like mobile apps):

```javascript
const handleInstantToggle = async (category, key, value) => {
  // 1. Update UI immediately
  setSettingsData(prev => ({
    ...prev,
    [category]: {
      ...prev[category],
      [key]: value
    }
  }));
  
  // 2. Save to backend (fire and forget)
  try {
    await updateSettingCategory(category, { [key]: value });
    // Optionally show a toast notification
  } catch (error) {
    console.error('Failed to save:', error);
    // Revert on error
    setSettingsData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !value // Revert
      }
    }));
    alert('Failed to save setting');
  }
};

// Usage in checkbox
<input
  type="checkbox"
  checked={settingsData.notifications.email}
  onChange={(e) => handleInstantToggle('notifications', 'email', e.target.checked)}
  className="toggle"
/>
```

---

## ✅ Testing Checklist

- [ ] Settings load on mount
- [ ] All toggles work correctly
- [ ] Save button updates backend
- [ ] Reset button restores defaults
- [ ] Loading states display correctly
- [ ] Error handling works
- [ ] Settings persist after page refresh
- [ ] Dark mode toggle actually changes theme
- [ ] Language selection works (if implemented)

---

## 🎨 CSS for Toggle Switch (Optional)

Add this to your CSS if you want nice toggle switches:

```css
.toggle {
  position: relative;
  width: 48px;
  height: 24px;
  appearance: none;
  background: #cbd5e0;
  border-radius: 12px;
  outline: none;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle:checked {
  background: #ec4899;
}

.toggle::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  background: white;
  transition: transform 0.3s;
}

.toggle:checked::before {
  transform: translateX(24px);
}
```

---

**Quick Start:** Copy the code above and integrate into your UserDashboard settings tab!

**Version:** 1.0  
**Status:** Ready to Use 🚀

