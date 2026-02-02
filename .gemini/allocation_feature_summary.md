# Inventory Allocation Feature Enhancement

## Summary
Enhanced the Store Manager Dashboard with auto-allocation capabilities, allowing managers to allocate specific quantities of inventory to staff members and view all allocations in a dedicated tab.

## Changes Made

### Backend (`backend-bloodbank/src/routes/storeManagerRoutes.js`)

1. **Updated GET `/api/store-manager/inventory`**
   - Added `.populate('allocatedTo', 'name role email')` to fetch full staff details for allocated items
   - This ensures the frontend receives complete information about who items are allocated to

2. **Enhanced PUT `/api/store-manager/inventory/:id/allocate`**
   - Added `quantity` parameter support from request body
   - Validates that requested quantity doesn't exceed available units
   - Improved logic for partial allocations:
     - If allocating less than total units, splits the batch and creates a new record
     - If allocating all units, updates the existing record
   - Better serial number tracking for split batches
   - Returns appropriate success messages with quantity information

### Frontend (`frontend/src/Pages/StoreManagerDashboard.jsx`)

1. **State Management**
   - Added `quantity: 1` to `allocationForm` state
   - Added `allocatedInventory` state to store allocated items

2. **New Tab: "Allocations"**
   - Added "Allocations" tab to the navigation
   - Created `fetchAllocatedInventory()` function to fetch reserved items with allocation details
   - Implemented `renderAllocations()` view with comprehensive table showing:
     - Item Name
     - Serial Number
     - Units Count
     - Allocated To (with avatar and email)
     - Department/Role (color-coded badge)
     - Allocated Date
     - Allocation Notes

3. **Enhanced Allocation Modal**
   - Added "Quantity to Allocate" input field with:
     - Number input with min/max validation
     - Dynamic max value based on available units
     - Helper text showing available units
   - Updated both allocation modals (there were duplicates) with the quantity field

4. **Improved UX**
   - Auto-loads allocated inventory when switching to Allocations tab
   - Displays staff information with visual indicators (avatars, role badges)
   - Shows allocation history with timestamps
   - Validates quantity before submission

## Features

### Auto-Allocation
- Store managers can now specify exactly how many units to allocate
- System automatically splits batches if partial allocation is requested
- Prevents over-allocation with validation

### Allocations View
- Dedicated tab showing all allocated inventory
- Displays:
  - What items are allocated
  - Who they're allocated to (name, email, role)
  - When they were allocated
  - Any notes/instructions
- Easy-to-read table format with color-coded role badges

### Data Integrity
- Backend validates quantity availability
- Proper serial number tracking for split batches
- Maintains allocation history with timestamps and notes

## Testing Recommendations

1. **Allocation Flow**
   - Allocate 1 unit from a multi-unit batch
   - Allocate all units from a batch
   - Try to allocate more units than available (should fail)
   - Verify batch splitting creates correct serial numbers

2. **Allocations View**
   - Navigate to Allocations tab
   - Verify all allocated items are displayed
   - Check staff details are correctly populated
   - Confirm role badges display properly

3. **Edge Cases**
   - Allocate to different staff members
   - Check allocation notes display
   - Verify date formatting
   - Test with empty allocations list

## API Endpoints Modified

- `GET /api/store-manager/inventory` - Now populates allocatedTo details
- `PUT /api/store-manager/inventory/:id/allocate` - Accepts quantity parameter

## Database Fields Used

- `BloodInventory.allocatedTo` - Reference to User
- `BloodInventory.allocatedAt` - Timestamp
- `BloodInventory.allocationNotes` - Text notes
- `BloodInventory.unitsCount` - Quantity tracking
- `BloodInventory.status` - Set to 'reserved' when allocated
