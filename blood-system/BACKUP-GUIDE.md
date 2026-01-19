# Blood Donation System - Backup & Restore Guide

## 📦 Available Backup Scripts

### 1. **Complete Backup** (Recommended)
Backs up everything: database, uploads, and configuration.

```powershell
.\backup-all.ps1
```

**Output:** `.\backups\complete\[timestamp]\`

---

### 2. **Database Only**
Backs up MongoDB database in both BSON (restorable) and JSON (readable) formats.

```powershell
.\backup-database.ps1
```

**Output:** `.\backups\mongodb\[timestamp]\`

---

### 3. **Uploads Only**
Backs up all uploaded profile images.

```powershell
.\backup-uploads.ps1
```

**Output:** `.\backups\uploads\[timestamp]\`

---

## 🔄 Restore Instructions

### Restore Database
```powershell
.\restore-database.ps1 -BackupPath ".\backups\mongodb\2026-01-16_14-30-00"
```

### Restore Uploads
```powershell
docker cp ".\backups\uploads\2026-01-16_14-30-00\uploads" blood-backend-donor:/app/
docker compose restart backend-donor
```

---

## 📅 Backup Schedule Recommendations

| Frequency | Type | Retention |
|-----------|------|-----------|
| **Daily** | Database only | Keep 7 days |
| **Weekly** | Complete backup | Keep 4 weeks |
| **Monthly** | Complete backup | Keep 12 months |

---

## 🗂️ Backup Structure

```
backups/
├── complete/
│   └── 2026-01-16_14-30-00/
│       ├── database/
│       │   ├── blood-monolith/ (BSON)
│       │   ├── json/ (JSON exports)
│       │   └── backup-info.json
│       ├── uploads/
│       │   └── uploads/profiles/
│       ├── config/
│       │   ├── docker-compose.yml
│       │   └── nginx-configs/
│       ├── docker-volumes.txt
│       ├── docker-containers.txt
│       ├── backup-manifest.json
│       └── README.txt
│
├── mongodb/
│   └── 2026-01-16_14-30-00/
│       ├── blood-monolith/
│       ├── json/
│       └── backup-info.json
│
└── uploads/
    └── 2026-01-16_14-30-00/
        ├── uploads/
        └── backup-info.json
```

---

## 💡 Quick Commands

### Create a backup right now
```powershell
cd D:\BloodDonation\blood-system
.\backup-all.ps1
```

### List all backups
```powershell
Get-ChildItem .\backups -Recurse -Directory | Where-Object { $_.Name -match '\d{4}-\d{2}-\d{2}' } | Select-Object FullName, CreationTime | Sort-Object CreationTime -Descending
```

### Check backup size
```powershell
$size = (Get-ChildItem .\backups -Recurse | Measure-Object -Property Length -Sum).Sum
[math]::Round($size / 1MB, 2)
```

### Delete old backups (older than 30 days)
```powershell
Get-ChildItem .\backups -Recurse -Directory | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Recurse -Force
```

---

## 🚨 Emergency Recovery

If your system crashes or data is corrupted:

1. **Stop all containers**
   ```powershell
   docker compose down
   ```

2. **Restore from latest backup**
   ```powershell
   $latest = Get-ChildItem .\backups\complete -Directory | Sort-Object CreationTime -Descending | Select-Object -First 1
   .\restore-database.ps1 -BackupPath "$($latest.FullName)\database"
   ```

3. **Restart containers**
   ```powershell
   docker compose up -d
   ```

---

## 📤 Export Data for Analysis

### Export specific collection to CSV
```powershell
docker exec blood-db mongoexport --db=blood-monolith --collection=users --type=csv --fields=_id,name,email,role --out=/tmp/users.csv
docker cp blood-db:/tmp/users.csv .\users.csv
```

### Export all data to JSON
```powershell
.\backup-database.ps1
# JSON files will be in: .\backups\mongodb\[timestamp]\json\
```

---

## 🔐 Security Notes

- ⚠️ Backups contain **sensitive data** (passwords are hashed, but still sensitive)
- 🔒 Store backups in a **secure location**
- 💾 Consider **encrypting** backups before cloud storage
- 🗑️ **Delete old backups** regularly to save space

---

## ❓ Troubleshooting

### "Container not running" error
```powershell
docker compose up -d
```

### Backup script permission denied
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Restore fails with "duplicate key error"
The database already has data. Use `--drop` flag (already included in restore script).

---

## 📞 Support

For issues or questions:
1. Check Docker container logs: `docker logs blood-db`
2. Verify containers are running: `docker ps`
3. Check disk space: `docker system df`

---

**Last Updated:** 2026-01-16
