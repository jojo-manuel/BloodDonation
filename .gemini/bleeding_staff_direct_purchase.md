# Bleeding Staff Direct Purchase Feature

## Summary
Enhanced the Bleeding Staff Dashboard to support two modes of inventory purchase:
1. **Booking-based billing** - Bill items to patients with existing bookings
2. **Direct purchase** - Buy inventory items for walk-in patients without bookings

## Changes Made

### Frontend (`frontend/src/Pages/BleedingStaffDashboard.jsx`)

#### 1. **Dynamic Purchase Button**
- Button text and icon change based on context:
  - **🎫 "Bill to Patient"** - When a booking is selected (auto-fills patient details)
  - **💰 "Buy Now"** - When no booking is selected (manual entry required)
- Added tooltip to explain the mode
- Clears form when switching from booking mode to direct purchase mode

#### 2. **Info Banner**
Added a helpful information banner above the inventory section explaining:
- How to use booking-based billing (search token → click "Bill to Patient")
- How to use direct purchase (click "Buy Now" → enter details manually)
- Visual indicators (🎫 and 💰) for easy recognition

#### 3. **Dynamic Modal Title**
- Modal title changes based on purchase mode:
  - **"🎫 Bill to Patient"** - When billing to a booking
  - **"💰 Purchase Inventory"** - When making a direct purchase

#### 4. **Enhanced Token Field**
- Label shows "(Optional)" when in direct purchase mode
- Dynamic placeholder text:
  - With booking: "Auto-filled from booking"
  - Without booking: "Enter token to auto-fill patient details"
- Helper text appears in direct purchase mode:
  - "💡 Leave empty for direct purchase, or enter token to fetch patient details"

#### 5. **Smart Form Handling**
- When opening modal WITH a booking:
  - Auto-fills token, patient name, and patient ID
  - Fetches full patient/donor details
  - Displays detailed information cards
- When opening modal WITHOUT a booking:
  - Clears all form fields
  - Allows manual entry of patient information
  - Token field becomes optional

## User Workflows

### Workflow 1: Booking-Based Purchase
1. Staff searches for patient's booking token in the "Booked Slots" section
2. System displays booking details
3. Staff clicks **"🎫 Bill to Patient"** on desired inventory item
4. Modal opens with auto-filled patient details
5. Staff enters price and optional notes
6. Submits to complete billing

### Workflow 2: Direct Purchase (Walk-in Patient)
1. Staff clicks **"💰 Buy Now"** on desired inventory item
2. Modal opens with empty form
3. Staff manually enters:
   - Patient name (required)
   - Patient ID/MRID (optional)
   - Price (required)
   - Notes (optional)
4. Optionally enters token number to fetch existing patient details
5. Submits to complete purchase

## Features

### Flexibility
- Supports both scheduled bookings and walk-in patients
- No requirement to have a booking to purchase inventory
- Can still link to booking if token is known

### User Guidance
- Clear visual indicators (icons and colors)
- Contextual help text
- Dynamic UI that adapts to the current mode

### Data Integrity
- Maintains patient details when available
- Allows manual entry when needed
- Optional token linking for record-keeping

## UI/UX Improvements

1. **Visual Clarity**
   - Blue info banner with clear instructions
   - Icon-based differentiation (🎫 vs 💰)
   - Contextual tooltips

2. **Smart Defaults**
   - Auto-fills when possible
   - Clears when switching modes
   - Helpful placeholder text

3. **Reduced Friction**
   - No forced booking requirement
   - Optional fields clearly marked
   - One-click purchase for walk-ins

## Backend Compatibility

The existing backend endpoint (`PUT /api/store-staff/inventory/:id/bill`) already supports:
- Optional token numbers
- Manual patient name entry
- Flexible billing scenarios

No backend changes were required for this feature.

## Testing Recommendations

### Test Case 1: Booking-Based Purchase
1. Search for a valid token
2. Click "Bill to Patient" on inventory
3. Verify auto-filled details
4. Submit and confirm success

### Test Case 2: Direct Purchase
1. Without searching for a token, click "Buy Now"
2. Verify empty form
3. Manually enter patient details
4. Submit and confirm success

### Test Case 3: Token Lookup During Direct Purchase
1. Click "Buy Now" (direct mode)
2. Enter a valid token in the token field
3. Click search button
4. Verify patient details auto-fill
5. Submit and confirm success

### Test Case 4: Mode Switching
1. Search for a booking
2. Click "Bill to Patient"
3. Close modal
4. Click "Buy Now" on different item
5. Verify form is cleared
6. Verify UI reflects direct purchase mode

## Benefits

✅ **Flexibility** - Handles both scheduled and walk-in patients
✅ **Efficiency** - Auto-fills when possible, allows manual entry when needed
✅ **User-Friendly** - Clear instructions and visual indicators
✅ **No Breaking Changes** - Works with existing backend
✅ **Better UX** - Contextual help and smart defaults
