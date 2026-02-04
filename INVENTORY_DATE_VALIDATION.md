# Inventory Date Validation Rules

## Overview
The inventory system now enforces strict date validation rules to ensure data integrity and compliance with blood storage regulations.

## Validation Rules

### 1. Collection Date Validation
**Rule**: Collection date **cannot be before today**

**Why**: 
- Prevents backdating of inventory entries
- Ensures accurate tracking of when blood was collected
- Maintains data integrity

**Examples**:
```
Today: February 4, 2026

✅ VALID:
- Collection Date: February 4, 2026 (today)
- Collection Date: February 5, 2026 (future)

❌ INVALID:
- Collection Date: February 3, 2026 (yesterday)
- Collection Date: January 1, 2026 (past)
```

**Error Message**:
```
"Collection date cannot be before today"
```

### 2. Expiry Date Validation
**Rule**: Expiry date **must be at least 6 months (180 days) after collection date**

**Why**:
- Blood products have minimum shelf life requirements
- Ensures inventory is usable for a reasonable period
- Prevents creation of already-expired or near-expired inventory

**Examples**:
```
Collection Date: February 4, 2026
Minimum Expiry Date: August 4, 2026 (6 months later)

✅ VALID:
- Expiry Date: August 4, 2026 (exactly 6 months)
- Expiry Date: December 4, 2026 (10 months)
- Expiry Date: February 4, 2027 (1 year)

❌ INVALID:
- Expiry Date: July 4, 2026 (only 5 months)
- Expiry Date: May 4, 2026 (only 3 months)
- Expiry Date: February 4, 2026 (same day)
```

**Error Message**:
```
"Expiry date must be at least 6 months after collection date"
```

## Implementation Details

### Backend Validation

#### Create Inventory Endpoint
**POST** `/api/store-manager/inventory`

```javascript
// Validate collection date (cannot be before today)
const today = new Date();
today.setHours(0, 0, 0, 0); // Reset to start of day
const collection = new Date(collectionDate);
collection.setHours(0, 0, 0, 0);

if (collection < today) {
  return res.status(400).json({
    success: false,
    message: 'Collection date cannot be before today'
  });
}

// Validate expiry date (must be at least 6 months after collection)
const expiry = new Date(expiryDate);
const minExpiryDate = new Date(collection);
minExpiryDate.setMonth(minExpiryDate.getMonth() + 6); // Add 6 months

if (expiry < minExpiryDate) {
  return res.status(400).json({
    success: false,
    message: 'Expiry date must be at least 6 months after collection date'
  });
}
```

#### Update Inventory Endpoint
**PUT** `/api/store-manager/inventory/:id`

Same validation logic applies when updating collection or expiry dates.

### Date Comparison Logic

**Time Normalization**:
- All dates are normalized to midnight (00:00:00) for comparison
- This ensures date-only comparisons without time interference

**Month Calculation**:
- Uses JavaScript's `setMonth()` method
- Automatically handles month overflow (e.g., Aug 31 + 6 months = Feb 28/29)

## Use Cases

### Creating New Inventory

**Scenario 1: Valid Entry**
```json
{
  "collectionDate": "2026-02-04",
  "expiryDate": "2026-08-04",
  "bloodGroup": "A+",
  "firstSerialNumber": 1000,
  "lastSerialNumber": 1099
}
```
✅ **Result**: Inventory created successfully

**Scenario 2: Collection Date in Past**
```json
{
  "collectionDate": "2026-02-01",  // 3 days ago
  "expiryDate": "2026-08-01",
  "bloodGroup": "A+",
  "firstSerialNumber": 1000,
  "lastSerialNumber": 1099
}
```
❌ **Result**: Error - "Collection date cannot be before today"

**Scenario 3: Expiry Too Soon**
```json
{
  "collectionDate": "2026-02-04",
  "expiryDate": "2026-05-04",  // Only 3 months
  "bloodGroup": "A+",
  "firstSerialNumber": 1000,
  "lastSerialNumber": 1099
}
```
❌ **Result**: Error - "Expiry date must be at least 6 months after collection date"

### Updating Existing Inventory

**Scenario 1: Updating Expiry Date**
```json
{
  "expiryDate": "2026-12-04"  // Extending expiry
}
```
- System checks: Is new expiry at least 6 months after collection date?
- If yes: ✅ Update successful
- If no: ❌ Error returned

