const ChargingSession = require('../models/ChargingSession');
const ChargingRequest = require('../models/ChargingRequest');
const Payment = require('../models/Payment');

const startSession = async (req, res) => {
  try {
    const { 
      requestId, 
      startBatteryPercentage, 
      targetBatteryPercentage, 
      pricingModel, 
      priceRate, 
      estimatedAmount 
    } = req.body;
    
    const request = await ChargingRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (String(request.providerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned provider can start this session' });
    }
    if (request.status !== 'ARRIVED') {
      return res.status(409).json({ message: 'The provider must arrive before charging starts' });
    }
    
    request.status = 'CHARGING';
    await request.save();

    const session = await ChargingSession.create({
      requestId,
      riderId: request.riderId,
      providerId: request.providerId,
      startBatteryPercentage: Number(startBatteryPercentage) || 15,
      targetBatteryPercentage: Number(targetBatteryPercentage) || 80,
      currentBatteryPercentage: Number(startBatteryPercentage) || 15,
      pricingModel: pricingModel || 'FIXED',
      priceRate: Number(priceRate) || 15,
      estimatedAmount: Number(estimatedAmount) || 250,
      chargingPowerKw: 29.5,
      voltageV: 382,
      currentA: 77.2,
      energyDeliveredKwh: 0,
      status: 'CHARGING'
    });

    const populatedSession = await ChargingSession.findById(session._id).populate('providerId riderId');
    res.status(201).json(populatedSession);
  } catch (error) {
    console.error('startSession error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateBattery = async (req, res) => {
  try {
    const { percentage, powerKw, voltage, current, energyKwh } = req.body;
    const session = await ChargingSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (String(session.providerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned provider can update session telemetry' });
    }
    if (!['CHARGING', 'IN_PROGRESS'].includes(session.status)) {
      return res.status(409).json({ message: 'This charging session is no longer active' });
    }

    if (percentage !== undefined) {
      session.currentBatteryPercentage = Number(percentage);
    }
    if (powerKw !== undefined) session.chargingPowerKw = Number(powerKw);
    if (voltage !== undefined) session.voltageV = Number(voltage);
    if (current !== undefined) session.currentA = Number(current);

    if (energyKwh !== undefined) {
      session.energyDeliveredKwh = Number(energyKwh);
    } else if (percentage !== undefined) {
      // Approximate 40 kWh total battery pack: (pctAdded / 100) * 40
      const pctAdded = Math.max(0, session.currentBatteryPercentage - session.startBatteryPercentage);
      session.energyDeliveredKwh = Number(((pctAdded / 100) * 40).toFixed(2));
    }

    session.batteryUpdates.push({ 
      percentage: session.currentBatteryPercentage, 
      energyKwh: session.energyDeliveredKwh,
      powerKw: session.chargingPowerKw,
      updatedBy: req.user._id 
    });
    
    await session.save();

    const populated = await ChargingSession.findById(session._id).populate('providerId riderId');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const endSession = async (req, res) => {
  try {
    const session = await ChargingSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (String(session.providerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned provider can end this session' });
    }
    if (session.status === 'PAYMENT_PENDING' || session.status === 'COMPLETED') {
      const existing = await ChargingSession.findById(session._id).populate('providerId riderId');
      return res.json(existing);
    }
    if (!['CHARGING', 'IN_PROGRESS'].includes(session.status)) {
      return res.status(409).json({ message: 'This charging session cannot be ended' });
    }

    const finalBattery = Number(session.currentBatteryPercentage);
    session.endBatteryPercentage = finalBattery;
    session.status = 'PAYMENT_PENDING';
    session.endTime = Date.now();

    // Calculate final amount
    let finalAmount = session.estimatedAmount;
    if (session.pricingModel === 'PER_PERCENTAGE') {
      const added = Math.max(0, finalBattery - session.startBatteryPercentage);
      finalAmount = Math.max(session.priceRate, added * session.priceRate);
    } else if (session.pricingModel === 'PER_KWH') {
      finalAmount = Math.max(session.priceRate, session.energyDeliveredKwh * session.priceRate);
    }

    const platformFee = Math.round(finalAmount * 0.10); // 10% platform fee
    const providerAmount = Math.round(finalAmount - platformFee);

    session.finalAmount = Math.round(finalAmount);
    session.platformFee = platformFee;
    session.providerAmount = providerAmount;
    await session.save();

    await Payment.findOneAndUpdate(
      { sessionId: session._id },
      {
        $setOnInsert: {
          sessionId: session._id,
          riderId: session.riderId,
          providerId: session.providerId,
          grossAmount: session.finalAmount,
          platformFee,
          providerAmount,
          currency: 'INR',
          status: 'PENDING'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const populated = await ChargingSession.findById(session._id).populate('providerId riderId');
    res.json(populated);
  } catch (error) {
    console.error('endSession error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const session = await ChargingSession.findById(req.params.id).populate('providerId riderId');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (String(session.riderId?._id || session.riderId) !== String(req.user._id)
      && String(session.providerId?._id || session.providerId) !== String(req.user._id)
      && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to view this session' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActiveSession = async (req, res) => {
  try {
    const session = await ChargingSession.findOne({
      $or: [{ riderId: req.user._id }, { providerId: req.user._id }],
      status: { $in: ['CHARGING', 'IN_PROGRESS', 'PAYMENT_PENDING'] }
    }).populate('providerId riderId');
    res.json(session || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProviderStats = async (req, res) => {
  try {
    const providerId = req.user._id;

    // Find all completed sessions for this provider
    const completedSessions = await ChargingSession.find({
      providerId,
      status: 'COMPLETED'
    })
      .populate('riderId', 'name email phone')
      .populate('requestId')
      .sort({ updatedAt: -1 });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let totalEarnings = 0;
    let todayEarnings = 0;
    let todaySessionsCount = 0;
    let totalEnergyKwh = 0;

    completedSessions.forEach(session => {
      const amount = Number(session.providerAmount !== undefined && session.providerAmount !== null 
        ? session.providerAmount 
        : (session.finalAmount || session.estimatedAmount || 0));
      
      totalEarnings += amount;
      totalEnergyKwh += Number(session.energyDeliveredKwh || 0);

      const sessionDate = new Date(session.endTime || session.updatedAt || session.createdAt);
      if (sessionDate >= startOfToday) {
        todayEarnings += amount;
        todaySessionsCount += 1;
      }
    });

    res.json({
      totalEarnings: Math.round(totalEarnings),
      todayEarnings: Math.round(todayEarnings),
      totalSessionsCount: completedSessions.length,
      todaySessionsCount,
      totalEnergyKwh: Number(totalEnergyKwh.toFixed(1)),
      recentSessions: completedSessions.slice(0, 20)
    });
  } catch (error) {
    console.error('getProviderStats error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startSession, updateBattery, endSession, getSession, getActiveSession, getProviderStats };
