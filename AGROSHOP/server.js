require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const axios = require('axios');
const crypto = require('crypto'); // Built-in Node.js module for security
const mongoose = require('mongoose'); // Import mongoose
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For JWT token generation and verification
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // For generating unique transaction IDs

const app = express();
const PORT = process.env.PORT || 3000;

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  });

// --- Mongoose Models ---
const Transaction = require('./models/Transaction'); // Assuming you have a Transaction model
const Order = require('./models/Order'); // Import the new Order model
const User = require('./models/User'); // Import the User model

// Check for required environment variables on startup
const REQUIRED_VARS = [
  'MTN_MOMO_API_USER_ID', 'MTN_MOMO_API_KEY', 'MTN_MOMO_SUBSCRIPTION_KEY',
  'MTN_MOMO_COLLECTION_BASE_URL', 'AIRTEL_MONEY_CLIENT_ID',
  'AIRTEL_MONEY_CLIENT_SECRET', 'AIRTEL_MONEY_BASE_URL',
  'MONGO_URI', 'JWT_SECRET', // JWT_SECRET is now required
  'WEBHOOK_SECRET_AIRTEL', // Secret shared with Airtel for HMAC
  'MTN_WEBHOOK_USER', 'MTN_WEBHOOK_PASS' // Credentials for MTN Basic Auth
];

REQUIRED_VARS.forEach((v) => {
  if (!process.env[v]) {
    console.error(`FATAL: Missing environment variable ${v}`);
    process.exit(1);
  }
});

// Middleware
app.use(cors()); // Enable CORS for all routes (adjust for production)
app.use(bodyParser.json()); // Parse JSON request bodies

// --- Helper Functions for Token Management ---
async function getMtnToken() {
  const auth = Buffer.from(`${process.env.MTN_MOMO_API_USER_ID}:${process.env.MTN_MOMO_API_KEY}`).toString('base64');
  const response = await axios.post(
    `${process.env.MTN_MOMO_COLLECTION_BASE_URL.replace('/collection/v1_0', '')}/token/`,
    {},
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
      },
    }
  );
  return response.data.access_token;
}

async function getAirtelToken() {
  const response = await axios.post(
    process.env.AIRTEL_MONEY_BASE_URL,
    {
      client_id: process.env.AIRTEL_MONEY_CLIENT_ID,
      client_secret: process.env.AIRTEL_MONEY_CLIENT_SECRET,
      grant_type: 'client_credentials',
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data.access_token;
}

// --- Authentication Middleware ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization token is required' });
  }

  const token = authHeader.split(' ')[1]; // Expects "Bearer TOKEN"
  if (!token) {
    return res.status(401).json({ message: 'Authorization token is required' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodedToken.userId; // Attach userId to the request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password
    const newUser = new User({ email, password: hashedPassword, name });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: newUser._id, email: newUser.email, name: newUser.name } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// --- MTN MoMo API Integration (Placeholder) ---
app.post('/api/momo/initiate-payment', authMiddleware, async (req, res) => { // Protected route
  const { phoneNumber, amount, currency = 'NGN', cartItems } = req.body;
  const userId = req.userId; // Get userId from auth middleware

  if (!phoneNumber || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ 
      message: 'A valid phone number and positive numeric amount are required.',
      received: { phoneNumber, amount }
    });
  }

  const externalId = uuidv4();
  const referenceId = uuidv4();

  try {
    const token = await getMtnToken();

    await axios.post(
      `${process.env.MTN_MOMO_COLLECTION_BASE_URL}/requesttopay`,
      {
        amount: amount.toString(),
        currency: currency,
        externalId: externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber,
        },
        payerMessage: `Agroshop Payment`,
        payeeNote: 'Order Payment',
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': 'sandbox',
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
        },
      }
    );

    // Save transaction to MongoDB
    const newTransaction = new Transaction({
      transactionId: referenceId,
      externalId: externalId, // MTN uses externalId for their reference
      phoneNumber,
      amount,
      currency,
      status: 'pending',
      provider: 'MTN',
    });
    await newTransaction.save();

    // Create a new Order in MongoDB
    const newOrder = new Order({ items: cartItems, totalAmount: amount, paymentTransactionId: referenceId, status: 'pending', userId });
    await newOrder.save();
    res.status(200).json({
      message: 'MTN MoMo prompt sent. Please enter your PIN on your phone.',
      status: 'pending',
      transactionId: referenceId,
      provider: 'MTN MoMo'
    });
  } catch (error) {
    console.error('Error initiating MTN MoMo payment:', error.response ? error.response.data : error.message);
    res.status(500).json({
      message: 'Failed to initiate MTN MoMo payment.',
      error: error.message,
      provider: 'MTN MoMo'
    });
  }
});

// --- Airtel Money API Integration (Placeholder) ---
app.post('/api/airtel-money/initiate-payment', authMiddleware, async (req, res) => { // Protected route
  const { phoneNumber, amount, currency = 'RWF' } = req.body; // Assuming RWF as currency for example
  const userId = req.userId; // Get userId from auth middleware

  if (!phoneNumber || !amount) {
    return res.status(400).json({ message: 'Phone number and amount are required.' });
  }

  const referenceId = uuidv4(); // Unique reference for Airtel Money
  try {
    const token = await getAirtelToken();
    
    await axios.post(
      `${process.env.AIRTEL_MONEY_BASE_URL.split('/auth')[0]}/standard/v1/payments`,
      {
        reference: referenceId,
        subscriber: { msisdn: phoneNumber },
        transaction: {
          amount: amount,
          currency: currency,
          id: referenceId
        }
      },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    // Save transaction to MongoDB
    const newTransaction = new Transaction({
      transactionId: referenceId,
      phoneNumber,
      amount,
      currency,
      status: 'pending',
      provider: 'Airtel',
    });
    await newTransaction.save();

    // Create a new Order in MongoDB
    const newOrder = new Order({ items: cartItems, totalAmount: amount, paymentTransactionId: referenceId, status: 'pending', userId });
    await newOrder.save();
    
    res.status(200).json({
      message: 'Airtel Money prompt sent. Please enter your PIN on your phone.',
      status: 'pending',
      transactionId: referenceId,
      provider: 'Airtel Money'
    });
  } catch (error) {
    console.error('Error initiating Airtel Money payment:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Failed to initiate Airtel Money payment.', error: error.message, provider: 'Airtel Money' });
  }
});

