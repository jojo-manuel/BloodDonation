// controllers/settingsController.js
// User Settings Controller - Manage user preferences and settings

const User = require('../Models/User');
const asyncHandler = require('../Middleware/asyncHandler');

/**
 * Get user settings
 * GET /api/settings
 * @access Private
 */
exports.getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('settings username email name');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Return settings with defaults if not set
  const settings = {
    notifications: {
      email: user.settings?.notifications?.email ?? true,
      sms: user.settings?.notifications?.sms ?? false,
      push: user.settings?.notifications?.push ?? true,
      donationReminders: user.settings?.notifications?.donationReminders ?? true,
      marketing: user.settings?.notifications?.marketing ?? false,
    },
    security: {
      twoFactorAuth: user.settings?.security?.twoFactorAuth ?? false,
    },
    appearance: {
      darkMode: user.settings?.appearance?.darkMode ?? false,
      language: user.settings?.appearance?.language ?? 'en',
    },
    privacy: {
      profileVisibility: user.settings?.privacy?.profileVisibility ?? 'public',
      showEmail: user.settings?.privacy?.showEmail ?? false,
      showPhone: user.settings?.privacy?.showPhone ?? false,
    },
    regional: {
      timezone: user.settings?.regional?.timezone ?? 'Asia/Kolkata',
      dateFormat: user.settings?.regional?.dateFormat ?? 'DD/MM/YYYY',
    },
  };

  res.json({
    success: true,
    data: {
      settings,
      user: {
        username: user.username,
        email: user.email,
        name: user.name
      }
    }
  });
});

/**
 * Update user settings
 * PUT /api/settings
 * @access Private
 */
exports.updateSettings = asyncHandler(async (req, res) => {
  const {
    notifications,
    security,
    appearance,
    privacy,
    regional
  } = req.body;

  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Initialize settings if not exists
  if (!user.settings) {
    user.settings = {};
  }

  // Update notifications settings
  if (notifications) {
    user.settings.notifications = {
      email: notifications.email ?? user.settings.notifications?.email ?? true,
      sms: notifications.sms ?? user.settings.notifications?.sms ?? false,
      push: notifications.push ?? user.settings.notifications?.push ?? true,
      donationReminders: notifications.donationReminders ?? user.settings.notifications?.donationReminders ?? true,
      marketing: notifications.marketing ?? user.settings.notifications?.marketing ?? false,
    };
  }

  // Update security settings
  if (security) {
    user.settings.security = {
      twoFactorAuth: security.twoFactorAuth ?? user.settings.security?.twoFactorAuth ?? false,
    };
  }

  // Update appearance settings
  if (appearance) {
    const validLanguages = ['en', 'hi', 'es', 'fr'];
    const language = appearance.language && validLanguages.includes(appearance.language) 
      ? appearance.language 
      : (user.settings.appearance?.language ?? 'en');

    user.settings.appearance = {
      darkMode: appearance.darkMode ?? user.settings.appearance?.darkMode ?? false,
      language: language,
    };
  }

  // Update privacy settings
  if (privacy) {
    const validVisibility = ['public', 'private', 'friends'];
    const profileVisibility = privacy.profileVisibility && validVisibility.includes(privacy.profileVisibility)
      ? privacy.profileVisibility
      : (user.settings.privacy?.profileVisibility ?? 'public');

    user.settings.privacy = {
      profileVisibility: profileVisibility,
      showEmail: privacy.showEmail ?? user.settings.privacy?.showEmail ?? false,
      showPhone: privacy.showPhone ?? user.settings.privacy?.showPhone ?? false,
    };
  }

  // Update regional settings
  if (regional) {
    const validDateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
    const dateFormat = regional.dateFormat && validDateFormats.includes(regional.dateFormat)
      ? regional.dateFormat
      : (user.settings.regional?.dateFormat ?? 'DD/MM/YYYY');

    user.settings.regional = {
      timezone: regional.timezone ?? user.settings.regional?.timezone ?? 'Asia/Kolkata',
      dateFormat: dateFormat,
    };
  }

  // Mark the settings field as modified to ensure it's saved
  user.markModified('settings');
  
  await user.save();

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: {
      settings: user.settings
    }
  });
});

/**
 * Reset settings to default
 * POST /api/settings/reset
 * @access Private
 */
exports.resetSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Reset to defaults
  user.settings = {
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
  };

  user.markModified('settings');
  await user.save();

  res.json({
    success: true,
    message: 'Settings reset to defaults',
    data: {
      settings: user.settings
    }
  });
});

/**
 * Update specific setting category
 * PATCH /api/settings/:category
 * @access Private
 */
exports.updateSettingCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const updates = req.body;

  const validCategories = ['notifications', 'security', 'appearance', 'privacy', 'regional'];
  
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
    });
  }

  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Initialize settings if not exists
  if (!user.settings) {
    user.settings = {};
  }

  if (!user.settings[category]) {
    user.settings[category] = {};
  }

  // Update specific category
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      user.settings[category][key] = updates[key];
    }
  });

  user.markModified('settings');
  await user.save();

  res.json({
    success: true,
    message: `${category.charAt(0).toUpperCase() + category.slice(1)} settings updated`,
    data: {
      [category]: user.settings[category]
    }
  });
});

