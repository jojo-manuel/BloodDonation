# Inventory Availability & Low Stock Alert Implementation

## Overview
Implemented automatic inventory status management and low stock alerts for the Store Manager Dashboard. The system now:
1. **Automatically marks items as "used" (sold out) when units reach 0**
2. **Alerts store managers when inventory reaches 10% of initial stock**
3. **Provides visual indicators for low stock items**

## Changes Made

### Backend Changes

#### 1. BloodInventory Model (`backend/Models/BloodInventory.js`)

**Added Fields:**
- `itemName`: String field for general inventory items (e.g., "Syringes", "Blood Bags")
- `initialUnitsCount`: Tracks the original quantity for calculating 10% threshold
- `allocatedTo`: Reference to User for allocation tracking
- `allocatedAt`: Timestamp for allocation
- `allocationNotes`: Notes for allocation

**Enhanced Pre-save Middleware:**
- Automatically sets `initialUnitsCount` on first save
- **Auto-marks items as 'used' when `unitsCount` reaches 0** (SOLD OUT)
- Sets `usedAt` timestamp when status changes to 'used'

**New Static Method:**
- `getLowStockItems(bloodBankId, thresholdPercent = 10)`: Returns items at or below the specified percentage of initial stock

#### 2. Store Manager Routes (`backend/Route/storeManagerRoutes.js`)

**Enhanced Analytics Endpoint (`GET /api/store-manager/analytics`):**
- Added `lowStockItems` to analytics data
- Returns `lowStockCount` and `lowStockAlerts` array
- Alerts include stock percentage calculation

**Enhanced Inventory Creation (`POST /api/store-manager/inventory`):**
- Handles both `serialNumber + quantity` format (from frontend) and `firstSerialNumber + lastSerialNumber` format
- Automatically calculates and sets `initialUnitsCount`
- Supports `itemName` field

**New Endpoints:**
- `GET /api/store-manager/staff`: Returns staff list for allocation
- `PUT /api/store-manager/inventory/:id/allocate`: Allocates inventory to staff members

### Frontend Changes

#### 1. Store Manager Dashboard (`frontend/src/Pages/StoreManagerDashboard.jsx`)

**Enhanced Analytics State:**
```javascript
{
  lowStockCount: 0,
  lowStockAlerts: []
}
```

**New Low Stock Alerts Section:**
- Displays items at or below 10% of initial stock
- Color-coded warnings:
  - **Red (CRITICAL)**: ≤ 5% remaining
  - **Orange (LOW STOCK)**: ≤ 10% remaining
- Shows stock percentage and remaining units
- Link to view all low stock items in inventory tab

**Enhanced Inventory Table:**
- Visual indicators for low stock items:
  - "SOLD OUT" badge when units = 0
  - "CRITICAL (X%)" badge when ≤ 5% remaining
  - "LOW STOCK (X%)" badge when ≤ 10% remaining
- Real-time stock percentage display

## How It Works

### Automatic Status Management

1. **When inventory is created:**
   - `initialUnitsCount` is set to the calculated units (lastSerial - firstSerial + 1)
   - Status is set to 'available'

2. **When units are consumed:**
   - As `unitsCount` decreases, the pre-save middleware checks the value
   - **If `unitsCount` reaches 0:**
     - Status automatically changes to 'used'
     - `usedAt` timestamp is set
     - Frontend displays "SOLD OUT" badge

3. **Low stock detection:**
   - Backend calculates: `stockPercentage = (unitsCount / initialUnitsCount) * 100`
   - Items with `stockPercentage ≤ 10%` are flagged as low stock
   - Store manager sees alerts on dashboard

### Visual Indicators

**Dashboard Overview:**
- Low Stock Alerts card appears when items reach ≤ 10%
- Shows top 5 low stock items with percentage
- Displays total count of low stock items

**Inventory Table:**
- Each row shows current stock status
- Color-coded badges for quick identification
- Percentage display for low stock items

## Testing the Feature

1. **Create inventory item:**
   ```
   - Item Name: "Blood Bags"
   - Serial Number: 1000
   - Quantity: 100
   ```
   This creates an item with `initialUnitsCount = 100`

2. **Simulate consumption:**
   - Edit the item and reduce quantity to 10
   - Stock percentage: 10% → Shows "LOW STOCK (10%)" badge
   
3. **Simulate critical stock:**
   - Reduce quantity to 5
   - Stock percentage: 5% → Shows "CRITICAL (5%)" badge

4. **Simulate sold out:**
   - Reduce quantity to 0
   - Status automatically changes to 'used'
   - Shows "SOLD OUT" badge

## Benefits

1. **Proactive Inventory Management:**
   - Store managers receive early warnings before stock runs out
   - 10% threshold provides time to reorder

2. **Automatic Status Updates:**
   - No manual intervention needed when items are sold out
   - Reduces human error

3. **Visual Clarity:**
   - Color-coded system makes it easy to identify issues at a glance
   - Percentage display shows exact stock levels

4. **Improved Workflow:**
   - Allocation feature allows tracking of who has which items
   - Staff management integration

## API Response Example

```json
{
  "success": true,
  "data": {
    "totalUnits": 500,
    "availableUnits": 350,
    "reservedUnits": 50,
    "expiredUnits": 20,
    "expiringUnits": 30,
    "lowStockCount": 3,
    "lowStockAlerts": [
      {
        "_id": "...",
        "itemName": "Blood Bags",
        "unitsCount": 5,
        "initialUnitsCount": 100,
        "stockPercentage": 5,
        "bloodGroup": "A+",
        "status": "available"
      }
    ]
  }
}
```

## Notes

- The 10% threshold is configurable in the backend (`getLowStockItems` method)
- Items with status 'used' or 'expired' are excluded from low stock alerts
- The system only tracks items that have `initialUnitsCount > 0`
- Stock percentage is calculated dynamically and not stored in the database
