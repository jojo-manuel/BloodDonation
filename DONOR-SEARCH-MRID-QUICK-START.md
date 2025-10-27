# 🚀 Donor Search by MRID - Quick Start Guide

## What Was Created

✅ **Complete BDD test suite** for searching donors using patient MRID

### Files Created:
1. `frontend/features/donor-search-by-mrid.feature` - **28 test scenarios**
2. `frontend/features/step_definitions/donor_search_by_mrid_steps.cjs` - Step implementations
3. `run-donor-search-mrid-test.bat` - Test runner script
4. Updated `frontend/package.json` - Added test script

---

## Quick Run

### Method 1: NPM (Recommended)
```bash
cd frontend
npm run test:bdd:donor-search-mrid
```

### Method 2: Batch File
```bash
run-donor-search-mrid-test.bat
```

---

## Prerequisites

✅ Frontend running: http://localhost:5173
✅ Backend running: http://localhost:5000
✅ Blood bank user: bloodbank1/password123
✅ Chrome browser installed

---

## What Does It Test?

### Core Features:
✅ Search donors by patient MRID
✅ Blood group matching (A+, A-, B+, B-, O+, O-, AB+, AB-)
✅ Patient information display
✅ Donor eligibility status
✅ Blocked/suspended donor filtering
✅ Case-insensitive search
✅ Partial MRID search
✅ Error validation
✅ Loading states
✅ Integration with donation requests

### Test Coverage:
- **28 scenarios**
- **~156 test steps**
- **Runtime**: 2-3 minutes

---

## Example Test Scenarios

### 1. Success Case
```gherkin
Given a patient with MRID "MR123456" exists with blood group "A+"
When I search for donors using MRID "MR123456"
Then I see compatible donors with blood group "A+"
```

### 2. Validation
```gherkin
When I leave MRID field empty
Then I see error "Please enter a patient MRID to search"
```

### 3. Filtering
```gherkin
Given blocked donors exist
When I search by MRID
Then blocked donors should NOT appear in results
```

---

## Test Tags

Run specific test types:

```bash
# Critical tests only
npx cucumber-js features/donor-search-by-mrid.feature --tags "@critical"

# Validation tests
npx cucumber-js features/donor-search-by-mrid.feature --tags "@validation"

# Blood group matching
npx cucumber-js features/donor-search-by-mrid.feature --tags "@bloodgroup-matching"

# UI tests
npx cucumber-js features/donor-search-by-mrid.feature --tags "@ui"
```

---

## How It Works

```
1. Blood Bank logs in
   ↓
2. Enters patient MRID (e.g., "MR123456")
   ↓
3. System finds patient → Gets blood group
   ↓
4. System searches compatible donors
   ↓
5. Filters blocked/suspended donors
   ↓
6. Shows eligible donors + patient info
   ↓
7. Can send donation requests
```

---

## Troubleshooting

### "Patient not found"
→ Create test patients with MRIDs in database

### "Login failed"
→ Update credentials in `donor_search_by_mrid_steps.cjs` (line 38)

### "No donors found"
→ Ensure donors exist for the blood group

### Servers not running
```bash
# Start frontend
cd frontend && npm run dev

# Start backend (different terminal)
cd backend && npm start
```

---

## File Locations

```
frontend/
├── features/
│   ├── donor-search-by-mrid.feature          ← Feature file
│   └── step_definitions/
│       └── donor_search_by_mrid_steps.cjs    ← Step definitions
├── package.json                               ← Updated scripts
└── cucumber.cjs                               ← Configuration

run-donor-search-mrid-test.bat                ← Test runner
```

---

## Expected Output

```
Feature: Donor Search by Patient MRID

  ✓ Successfully find donors using valid patient MRID
  ✓ Search with empty MRID field
  ✓ Search with non-existent MRID
  ✓ Search for patient with no matching donors
  ✓ Search donors for different blood groups (6 examples)
  ✓ Case-insensitive search
  ✓ Partial MRID search
  ... (continues)

28 scenarios (28 passed)
156 steps (156 passed)
Duration: 2m 15s
```

---

## Complete Documentation

📚 **Full Guide**: `DONOR-SEARCH-MRID-BDD-COMPLETE.md`

---

**Status**: ✅ Ready to Run
**Version**: 1.0
**Date**: October 27, 2025