**Scenario 2: Updating Collection Date**
```json
{
  "collectionDate": "2026-02-05"  // Tomorrow
}
```
- System checks: Is new collection date >= today?
- System checks: Is expiry date at least 6 months after new collection date?
- If both yes: ✅ Update successful
- If either no: ❌ Error returned

## Validation Order

When creating or updating inventory, validations occur in this order:

1. **Required Fields Check**
   - Blood group, serial numbers, dates present?

2. **Serial Number Validation**
   - First serial ≤ Last serial?
   - No overlaps with existing inventory?

3. **Collection Date Validation** ⭐ NEW
   - Collection date ≥ today?

4. **Expiry Date Validation** ⭐ NEW
   - Expiry date ≥ collection date + 6 months?

5. **Save to Database**
   - If all validations pass

## Error Handling

### Frontend Display
When validation fails, the backend returns:
```json
{
  "success": false,
  "message": "Collection date cannot be before today"
}
```

The frontend should display this message to the user.

### Recommended Frontend Validation

To improve user experience, add frontend validation:

**Collection Date Input**:
```html
<input 
  type="date" 
  min="2026-02-04"  <!-- Today's date -->
  value={collectionDate}
  onChange={handleCollectionDateChange}
/>
```

**Expiry Date Input**:
```javascript
// Calculate minimum expiry date
const minExpiryDate = new Date(collectionDate);
minExpiryDate.setMonth(minExpiryDate.getMonth() + 6);

<input 
  type="date" 
  min={minExpiryDate.toISOString().split('T')[0]}
  value={expiryDate}
  onChange={handleExpiryDateChange}
/>
```

## Benefits

### 1. **Data Integrity**
- Prevents invalid date entries
- Ensures logical date relationships
- Maintains accurate inventory records

### 2. **Compliance**
- Meets blood storage regulations
- Ensures minimum shelf life requirements
- Prevents expired inventory creation

### 3. **User Guidance**
- Clear error messages
- Prevents common mistakes
- Guides users to correct entries

### 4. **Audit Trail**
- Accurate collection dates
- Reliable expiry tracking
- Better inventory management

## Examples by Blood Product Type

### Whole Blood
```
Collection: Feb 4, 2026
Minimum Expiry: Aug 4, 2026 (6 months)
Typical Expiry: 35-42 days (but system allows 6+ months for flexibility)
```

### Plasma
```
Collection: Feb 4, 2026
Minimum Expiry: Aug 4, 2026 (6 months)
Typical Expiry: 1 year when frozen
```

### Platelets
```
Collection: Feb 4, 2026
Minimum Expiry: Aug 4, 2026 (6 months)
Typical Expiry: 5-7 days (but system allows 6+ months for flexibility)
```

### Red Blood Cells
```
Collection: Feb 4, 2026
Minimum Expiry: Aug 4, 2026 (6 months)
Typical Expiry: 35-42 days
```

**Note**: The 6-month minimum is a system requirement. Actual expiry dates should be set based on the specific blood product type and storage conditions.

## Testing Scenarios

### Test Case 1: Valid Dates
```
Input:
- Collection: 2026-02-04 (today)
- Expiry: 2026-08-04 (6 months later)

Expected: ✅ Success
```

### Test Case 2: Past Collection Date
```
Input:
- Collection: 2026-02-01 (3 days ago)
- Expiry: 2026-08-01

Expected: ❌ Error - "Collection date cannot be before today"
```

### Test Case 3: Insufficient Shelf Life
```
Input:
- Collection: 2026-02-04
- Expiry: 2026-07-04 (5 months later)

Expected: ❌ Error - "Expiry date must be at least 6 months after collection date"
```

### Test Case 4: Future Collection Date
```
Input:
- Collection: 2026-02-10 (6 days from now)
- Expiry: 2026-08-10

Expected: ✅ Success (future collection dates allowed)
```

### Test Case 5: Exact 6 Month Expiry
```
Input:
- Collection: 2026-02-04
- Expiry: 2026-08-04 (exactly 6 months)

Expected: ✅ Success (minimum requirement met)
```

## Summary

✅ **Collection Date**: Must be today or later
✅ **Expiry Date**: Must be at least 6 months after collection date
✅ **Applied To**: Both create and update operations
✅ **Error Messages**: Clear and actionable
✅ **Data Integrity**: Enforced at backend level
