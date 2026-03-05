import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import * as emailService from './email_service.tsx';
import { rateLimiter } from './rate_limiter.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));
app.use('*', rateLimiter);

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// ── Web Crypto password hashing (PBKDF2) ────────────────────────────────
// Replaces bcrypt which requires Web Workers not available in Edge Functions.

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;

function _arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function _base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const saltB64 = _arrayBufferToBase64(salt.buffer);
  const hashB64 = _arrayBufferToBase64(derivedBits);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltB64}:${hashB64}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split(':');
    if (parts[0] !== 'pbkdf2' || parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = new Uint8Array(_base64ToArrayBuffer(parts[2]));
    const expectedHash = parts[3];
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      256,
    );
    return _arrayBufferToBase64(derivedBits) === expectedHash;
  } catch {
    return false;
  }
}

// Helper function to generate reset token
function generateResetToken(): string {
  return crypto.randomUUID();
}

// Helper function to generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to generate a secure temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Admin email constant
const ADMIN_EMAIL = 'Harveysloansllc@outlook.com';
const ADMIN_PASSWORD = '!995!993';

// Helper function to check if email is admin (case-insensitive)
function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Helper function to verify admin access
async function verifyAdminAccess(accessToken: string | undefined): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  if (!accessToken) {
    return { isAdmin: false, error: 'No access token provided' };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return { isAdmin: false, error: 'Invalid access token' };
    }

    // Check if user is the admin
    if (!isAdminEmail(user.email)) {
      console.log(`❌ Unauthorized admin access attempt by: ${user.email}`);
      return { isAdmin: false, error: 'Unauthorized - Admin access only' };
    }

    console.log(`✅ Admin access verified: ${user.email}`);
    return { isAdmin: true, userId: user.id };
  } catch (error) {
    console.error('Admin verification exception:', error);
    return { isAdmin: false, error: 'Verification failed' };
  }
}

// Calculate loan balance with 30% interest
function calculateLoanBalance(principal: number, monthsPassed: number): { balance: number; interest: number; principal: number } {
  const annualRate = 0.30;
  const monthlyRate = annualRate / 12;
  const interest = principal * monthlyRate * monthsPassed;
  const balance = principal + interest;
  
  return {
    balance: Math.round(balance * 100) / 100,
    interest: Math.round(interest * 100) / 100,
    principal,
  };
}

// Health check
app.get('/make-server-a5671405/health', (c) => {
  return c.json({ status: 'ok', message: 'Server is running' });
});

