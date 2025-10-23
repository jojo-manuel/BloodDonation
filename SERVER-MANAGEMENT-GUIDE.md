# Server Management Guide

## 🚨 Problem: Port Already in Use

### Error Message:
```
Error: listen EADDRINUSE: address already in use :::5000
```

This means another process is already using port 5000.

---

## ✅ **QUICK SOLUTION**

### **Option 1: Use Helper Scripts (Easiest)**

I've created automated scripts for you:

#### **Kill Port 5000:**
```bash
kill-port-5000.bat
```
Double-click this file to kill any process using port 5000.

#### **Start Both Servers:**
```bash
start-servers.bat
```
This will:
- ✅ Check and free port 5000 if needed
- ✅ Start backend in a new window
- ✅ Start frontend in a new window

#### **Stop All Servers:**
```bash
stop-servers.bat
```
This will stop both backend and frontend servers.

---

### **Option 2: Manual PowerShell Commands**

#### **Find Process Using Port 5000:**
```powershell
netstat -ano | findstr :5000
```

Output shows PID (Process ID):
```
TCP    0.0.0.0:5000    0.0.0.0:0    LISTENING    22456
                                                  ↑
                                               PID here
```

#### **Kill the Process:**
```powershell
# Replace 22456 with your actual PID
Stop-Process -Id 22456 -Force
```

#### **One-Liner to Kill Port 5000:**
```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

### **Option 3: Manual Task Manager**

1. Open **Task Manager** (Ctrl + Shift + Esc)
2. Go to **Details** tab
3. Find **node.exe** processes
4. Right-click → **End Task**

---

## 🎯 **Best Practices**

### **Starting Servers:**

#### **Backend:**
```bash
# Method 1: Using existing batch file
start_backend.bat

# Method 2: Manually
cd backend
node server.js
```

#### **Frontend:**
```bash
# Method 1: Using existing batch file
start_frontend.bat

# Method 2: Manually
cd frontend
npm run dev
```

#### **Both at Once:**
```bash
start-servers.bat
```

---

### **Stopping Servers:**

#### **Graceful Shutdown:**
- Press **Ctrl + C** in the terminal window
- Type `Y` if prompted

#### **Force Stop:**
```bash
stop-servers.bat
```

---

## 📋 **Server Status Check**

### **Check if Backend is Running:**
```powershell
curl http://localhost:5000
```

Expected response:
```json
{"success":false,"message":"Route not found"}
```
(This is normal - it means server is running)

### **Check if Frontend is Running:**
```powershell
curl http://localhost:5173
```

Should return HTML content.

### **Check Ports:**
```powershell
# Backend (port 5000)
netstat -ano | findstr :5000

# Frontend (port 5173)  
netstat -ano | findstr :5173
```

---

## 🐛 **Troubleshooting**

### **Problem: Backend won't start**

1. **Check if port is free:**
   ```bash
   netstat -ano | findstr :5000
   ```

2. **Kill existing process:**
   ```bash
   kill-port-5000.bat
   ```

3. **Check MongoDB connection:**
   ```bash
   cd backend
   node verify-mongodb-atlas.js
   ```

4. **Start backend:**
   ```bash
   node server.js
   ```

### **Problem: Frontend won't start**

1. **Check if port 5173 is free:**
   ```bash
   netstat -ano | findstr :5173
   ```

2. **Kill existing process:**
   ```bash
   Get-NetTCPConnection -LocalPort 5173 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```

3. **Clear cache and reinstall:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

### **Problem: Multiple Node processes running**

**View all node processes:**
```powershell
Get-Process node
```

**Kill all node processes (careful!):**
```powershell
Stop-Process -Name node -Force
```

---

## 🎮 **Quick Commands Reference**

| Action | Command |
|--------|---------|
| Kill port 5000 | `kill-port-5000.bat` |
| Start both servers | `start-servers.bat` |
| Stop all servers | `stop-servers.bat` |
| Start backend only | `cd backend && node server.js` |
| Start frontend only | `cd frontend && npm run dev` |
| Check backend | `curl http://localhost:5000` |
| Check frontend | `curl http://localhost:5173` |
| List all ports | `netstat -ano | findstr LISTENING` |

---

## 🚀 **Running Playwright E2E Tests**

### **Prerequisites:**
1. ✅ Backend running (port 5000)
2. ✅ Frontend will auto-start via Playwright config

### **Run Tests:**

#### **Option 1: Interactive UI (Recommended)**
```bash
cd frontend
npm run test:playwright:ui
```

#### **Option 2: Headless (All Tests)**
```bash
cd frontend
npm run test:playwright
```

#### **Option 3: See Browser (Headed Mode)**
```bash
cd frontend
npm run test:playwright:headed
```

#### **Option 4: Use Batch Script**
```bash
cd frontend
run-e2e-tests.bat
```

---

## 📊 **Server URLs**

| Service | URL | Port |
|---------|-----|------|
| Backend API | http://localhost:5000 | 5000 |
| Frontend App | http://localhost:5173 | 5173 |
| MongoDB Atlas | cloud.mongodb.com | 27017 |

---

## ✨ **Tips**

1. **Always check ports before starting servers**
2. **Use batch scripts for convenience**
3. **Close server windows properly (Ctrl+C)**
4. **Run `stop-servers.bat` before shutting down**
5. **Check MongoDB connection before starting backend**

---

## 🎉 **Summary**

You now have:
- ✅ **kill-port-5000.bat** - Kill port 5000 process
- ✅ **start-servers.bat** - Start both servers automatically
- ✅ **stop-servers.bat** - Stop all servers
- ✅ **MongoDB connection fixed**
- ✅ **Comprehensive E2E test suite with Playwright**

**To run your application:**
```bash
start-servers.bat
```

**To run E2E tests:**
```bash
cd frontend
npm run test:playwright:ui
```

**Done! 🚀**

