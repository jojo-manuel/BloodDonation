# Multi-Role Inventory Purchase System

## Overview
The inventory purchase system now supports purchases by **Doctors**, **Bleeding Staff**, and **Centrifuge Staff**, with automatic serial number tracking and unit management.

## Authorized Roles for Inventory Purchase

### 1. **Store Manager** (`store_manager`)
- Full access: Create, Read, Update, Delete inventory
- Purchase inventory items
- Allocate inventory to staff
- View all inventory analytics

### 2. **Blood Bank Admin** (`bloodbank`)
- Full access: Create, Read, Update, Delete inventory
- Purchase inventory items
- Manage all inventory operations

### 3. **Doctor** (`doctor`)
- View available inventory
- Purchase inventory by unit
- Access through Doctor Dashboard
- Auto-fill patient details from donor assessments

### 4. **Bleeding Staff** (`bleeding_staff`)
- View available inventory
- Purchase inventory by unit
- Access through Bleeding Staff Dashboard
- Integrated with donation workflow

### 5. **Centrifuge Staff** (`centrifuge_staff`) ✨ NEW
- View available inventory
- Purchase inventory by unit
- Access through same endpoints as other staff
- Can purchase supplies needed for blood processing

## Serial Number Auto-Generation System

### How It Works

The system automatically generates serial numbers based on:
1. **First Serial Number**: Starting point of the batch
2. **Number of Units**: Quantity being purchased

### Example Flow

**Initial Inventory:**
```
Item: Blood Bags Type A+
First Serial: 5000
Last Serial: 5099
Total Units: 100
Status: Available
```

**Purchase 1: Doctor purchases 15 units**
```
Purchased Serials: #5000-5014 (15 units)
Patient: John Doe

Updated Inventory:
First Serial: 5015 ← Auto-incremented!
Last Serial: 5099
Remaining Units: 85
Status: Available
```

**Purchase 2: Bleeding Staff purchases 30 units**
```
Purchased Serials: #5015-5044 (30 units)
Patient: Jane Smith

Updated Inventory:
First Serial: 5045 ← Auto-incremented!
Last Serial: 5099
Remaining Units: 55
Status: Available
```

**Purchase 3: Centrifuge Staff purchases 55 units**
```
Purchased Serials: #5045-5099 (55 units)
Patient: Bob Johnson

Updated Inventory:
First Serial: 5099
Last Serial: 5099
Remaining Units: 0
Status: Used (Fully Purchased) ← Auto-marked!
Serial numbers: Hidden from display
```

## Purchase Process

### For All Staff Roles:

1. **View Inventory**
   - See all available items
   - Check units available
   - View current serial range
   - Check expiry dates

2. **Select Item to Purchase**
   - Click "Purchase by Unit" button
   - Purchase modal opens

3. **Enter Purchase Details**
   - **Units**: Number to purchase (1 to available count)
   - **Patient Name**: Required
   - **Patient ID/MRID**: Optional
   - **Notes**: Optional

4. **System Processing**
   - Validates unit count
   - Calculates serial numbers to assign
   - Deducts units from inventory
   - Updates first serial number
   - Records purchase in notes
   - Marks as "used" if depleted

5. **Confirmation**
   - Success message shows purchased serials
   - Example: "Successfully purchased 15 units (Serials #5000-5014)"
   - Inventory refreshes automatically

## Backend Implementation

### Middleware Access Control
```javascript
const allowedRoles = [
  'store_manager',      // Full access
  'bloodbank',          // Full access
  'doctor',             // View + Purchase
  'bleeding_staff',     // View + Purchase
  'centrifuge_staff'    // View + Purchase
];
```

### Purchase Endpoint
**POST** `/api/store-manager/inventory/:id/purchase`

**Request Body:**
```json
{
  "units": 15,
  "patientName": "John Doe",
  "patientId": "MR12345",
  "notes": "Emergency surgery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully purchased 15 units (Serials #5000-5014)",
  "data": {
    "_id": "...",
    "bloodGroup": "A+",
    "unitsCount": 85,
    "firstSerialNumber": 5015,
    "lastSerialNumber": 5099,
    "status": "available",
    "purchasedSerials": {
      "start": 5000,
      "end": 5014,
      "count": 15
    }
  }
}
```

