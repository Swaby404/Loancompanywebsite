# 🧪 Harvey's Loans Admin Portal - Testing Guide

## Quick Start Testing

### ✅ **Test 1: Admin Login (PASS SCENARIO)**

1. Navigate to `/admin/login`
2. Enter credentials:
   - Email: `Harveysloansllc@outlook.com`
   - Password: `!995!993`
3. Click "Sign In"

**Expected Result:** ✅
- Login successful
- Redirected to `/admin/dashboard`
- Console log: `✅ Admin authenticated successfully: Harveysloansllc@outlook.com`

---

### ❌ **Test 2: Unauthorized Email (FAIL SCENARIO)**

1. Navigate to `/admin/login`
2. Enter credentials:
   - Email: `user@example.com`
   - Password: `anypassword`
3. Click "Sign In"

**Expected Result:** ❌
- Error message: `⛔ Access Denied: Only Harveysloansllc@outlook.com can access this portal`
- Login fails
- No access granted

---

### ❌ **Test 3: Wrong Password (FAIL SCENARIO)**

1. Navigate to `/admin/login`
2. Enter credentials:
   - Email: `Harveysloansllc@outlook.com`
   - Password: `wrongpassword`
3. Click "Sign In"

**Expected Result:** ❌
- Error message: `Invalid admin credentials`
- Login fails
- No access granted

---

## Admin Dashboard Tests

### ✅ **Test 4: View Business Overview**

**Prerequisites:** Must be logged in as admin

1. Access `/admin/dashboard`
2. View the top section with 8 metrics cards

**Expected Result:** ✅
- See all 8 business metrics:
  - Total Loans Outstanding
  - Total Principal Disbursed
  - Total Interest Accrued
  - Average Loan Size
  - Active Loans Count
  - Pending Applications Count
  - Denied Applications Count
  - Total Applications Count
- All numbers calculated correctly with 30% annual interest

---

### ✅ **Test 5: View Loan Applications**

**Prerequisites:** Must be logged in as admin, have test applications

1. Access `/admin/dashboard`
2. Scroll to "Loan Applications" section
3. View list of all applications

**Expected Result:** ✅
- See all loan applications (pending, approved, denied)
- Applications sorted by newest first
- Each card shows:
  - Application ID
  - Applicant name
  - Loan amount
  - Status badge
  - Submission date

---

### ✅ **Test 6: Review Application Details**

**Prerequisites:** Must be logged in as admin, have test applications

1. Click "View Details" on any application
2. View modal with full application data

**Expected Result:** ✅
- Modal opens with complete information:
  - Personal Information (name, email, phone, DOB, address)
  - Loan Details (amount, purpose)
  - Employment Information (status, income, employer)
  - Uploaded Documents (proof of employment, ID)
  - Application timeline
- Documents are viewable (if uploaded)

---

### ✅ **Test 7: Approve Loan**

**Prerequisites:** Must be logged in as admin, have pending application

1. Click "View Details" on a pending application
2. Click "Approve" button
3. Enter:
   - Interest Rate: `30`
   - Term (months): `12`
4. Click "Approve Loan"

**Expected Result:** ✅
- Success message appears
- Application status changes to "Approved"
- Loan balance calculation begins (30% annual interest)
- Email sent to applicant
- Email sent to both admin emails
- Business overview metrics update
- Console log: `✅ Loan approved: LOAN-xxx for application LOAN-xxx by admin`

---

### ✅ **Test 8: Deny Application**

**Prerequisites:** Must be logged in as admin, have pending application

1. Click "View Details" on a pending application
2. Click "Deny" button
3. Enter denial reason
4. Click "Deny Application"

**Expected Result:** ✅
- Application status changes to "Denied"
- Admin message saved
- Email sent to applicant
- Email sent to both admin emails
- Business overview metrics update
- Console log: `✅ Application LOAN-xxx status updated to: denied by admin`

---

## Security Tests

### ❌ **Test 9: Direct Dashboard Access (Unauthorized)**

**Prerequisites:** NOT logged in as admin

1. Navigate directly to `/admin/dashboard` in browser

**Expected Result:** ❌
- Automatic redirect to `/admin/login`
- Console log: `❌ No active session, redirecting to login`

---

### ❌ **Test 10: API Access Without Token**

**Prerequisites:** Use browser console or API client

1. Try to access: `https://<project-id>.supabase.co/functions/v1/make-server-a5671405/admin/applications`
2. No Authorization header

**Expected Result:** ❌
- Response: `{ error: "Unauthorized" }`
- Status code: `401`

---

### ❌ **Test 11: API Access With Non-Admin Token**

**Prerequisites:** User account that is NOT admin

1. Login as regular user
2. Get user's access token
3. Try to access admin endpoint with that token

**Expected Result:** ❌
- Response: `{ error: "Unauthorized - Admin access only" }`
- Status code: `401` or `403`
- Console log: `❌ Unauthorized admin access attempt by: user@example.com`

---

## Email Notification Tests

### ✅ **Test 12: New Loan Application Email**

**Prerequisites:** User submits loan application

**Expected Result:** ✅
- Email sent to: `Harveysloansllc@outlook.com`
- Email sent to: `swabyoliver@gmail.com`
- Email contains:
  - Application ID
  - Applicant details
  - Loan amount
  - Employment information
  - Links to view documents
  - Interest rate (30% annually)

---

### ✅ **Test 13: Loan Approval Email**

**Prerequisites:** Admin approves loan

**Expected Result:** ✅
- Email sent to applicant
- Email sent to testing emails
- Email contains:
  - Loan approval message
  - Loan ID
  - Interest rate details (30% annually)
  - Next steps

---

