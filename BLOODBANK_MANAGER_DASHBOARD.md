# Blood Bank Manager Dashboard

A comprehensive dashboard specifically designed for blood bank managers to efficiently manage their blood bank operations.

## Features

### 📊 Overview Dashboard
- **Real-time Analytics**: View key metrics including total bookings, completed donations, patient statistics, and today's bookings
- **Blood Group Distribution**: Visual representation of blood group availability and demand
- **Recent Activity**: Track latest activities including new bookings and patient registrations
- **Monthly Trends**: Historical data visualization for performance tracking

### 📅 Booking Management
- **Advanced Filtering**: Filter bookings by status, blood group, date range, and search terms
- **Status Updates**: Easily confirm, reject, or complete bookings
- **Real-time Status Tracking**: Monitor booking progression from pending to completed
- **Comprehensive Booking Details**: View donor information, patient details, and booking metadata

### 🏥 Patient Management
- **Patient Registration**: Add new patients with complete medical and contact information
- **Patient Tracking**: Monitor units required vs. received for each patient
- **Fulfillment Status**: Track which patients have received their required blood units
- **Patient Search**: Quick search by name, MRID, or phone number

### 👥 Staff Management
- **Staff Creation**: Add new staff members with role-based access
- **Auto-generated Credentials**: Secure username and password generation for new staff
- **Role Management**: Assign appropriate roles (frontdesk, doctor, bleeding staff, etc.)
- **Staff Directory**: View all staff members with contact information

### 📋 Donation Requests
- **Request Management**: View and manage incoming donation requests
- **Status Tracking**: Monitor request progression from pending to completed
- **Blood Group Filtering**: Filter requests by specific blood groups
- **Request Details**: View complete request information including patient and donor details

### 🩸 Inventory Tracking
- **Blood Unit Tracking**: Monitor available blood units by blood group
- **Expiry Management**: Track blood unit expiration dates
- **Reservation System**: Manage reserved vs. available units
- **Real-time Updates**: Automatic inventory updates based on donations and usage

## Access

### URL
- **Manager Dashboard**: `/bloodbank/manager`
- **Standard Dashboard**: `/bloodbank/dashboard`

### Authentication
- **Role Required**: `bloodbank` (Blood Bank Manager)
- **Authentication**: JWT token-based authentication
- **Authorization**: Role-based access control

## API Endpoints

### Analytics
- `GET /api/bloodbank-manager/analytics` - Dashboard analytics and statistics

### Bookings
- `GET /api/bloodbank-manager/bookings` - List bookings with filtering
- `PUT /api/bloodbank-manager/bookings/:id/status` - Update booking status

### Patients
- `GET /api/bloodbank-manager/patients` - List patients
- `POST /api/bloodbank-manager/patients` - Create new patient
- `PUT /api/bloodbank-manager/patients/:id` - Update patient
- `DELETE /api/bloodbank-manager/patients/:id` - Delete patient (soft delete)

### Staff
- `GET /api/bloodbank-manager/staff` - List staff members
- `POST /api/bloodbank-manager/staff` - Create new staff member
- `PUT /api/bloodbank-manager/staff/:id` - Update staff member
- `DELETE /api/bloodbank-manager/staff/:id` - Delete staff member

### Donation Requests
- `GET /api/bloodbank-manager/donation-requests` - List donation requests

### Inventory
- `GET /api/bloodbank-manager/inventory` - Blood inventory status

### Blood Bank Details
- `GET /api/bloodbank-manager/details` - Blood bank information

## Technology Stack

### Frontend
- **React 18** with functional components and hooks
- **Tailwind CSS** for responsive styling
- **Heroicons** for consistent iconography
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Role-based middleware** for authorization

## Key Components

### Dashboard Layout
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Dark Mode Support**: Automatic theme switching
- **Tab Navigation**: Organized sections for different management areas
- **Modal System**: Consistent modal dialogs for forms and confirmations

### Data Management
- **Real-time Updates**: Automatic data refresh on actions
- **Optimistic Updates**: Immediate UI feedback with server validation
- **Error Handling**: Comprehensive error messages and recovery
- **Loading States**: Visual feedback during data operations

### Security Features
- **Role-based Access**: Restricted to blood bank managers only
- **Input Validation**: Client and server-side validation
- **Secure API**: Protected endpoints with authentication middleware
- **Data Sanitization**: Clean and validate all user inputs

## Usage Instructions

### Getting Started
1. **Login**: Use blood bank manager credentials
2. **Navigation**: Access via "Manager Dashboard" link in the main dashboard
3. **Overview**: Start with the overview tab to see key metrics
4. **Management**: Use specific tabs for different management tasks

### Managing Patients
1. Click "Patients" tab
2. Use "Add Patient" button to register new patients
3. Fill in required information including MRID, blood group, and units needed
4. Track fulfillment status and update as needed

### Managing Staff
1. Navigate to "Staff" tab
2. Click "Add Staff" to create new staff members
3. Assign appropriate roles based on responsibilities
4. Save generated credentials securely for new staff

### Booking Operations
1. Use "Bookings" tab for all booking management
2. Apply filters to find specific bookings
3. Update booking status as donations progress
4. Monitor completion rates and trends

### Monitoring Analytics
1. Overview tab provides real-time dashboard
2. Review blood group distribution for inventory planning
3. Track monthly trends for performance analysis
4. Monitor recent activity for operational awareness

## Benefits

### Operational Efficiency
- **Centralized Management**: All operations in one interface
- **Quick Access**: Fast navigation between different management areas
- **Real-time Data**: Up-to-date information for better decision making
- **Automated Workflows**: Streamlined processes for common tasks

### Better Patient Care
- **Patient Tracking**: Monitor patient needs and fulfillment
- **Quick Response**: Faster processing of donation requests
- **Inventory Management**: Ensure blood availability when needed
- **Staff Coordination**: Better staff management for improved service

### Data-Driven Decisions
- **Analytics Dashboard**: Key metrics and trends
- **Performance Tracking**: Monitor operational efficiency
- **Resource Planning**: Data for inventory and staff planning
- **Quality Improvement**: Identify areas for enhancement

## Future Enhancements

### Planned Features
- **Advanced Reporting**: Detailed reports and exports
- **Notification System**: Real-time alerts and notifications
- **Mobile App**: Dedicated mobile application
- **Integration**: Connect with hospital management systems
- **AI Analytics**: Predictive analytics for demand forecasting

### Scalability
- **Multi-location Support**: Manage multiple blood bank locations
- **API Extensions**: Additional endpoints for third-party integrations
- **Performance Optimization**: Enhanced caching and data loading
- **Advanced Security**: Additional security measures and compliance

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

## Version

**Current Version**: 1.0.0
**Last Updated**: January 2025
**Compatibility**: Modern browsers with JavaScript enabled