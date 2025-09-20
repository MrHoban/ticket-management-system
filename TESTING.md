# 🧪 Testing Guide for Ticket Management System

Thank you for testing our ticket management system! This guide will help you explore all the features.

## 🚀 Quick Start for Testers

### If Testing Locally:
1. Clone the repository: `git clone https://github.com/MrHoban/ticket-management-system.git`
2. Install dependencies: `npm install && pip install -r requirements.txt`
3. Start the server: `npm start`
4. Open: http://localhost:3000

### If Testing Live Deployment:
- Visit the provided URL (e.g., https://your-app.onrender.com)

## 🎯 Test Scenarios

### 👤 **Customer Experience Testing**

1. **Submit a Support Ticket:**
   - Go to `/submit` or the main page
   - Fill out the form with test data:
     - Name: Your Name
     - Email: test@example.com
     - Phone: 555-123-4567
     - Device: Test Device
     - Description: Test issue description
   - Submit and note the ticket ID

2. **Test Form Validation:**
   - Try submitting with missing fields
   - Test with invalid email formats
   - Verify error messages appear

### 🔐 **Staff Authentication Testing**

1. **Access Staff Dashboard:**
   - Try to go to `/board` directly
   - Should redirect to login page

2. **Test Login:**
   - **Valid Credentials:**
     - Username: `admin`
     - Password: `admin123`
   - **Invalid Credentials:**
     - Try wrong username/password
     - Verify error messages

3. **Test Authentication Flow:**
   - Login successfully
   - Verify redirect to dashboard
   - Check user info in header
   - Test logout functionality

### 📊 **Dashboard & Ticket Management Testing**

1. **Dashboard Overview:**
   - View ticket statistics cards
   - Check if submitted tickets appear
   - Test auto-refresh (wait 30 seconds)

2. **Filtering & Search:**
   - Filter by status (Open, In Progress, Resolved, Closed)
   - Filter by priority (Low, Medium, High, Urgent)
   - Search by customer name, email, or device
   - Test "Clear Filters" functionality

3. **Ticket Management:**
   - Click on a ticket to open details
   - Update ticket status
   - Change priority level
   - Assign to staff member
   - Add notes to ticket
   - Save changes and verify updates

4. **View Toggles:**
   - Switch between Grid and List view
   - Test responsive design on mobile

### 🔄 **Workflow Testing**

1. **Complete Ticket Lifecycle:**
   - Submit a new ticket as customer
   - Login as staff
   - Find the new ticket
   - Move through statuses: Open → In Progress → Resolved → Closed
   - Add notes at each stage

2. **Multi-User Simulation:**
   - Submit multiple tickets with different data
   - Test bulk management
   - Verify data persistence

### 🛡️ **Security Testing**

1. **Protected Routes:**
   - Try accessing `/board` without login
   - Try accessing `/ticket/123` without login
   - Verify redirects work properly

2. **API Protection:**
   - Try making API calls without authentication
   - Test session timeout (wait 24 hours or restart server)

3. **Data Validation:**
   - Test XSS prevention in form fields
   - Try SQL injection patterns (should be safe with JSON storage)

## 🐛 **What to Look For**

### ✅ **Expected Behavior:**
- Smooth navigation between pages
- Forms submit successfully
- Authentication works properly
- Data persists between sessions
- Responsive design on different screen sizes
- Error messages are helpful and clear

### ❌ **Report These Issues:**
- Broken links or 404 errors
- Forms that don't submit
- Login/logout problems
- Data that doesn't save
- UI elements that don't work
- Mobile responsiveness issues
- Performance problems

## 📝 **Feedback Template**

Please provide feedback using this format:

```
## Test Environment
- Browser: [Chrome/Firefox/Safari/Edge]
- Device: [Desktop/Mobile/Tablet]
- Screen Size: [e.g., 1920x1080]

## Features Tested
- [ ] Customer ticket submission
- [ ] Staff authentication
- [ ] Dashboard navigation
- [ ] Ticket management
- [ ] Filtering and search
- [ ] Mobile responsiveness

## Issues Found
1. **Issue Description:** [Brief description]
   - **Steps to Reproduce:** [How to recreate the issue]
   - **Expected:** [What should happen]
   - **Actual:** [What actually happened]
   - **Severity:** [Low/Medium/High/Critical]

## Positive Feedback
- [What worked well]
- [Features you liked]
- [Suggestions for improvement]

## Overall Rating
- Functionality: [1-5 stars]
- User Experience: [1-5 stars]
- Design: [1-5 stars]
```

## 🎯 **Test Data Suggestions**

Use these sample data sets for testing:

### Customer Tickets:
1. **Urgent Issue:**
   - Name: Sarah Johnson
   - Email: sarah.j@company.com
   - Phone: 555-987-6543
   - Device: MacBook Pro 2023
   - Description: Computer won't start, urgent deadline today

2. **Simple Request:**
   - Name: Mike Chen
   - Email: mike.chen@email.com
   - Phone: 555-456-7890
   - Device: iPhone 14
   - Description: Need help setting up email

3. **Complex Issue:**
   - Name: Alex Rodriguez
   - Email: alex.r@business.org
   - Phone: 555-321-0987
   - Device: Dell Server Rack
   - Description: Network connectivity issues affecting entire office

## 🚀 **Advanced Testing**

For technical testers:

1. **API Testing:**
   ```bash
   # Test ticket creation
   curl -X POST http://localhost:3000/api/tickets \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","phone":"555-1234","deviceName":"Test Device","description":"API test"}'
   
   # Test authentication
   curl -X GET http://localhost:3000/api/auth/status
   ```

2. **Performance Testing:**
   - Submit 50+ tickets and test dashboard performance
   - Test with very long descriptions/names
   - Test concurrent user access

3. **Browser Compatibility:**
   - Test on Chrome, Firefox, Safari, Edge
   - Test on different operating systems
   - Verify mobile browsers work correctly

## 📞 **Support**

If you encounter issues or have questions:
- Create an issue on GitHub: [Issues Page](https://github.com/MrHoban/ticket-management-system/issues)
- Include browser console errors if any
- Provide screenshots for UI issues

Thank you for helping test the Ticket Management System! 🙏
