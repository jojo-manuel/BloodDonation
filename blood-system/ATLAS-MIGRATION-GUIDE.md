# MongoDB Atlas Migration Guide

This guide will help you migrate your blood donation system database from the local MongoDB container to MongoDB Atlas cloud service.

## 📋 Prerequisites

1. **MongoDB Atlas Account**: Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Atlas Cluster**: Set up a cluster in Atlas
3. **Connection String**: Get your Atlas connection string
4. **MongoDB Tools**: Install MongoDB Database Tools (optional, for manual backup/restore)
5. **Node.js**: Ensure Node.js is installed for the migration scripts

## 🚀 Quick Migration (Recommended)

### Step 1: Prepare Atlas Connection String

1. Log in to MongoDB Atlas
2. Go to your cluster and click "Connect"
3. Choose "Connect your application"
4. Copy the connection string (it should look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/bloodbank?retryWrites=true&w=majority
   ```

### Step 2: Run the Migration Script

```powershell
# Navigate to the blood-system directory
cd blood-system

# Run the migration (replace with your actual Atlas connection string)
$env:MONGODB_ATLAS_URI="mongodb+srv://username:password@cluster.mongodb.net/bloodbank?retryWrites=true&w=majority"
node migrate-to-atlas.js
```

Or use the PowerShell wrapper:

```powershell
.\migrate-to-atlas.ps1 -AtlasConnectionString "mongodb+srv://username:password@cluster.mongodb.net/bloodbank?retryWrites=true&w=majority"
```

### Step 3: Update Application Configuration

Update your application's environment variables to use the Atlas connection string:

```bash
# In your .env files
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bloodbank?retryWrites=true&w=majority
```

## 🛠️ Manual Migration Steps

### Step 1: Create Backup

```powershell
# Create a backup of your local database
.\backup-database.ps1
```

This will create a backup in the `database-backup` directory.

### Step 2: Restore to Atlas

```powershell
# Restore the backup to Atlas
.\restore-to-atlas.ps1 -AtlasConnectionString "your-atlas-connection-string" -BackupPath ".\database-backup\bloodbank-backup-YYYY-MM-DD_HH-mm-ss"
```

## 📊 Migration Script Features

### Automated Migration (`migrate-to-atlas.js`)

- ✅ **Automatic Discovery**: Finds all collections in your local database
- ✅ **Backup Creation**: Creates local JSON backups before migration
- ✅ **Batch Processing**: Migrates data in batches for efficiency
- ✅ **Error Handling**: Continues migration even if some documents fail
- ✅ **Index Creation**: Recreates important indexes in Atlas
- ✅ **Verification**: Verifies document counts after migration
- ✅ **Detailed Reporting**: Generates comprehensive migration reports

### Collections Migrated

The script will migrate all collections found in your database, including:

- `users` - User accounts and authentication data
- `patients` - Patient records and medical information
- `bookings` - Appointment and booking data
- `bloodbags` - Blood bag inventory and tracking
- `bloodcomponents` - Separated blood components
- `bloodinventories` - Blood inventory management
- `activities` - System activity logs
- `notifications` - User notifications
- And any other collections in your database

## 🔧 Advanced Options

### Dry Run (Test Migration)

```powershell
# Test the migration without actually moving data
.\migrate-to-atlas.ps1 -AtlasConnectionString "your-connection-string" -DryRun
```

### Backup Only

```powershell
# Create backup without migrating
.\migrate-to-atlas.ps1 -AtlasConnectionString "your-connection-string" -BackupOnly
```

### Custom Database Name

```powershell
# Migrate to a different database name
.\restore-to-atlas.ps1 -AtlasConnectionString "your-connection-string" -BackupPath "backup-path" -DatabaseName "bloodbank_prod"
```

## 📁 File Structure After Migration

```
blood-system/
├── migrate-to-atlas.js          # Main migration script
├── migrate-to-atlas.ps1         # PowerShell wrapper
├── backup-database.ps1          # Backup script
├── restore-to-atlas.ps1         # Restore script
├── migration-backup/            # Local backups (JSON format)
│   ├── users.json
│   ├── patients.json
│   ├── bookings.json
│   └── ...
├── migration-report.json        # Detailed migration report
└── database-backup/             # MongoDB dump backups
    └── bloodbank-backup-YYYY-MM-DD_HH-mm-ss/
```

## 🔍 Verification Steps

After migration, verify your data:

1. **Check Collection Counts**:
   ```javascript
   // In MongoDB Atlas console or Compass
   db.users.countDocuments()
   db.patients.countDocuments()
   db.bookings.countDocuments()
   ```

2. **Test Application**:
   - Update your application's connection string
   - Start your application
   - Test login functionality
   - Test data retrieval and creation

3. **Check Migration Report**:
   - Review `migration-report.json` for any errors
   - Verify all collections were migrated successfully

## 🚨 Troubleshooting

### Common Issues

1. **Connection Timeout**:
   - Check your Atlas cluster is running
   - Verify network access (whitelist your IP)
   - Ensure connection string is correct

2. **Authentication Failed**:
   - Verify username and password in connection string
   - Check database user permissions in Atlas

3. **Duplicate Key Errors**:
   - The script handles these automatically
   - Check migration report for details

4. **Large Database**:
   - Migration may take time for large datasets
   - Consider migrating during low-traffic periods

### Getting Help

If you encounter issues:

1. Check the migration report (`migration-report.json`)
2. Review backup files in `migration-backup/`
3. Check Atlas cluster status and logs
4. Verify network connectivity and firewall settings

## 🔄 Rollback Plan

If you need to rollback:

1. **Keep Local Container**: Don't delete your local MongoDB container until migration is verified
2. **Use Backups**: Restore from the backup files created during migration
3. **Revert Connection Strings**: Change your application back to local MongoDB

## 📈 Post-Migration Optimization

After successful migration:

1. **Set up Monitoring**: Enable Atlas monitoring and alerts
2. **Configure Backups**: Set up automated backups in Atlas
3. **Optimize Performance**: Review and optimize indexes
4. **Security**: Review security settings and access controls
5. **Scaling**: Configure auto-scaling if needed

## 🎯 Next Steps

1. **Update Environment Variables**: Update all your services to use Atlas
2. **Test Thoroughly**: Test all application functionality
3. **Monitor Performance**: Watch for any performance issues
4. **Clean Up**: Once verified, you can stop the local MongoDB container
5. **Documentation**: Update your deployment documentation

## 📞 Support

For Atlas-specific issues:
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Community Forums](https://community.mongodb.com/)
- [Atlas Support](https://support.mongodb.com/)

---

**⚠️ Important**: Always test the migration in a development environment first before migrating production data!