### ✅ **Test 14: Loan Denial Email**

**Prerequisites:** Admin denies application

**Expected Result:** ✅
- Email sent to applicant
- Email contains:
  - Denial notification
  - Admin message/reason
  - Contact information

---

## Interest Calculation Tests

### ✅ **Test 15: 30% Interest Calculation**

**Prerequisites:** Approved loan exists

**Test Scenario:**
- Loan Amount: $10,000
- Approved Date: 3 months ago
- Interest Rate: 30% annually

**Expected Calculation:**
```
Monthly Rate = 30% / 12 = 2.5%
Interest = $10,000 × 0.025 × 3 = $750
Balance = $10,000 + $750 = $10,750
```

**Expected Result:** ✅
- Dashboard shows correct balance: `$10,750.00`
- Interest accrued: `$750.00`
- Principal: `$10,000.00`
- Months passed: `3`

---

### ✅ **Test 16: Auto-Refresh Business Metrics**

**Prerequisites:** Admin logged in

1. Note current business metrics
2. Approve a new loan
3. Wait for success message
4. Observe metrics

**Expected Result:** ✅
- Total Loans Outstanding increases
- Total Principal Disbursed increases
- Active Loans Count increases by 1
- Pending Applications Count decreases by 1
- Average Loan Size recalculates
- All numbers update automatically

---

## Browser Console Monitoring

### Key Success Logs to Look For:

```
✅ Admin initialization complete
✅ Admin authenticated successfully: Harveysloansllc@outlook.com
✅ Admin verified successfully
✅ Admin access verified: Harveysloansllc@outlook.com
✅ Loaded X applications
✅ Business overview loaded
✅ Loan approved: LOAN-xxx for application LOAN-xxx by admin
✅ Application LOAN-xxx status updated to: approved by admin
📊 Business overview calculated by admin: X active loans, $XX outstanding
```

### Key Error Logs to Look For (When Testing Security):

```
❌ No active session, redirecting to login
❌ Admin verification failed, redirecting to login
❌ Unauthorized admin access attempt by: user@example.com
```

---

## Performance Tests

### ✅ **Test 17: Dashboard Load Time**

1. Login as admin
2. Navigate to dashboard
3. Measure load time

**Expected Result:** ✅
- Dashboard loads in < 3 seconds
- All metrics calculated and displayed
- All applications fetched and rendered
- No console errors

---

### ✅ **Test 18: Large Application List**

**Prerequisites:** Multiple loan applications exist

1. Login as admin
2. View applications list with 20+ applications

**Expected Result:** ✅
- All applications load successfully
- Scrolling is smooth
- Balance calculations correct for all approved loans
- No performance degradation

---

## Regression Tests (After Changes)

### Checklist:
- [ ] Admin can still login with correct credentials
- [ ] Non-admin users are blocked
- [ ] Business overview displays correctly
- [ ] Loan approvals work
- [ ] Loan denials work
- [ ] Emails are sent
- [ ] Interest calculations are accurate (30%)
- [ ] Dashboard loads without errors
- [ ] All API endpoints respond correctly
- [ ] Session persists across page refreshes
- [ ] Logout works properly

---

## Common Issues & Solutions

### Issue 1: "Failed to load applications"
**Solution:** Check console logs, verify API endpoint is accessible

### Issue 2: "Admin verification failed"
**Solution:** Clear browser cache, login again

### Issue 3: Emails not sending
**Solution:** Verify `RESEND_API_KEY` is set: `re_h1VrRipR_AD6rXKJv33mRzNT68QpMG4RZ`

### Issue 4: Wrong interest calculation
**Solution:** Verify loan approval date is correct, ensure 30% rate

### Issue 5: Dashboard not loading
**Solution:** Check network tab, verify all API calls return 200

---

## Test Result Template

```
Date: _________
Tester: _________

Test 1 (Admin Login): ✅ PASS / ❌ FAIL
Test 2 (Unauthorized Email): ✅ PASS / ❌ FAIL
Test 3 (Wrong Password): ✅ PASS / ❌ FAIL
Test 4 (Business Overview): ✅ PASS / ❌ FAIL
Test 5 (View Applications): ✅ PASS / ❌ FAIL
Test 6 (Application Details): ✅ PASS / ❌ FAIL
Test 7 (Approve Loan): ✅ PASS / ❌ FAIL
Test 8 (Deny Application): ✅ PASS / ❌ FAIL
Test 9 (Unauthorized Access): ✅ PASS / ❌ FAIL
Test 10 (API Without Token): ✅ PASS / ❌ FAIL
Test 11 (API Non-Admin Token): ✅ PASS / ❌ FAIL
Test 12 (Application Email): ✅ PASS / ❌ FAIL
Test 13 (Approval Email): ✅ PASS / ❌ FAIL
Test 14 (Denial Email): ✅ PASS / ❌ FAIL
Test 15 (Interest Calculation): ✅ PASS / ❌ FAIL
Test 16 (Auto-Refresh Metrics): ✅ PASS / ❌ FAIL
Test 17 (Dashboard Load Time): ✅ PASS / ❌ FAIL
Test 18 (Large Application List): ✅ PASS / ❌ FAIL

Notes: ________________________________
_______________________________________
_______________________________________
```

---

## 🎯 Critical Tests (MUST PASS)

These tests are CRITICAL and must pass for the system to be considered functional:

1. ✅ Admin login with correct credentials
2. ❌ Non-admin email blocked
3. ✅ Business overview displays
4. ✅ Loan approval works
5. ✅ Emails sent on application/approval/denial
6. ✅ 30% interest calculated correctly
7. ❌ Unauthorized API access blocked

**All 7 critical tests must pass before going live.**
