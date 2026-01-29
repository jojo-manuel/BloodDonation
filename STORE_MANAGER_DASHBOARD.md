# Store Manager Dashboard

A specialized dashboard for blood bank store managers to efficiently manage blood inventory with serial number tracking and expiry management.

## 🩸 Key Features

### 📊 **Overview Dashboard**
- **Real-time Analytics**: Total units, available units, reserved units, expiring units, expired units
- **Blood Group Distribution**: Visual breakdown of inventory by blood group
- **Expiry Alerts**: Items expiring within 14 days with countdown
- **Status Tracking**: Monitor inventory status across all blood products

### 🏪 **Inventory Management**
- **Add New Items**: Create inventory entries with serial number ranges
- **Serial Number Tracking**: First and last serial numbers with automatic unit calculation
- **Expiry Date Management**: Collection and expiry date tracking
- **Status Management**: Available, Reserved, Used, Expired status tracking
- **Storage Information**: Location and temperature tracking
- **Donor Information**: Link inventory to specific donors

### 🔍 **Advanced Search & Filtering**
- **Search**: Find items by donor name, location, notes, or serial numbers
- **Blood Group Filter**: Filter by specific blood groups (A+, A-, B+, B-, O+, O-, AB+, AB-)
- **Status Filter**: Filter by availability status
- **Expiry Filter**: Show expiring soon or expired items
- **Sorting**: Sort by expiry date, collection date, or blood group

### ⚠️ **Expiry Management**
- **Expiry Alerts**: Automatic alerts for items expiring within 14 days
- **Color-coded Status**: Visual indicators for expiry urgency
  - 🔴 **Critical**: Expiring within 7 days
  - 🟡 **Warning**: Expiring within 14 days  
  - 🟢 **Good**: More than 14 days remaining
- **Auto-expiry**: Automatic status change for expired items

### 📋 **Inventory Operations**
- **Reserve/Release**: Reserve units for specific patients
- **Status Updates**: Mark items as used or expired
- **Edit Items**: Update inventory details including serial numbers
- **Delete Items**: Remove inventory entries with confirmation
- **Quality Control**: Track quality checks and notes

## 🎯 **Blood Product Types**
- **Whole Blood**: Complete blood donation
- **Plasma**: Blood plasma component
- **Platelets**: Platelet concentrate
- **Red Blood Cells**: Packed red blood cells

## 🔐 **Access Control**
- **Required Roles**: `store_manager` or `bloodbank` (admin)
- **Authentication**: JWT token-based authentication
- **Blood Bank Association**: Access limited to user's blood bank

## 🛠️ **Technical Implementation**

### Frontend (`StoreManagerDashboard.jsx`)
- **React 18** with hooks and functional components
- **Tailwind CSS** for responsive design
- **Heroicons** for consistent iconography
- **Modal Forms** for inventory creation/editing
- **Real-time Updates** with optimistic UI updates

### Backend (`storeManagerRoutes.js`)
- **Express.js** routes with middleware protection
- **MongoDB** with Mongoose ODM
- **Role-based Access Control** middleware
- **Data Validation** and error handling
- **Aggregation Queries** for analytics

### Database Model (`BloodInventory.js`)
```javascript
{
  bloodBankId: ObjectId,           // Blood bank reference
  bloodGroup: String,              // A+, A-, B+, B-, O+, O-, AB+, AB-
  donationType: String,            // whole_blood, plasma, platelets, red_cells
  firstSerialNumber: Number,       // Starting serial number
  lastSerialNumber: Number,        // Ending serial number
  unitsCount: Number,              // Calculated: last - first + 1
  collectionDate: Date,            // When blood was collected
  expiryDate: Date,                // When blood expires
  donorId: ObjectId,               // Optional donor reference
  donorName: String,               // Donor name for quick reference
  status: String,                  // available, reserved, used, expired
  location: String,                // Storage location
  temperature: String,             // Storage temperature
  notes: String,                   // Additional notes
  createdBy: ObjectId,             // User who created the entry
  updatedBy: ObjectId              // User who last updated
}
```

## 📡 **API Endpoints**

### Analytics
- `GET /api/store-manager/analytics` - Dashboard statistics and blood group distribution