// --- Status Check Endpoint ---
app.get('/api/payment-status/:transactionId', authMiddleware, async (req, res) => { // Protected route
  const { transactionId } = req.params; // Get transactionId from request parameters

  Transaction.findOne({ paymentTransactionId: transactionId }) // Find transaction in MongoDB
    .then(transaction => {
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      res.status(200).json(transaction);
    })
    .catch(error => {
      console.error('Error fetching transaction status:', error);
      res.status(500).json({ message: 'Failed to fetch transaction status.', error: error.message });
    });
});

// --- Webhook Callbacks ---
// Note: You must expose your local server using a tool like ngrok 
// and configure these URLs in the MTN/Airtel Developer Portals.

/**
 * SECURE MTN WEBHOOK
 * Strategy: Basic Auth validation + "Verify by Query"
 */
app.post('/api/webhook/momo', express.json(), async (req, res) => {
  // 1. Check Basic Auth (MTN sends credentials if configured)
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send('Unauthorized');

  // 2. Extract Reference ID
  const { externalId, status } = req.body;
  const refId = req.headers['x-reference-id'] || externalId;

  console.log(`[MTN Webhook Received] Ref: ${refId}`);

  try {
    // 3. SECURE STEP: Call MTN API directly to verify the status
    // This prevents "spoofing" where a hacker sends a fake success JSON to this endpoint.
    const token = await getMtnToken();
    const verifyResponse = await axios.get(
      `${process.env.MTN_MOMO_COLLECTION_BASE_URL}/requesttopay/${refId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
        }
      }
    );

    const verifiedStatus = verifyResponse.data.status;
    
    // Update the Transaction status in MongoDB
    await Transaction.updateOne({ transactionId: refId }, { status: verifiedStatus.toLowerCase() === 'successful' ? 'success' : 'failed', updatedAt: new Date() }).exec();
    // Update the Order status in MongoDB (assuming paymentTransactionId is unique)
    await Order.updateOne({ paymentTransactionId: refId }, { status: verifiedStatus.toLowerCase() === 'successful' ? 'paid' : 'failed', updatedAt: new Date() }).exec();
      console.log(`[MTN Webhook Verified] Ref: ${refId}, Real Status: ${verifiedStatus}`);
    }
  } catch (error) {
    console.error('Error verifying MTN Webhook via API:', error.message);
  }
  
  res.status(200).send();
});

/**
 * SECURE AIRTEL WEBHOOK
 * Strategy: HMAC-SHA256 Signature Verification
 */
app.post('/api/webhook/airtel', (req, res) => {
  const receivedSignature = req.headers['x-signature']; // Airtel typically sends a signature

  // 1. Re-calculate the hash using your secret and the request body
  const secret = process.env.WEBHOOK_SECRET_AIRTEL;
  const computedHash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  // 2. Compare. If they don't match, the request might be faked.
  if (computedHash !== receivedSignature) {
    console.error('[Airtel Webhook] Invalid Signature detected!');
    return res.status(403).send('Invalid Signature');
  }

  const { transaction } = req.body;
  const refId = transaction?.id;

  console.log(`[Airtel Webhook] Ref: ${refId}, Status: ${transaction?.status}`);
  // Update the Transaction status in MongoDB
  Transaction.updateOne({ transactionId: refId }, { status: transaction.status?.toLowerCase() === 'success' ? 'success' : 'failed', updatedAt: new Date() }).exec();
  // Update the Order status in MongoDB
  Order.updateOne({ paymentTransactionId: refId }, { status: transaction.status?.toLowerCase() === 'success' ? 'success' : 'failed', updatedAt: new Date() }).exec();
  res.status(200).send();
});

// --- Paystack Verification Endpoint ---
app.post('/api/paystack/verify-payment', async (req, res) => {
  const { reference, amount, cartItems, email } = req.body;

  if (!reference || !amount || !cartItems || !email) {
    return res.status(400).json({ message: 'Missing required payment details.' });
  }

  try {
    // 1. Verify the transaction with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Ensure you have this in your .env
          'Content-Type': 'application/json',
        },
      }
    );

    const paystackData = paystackResponse.data;

    if (paystackData.status && paystackData.data.status === 'success' && paystackData.data.amount === amount * 100) {
      // 2. Save transaction to MongoDB
      const newTransaction = new Transaction({
        transactionId: reference,
        phoneNumber: email, // Using email as identifier for Paystack
        amount,
        currency: paystackData.data.currency,
        status: 'success',
        provider: 'Paystack',
      });
      await newTransaction.save();

      // 3. Create a new Order in MongoDB
      const newOrder = new Order({ items: cartItems, totalAmount: amount, paymentTransactionId: reference, status: 'paid', userId });
      await newOrder.save();

      return res.status(200).json({ status: 'success', message: 'Paystack payment verified and order created.' });
    } else {
      return res.status(400).json({ status: 'failed', message: 'Paystack verification failed or amount mismatch.' });
    }
  } catch (error) {
    console.error('Error verifying Paystack payment:', error.response ? error.response.data : error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to verify Paystack payment.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`AGROSHOP Payment Backend running on port ${PORT}`);
});