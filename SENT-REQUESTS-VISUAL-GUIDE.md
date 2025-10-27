# Sent Requests - Visual Guide

## 📤 My Requests → Sent Requests Tab

### What You'll See Now

---

## Request Status Workflow

### 1️⃣ **PENDING** - Waiting for Donor Response
```
┌─────────────────────────────────────┐
│ Status: ⏳ PENDING                  │
│                                     │
│ Actions:                            │
│ ┌─────────────────────────────────┐ │
│ │      🚫 Cancel                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```
**You can:** Cancel your request

---

### 2️⃣ **ACCEPTED** - Donor Agreed, Slot Not Booked Yet
```
┌─────────────────────────────────────┐
│ Status: ✅ ACCEPTED                 │
│                                     │
│ Actions:                            │
│ ┌─────────────────────────────────┐ │
│ │      🚖 Book Taxi               │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │      🚫 Cancel                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```
**You can:** 
- Book taxi in advance (optional)
- Cancel your request

---

### 3️⃣ **BOOKED** - Donation Slot Confirmed ⭐ NEW ENHANCEMENT
```
┌─────────────────────────────────────┐
│ Status: 🎫 BOOKED                   │
│                                     │
│ Actions:                            │
│ ┌─────────────────────────────────┐ │
│ │      📋 View Details            │ │
│ │   (Purple-Pink Gradient)        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │      🚖 Book Taxi               │ │
│ │   (Yellow-Orange Gradient)      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```
**You can:**
- **View Details**: See booking info, slot time, download PDF
- **Book Taxi**: Book taxi for your donation appointment

---

### 4️⃣ **REJECTED** / **CANCELLED** / **COMPLETED**
```
┌─────────────────────────────────────┐
│ Status: ❌ REJECTED                 │
│                                     │
│ Actions:                            │
│ ┌─────────────────────────────────┐ │
│ │      👁️ View                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```
**You can:** View request details only

---

## 🚖 How to Book a Taxi

### Step 1: Go to "My Requests" Tab
Click on **"My Requests"** in the dashboard navigation

### Step 2: Select "Sent Requests"
Click on **"📤 Sent Requests"** tab (not "Received Requests")

### Step 3: Find Your Booked Request
Look for requests with **🎫 BOOKED** status badge

### Step 4: Click "Book Taxi"
Click the **🚖 Book Taxi** button (yellow-orange gradient)

### Step 5: Fill Taxi Booking Details
- Pickup location
- Pickup date/time
- Number of passengers
- Special requirements (optional)

### Step 6: Complete Payment
- Review taxi fare
- Pay via Razorpay
- Get confirmation

### Step 7: View Confirmation
- Download taxi booking PDF
- Receive email/SMS confirmation
- View booking details anytime

---

## 📋 View Details Features

Click **"📋 View Details"** to see:
- ✅ Donation slot date and time
- ✅ Blood bank name and address
- ✅ Patient information (MRID)
- ✅ Blood group required
- ✅ Booking confirmation number
- ✅ Download booking PDF
- ✅ QR code for check-in

---

## Complete Table View

```
┌──────────┬──────┬────────┬──────────┬────────┬──────────────────┬────────┬──────────────┬──────────────┬──────────────────────┐
│    ID    │ From │   To   │  Blood   │ Status │   Requested      │ Active │  Blood Bank  │   Patient    │       Actions        │
│          │      │        │  Group   │        │                  │        │              │              │                      │
├──────────┼──────┼────────┼──────────┼────────┼──────────────────┼────────┼──────────────┼──────────────┼──────────────────────┤
│ 67a3f... │  Me  │ John D │   A+     │⏳ PEND │ Oct 27, 10:30 AM │  Yes   │ 🏥 City BB   │👤 Jane Smith │   🚫 Cancel         │
├──────────┼──────┼────────┼──────────┼────────┼──────────────────┼────────┼──────────────┼──────────────┼──────────────────────┤
│ 67a3e... │  Me  │ Sarah  │   B+     │✅ ACCP │ Oct 27, 09:15 AM │  Yes   │ 🏥 Central   │👤 John Doe   │   🚖 Book Taxi      │
│          │      │        │          │        │                  │        │              │              │   🚫 Cancel         │
├──────────┼──────┼────────┼──────────┼────────┼──────────────────┼────────┼──────────────┼──────────────┼──────────────────────┤
│ 67a3d... │  Me  │ Mike R │   O+     │🎫 BOOK │ Oct 26, 02:45 PM │  Yes   │ 🏥 Apollo    │👤 Mary Jane  │   📋 View Details   │
│          │      │        │          │        │                  │        │              │  MRID: M12345│   🚖 Book Taxi      │
├──────────┼──────┼────────┼──────────┼────────┼──────────────────┼────────┼──────────────┼──────────────┼──────────────────────┤
│ 67a3c... │  Me  │ Lisa W │   AB+    │❌ REJ  │ Oct 25, 11:20 AM │  No    │ 🏥 Med Plus  │👤 Tom Brown  │   👁️ View          │
└──────────┴──────┴────────┴──────────┴────────┴──────────────────┴────────┴──────────────┴──────────────┴──────────────────────┘
```

---

## Mobile View (Responsive)

On mobile devices, buttons stack vertically and take full width:

```
┌─────────────────────────┐
│ Request: 67a3d...       │
│ Status: 🎫 BOOKED       │
│                         │
│ ┌─────────────────────┐ │
│ │  📋 View Details    │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │   🚖 Book Taxi      │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

---

## Key Features

### ✨ Visual Enhancements
- 🎨 **Gradient Buttons**: Modern, eye-catching design
- 🎯 **Clear Hierarchy**: Most important actions first
- 📱 **Mobile Friendly**: Buttons stack nicely on small screens
- ⚡ **Hover Effects**: Smooth transitions on mouse over
- 🔍 **Clickable ID**: Click request ID to view full details

### 🔔 Status Indicators
- ⏳ **Pending**: Yellow badge
- ✅ **Accepted**: Green badge
- 🎫 **Booked**: Purple badge
- ❌ **Rejected**: Red badge
- 🚫 **Cancelled**: Gray badge
- 🎉 **Completed**: Emerald badge

### 🎯 Quick Actions
- Click **ID** → View full request details
- Click **View Details** → See booking info + download PDF
- Click **Book Taxi** → Open taxi booking modal
- Click **Cancel** → Cancel your request

---

## Benefits

✅ **Easy to Find**: Book Taxi button is now prominent in Actions column  
✅ **Consistent**: Same UI as Received Requests tab  
✅ **Complete**: All actions (View + Taxi + Cancel) in one place  
✅ **Visual**: Gradient colors help identify button purpose  
✅ **Efficient**: Fewer clicks to book a taxi  

---

## Tips

💡 **Book taxi early**: You can book taxi as soon as request is accepted  
💡 **View details first**: Check slot time before booking taxi  
💡 **Save PDF**: Download booking PDF for reference  
💡 **Check status**: Status badge shows current request state  
💡 **Mobile friendly**: Works great on phones and tablets  

---

## Need Help?

If you don't see the "Book Taxi" button:
1. ✅ Check request status - must be **BOOKED** or **ACCEPTED**
2. ✅ Refresh the page
3. ✅ Make sure you're in **"Sent Requests"** tab (not Received)
4. ✅ Verify the booking has been confirmed by the blood bank

---

**Last Updated:** October 27, 2025  
**Feature:** Enhanced Sent Requests with Book Taxi Option  
**Status:** ✅ Live and Ready to Use

