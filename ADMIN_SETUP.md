# Harvey's Loans Admin Portal Setup

## ✅ Admin Access Credentials

**Email:** Harveysloansllc@outlook.com  
**Password:** !995!993

⚠️ **IMPORTANT: ONLY this email address has admin access. No other accounts can access the admin portal.**

## 🔐 Admin Portal Features

### 1. **Secure Authentication**
- Admin account is automatically created on first visit to `/admin/login`
- Uses Supabase Auth for secure session management
- Only `Harveysloansllc@outlook.com` can access admin features
- Session-based authentication with Bearer tokens

### 2. **Business Overview Dashboard**
The admin dashboard displays 8 comprehensive business metrics:

- **Total Loans Outstanding** - Current balance with 30% annual interest
- **Total Principal Disbursed** - Sum of all approved loan principals
- **Total Interest Accrued** - Total interest earned across all loans
- **Average Loan Size** - Mean amount of approved loans
- **Active Loans Count** - Number of approved/active loans
- **Pending Applications Count** - Applications awaiting review
- **Denied Applications Count** - Rejected applications
- **Total Applications Count** - Complete application history

### 3. **Loan Management**
- View all loan applications (pending, approved, denied)
- Review applicant details (personal info, employment, documents)
- Approve loans with custom interest rate and term
- View uploaded documents (employment proof, ID verification)
- Track loan balances with automatic 30% annual interest calculation

### 4. **Email Notifications**
All loan applications and updates are sent to:
- Harveysloansllc@outlook.com
- swabyoliver@gmail.com

## 📧 Email API Configuration

**Resend API Key:** `re_h1VrRipR_AD6rXKJv33mRzNT68QpMG4RZ`

This API key is already configured in the environment variables as `RESEND_API_KEY`.

## 🚀 How to Access

1. Navigate to `/admin/login`
2. Enter credentials:
   - Email: `Harveysloansllc@outlook.com`
   - Password: `!995!993`
3. Click "Sign In"
4. You'll be redirected to `/admin/dashboard`

## 🔒 Security Features

- Admin-only email restriction (`Harveysloansllc@outlook.com`)
- Supabase Auth session management
- Bearer token authentication for all API calls
- Automatic session verification on dashboard load
- Protected admin endpoints (server-side validation)

## 📊 Interest Rate System

- Default annual rate: **30%**
- Interest is calculated monthly
- Formula: `Interest = Principal × (0.30 / 12) × MonthsPassed`
- Current balance: `Principal + Interest`
- Automatically recalculated on dashboard load

## 🛠️ Admin Endpoints

All endpoints require admin authentication:

- `POST /admin/init` - Initialize admin user (auto-called on login page)
- `GET /admin/verify` - Verify admin session
- `GET /admin/applications` - Get all loan applications
- `POST /admin/applications/:id/status` - Update application status
- `POST /admin/approve-loan/:id` - Approve loan with terms
- `GET /admin/business-overview` - Get business metrics

## 💡 Admin Workflow

1. **Login** → Access admin portal with credentials
2. **Review** → View pending applications and business metrics
3. **Analyze** → Check applicant details and documents
4. **Approve/Deny** → Make loan decisions with custom terms
5. **Track** → Monitor loan balances and interest accrual
6. **Report** → View comprehensive business overview

## 📱 Contact Information

**Harvey's Loans LLC**  
Phone: 1-345-917-8564  
Email: Harveysloansllc@outlook.com

---

**Note:** The admin account is automatically created when you first visit the login page. If you encounter any authentication issues, please check the browser console for detailed error logs.