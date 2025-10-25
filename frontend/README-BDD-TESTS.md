# 🥒 BDD Testing - Quick Reference Card

## ⚡ Run Tests NOW!

```bash
# Test Everything (52 scenarios)
npm run test:bdd

# Test Individual Features
npm run test:bdd:login              # Login (13 scenarios)
npm run test:bdd:donor-booking      # Donor Booking (10 scenarios)
npm run test:bdd:patient            # Patient Management (12 scenarios)
npm run test:bdd:donor-slots        # Donor Slot Booking (17 scenarios)

# Generate HTML Report
npm run test:bdd:report
```

---

## 📋 What Each Feature Tests

### 1. Login Feature 🔐
- User authentication
- Password validation
- Firebase login
- Forgot password
- Form validation

### 2. Donor Booking Feature 🩸
- Search donors by blood group
- Book appointments
- Manage booking requests
- Emergency bookings
- Donor profiles

### 3. Patient Management Feature 🏥
- Add patient records
- Search by MR ID
- Update patient info
- Fulfill requests
- Export reports

### 4. Donor Slot Booking Feature 🎫
- Book donation slots
- View available slots
- Cancel/reschedule
- Taxi booking
- Payment integration
- Download certificates

---

## 🏷️ Test by Tags

```bash
npm run test:bdd:tags "@smoke"      # Critical path
npm run test:bdd:tags "@critical"   # Business critical
npm run test:bdd:tags "@booking"    # Booking features
npm run test:bdd:tags "@patient"    # Patient features
npm run test:bdd:tags "@slots"      # Slot features
```

---

## 📊 Test Count: 52 Scenarios

| Feature | Count | Status |
|---------|-------|--------|
| Login | 13 | ✅ Ready |
| Donor Booking | 10 | ✅ Ready |
| Patient Management | 12 | ✅ Ready |
| Donor Slot Booking | 17 | ✅ Ready |

---

## 📚 Full Documentation

1. **Quick Start:** `BDD-QUICK-START.md`
2. **Separate Tests:** `BDD-SEPARATE-TESTS-GUIDE.md`
3. **All Scenarios:** `BDD-ALL-SCENARIOS.md`
4. **Complete Guide:** `BDD-TESTING-GUIDE.md`

---

## 🎯 Common Commands

```bash
# Run single feature file
npx cucumber-js features/login.feature

# Run specific scenario (line 20)
npx cucumber-js features/login.feature:20

# Run multiple features
npx cucumber-js features/login.feature features/donor-booking.feature

# Run with specific tag
npm run test:bdd:tags "@smoke and @booking"
```

---

## ✨ You Have

✅ 52 test scenarios  
✅ 4 feature files  
✅ Complete system coverage  
✅ Individual test commands  
✅ Tag-based filtering  
✅ HTML reporting  
✅ Real-world test cases  

**Start testing!** 🚀

