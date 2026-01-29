# Store Staff Dashboard

## Overview
The Store Staff Dashboard is designed for blood bank store staff to manage blood inventory items and track their usage by different departments. This dashboard provides comprehensive inventory management capabilities with department tracking functionality.

## Features

### 1. **Inventory Management**
- **View Inventory**: Display all blood inventory items with detailed information
- **Add New Items**: Create new inventory entries with complete details
- **Edit Items**: Update existing inventory item information
- **Delete Items**: Remove inventory items from the system
- **Search & Filter**: Find items by various criteria (blood group, status, serial numbers, etc.)

### 2. **Department Tracking**
- **Mark Items as Taken**: Record when items are taken by departments
- **Department Selection**: Track which department took the items
- **Staff Tracking**: Record who took the items
- **Reason Logging**: Document the reason for taking items
- **Usage History**: Maintain complete audit trail of item usage

### 3. **Status Management**
- **Available**: Items ready for use
- **Reserved**: Items set aside for specific purposes
- **Used**: Items that have been taken by departments
- **Expired**: Items past their expiry date
- **Quarantine**: Items under review or investigation

### 4. **Analytics & Monitoring**
- **Inventory Overview**: Total, available, used, and expired item counts
- **Expiry Alerts**: Items expiring within 14 days
- **Blood Group Distribution**: Visual breakdown by blood type
- **Recent Activity**: Track recent department usage

## User Interface

### Main Dashboard
- **Header**: Dashboard title and "Add Item" button
- **Filters**: Search, status filter, and blood group filter
- **Inventory Grid**: Card-based layout showing inventory items
- **Item Cards**: Detailed information for each inventory item

### Item Card Information
- Blood group and donation type
- Status badge with color coding
- Serial number range and unit count
- Donor name and expiry date
- Location and temperature
- Notes and usage history
- Action buttons (Take, Edit, Delete)

### Modals
1. **Add Item Modal**: Form to create new inventory items
2. **Take Item Modal**: Form to mark items as taken by departments

## API Endpoints

### Authentication
All endpoints require authentication with store staff role or higher.

### Inventory Management
- `GET /api/store-staff/inventory` - Get inventory with filtering
- `POST /api/store-staff/inventory` - Create new inventory item
- `PUT /api/store-staff/inventory/:id` - Update inventory item
- `DELETE /api/store-staff/inventory/:id` - Delete inventory item

### Department Tracking
- `PUT /api/store-staff/inventory/:id/take` - Mark item as taken
- `PUT /api/store-staff/inventory/:id/status` - Update item status

### Analytics
- `GET /api/store-staff/analytics` - Get dashboard analytics
- `GET /api/store-staff/expiry-alerts` - Get expiring items

## Data Models

### Blood Inventory Item
```javascript
{
  _id: ObjectId,
  bloodGroup: String, // A+, A-, B+, B-, AB+, AB-, O+, O-
  donationType: String, // whole_blood, plasma, platelets, etc.
  firstSerialNumber: Number,
  lastSerialNumber: Number,
  unitsCount: Number, // Calculated from serial range
  collectionDate: Date,
  expiryDate: Date,
  donorName: String,
  status: String, // available, reserved, used, expired, quarantine
  location: String,
  temperature: String,
  notes: String,
  hospital_id: String,
  
  // Department tracking fields
  takenBy: String,
  department: String,
  reason: String,
  takenAt: Date,
  
  // Audit fields
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## User Roles & Permissions

### Store Staff (`store_staff`)
- View all inventory items
- Add new inventory items
- Edit inventory items
- Mark items as taken by departments
- Update item status
- Delete inventory items
- View analytics and reports

### Store Manager (`store_manager`)
- All store staff permissions
- Additional management capabilities

### Blood Bank Admin (`bloodbank`)
- All store staff and manager permissions
- System administration capabilities

## Workflow Examples

### 1. Adding New Inventory Item
1. Click "Add Item" button
2. Fill in required information:
   - Blood group
   - Serial number range
   - Collection and expiry dates
   - Donor information
   - Storage location
3. Submit form
4. Item appears in inventory grid

### 2. Marking Item as Taken
1. Find available inventory item
2. Click "Take" button (minus icon)
3. Fill in department tracking form:
   - Select department
   - Enter staff name who took it
   - Specify reason for taking
   - Add additional notes
4. Submit form
5. Item status changes to "used"
6. Usage information is recorded

### 3. Monitoring Expiry Dates
1. Items expiring within 14 days show warning badge
2. Expired items show red "Expired" badge
3. Use expiry alerts endpoint for proactive monitoring
4. Filter by expiry status for focused management

## Security Features

- **Role-based Access Control**: Only authorized staff can access
- **Hospital Isolation**: Staff can only see their hospital's inventory
- **Audit Trail**: All changes are logged with user and timestamp
- **Input Validation**: Comprehensive validation on all inputs
- **Serial Number Validation**: Prevents overlapping serial ranges

## Technical Implementation

### Frontend (React)
- **Component**: `StoreStaffDashboard.jsx`
- **State Management**: React hooks for local state
- **API Integration**: Axios-based API client
- **UI Components**: Lucide React icons, Tailwind CSS styling
- **Responsive Design**: Mobile-friendly grid layout

### Backend (Node.js/Express)
- **Routes**: `storeStaffRoutes.js`
- **Model**: `BloodInventory.js` (Mongoose schema)
- **Authentication**: JWT-based with role validation
- **Database**: MongoDB with proper indexing
- **Validation**: Comprehensive input validation and business rules

## Testing

### Functionality Verified
- ✅ **Authentication**: Store staff can login and access dashboard
- ✅ **Inventory Creation**: New items can be added successfully
- ✅ **Department Tracking**: Items can be marked as taken with full tracking
- ✅ **Status Management**: Item status updates work correctly
- ✅ **Filtering**: Search and filter functionality works
- ✅ **Analytics**: Dashboard shows accurate counts and statistics
- ✅ **Data Persistence**: All changes are saved to MongoDB
- ✅ **Role Security**: Only authorized users can access functionality

### Test Results
- **Login Success**: `staff@store.com` / `password123`
- **Item Creation**: A+ blood (5 units) created successfully
- **Department Usage**: Item marked as taken by Emergency department
- **Analytics**: Shows 1 total item, 0 available, 1 used
- **Filtering**: Status and blood group filters work correctly

## Future Enhancements

1. **Barcode Scanning**: Integration with barcode scanners for serial numbers
2. **Batch Operations**: Bulk status updates and transfers
3. **Reporting**: Detailed usage reports by department and time period
4. **Notifications**: Real-time alerts for expiring items
5. **Mobile App**: Dedicated mobile application for staff
6. **Integration**: Connection with hospital management systems
7. **Temperature Monitoring**: Integration with IoT temperature sensors

## Conclusion

The Store Staff Dashboard provides a comprehensive solution for blood inventory management with robust department tracking capabilities. It ensures proper accountability, maintains detailed audit trails, and provides the tools necessary for efficient blood bank operations.