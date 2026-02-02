# Bleeding Staff Inventory Display Fix

## Issue
The "Available Inventory for Purchase" section in the Bleeding Staff Dashboard was showing no items.

## Root Cause
The backend inventory endpoint (`GET /api/store-staff/inventory`) had incomplete query logic:
- When `includeAllocated=true` was passed, it would show available OR allocated-to-user items
- However, when no status filter was provided, it wasn't defaulting to show available items
- This resulted in an empty query that returned no results

## Fix Applied

### Backend Changes (`backend-bloodbank/src/routes/storeStaffRoutes.js`)

1. **Added Default Status Filter**
   ```javascript
   if (includeAllocated === 'true') {
     query.$or = [
       { status: 'available' },
       { status: 'reserved', allocatedTo: req.user.id }
     ];
   } else if (status && status !== 'all') {
     query.status = status;
   } else {
     // NEW: Default to showing available items
     query.status = 'available';
   }
   ```

2. **Improved Search Functionality**
   - Added `serialNumber` and `itemName` to text search
   - Fixed numeric serial number search to properly parse integers
   - Better handling of combined search and filter queries

3. **Added Debug Logging**
   - Logs user email and hospital ID
   - Logs the MongoDB query being executed
   - Logs the number of items found
   - Helps diagnose issues in production

## Query Logic Flow

### For Bleeding Staff (includeAllocated=true)
```
Show items where:
  - status = 'available' (any available item)
  OR
  - status = 'reserved' AND allocatedTo = current user (items allocated to me)
```

### For Store Staff (no includeAllocated)
```
Show items where:
  - status = 'available' (only available items)
```

### With Status Filter
```
Show items where:
  - status = specified status
```

## Verification Steps

### 1. Check Backend Logs
After the fix, when bleeding staff accesses the dashboard, you should see:
```
[Store Staff Inventory] User: staff@example.com, Hospital: 507f1f77bcf86cd799439011
[Store Staff Inventory] Query: {"hospital_id":"507f1f77bcf86cd799439011","$or":[{"status":"available"},{"status":"reserved","allocatedTo":"507f191e810c19729de860ea"}]}
[Store Staff Inventory] Found 5 items
```

### 2. Check Frontend
- Navigate to Bleeding Staff Dashboard
- Scroll to "Available Inventory for Purchase" section
- Should see inventory cards displayed
- Each card shows:
  - Blood group or item name
  - Units available
  - Serial number
  - Expiry date
  - Collection date
  - "Buy Now" or "Bill to Patient" button

### 3. Test Purchase Flow
1. Click "Buy Now" on any item
2. Modal should open
3. Enter patient details
4. Submit successfully

## Database Check

If no inventory is showing, check if inventory exists in the database:

### Using MongoDB Shell
```javascript
use blood_donation_system
db.bloodinventories.countDocuments()
db.bloodinventories.find({ status: 'available' }).limit(5)
```

### Using the Check Script
```bash
cd blood-system/backend-bloodbank
node scripts/check-inventory.js
```

This script will:
- Count total inventory items
- Show breakdown by status
- Display sample items
- Optionally create sample data if none exists

## Sample Data Creation

If you need to create sample inventory for testing:

1. **Via Store Manager Dashboard**
   - Login as store manager
   - Go to Inventory tab
   - Click "Add New Item"
   - Fill in details and save

2. **Via Check Script**
   - Run `node scripts/check-inventory.js`
   - If no inventory exists, it will create 5 sample items:
     - A+ whole blood (3 units)
     - O- whole blood (2 units)
     - B+ platelets (1 unit)
     - Blood collection bags (50 units)
     - Sterile gloves (10 boxes)

## API Endpoint Details

**Endpoint:** `GET /api/store-staff/inventory`

**Query Parameters:**
- `includeAllocated` (boolean) - Include items allocated to current user
- `status` (string) - Filter by specific status
- `bloodGroup` (string) - Filter by blood group
- `search` (string) - Search in multiple fields
- `sortBy` (string) - Sort field (expiryDate, collectionDate, bloodGroup, status)
- `sortOrder` (string) - asc or desc

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
      "temperature": "2-6"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 1,
    "total": 5
  }
}
```

## Testing Checklist

- [ ] Backend service restarted successfully
- [ ] Bleeding staff can see inventory items
- [ ] Items show correct blood groups and details
- [ ] "Buy Now" button works
- [ ] "Bill to Patient" button works (when booking selected)
- [ ] Modal opens with correct data
- [ ] Purchase completes successfully
- [ ] Inventory refreshes after purchase

## Troubleshooting

### No items showing
1. Check backend logs for query and results count
2. Verify inventory exists in database
3. Check user's hospital_id matches inventory hospital_id
4. Run check-inventory.js script

### Items showing but can't purchase
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check user permissions (bleeding_staff role)

### Wrong items showing
1. Check status filter (should be 'available')
2. Verify hospital_id filtering
3. Check allocation logic

## Related Files

- `backend-bloodbank/src/routes/storeStaffRoutes.js` - Inventory endpoint
- `frontend/src/Pages/BleedingStaffDashboard.jsx` - Frontend display
- `backend-bloodbank/scripts/check-inventory.js` - Database check script
- `backend-bloodbank/src/models/BloodInventory.js` - Data model
