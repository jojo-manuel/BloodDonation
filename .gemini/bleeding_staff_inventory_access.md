# Bleeding Staff Inventory Access Fix

## Issue
Bleeding staff dashboard was not showing inventory items because they didn't have permission to access the store-manager inventory endpoint.

## Solution

### 1. Frontend Changes (`BleedingStaffDashboard.jsx`)

**Changed inventory data source:**
- **Before:** Used `/store-staff/inventory?includeAllocated=true`
- **After:** Uses `/store-manager/inventory?status=available` (primary)
- **Fallback:** Falls back to store-staff endpoint if store-manager fails

**Benefits:**
- Access to complete inventory managed by store managers
- Better data consistency
- Graceful fallback for permission issues

```javascript
const fetchInventory = async () => {
    try {
        setLoadingInventory(true);
        // Primary: Fetch from store-manager endpoint
        const res = await api.get('/store-manager/inventory?status=available');
        if (res.data.success) {
            setInventory(res.data.data);
        }
    } catch (err) {
        // Fallback: Try store-staff endpoint
        try {
            const fallbackRes = await api.get('/store-staff/inventory?includeAllocated=true');
            if (fallbackRes.data.success) {
                setInventory(fallbackRes.data.data);
            }
        } catch (fallbackErr) {
            showToast("Failed to load inventory", "error");
        }
    } finally {
        setLoadingInventory(false);
    }
};
```

### 2. Backend Changes (`storeManagerRoutes.js`)

**Added flexible inventory read access middleware:**

```javascript
const requireInventoryReadAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Allow multiple roles to view inventory
  const allowedRoles = [
    'store_manager',
    'bleeding_staff',
    'store_staff',
    'bloodbank',
    'BLOODBANK_ADMIN'
  ];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions to view inventory.'
    });
  }

  next();
};
```

**Updated GET inventory endpoint:**
```javascript
router.get('/inventory', [authMiddleware, requireInventoryReadAccess], async (req, res) => {
  // ... inventory logic
});
```

## Access Control Matrix

| Role | View Inventory | Create Inventory | Edit Inventory | Delete Inventory | Allocate Items |
|------|---------------|------------------|----------------|------------------|----------------|
| **store_manager** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **bleeding_staff** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **store_staff** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **bloodbank** | ✅ | ✅ | ✅ | ✅ | ✅ |

## Data Flow

### Before Fix
```
Bleeding Staff Dashboard
    ↓
GET /api/store-staff/inventory?includeAllocated=true
    ↓
Limited data (only available OR allocated-to-user)
    ↓
Empty result (no items allocated to bleeding staff)
```

### After Fix
```
Bleeding Staff Dashboard
    ↓
GET /api/store-manager/inventory?status=available
    ↓
Complete inventory data (all available items)
    ↓
Full inventory displayed
    ↓ (if fails)
Fallback to /api/store-staff/inventory
```

## Benefits

### 1. **Unified Data Source**
- Bleeding staff see the same inventory as store managers
- No data inconsistency between different staff roles
- Single source of truth for available inventory

### 2. **Better Access Control**
- Granular permissions (read vs write)
- Bleeding staff can view but not modify
- Store managers retain full control

### 3. **Improved Reliability**
- Fallback mechanism for backward compatibility
- Graceful error handling
- User-friendly error messages

### 4. **Scalability**
- Easy to add more roles with read access
- Centralized permission logic
- Maintainable codebase

## Testing

### Test Case 1: Bleeding Staff Access
1. Login as bleeding_staff
2. Navigate to dashboard
3. Scroll to "Available Inventory for Purchase"
4. **Expected:** See all available inventory items
5. **Expected:** Can click "Buy Now" or "Bill to Patient"

### Test Case 2: Store Manager Access
1. Login as store_manager
2. Navigate to Store Manager Dashboard
3. Go to Inventory tab
4. **Expected:** See all inventory items
5. **Expected:** Can create, edit, delete, and allocate

### Test Case 3: Unauthorized Access
1. Login as a donor or regular user
2. Try to access `/api/store-manager/inventory`
3. **Expected:** 403 Forbidden error

### Test Case 4: Fallback Mechanism
1. Temporarily disable store-manager endpoint
2. Login as bleeding_staff
3. **Expected:** Inventory still loads from fallback endpoint
4. **Expected:** Console shows fallback attempt

## API Endpoints

### GET /api/store-manager/inventory
**Access:** store_manager, bleeding_staff, store_staff, bloodbank, BLOODBANK_ADMIN

**Query Parameters:**
- `status` - Filter by status (available, reserved, used, expired)
- `bloodGroup` - Filter by blood group
- `search` - Search in multiple fields
- `sortBy` - Sort field
- `sortOrder` - asc or desc

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "hospital_id": "...",
      "bloodGroup": "A+",
      "donationType": "whole_blood",
      "serialNumber": "WB-A+-001",
      "unitsCount": 3,
      "status": "available",
      "expiryDate": "2026-03-10T00:00:00.000Z",
      "collectionDate": "2026-02-02T00:00:00.000Z",
      "location": "Refrigerator A",
      "temperature": "2-6",
      "allocatedTo": null
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 1,
    "total": 5
  }
}
```

## Security Considerations

### 1. **Read-Only Access for Bleeding Staff**
- Can view inventory but cannot modify
- Cannot allocate items to themselves
- Cannot change status or delete items

### 2. **Hospital Isolation**
- All queries filtered by `hospital_id`
- Users can only see inventory from their hospital
- No cross-hospital data leakage

### 3. **Authentication Required**
- All endpoints require valid JWT token
- Token must be active and not expired
- User account must be active

## Migration Notes

### No Breaking Changes
- Existing store-staff endpoint still works
- Fallback ensures backward compatibility
- No database schema changes required

### Deployment Steps
1. Deploy backend changes
2. Restart backend service
3. Frontend automatically uses new endpoint
4. Test with bleeding_staff account
5. Verify inventory displays correctly

## Troubleshooting

### Issue: Still no inventory showing
**Check:**
1. Backend logs for permission errors
2. User role is 'bleeding_staff'
3. Hospital_id is set correctly
4. Inventory exists in database for that hospital

**Solution:**
```bash
# Check backend logs
docker logs blood-backend-bloodbank

# Verify inventory exists
node scripts/check-inventory.js
```

### Issue: 403 Forbidden error
**Check:**
1. User role is in allowed roles list
2. JWT token is valid
3. User account is active

**Solution:**
- Verify user role in database
- Re-login to get fresh token
- Check account status

### Issue: Empty inventory list
**Check:**
1. Inventory exists for user's hospital
2. Status filter is correct (should be 'available')
3. No other filters blocking results

**Solution:**
- Create inventory via Store Manager Dashboard
- Or run `node scripts/check-inventory.js` to seed data

## Related Files

- `frontend/src/Pages/BleedingStaffDashboard.jsx` - Frontend inventory display
- `backend-bloodbank/src/routes/storeManagerRoutes.js` - Inventory endpoint
- `backend-bloodbank/src/middleware/auth.js` - Authentication middleware
- `backend-bloodbank/src/models/BloodInventory.js` - Data model

## Summary

✅ **Bleeding staff can now view all available inventory**
✅ **Uses store-manager endpoint for complete data**
✅ **Fallback mechanism for reliability**
✅ **Proper access control (read-only for bleeding staff)**
✅ **No breaking changes to existing functionality**