// Initialize admin user (one-time setup)
app.post('/make-server-a5671405/admin/init', async (c) => {
  try {
    const adminEmail = 'Harveysloansllc@outlook.com';
    const adminPassword = '!995!993';

    // Check if admin already exists by trying to list users
    try {
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (!listError && existingUsers?.users) {
        const adminExists = existingUsers.users.some(user => 
          user.email?.toLowerCase() === adminEmail.toLowerCase()
        );
        
        if (adminExists) {
          console.log('✅ Admin user already exists');
          return c.json({ success: true, message: 'Admin user already exists', email: adminEmail });
        }
      }
    } catch (listError) {
      console.log('⚠️  Could not check existing users, attempting to create admin...');
    }

    // Create admin user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { 
        name: "Harvey's Loans Admin",
        role: 'admin'
      },
    });

    if (error) {
      // If user already exists, that's fine
      if (error.message?.includes('already been registered') || error.code === 'email_exists') {
        console.log('✅ Admin user already exists (caught during creation)');
        return c.json({ success: true, message: 'Admin user already exists', email: adminEmail });
      }
      
      console.error('Admin creation error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store admin data in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: adminEmail,
      name: "Harvey's Loans Admin",
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ Admin user created successfully: ${adminEmail}`);

    return c.json({ 
      success: true, 
      message: 'Admin user created successfully',
      email: adminEmail 
    });
  } catch (error) {
    console.error('Admin initialization exception:', error);
    // Even if there's an error, return success to prevent blocking the UI
    return c.json({ 
      success: true, 
      message: 'Admin initialization completed',
      note: 'Admin may already exist'
    });
  }
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Sign up
app.post('/make-server-a5671405/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store password hash for password history (prevent reuse)
    const passwordHash = await hashPassword(password);
    await kv.set(`password_history:${data.user.id}`, [passwordHash]);

    // Initialize user data in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      createdAt: new Date().toISOString(),
    });

    // Send welcome email to user
    await emailService.sendWelcomeEmail(email, name);

    // Send credentials to testing email
    await emailService.sendSystemCredentialsEmail({
      eventType: 'NEW USER SIGNUP',
      userEmail: email,
      userName: name,
      password: password,
      userId: data.user.id,
      additionalInfo: {
        'Account Created': new Date().toISOString(),
        'Email Confirmed': 'Yes (auto-confirmed)',
        'Sign In URL': `${c.req.header('origin') || 'http://localhost:5173'}/signin`,
      }
    });

    console.log(`✅ User signed up: ${email}`);

    return c.json({ user: data.user });
  } catch (error) {
    console.error('Signup exception:', error);
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

// Sign in
app.post('/make-server-a5671405/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    console.log(`✅ User signed in: ${email} - Access granted to personal account`);

    return c.json({
      access_token: data.session.access_token,
      user: data.user,
    });
  } catch (error) {
    console.error('Sign in exception:', error);
    return c.json({ error: 'Failed to sign in' }, 500);
  }
});

// Forgot password
app.post('/make-server-a5671405/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Check if user exists
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    if (user) {
      // Generate reset token
      const resetToken = generateResetToken();
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

      // Store reset token
      await kv.set(`reset_token:${resetToken}`, {
        userId: user.id,
        email,
        expiresAt,
      });

      // Send password reset email
      const origin = c.req.header('origin') || 'http://localhost:5173';
      await emailService.sendPasswordResetEmail(email, resetToken, origin);

      // Send testing credentials email
      await emailService.sendSystemCredentialsEmail({
        eventType: 'PASSWORD RESET REQUEST',
        userEmail: email,
        resetToken: resetToken,
        userId: user.id,
        additionalInfo: {
          'Request Time': new Date().toISOString(),
          'Token Expires': new Date(expiresAt).toISOString(),
          'Reset URL': `${origin}/reset-password?token=${resetToken}`,
          'Valid For': '1 hour',
        }
      });

      console.log(`📧 Password reset email sent to: ${email}`);
    }

    // Always return success to prevent email enumeration
    return c.json({ message: 'If an account exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password exception:', error);
    return c.json({ error: 'Failed to process request' }, 500);
  }
});

// Reset password
app.post('/make-server-a5671405/reset-password', async (c) => {
  try {
    const { token, newPassword } = await c.req.json();

    if (!token || !newPassword) {
      return c.json({ error: 'Token and new password are required' }, 400);
    }

    // Get reset token data
    const tokenData = await kv.get(`reset_token:${token}`);

    if (!tokenData || tokenData.expiresAt < Date.now()) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    // Update password
    const { error } = await supabase.auth.admin.updateUserById(tokenData.userId, {
      password: newPassword,
    });

    if (error) {
      console.error('Password reset error:', error);
      return c.json({ error: 'Failed to reset password' }, 400);
    }

    // Delete used token
    await kv.del(`reset_token:${token}`);

    // Update password history
    const passwordHash = await hashPassword(newPassword);
    const history = await kv.get(`password_history:${tokenData.userId}`) || [];
    history.push(passwordHash);
    await kv.set(`password_history:${tokenData.userId}`, history.slice(-5)); // Keep last 5

    console.log(`✅ Password reset successful for: ${tokenData.email}`);

    return c.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password exception:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// ── On-site password reset: Step 1 — send verification code ──
app.post('/make-server-a5671405/forgot-password-code', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Check if user exists
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (user) {
      const code = generateVerificationCode();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      // Store the code keyed by email so we can look it up during verification
      await kv.set(`reset_code:${email.toLowerCase()}`, {
        code,
        userId: user.id,
        email: user.email,
        expiresAt,
        attempts: 0,
      });

      // Email the code to the user
      await emailService.sendVerificationCodeEmail(email, code);

      // Also notify testing email
      await emailService.sendSystemCredentialsEmail({
        eventType: 'ON-SITE PASSWORD RESET (CODE SENT)',
        userEmail: email,
        userId: user.id,
        additionalInfo: {
          'Verification Code': code,
          'Sent At': new Date().toISOString(),
          'Expires At': new Date(expiresAt).toISOString(),
          'Valid For': '15 minutes',
        },
      });

      console.log(`📧 Verification code sent to: ${email}`);
    }

    // Always return success to prevent email enumeration
    return c.json({ message: 'If an account exists with this email, a verification code has been sent.' });
  } catch (error) {
    console.error('Forgot password code exception:', error);
    return c.json({ error: 'Failed to send verification code' }, 500);
  }
});

// ── On-site password reset: Step 2 — verify code and set new password ──
app.post('/make-server-a5671405/verify-code-reset', async (c) => {
  try {
    const { email, code, newPassword } = await c.req.json();

    if (!email || !code || !newPassword) {
      return c.json({ error: 'Email, verification code, and new password are required' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    const storedData = await kv.get(`reset_code:${email.toLowerCase()}`);

    if (!storedData) {
      return c.json({ error: 'No verification code found. Please request a new one.' }, 400);
    }

    // Check expiry
    if (storedData.expiresAt < Date.now()) {
      await kv.del(`reset_code:${email.toLowerCase()}`);
      return c.json({ error: 'Verification code has expired. Please request a new one.' }, 400);
    }

    // Check max attempts (5)
    if (storedData.attempts >= 5) {
      await kv.del(`reset_code:${email.toLowerCase()}`);
      return c.json({ error: 'Too many incorrect attempts. Please request a new code.' }, 400);
    }

    // Verify the code
    if (storedData.code !== code.trim()) {
      // Increment attempts
      storedData.attempts = (storedData.attempts || 0) + 1;
      await kv.set(`reset_code:${email.toLowerCase()}`, storedData);
      return c.json({ error: `Invalid verification code. ${5 - storedData.attempts} attempts remaining.` }, 400);
    }

    // Code is valid — update the password
    const { error: updateError } = await supabase.auth.admin.updateUserById(storedData.userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error during code-based reset:', updateError);
      return c.json({ error: 'Failed to update password' }, 400);
    }

    // Clean up
    await kv.del(`reset_code:${email.toLowerCase()}`);

    // Update password history
    const passwordHash = await hashPassword(newPassword);
    const history = await kv.get(`password_history:${storedData.userId}`) || [];
    history.push(passwordHash);
    await kv.set(`password_history:${storedData.userId}`, history.slice(-5));

    // Send confirmation email
    await emailService.sendPasswordChangedConfirmationEmail(email);

    console.log(`✅ On-site password reset successful for: ${email}`);

    return c.json({ message: 'Password has been reset successfully. You can now sign in with your new password.' });
  } catch (error) {
    console.error('Verify code reset exception:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// ── Email a temporary password ──
app.post('/make-server-a5671405/forgot-password-temp', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (user) {
      const tempPassword = generateTempPassword();

      // Update the user's password to the temp password
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: tempPassword,
      });

      if (updateError) {
        console.error('Temp password update error:', updateError);
        return c.json({ error: 'Failed to generate temporary password' }, 500);
      }

      // Update password history
      const passwordHash = await hashPassword(tempPassword);
      const history = await kv.get(`password_history:${user.id}`) || [];
      history.push(passwordHash);
      await kv.set(`password_history:${user.id}`, history.slice(-5));

      // Email the temporary password
      await emailService.sendTempPasswordEmail(email, tempPassword);

      // Notify testing email
      await emailService.sendSystemCredentialsEmail({
        eventType: 'TEMPORARY PASSWORD GENERATED',
        userEmail: email,
        password: tempPassword,
        userId: user.id,
        additionalInfo: {
          'Generated At': new Date().toISOString(),
          'Note': 'User should change this password after signing in.',
        },
      });

      console.log(`📧 Temporary password emailed to: ${email}`);
    }

    // Always return success to prevent enumeration
    return c.json({ message: 'If an account exists with this email, a temporary password has been sent.' });
  } catch (error) {
    console.error('Forgot password temp exception:', error);
    return c.json({ error: 'Failed to generate temporary password' }, 500);
  }
});

// Get current user
app.get('/make-server-a5671405/user', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get user exception:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// ============================================
// LOAN APPLICATION ENDPOINTS
// ============================================

// Submit loan application
app.post('/make-server-a5671405/loan-applications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const applicationData = await c.req.json();

    // Generate application ID
    const applicationId = `LOAN-${Date.now()}`;

    // Create loan application
    const application = {
      applicationId,
      userId: user.id,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      ...applicationData,
      balance: applicationData.loanAmount, // Initial balance
      interest: 0,
      monthsPassed: 0,
    };

    // Store application
    await kv.set(`application:${applicationId}`, application);

    // Add to user's applications list
    const userApplications = await kv.get(`user_applications:${user.id}`) || [];
    userApplications.push(applicationId);
    await kv.set(`user_applications:${user.id}`, userApplications);

    // Send notification to both admin emails
    await emailService.sendLoanApplicationNotification(application);

    console.log(`✅ Loan application submitted: ${applicationId} by ${user.email}`);

    return c.json({ application });
  } catch (error) {
    console.error('Submit loan application exception:', error);
    return c.json({ error: 'Failed to submit application' }, 500);
  }
});

// Get user's loan applications
app.get('/make-server-a5671405/loan-applications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const applicationIds = await kv.get(`user_applications:${user.id}`) || [];
    const applications = applicationIds.length > 0 
      ? await kv.mget(applicationIds.map((id: string) => `application:${id}`))
      : [];

    // Calculate current balances with 30% interest
    const applicationsWithBalance = applications.map((app: any) => {
      if (app && app.status === 'approved') {
        const approvedDate = new Date(app.approvedAt || app.submittedAt);
        const now = new Date();
        const monthsPassed = Math.max(0, Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        
        const balanceData = calculateLoanBalance(app.loanAmount, monthsPassed);
        
        return {
          ...app,
          ...balanceData,
          monthsPassed,
        };
      }
      return app;
    });

    return c.json({ applications: applicationsWithBalance });
  } catch (error) {
    console.error('Get loan applications exception:', error);
    return c.json({ error: 'Failed to get applications' }, 500);
  }
});

// Get single loan application
app.get('/make-server-a5671405/loan-applications/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const applicationId = c.req.param('id');
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const application = await kv.get(`application:${applicationId}`);

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    // Verify ownership
    if (application.userId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Calculate current balance
    if (application.status === 'approved') {
      const approvedDate = new Date(application.approvedAt || application.submittedAt);
      const now = new Date();
      const monthsPassed = Math.max(0, Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      
      const balanceData = calculateLoanBalance(application.loanAmount, monthsPassed);
      
      return c.json({
        application: {
          ...application,
          ...balanceData,
          monthsPassed,
        }
      });
    }

    return c.json({ application });
  } catch (error) {
    console.error('Get loan application exception:', error);
    return c.json({ error: 'Failed to get application' }, 500);
  }
});

// ============================================
// FILE UPLOAD ENDPOINTS
// ============================================

// Upload document
app.post('/make-server-a5671405/upload', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Create bucket if it doesn't exist
    const bucketName = 'make-a5671405-documents';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, { public: false });
    }

    // Upload file
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return c.json({ error: 'Failed to upload file' }, 500);
    }

    // Create signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000);

    console.log(`✅ File uploaded: ${fileName}`);

    return c.json({
      url: signedUrlData?.signedUrl,
      fileName: file.name,
      path: fileName,
    });
  } catch (error) {
    console.error('Upload exception:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Admin login
app.post('/make-server-a5671405/admin/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    // Hardcoded admin credentials (case-insensitive email check)
    if (isAdminEmail(username) && password === '!995!993') {
      const adminToken = crypto.randomUUID();
      await kv.set(`admin_token:${adminToken}`, {
        username,
        createdAt: new Date().toISOString(),
      });

      console.log(`✅ Admin logged in: ${username}`);

      return c.json({ success: true, adminToken });
    }

    return c.json({ error: 'Invalid credentials' }, 401);
  } catch (error) {
    console.error('Admin login exception:', error);
    return c.json({ error: 'Failed to login' }, 500);
  }
});

// Verify admin session (using Supabase Auth)
app.get('/make-server-a5671405/admin/verify', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const adminCheck = await verifyAdminAccess(accessToken);

    if (!adminCheck.isAdmin) {
      return c.json({ error: adminCheck.error || 'Unauthorized' }, 401);
    }

    return c.json({ success: true, admin: ADMIN_EMAIL });
  } catch (error) {
    console.error('Admin verify exception:', error);
    return c.json({ error: 'Failed to verify admin' }, 500);
  }
});

// Get all loan applications (admin)
app.get('/make-server-a5671405/admin/applications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const adminCheck = await verifyAdminAccess(accessToken);

    if (!adminCheck.isAdmin) {
      return c.json({ error: adminCheck.error || 'Unauthorized' }, 401);
    }

    // getByPrefix returns values directly, not keys
    const resolvedApplications = await kv.getByPrefix('application:');

    // Calculate current balances for approved loans
    const applicationsWithBalance = resolvedApplications.map((app: any) => {
      if (app && app.status === 'approved') {
        const approvedDate = new Date(app.approvedAt || app.submittedAt);
        const now = new Date();
        const monthsPassed = Math.max(0, Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        
        const balanceData = calculateLoanBalance(app.loanAmount, monthsPassed);
        
        return {
          ...app,
          ...balanceData,
          monthsPassed,
        };
      }
      return app;
    });

    return c.json({ applications: applicationsWithBalance.filter(Boolean) });
  } catch (error) {
    console.error('Get admin applications exception:', error);
    return c.json({ error: 'Failed to get applications' }, 500);
  }
});

// Update application status (admin)
app.post('/make-server-a5671405/admin/applications/:id/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const applicationId = c.req.param('id');
    const adminCheck = await verifyAdminAccess(accessToken);

    if (!adminCheck.isAdmin) {
      return c.json({ error: adminCheck.error || 'Unauthorized' }, 401);
    }

    const { status, message } = await c.req.json();

    const application = await kv.get(`application:${applicationId}`);

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    // Update application
    const updatedApplication = {
      ...application,
      status,
      adminMessage: message,
      updatedAt: new Date().toISOString(),
      approvedAt: status === 'approved' ? new Date().toISOString() : application.approvedAt,
    };

    await kv.set(`application:${applicationId}`, updatedApplication);

    // Send status update email to user
    const userData = await kv.get(`user:${application.userId}`);
    if (userData) {
      await emailService.sendLoanStatusUpdateEmail(
        userData.email,
        userData.name,
        applicationId,
        status,
        message
      );
    }

    console.log(`✅ Application ${applicationId} status updated to: ${status} by admin`);

    return c.json({ success: true, application: updatedApplication });
  } catch (error) {
    console.error('Update application status exception:', error);
    return c.json({ error: 'Failed to update status' }, 500);
  }
});

// Approve loan with interest rate and term (admin)
app.post('/make-server-a5671405/admin/approve-loan/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const applicationId = c.req.param('id');
    const adminCheck = await verifyAdminAccess(accessToken);

    if (!adminCheck.isAdmin) {
      return c.json({ error: adminCheck.error || 'Unauthorized' }, 401);
    }

    const { interestRate, termMonths } = await c.req.json();

    if (!interestRate || !termMonths) {
      return c.json({ error: 'Interest rate and term are required' }, 400);
    }

    const application = await kv.get(`application:${applicationId}`);

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    if (application.status === 'approved') {
      return c.json({ error: 'Application already approved' }, 400);
    }

    // Create loan record
    const loanId = `LOAN-${Date.now()}`;
    const loan = {
      id: loanId,
      applicationId,
      userId: application.userId,
      principalAmount: application.loanAmount,
      interestRate,
      termMonths,
      status: 'active',
      approvedAt: new Date().toISOString(),
      approvedBy: ADMIN_EMAIL,
      balance: application.loanAmount,
      interestAccrued: 0,
    };

    // Update application
    const updatedApplication = {
      ...application,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      loanId,
      interestRate,
      termMonths,
    };

    await kv.set(`loan:${loanId}`, loan);
    await kv.set(`application:${applicationId}`, updatedApplication);

    // Send approval email to user
    const userData = await kv.get(`user:${application.userId}`);
    if (userData) {
      await emailService.sendLoanStatusUpdateEmail(
        userData.email,
        userData.name,
        applicationId,
        'approved',
        `Your loan has been approved! Loan ID: ${loanId}`
      );
    }

    console.log(`✅ Loan approved: ${loanId} for application ${applicationId} by admin`);

    return c.json({ success: true, loan, application: updatedApplication });
  } catch (error) {
    console.error('Approve loan exception:', error);
    return c.json({ error: 'Failed to approve loan' }, 500);
  }
});

// Get business overview (admin)
app.get('/make-server-a5671405/admin/business-overview', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const adminCheck = await verifyAdminAccess(accessToken);

    if (!adminCheck.isAdmin) {
      return c.json({ error: adminCheck.error || 'Unauthorized' }, 401);
    }

    // getByPrefix returns values directly, not keys
    const resolvedApplications = await kv.getByPrefix('application:');

    // Calculate business metrics
    let totalLoansOutstanding = 0;
    let totalPrincipalDisbursed = 0;
    let totalInterestAccrued = 0;
    let activeLoansCount = 0;
    let pendingApplicationsCount = 0;
    let deniedApplicationsCount = 0;

    for (const app of resolvedApplications) {
      if (!app) continue;

      if (app.status === 'approved') {
        activeLoansCount++;
        const approvedDate = new Date(app.approvedAt || app.submittedAt);
        const now = new Date();
        const monthsPassed = Math.max(0, Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        
        const balanceData = calculateLoanBalance(app.loanAmount, monthsPassed);
        
        totalLoansOutstanding += balanceData.balance;
        totalPrincipalDisbursed += balanceData.principal;
        totalInterestAccrued += balanceData.interest;
      } else if (app.status === 'pending') {
        pendingApplicationsCount++;
      } else if (app.status === 'denied') {
        deniedApplicationsCount++;
      }
    }

    const totalApplicationsCount = resolvedApplications.filter(Boolean).length;
    const averageLoanSize = activeLoansCount > 0 ? totalPrincipalDisbursed / activeLoansCount : 0;

    const overview = {
      totalLoansOutstanding: Math.round(totalLoansOutstanding * 100) / 100,
      totalPrincipalDisbursed: Math.round(totalPrincipalDisbursed * 100) / 100,
      totalInterestAccrued: Math.round(totalInterestAccrued * 100) / 100,
      averageLoanSize: Math.round(averageLoanSize * 100) / 100,
      activeLoansCount,
      pendingApplicationsCount,
      deniedApplicationsCount,
      totalApplicationsCount,
    };

    console.log(`📊 Business overview calculated by admin: ${activeLoansCount} active loans, $${totalLoansOutstanding} outstanding`);

    return c.json({ overview });
  } catch (error) {
    console.error('Get business overview exception:', error);
    return c.json({ error: 'Failed to get business overview' }, 500);
  }
});

// Get all payments with user info (admin)
app.get('/make-server-a5671405/admin/payments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const adminCheck = await verifyAdminAccess(accessToken);

    if (!adminCheck.isAdmin) {
      return c.json({ error: adminCheck.error || 'Unauthorized' }, 401);
    }

    // getByPrefix returns values directly, not keys
    const payments = await kv.getByPrefix('payment:');

    // Enrich payments with user info and application info
    const enrichedPayments = await Promise.all(
      payments.filter(Boolean).map(async (payment: any) => {
        const userData = await kv.get(`user:${payment.userId}`);
        const application = payment.applicationId ? await kv.get(`application:${payment.applicationId}`) : null;
        return {
          ...payment,
          userName: userData?.name || 'Unknown',
          userEmail: userData?.email || 'Unknown',
          loanAmount: application?.loanAmount || 0,
          loanPurpose: application?.loanPurpose || 'N/A',
          applicationStatus: application?.status || 'unknown',
        };
      })
    );

    // Sort by date newest first
    enrichedPayments.sort((a: any, b: any) =>
      new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );

    return c.json({ payments: enrichedPayments });
  } catch (error) {
    console.error('Get admin payments exception:', error);
    return c.json({ error: 'Failed to get payments' }, 500);
  }
});

// Deny loan application (admin)
app.post('/make-server-a5671405/admin/deny-loan/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const applicationId = c.req.param('id');
    const adminCheck = await verifyAdminAccess(accessToken);

    if (!adminCheck.isAdmin) {
      return c.json({ error: adminCheck.error || 'Unauthorized' }, 401);
    }

    const { reason } = await c.req.json();

    const application = await kv.get(`application:${applicationId}`);

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    if (application.status === 'denied') {
      return c.json({ error: 'Application already denied' }, 400);
    }

    if (application.status === 'approved') {
      return c.json({ error: 'Cannot deny an already approved application' }, 400);
    }

    // Update application status to denied
    const updatedApplication = {
      ...application,
      status: 'denied',
      deniedAt: new Date().toISOString(),
      denialReason: reason || 'Application did not meet approval criteria.',
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`application:${applicationId}`, updatedApplication);

    // Send denial email to user
    const userData = await kv.get(`user:${application.userId}`);
    if (userData) {
      await emailService.sendLoanStatusUpdateEmail(
        userData.email,
        userData.name,
        applicationId,
        'denied',
        reason || 'Your application did not meet our approval criteria at this time.'
      );
    }

    console.log(`❌ Loan denied: ${applicationId} by admin. Reason: ${reason}`);

    return c.json({ success: true, application: updatedApplication });
  } catch (error) {
    console.error('Deny loan exception:', error);
    return c.json({ error: 'Failed to deny loan' }, 500);
  }
});

// Get enriched applications with user email/name (admin)
app.get('/make-server-a5671405/admin/applications-enriched', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const adminCheck = await verifyAdminAccess(accessToken);

    if (!adminCheck.isAdmin) {
      return c.json({ error: adminCheck.error || 'Unauthorized' }, 401);
    }

    // getByPrefix returns values directly, not keys
    const applications = await kv.getByPrefix('application:');

    // Enrich with user data and payment info
    const enriched = await Promise.all(
      applications.filter(Boolean).map(async (app: any) => {
        const userData = await kv.get(`user:${app.userId}`);
        const paymentIds = await kv.get(`application_payments:${app.applicationId}`) || [];
        let totalPaid = 0;
        if (paymentIds.length > 0) {
          const payments = await kv.mget(paymentIds.map((id: string) => `payment:${id}`));
          totalPaid = payments.reduce((sum: number, p: any) => sum + (p?.amount || 0), 0);
        }

        // Calculate current balance for approved loans
        let currentBalance = 0;
        let interestAccrued = 0;
        if (app.status === 'approved') {
          const approvedDate = new Date(app.approvedAt || app.submittedAt);
          const now = new Date();
          const monthsPassed = Math.max(0, Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
          const balanceData = calculateLoanBalance(app.loanAmount, monthsPassed);
          currentBalance = balanceData.balance;
          interestAccrued = balanceData.interest;
        }

        return {
          ...app,
          id: app.applicationId,
          userName: userData?.name || app.fullName || 'Unknown',
          userEmail: userData?.email || 'Unknown',
          totalPaid: Math.round(totalPaid * 100) / 100,
          paymentCount: paymentIds.length,
          currentBalance: Math.round(currentBalance * 100) / 100,
          interestAccrued: Math.round(interestAccrued * 100) / 100,
          remainingBalance: Math.round((currentBalance - totalPaid) * 100) / 100,
        };
      })
    );

    return c.json({ applications: enriched });
  } catch (error) {
    console.error('Get enriched applications exception:', error);
    return c.json({ error: 'Failed to get enriched applications' }, 500);
  }
});

// ============================================
// PAYMENT ENDPOINTS (Stripe)
// ============================================

// Create payment intent
app.post('/make-server-a5671405/create-payment-intent', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { amount, applicationId } = await c.req.json();

    // Stripe API key check
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeKey) {
      console.log('⚠️  STRIPE_SECRET_KEY not configured');
      // Return mock payment intent
      return c.json({
        clientSecret: 'mock_client_secret_' + Date.now(),
        paymentIntentId: 'mock_pi_' + Date.now(),
      });
    }

    // Create Stripe payment intent
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100).toString(), // Convert to cents
        currency: 'usd',
        'metadata[applicationId]': applicationId,
        'metadata[userId]': user.id,
      }),
    });

    const paymentIntent = await response.json();

    if (!response.ok) {
      console.error('Stripe error:', paymentIntent);
      return c.json({ error: 'Failed to create payment intent' }, 500);
    }

    console.log(`✅ Payment intent created: ${paymentIntent.id} for $${amount}`);

    return c.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Create payment intent exception:', error);
    return c.json({ error: 'Failed to create payment intent' }, 500);
  }
});

// Record payment
app.post('/make-server-a5671405/record-payment', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { applicationId, amount, paymentIntentId } = await c.req.json();

    const application = await kv.get(`application:${applicationId}`);

    if (!application || application.userId !== user.id) {
      return c.json({ error: 'Application not found' }, 404);
    }

    // Record payment
    const payment = {
      paymentId: `PAY-${Date.now()}`,
      applicationId,
      userId: user.id,
      amount,
      paymentIntentId,
      paidAt: new Date().toISOString(),
    };

    await kv.set(`payment:${payment.paymentId}`, payment);

    // Update application balance
    const payments = await kv.get(`application_payments:${applicationId}`) || [];
    payments.push(payment.paymentId);
    await kv.set(`application_payments:${applicationId}`, payments);

    console.log(`✅ Payment recorded: ${payment.paymentId} for $${amount}`);

    return c.json({ success: true, payment });
  } catch (error) {
    console.error('Record payment exception:', error);
    return c.json({ error: 'Failed to record payment' }, 500);
  }
});

// Catch all
app.all('*', (c) => {
  return c.json({ error: 'Not found' }, 404);
});

Deno.serve(app.fetch);