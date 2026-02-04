# Enhanced Inventory Purchase System - Serial Number Tracking

## Overview
The inventory purchase system has been enhanced to properly track serial numbers when units are purchased, ensuring accurate inventory management and audit trails.

## How It Works

### Example Scenario
**Initial Inventory:**
- Item: Blood Type A+
- Total Units: 100
- Serial Range: 1000-1099
- Status: Available

### Purchase Transaction 1
**Doctor purchases 25 units for Patient John Doe**

**Before Purchase:**
- Units: 100
- Serial Range: 1000-1099
- Status: Available

**After Purchase:**
- Units: 75 (100 - 25)
- Serial Range: 1025-1099 (updated!)
- Status: Available
- Purchase Record: "Purchased 25 units (Serials #1000-1024) for patient: John Doe"

**Serials 1000-1024 are now marked as purchased and assigned to John Doe**

### Purchase Transaction 2
**Doctor purchases 50 units for Patient Jane Smith**

**Before Purchase:**
- Units: 75
- Serial Range: 1025-1099
- Status: Available

**After Purchase:**
- Units: 25 (75 - 50)
- Serial Range: 1075-1099 (updated!)
- Status: Available
- Purchase Record: "Purchased 50 units (Serials #1025-1074) for patient: Jane Smith"

**Serials 1025-1074 are now marked as purchased and assigned to Jane Smith**

### Final Purchase Transaction
**Doctor purchases remaining 25 units for Patient Bob Johnson**

**Before Purchase:**
- Units: 25
- Serial Range: 1075-1099
- Status: Available

**After Purchase:**
- Units: 0
- Serial Range: N/A (hidden from display)
- Status: Used (Fully Purchased)
- Purchase Record: "Purchased 25 units (Serials #1075-1099) for patient: Bob Johnson"

**All units consumed - item marked as "used" and serial numbers hidden**

## Technical Implementation

### Backend Changes (storeManagerRoutes.js)

#### Serial Number Tracking
```javascript
// Track which serials are being purchased
const purchasedSerialStart = inventoryItem.firstSerialNumber;
const purchasedSerialEnd = inventoryItem.firstSerialNumber + units - 1;

// Update inventory
inventoryItem.unitsCount -= units;

// Update serial range for remaining inventory
if (inventoryItem.unitsCount > 0) {
  inventoryItem.firstSerialNumber = purchasedSerialEnd + 1;
}
```

#### Purchase Notes
Each purchase is logged with:
- Timestamp
- Number of units purchased
- Specific serial numbers assigned
- Patient name and ID
- Additional notes
- Who made the purchase

Example:
```
[2026-02-04T10:30:00.000Z] Purchased 25 unit(s) (Serials #1000-1024) for patient: John Doe (ID: MR12345). Notes: Emergency surgery. Purchased by: dr.smith@hospital.com
```

#### Status Management
- **Available**: Item has units remaining
- **Used**: All units have been purchased/consumed
- When marked as "used", the item is automatically filtered from available inventory

### Frontend Changes (DoctorDashboard.jsx)

#### Conditional Serial Display
```javascript
{item.status === 'available' && item.unitsCount > 0 ? (
  <div>
    <span>Serial Range:</span>
    <span>{item.firstSerialNumber}-{item.lastSerialNumber}</span>
  </div>
) : (
  <div>
    <span>Status:</span>
    <span>Fully Purchased</span>
  </div>
)}
```

#### Success Messages
Purchase confirmations now show exactly which serials were assigned:
- Single unit: "Successfully purchased 1 unit (Serial #1000)"
- Multiple units: "Successfully purchased 25 units (Serials #1000-1024)"

## Benefits

### 1. **Accurate Tracking**
- Every unit has a unique serial number
- Serial numbers are assigned sequentially
- No gaps or overlaps in serial assignments

### 2. **Complete Audit Trail**
- Know exactly which serials went to which patient
- Timestamp of every transaction
- Who authorized each purchase

### 3. **Inventory Accuracy**
- Real-time unit count updates
- Serial ranges always reflect current inventory
- Automatic status changes when depleted

### 4. **Traceability**
- Track any blood unit back to its original batch
- Identify which patient received specific units
- Useful for recalls or quality issues

### 5. **User-Friendly Display**
- Shows serial numbers only when relevant
- Hides technical details for fully consumed items
- Clear status indicators

## Purchase Workflow

1. **Doctor selects inventory item** → Views available units and serial range
2. **Clicks "Purchase by Unit"** → Opens purchase modal
3. **Enters purchase details**:
   - Number of units (validated against available stock)
   - Patient name (required)
   - Patient ID (optional)
   - Notes (optional)
4. **Confirms purchase** → System:
   - Calculates which serials are being purchased
   - Deducts units from inventory
   - Updates firstSerialNumber for remaining inventory
   - Logs purchase with serial details
   - Marks as "used" if all units consumed
   - Shows success message with serial numbers
5. **Inventory refreshes** → Updated counts and serial ranges displayed

## Data Integrity

### Validation
- ✅ Cannot purchase more units than available
- ✅ Serial numbers never overlap
- ✅ Sequential assignment ensures no gaps
- ✅ Patient name required for accountability
- ✅ All purchases logged with timestamps

### Automatic Updates
- ✅ Unit counts decrease with each purchase
- ✅ Serial ranges adjust automatically
- ✅ Status changes when inventory depleted
- ✅ Purchase history preserved in notes

## Example Purchase History

```
Initial State:
Units: 100, Serials: 1000-1099, Status: Available

[2026-02-04T09:00:00.000Z] Purchased 25 unit(s) (Serials #1000-1024) for patient: John Doe (ID: MR001). Purchased by: dr.smith
Remaining: Units: 75, Serials: 1025-1099, Status: Available

[2026-02-04T10:15:00.000Z] Purchased 30 unit(s) (Serials #1025-1054) for patient: Jane Smith (ID: MR002). Purchased by: dr.jones
Remaining: Units: 45, Serials: 1055-1099, Status: Available

[2026-02-04T11:30:00.000Z] Purchased 45 unit(s) (Serials #1055-1099) for patient: Bob Johnson (ID: MR003). Purchased by: dr.brown
Remaining: Units: 0, Serials: N/A, Status: Used (Fully Purchased)
```

## Future Enhancements

Potential improvements:
- Export purchase history reports
- Search purchases by serial number
- Filter by date range or patient
- Batch purchase reversals (if needed)
- Integration with hospital billing systems
