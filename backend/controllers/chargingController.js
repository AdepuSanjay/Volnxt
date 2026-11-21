const ChargingSession = require('../models/ChargingSession');
const ChargingRequest = require('../models/ChargingRequest');
const Payment = require('../models/Payment');

const startSession = async (req, res) => {
  try {
    const { requestId, startBatteryPercentage, targetBatteryPercentage, pricingModel, priceRate, estimatedAmount } = req.body;
    
    const request = await ChargingRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    request.status = 'CHARGING';
    await request.save();

    const session = await ChargingSession.create({
      requestId,
      riderId: request.riderId,
      providerId: request.providerId,
      startBatteryPercentage,
      targetBatteryPercentage,
      currentBatteryPercentage: startBatteryPercentage,
      pricingModel,
      priceRate,
      estimatedAmount
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBattery = async (req, res) => {
  try {
    const { percentage } = req.body;
    const session = await ChargingSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.currentBatteryPercentage = percentage;
    session.batteryUpdates.push({ percentage, updatedBy: req.user._id });
    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const endSession = async (req, res) => {
  try {
    const { endBatteryPercentage } = req.body;
    const session = await ChargingSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.endBatteryPercentage = endBatteryPercentage;
    session.status = 'COMPLETED';
    session.endTime = Date.now();

    // Calculate final amount
    let finalAmount = session.estimatedAmount;
    if (session.pricingModel === 'PER_PERCENTAGE') {
      const added = endBatteryPercentage - session.startBatteryPercentage;
      finalAmount = added * session.priceRate;
    }

    const platformFee = finalAmount * 0.10; // 10% mock fee
    const providerAmount = finalAmount - platformFee;

    session.finalAmount = finalAmount;
    session.platformFee = platformFee;
    session.providerAmount = providerAmount;
    await session.save();

    const request = await ChargingRequest.findById(session.requestId);
    request.status = 'COMPLETED';
    await request.save();

    await Payment.create({
      sessionId: session._id,
      riderId: session.riderId,
      providerId: session.providerId,
      grossAmount: finalAmount,
      platformFee,
      providerAmount,
      status: 'PAID'
    });

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const session = await ChargingSession.findById(req.params.id).populate('providerId riderId');
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActiveSession = async (req, res) => {
  try {
    const session = await ChargingSession.findOne({
      $or: [{ riderId: req.user._id }, { providerId: req.user._id }],
      status: 'CHARGING'
    });
    res.json(session || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startSession, updateBattery, endSession, getSession, getActiveSession };
