import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase clients
const getSupabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const getSupabaseClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize storage bucket on startup
const bucketName = 'make-a5671405-loan-documents';
const supabase = getSupabaseAdmin();
const { data: buckets } = await supabase.storage.listBuckets();
const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
if (!bucketExists) {
  await supabase.storage.createBucket(bucketName, { public: false });
  console.log(`Created bucket: ${bucketName}`);
}

// Health check endpoint
app.get("/make-server-a5671405/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-a5671405/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Error creating user during signup:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.error('Error in signup endpoint:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Get authenticated user
app.get("/make-server-a5671405/user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.error('Error getting user:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Error in user endpoint:', error);
    return c.json({ error: 'Internal server error while getting user' }, 500);
  }
});

// Submit loan application
app.post("/make-server-a5671405/applications", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error while submitting loan application:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const applicationData = await c.req.json();
    const applicationId = crypto.randomUUID();
    
    const application = {
      id: applicationId,
      userId: user.id,
      ...applicationData,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`application:${applicationId}`, application);
    await kv.set(`user_application:${user.id}:${applicationId}`, applicationId);

    // Send email notification to Harvey's Loans
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Harvey\'s Loans <onboarding@resend.dev>',
            to: ['Harveysloansllc@outlook.com'],
            subject: `New Loan Application - ${applicationData.fullName}`,
            html: `
              <h2>New Loan Application Received</h2>
              <p><strong>Application ID:</strong> ${applicationId}</p>
              <p><strong>Submission Date:</strong> ${new Date().toLocaleString()}</p>
              
              <h3>Personal Information</h3>
              <ul>
                <li><strong>Name:</strong> ${applicationData.fullName}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Phone:</strong> ${applicationData.phone}</li>
                <li><strong>Address:</strong> ${applicationData.address}, ${applicationData.city}, ${applicationData.state} ${applicationData.zipCode}</li>
              </ul>
              
              <h3>Employment Information</h3>
              <ul>
                <li><strong>Employer:</strong> ${applicationData.employer}</li>
                <li><strong>Job Title:</strong> ${applicationData.jobTitle}</li>
                <li><strong>Monthly Income:</strong> $${applicationData.monthlyIncome}</li>
                <li><strong>Years at Job:</strong> ${applicationData.employmentYears}</li>
              </ul>
              
              <h3>Loan Details</h3>
              <ul>
                <li><strong>Loan Amount:</strong> $${applicationData.loanAmount}</li>
                <li><strong>Loan Purpose:</strong> ${applicationData.loanPurpose}</li>
              </ul>
              
              <h3>Documents</h3>
              <ul>
                <li><strong>Employment Proof:</strong> ${applicationData.employmentProofUrl ? 'Uploaded' : 'Not provided'}</li>
                <li><strong>ID Verification:</strong> ${applicationData.idProofUrl ? 'Uploaded' : 'Not provided'}</li>
              </ul>
              
              <p><strong>Terms Agreed:</strong> ${applicationData.agreedToTerms ? 'Yes' : 'No'}</p>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error('Error sending email notification:', errorData);
        } else {
          console.log('Email notification sent successfully to Harveysloansllc@outlook.com');
        }
      } else {
        console.log('RESEND_API_KEY not configured. Skipping email notification.');
      }
    } catch (emailError) {
      console.error('Error sending email notification (non-blocking):', emailError);
      // Don't fail the application submission if email fails
    }

    return c.json({ application });
  } catch (error) {
    console.error('Error submitting loan application:', error);
    return c.json({ error: 'Internal server error while submitting application' }, 500);
  }
});

// Get user's applications
app.get("/make-server-a5671405/applications", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error while fetching applications:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userApplicationIds = await kv.getByPrefix(`user_application:${user.id}:`);
    const applications = await kv.mget(userApplicationIds.map((id: string) => `application:${id}`));

    return c.json({ applications });
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return c.json({ error: 'Internal server error while fetching applications' }, 500);
  }
});

// Upload document
app.post("/make-server-a5671405/upload", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error during document upload:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;
    
    const fileBuffer = await file.arrayBuffer();
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Error uploading file to storage:', error);
      return c.json({ error: error.message }, 400);
    }

    // Create signed URL valid for 1 year
    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000);

    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      return c.json({ error: 'Error creating signed URL' }, 500);
    }

    // Store document reference in KV
    const documentId = crypto.randomUUID();
    await kv.set(`document:${documentId}`, {
      id: documentId,
      userId: user.id,
      fileName: file.name,
      storagePath: fileName,
      documentType,
      uploadedAt: new Date().toISOString(),
    });

    return c.json({ 
      documentId,
      url: signedUrlData.signedUrl,
      fileName: file.name 
    });
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    return c.json({ error: 'Internal server error during file upload' }, 500);
  }
});

// Create Stripe payment intent
app.post("/make-server-a5671405/create-payment-intent", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error while creating payment intent:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { amount } = await c.req.json();

    if (!amount || amount <= 0) {
      return c.json({ error: 'Valid amount is required' }, 400);
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return c.json({ error: 'Stripe not configured. Please add STRIPE_SECRET_KEY environment variable.' }, 500);
    }

    // Create payment intent with Stripe
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100).toString(), // Convert to cents
        currency: 'usd',
        'metadata[userId]': user.id,
      }),
    });

    const paymentIntent = await response.json();

    if (!response.ok) {
      console.error('Error creating Stripe payment intent:', paymentIntent);
      return c.json({ error: paymentIntent.error?.message || 'Error creating payment intent' }, 400);
    }

    return c.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    });
  } catch (error) {
    console.error('Error in create-payment-intent endpoint:', error);
    return c.json({ error: 'Internal server error while creating payment intent' }, 500);
  }
});

// Admin: Approve loan application and create active loan
app.post("/make-server-a5671405/admin/approve-loan/:applicationId", async (c) => {
  try {
    const applicationId = c.req.param('applicationId');
    const { interestRate, termMonths } = await c.req.json();

    if (!applicationId) {
      return c.json({ error: 'Application ID is required' }, 400);
    }

    if (!interestRate || !termMonths) {
      return c.json({ error: 'Interest rate and term are required' }, 400);
    }

    // Get the application
    const application = await kv.get(`application:${applicationId}`);
    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    // Calculate loan details
    const principal = parseFloat(application.loanAmount);
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    const totalAmount = monthlyPayment * termMonths;

    const loanId = crypto.randomUUID();
    const startDate = new Date().toISOString();
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const loan = {
      id: loanId,
      userId: application.userId,
      applicationId: applicationId,
      principal,
      interestRate,
      termMonths,
      monthlyPayment,
      remainingBalance: totalAmount,
      totalAmount,
      status: 'active',
      startDate,
      nextPaymentDate: nextPaymentDate.toISOString(),
      lastPaymentDate: null,
      lastPaymentAmount: null,
      createdAt: new Date().toISOString(),
    };

    // Store loan
    await kv.set(`loan:${loanId}`, loan);
    await kv.set(`user_loan:${application.userId}:${loanId}`, loanId);

    // Update application status
    await kv.set(`application:${applicationId}`, {
      ...application,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      loanId,
    });

    return c.json({ loan });
  } catch (error) {
    console.error('Error approving loan:', error);
    return c.json({ error: 'Internal server error while approving loan' }, 500);
  }
});

// Get user's loans
app.get("/make-server-a5671405/loans", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error while fetching loans:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all loan IDs for this user
    const userLoanData = await kv.getByPrefix(`user_loan:${user.id}:`);
    
    // If no loan data, return empty array
    if (!userLoanData || userLoanData.length === 0) {
      return c.json({ loans: [] });
    }

    // userLoanData contains the loan IDs as values
    const loanIds = userLoanData;
    
    // Fetch all loans
    const loans = await kv.mget(loanIds.map((id: string) => `loan:${id}`));

    return c.json({ loans: loans || [] });
  } catch (error) {
    console.error('Error fetching loans:', error);
    return c.json({ error: 'Internal server error while fetching loans' }, 500);
  }
});

// Get specific loan details
app.get("/make-server-a5671405/loans/:loanId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error while fetching loan details:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const loanId = c.req.param('loanId');
    const loan = await kv.get(`loan:${loanId}`);

    if (!loan) {
      return c.json({ error: 'Loan not found' }, 404);
    }

    // Verify the loan belongs to the user
    if (loan.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({ loan });
  } catch (error) {
    console.error('Error fetching loan details:', error);
    return c.json({ error: 'Internal server error while fetching loan details' }, 500);
  }
});

// Get loan payment history
app.get("/make-server-a5671405/loans/:loanId/payments", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error while fetching payment history:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const loanId = c.req.param('loanId');
    const loan = await kv.get(`loan:${loanId}`);

    if (!loan || loan.userId !== user.id) {
      return c.json({ error: 'Loan not found or unauthorized' }, 401);
    }

    // Get all payments for this loan - getByPrefix returns the values directly
    const payments = await kv.getByPrefix(`payment:${loanId}:`);

    return c.json({ payments: payments || [] });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return c.json({ error: 'Internal server error while fetching payment history' }, 500);
  }
});

// Make a loan payment
app.post("/make-server-a5671405/loans/:loanId/payments", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error while making payment:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const loanId = c.req.param('loanId');
    const { amount } = await c.req.json();

    if (!amount || amount <= 0) {
      return c.json({ error: 'Valid payment amount is required' }, 400);
    }

    const loan = await kv.get(`loan:${loanId}`);

    if (!loan) {
      return c.json({ error: 'Loan not found' }, 404);
    }

    if (loan.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (amount > loan.remainingBalance) {
      return c.json({ error: 'Payment amount exceeds remaining balance' }, 400);
    }

    // Create payment record
    const paymentId = crypto.randomUUID();
    const payment = {
      id: paymentId,
      loanId,
      amount,
      date: new Date().toISOString(),
      status: 'completed',
      userId: user.id,
    };

    await kv.set(`payment:${loanId}:${paymentId}`, payment);

    // Update loan
    const newBalance = loan.remainingBalance - amount;
    const updatedLoan = {
      ...loan,
      remainingBalance: newBalance,
      lastPaymentDate: payment.date,
      lastPaymentAmount: amount,
      status: newBalance <= 0.01 ? 'paid_off' : 'active',
    };

    // Update next payment date if still active
    if (updatedLoan.status === 'active') {
      const nextDate = new Date(loan.nextPaymentDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      updatedLoan.nextPaymentDate = nextDate.toISOString();
    }

    await kv.set(`loan:${loanId}`, updatedLoan);

    return c.json({ loan: updatedLoan, payment });
  } catch (error) {
    console.error('Error processing payment:', error);
    return c.json({ error: 'Internal server error while processing payment' }, 500);
  }
});

Deno.serve(app.fetch);