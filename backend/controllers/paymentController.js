const crypto = require('crypto');
const Razorpay = require('razorpay');
const ChargingRequest = require('../models/ChargingRequest');
const ChargingSession = require('../models/ChargingSession');
const Payment = require('../models/Payment');

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    const error = new Error('Razorpay is not configured');
    error.status = 503;
    throw error;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const createOrder = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });

    const session = await ChargingSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (String(session.riderId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the rider for this session can pay' });
    }
    if (session.status !== 'PAYMENT_PENDING' || !Number.isFinite(session.finalAmount)) {
      return res.status(409).json({ message: 'This session is not awaiting payment' });
    }

    const amountPaise = Math.round(session.finalAmount * 100);
    if (amountPaise < 100) return res.status(400).json({ message: 'Payment amount must be at least ₹1' });

    const razorpay = getRazorpayClient();
    let payment = await Payment.findOne({ sessionId: session._id });
    if (payment?.status === 'PAID') {
      return res.status(409).json({ message: 'This session has already been paid' });
    }

    if (payment?.status === 'PENDING' && payment.razorpayOrderId && payment.amountPaise === amountPaise) {
      return res.json({
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: payment.razorpayOrderId,
        amount: payment.amountPaise,
        currency: payment.currency || 'INR',
        sessionId: session._id
      });
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `volnxt_${session._id}`,
      notes: { sessionId: String(session._id) }
    });

    if (!payment) {
      payment = new Payment({
        sessionId: session._id,
        riderId: session.riderId,
        providerId: session.providerId,
        grossAmount: session.finalAmount,
        platformFee: session.platformFee,
        providerAmount: session.providerAmount
      });
    }
    payment.razorpayOrderId = order.id;
    payment.amountPaise = amountPaise;
    payment.currency = 'INR';
    payment.status = 'PENDING';
    await payment.save();

    res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: amountPaise,
      currency: 'INR',
      sessionId: session._id
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Unable to create payment order' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: 'Razorpay payment details are required' });
    }

    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) return res.status(404).json({ message: 'Payment order not found' });
    if (String(payment.riderId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the rider for this payment can verify it' });
    }
    if (payment.status === 'PAID') {
      if (payment.razorpayPaymentId !== paymentId) {
        return res.status(409).json({ message: 'This order was completed with another payment' });
      }
      const completedSession = await ChargingSession.findById(payment.sessionId).populate('providerId riderId');
      return res.json({ session: completedSession, payment });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(503).json({ message: 'Razorpay is not configured' });
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');
    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    const session = await ChargingSession.findById(payment.sessionId);
    if (!session || String(session.riderId) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Payment session not found' });
    }
    if (!['PAYMENT_PENDING', 'COMPLETED'].includes(session.status)) {
      return res.status(409).json({ message: 'Session is not ready to be settled' });
    }

    const razorpay = getRazorpayClient();
    let gatewayPayment = await razorpay.payments.fetch(paymentId);
    if (gatewayPayment.order_id !== orderId
      || Number(gatewayPayment.amount) !== payment.amountPaise
      || gatewayPayment.currency !== (payment.currency || 'INR')) {
      return res.status(400).json({ message: 'Payment details do not match this order' });
    }
    if (gatewayPayment.status === 'authorized') {
      await razorpay.payments.capture(paymentId, gatewayPayment.amount, gatewayPayment.currency);
      gatewayPayment = await razorpay.payments.fetch(paymentId);
    }
    if (gatewayPayment.status !== 'captured') {
      return res.status(402).json({ message: 'Razorpay has not captured this payment yet' });
    }

    session.status = 'COMPLETED';
    session.endTime = session.endTime || new Date();
    await session.save();

    const request = await ChargingRequest.findById(session.requestId);
    if (request) {
      request.status = 'COMPLETED';
      await request.save();
    }

    payment.status = 'PAID';
    payment.razorpayPaymentId = paymentId;
    payment.razorpaySignature = signature;
    await payment.save();

    const populatedSession = await ChargingSession.findById(session._id).populate('providerId riderId');
    res.json({ session: populatedSession, payment });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Unable to verify payment' });
  }
};

module.exports = { createOrder, verifyPayment };