### Serial Number Logic
```javascript
// Track purchased serials
const purchasedSerialStart = inventoryItem.firstSerialNumber;
const purchasedSerialEnd = inventoryItem.firstSerialNumber + units - 1;

// Update inventory
inventoryItem.unitsCount -= units;

// Update first serial for remaining inventory
if (inventoryItem.unitsCount > 0) {
  inventoryItem.firstSerialNumber = purchasedSerialEnd + 1;
}

// Mark as used if depleted
if (inventoryItem.unitsCount === 0) {
  inventoryItem.status = 'used';
  inventoryItem.usedBy = req.user.id;
  inventoryItem.usedAt = new Date();
}
```

## Purchase Audit Trail

Every purchase is logged with complete details:

```
[2026-02-04T11:00:00.000Z] Purchased 15 unit(s) (Serials #5000-5014) 
for patient: John Doe (ID: MR12345). 
Notes: Emergency surgery. 
Purchased by: dr.smith@hospital.com

[2026-02-04T11:30:00.000Z] Purchased 30 unit(s) (Serials #5015-5044) 
for patient: Jane Smith (ID: MR12346). 
Purchased by: bleeding.staff@hospital.com

[2026-02-04T12:00:00.000Z] Purchased 55 unit(s) (Serials #5045-5099) 
for patient: Bob Johnson (ID: MR12347). 
Purchased by: centrifuge.staff@hospital.com
```

## Frontend Integration

### Doctor Dashboard
- Inventory section at top
- Purchase modal with patient auto-fill
- Integrated with donor assessment workflow

### Bleeding Staff Dashboard
- Inventory section already exists
- Purchase functionality available
- Integrated with donation completion workflow

### Centrifuge Staff Dashboard
- Can access inventory through API
- Same purchase endpoints
- Can purchase supplies for blood processing

## Display Rules

### Available Items (units > 0)
```
Blood Type A+ Whole Blood
Units: 85
Serial Range: 5015-5099  ← Visible
Status: Available
```

### Fully Purchased Items (units = 0)
```
Blood Type A+ Whole Blood
Units: 0
Serial Range: [Hidden]  ← Not shown
Status: Fully Purchased
```

## Benefits

### 1. **Complete Traceability**
- Every unit tracked from batch to patient
- Serial numbers provide unique identification
- Full audit trail for compliance

### 2. **Multi-Role Access**
- Doctors can purchase during assessments
- Bleeding staff can purchase during donations
- Centrifuge staff can purchase for processing
- Store managers maintain full control

### 3. **Automatic Management**
- Serial numbers auto-increment
- Units auto-decrement
- Status auto-updates
- No manual calculations needed

### 4. **Accurate Inventory**
- Real-time unit tracking
- No over-purchasing possible
- Automatic depletion detection
- Clear visibility of availability

### 5. **Patient Safety**
- Know exactly which units went to which patient
- Useful for recalls or quality issues
- Complete chain of custody
- Regulatory compliance

## Use Cases

### Doctor Use Case
```
Dr. Smith assesses donor → Approves donation → 
Needs blood bags for collection → 
Purchases 5 units (Serials #5000-5004) → 
Assigns to patient John Doe
```

### Bleeding Staff Use Case
```
Bleeding staff completes donation → 
Needs additional supplies → 
Purchases 10 units (Serials #5005-5014) → 
Assigns to patient Jane Smith
```

### Centrifuge Staff Use Case
```
Centrifuge staff processes blood → 
Needs separation supplies → 
Purchases 20 units (Serials #5015-5034) → 
Assigns to processing batch
```

## Summary

✅ **5 Roles** can now purchase inventory
✅ **Automatic serial number** generation and tracking
✅ **Unit count** decreases with each purchase
✅ **First serial number** increases automatically
✅ **Status** changes to "used" when depleted
✅ **Complete audit trail** for all purchases
✅ **Patient assignment** for every transaction
✅ **Real-time inventory** updates