### Inventory Management
- `GET /api/store-manager/inventory` - List inventory with filtering and pagination
- `POST /api/store-manager/inventory` - Create new inventory item
- `PUT /api/store-manager/inventory/:id` - Update inventory item
- `DELETE /api/store-manager/inventory/:id` - Delete inventory item
- `PUT /api/store-manager/inventory/:id/status` - Update item status

### Expiry Management
- `GET /api/store-manager/expiry-alerts` - Get items expiring soon

### Reports
- `GET /api/store-manager/reports/inventory` - Generate inventory reports (JSON/CSV)

## 🚀 **Usage Guide**

### Adding New Inventory
1. Click "Add Inventory" button
2. Select blood group and donation type
3. Enter serial number range (first and last)
4. Set collection and expiry dates
5. Add donor information (optional)
6. Specify storage location and temperature
7. Add any relevant notes
8. Save to create inventory entry

### Managing Inventory
1. Use search and filters to find specific items
2. Click edit icon to modify inventory details
3. Use status buttons to reserve/release items
4. Monitor expiry alerts in the overview dashboard
5. Generate reports for inventory analysis

### Serial Number System
- **Range-based**: Enter first and last serial numbers
- **Automatic Calculation**: Units count calculated automatically
- **Overlap Prevention**: System prevents overlapping serial ranges
- **Unique Tracking**: Each unit has a unique serial number within the range

### Expiry Management
- **Automatic Alerts**: System shows items expiring within 14 days
- **Color Coding**: Visual indicators for expiry urgency
- **Status Updates**: Items automatically marked as expired when past expiry date
- **Proactive Management**: Early warnings help prevent waste

## 🎨 **User Interface**

### Dashboard Layout
- **Header**: Blood bank name and navigation
- **Tabs**: Overview, Inventory, Expiry Alerts, Reports
- **Stats Cards**: Key metrics with icons and colors
- **Data Tables**: Sortable and filterable inventory lists
- **Modals**: Clean forms for adding/editing inventory

### Visual Design
- **Modern UI**: Clean, professional interface
- **Responsive**: Works on desktop, tablet, and mobile
- **Dark Mode**: Automatic theme support
- **Color Coding**: Status and expiry indicators
- **Icons**: Intuitive Heroicons throughout

## 📈 **Benefits**

### Operational Efficiency
- **Centralized Management**: All inventory operations in one place
- **Quick Access**: Fast search and filtering capabilities
- **Automated Calculations**: Automatic unit counting and expiry tracking
- **Real-time Updates**: Immediate reflection of changes

### Inventory Control
- **Serial Tracking**: Complete traceability of blood units
- **Expiry Management**: Prevent waste through early alerts
- **Status Monitoring**: Track availability and usage
- **Quality Assurance**: Notes and quality control tracking

### Compliance & Safety
- **Audit Trail**: Complete history of inventory changes
- **Expiry Compliance**: Automatic expiry date enforcement
- **Temperature Tracking**: Storage condition monitoring
- **Documentation**: Comprehensive notes and tracking

## 🔄 **Integration**

### Blood Bank System
- **Seamless Integration**: Works with existing blood bank dashboard
- **Role-based Access**: Integrates with user role system
- **Data Consistency**: Shared database with other modules
- **API Compatibility**: RESTful API design

### Future Enhancements
- **Barcode Scanning**: QR/barcode integration for serial numbers
- **Mobile App**: Dedicated mobile application
- **Advanced Analytics**: Predictive analytics for inventory planning
- **Integration APIs**: Connect with hospital management systems
- **Automated Alerts**: Email/SMS notifications for expiry alerts

## 🛡️ **Security Features**

### Access Control
- **Role-based Permissions**: Only store managers and admins can access
- **Blood Bank Isolation**: Users can only see their blood bank's inventory
- **Audit Logging**: Track all inventory changes with user attribution
- **Input Validation**: Comprehensive validation on all inputs

### Data Protection
- **Secure API**: Protected endpoints with authentication
- **Data Validation**: Server-side validation for all operations
- **Error Handling**: Graceful error handling and user feedback
- **Transaction Safety**: Database operations with proper error handling

## 📞 **Support**

For technical support, feature requests, or questions about the Store Manager Dashboard, please contact the development team or refer to the main project documentation.

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Compatibility**: Modern browsers with JavaScript enabled