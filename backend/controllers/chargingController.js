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
    const { endBatteryPercentage } = req.body;
    const session = await ChargingSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const finalBattery = endBatteryPercentage !== undefined ? Number(endBatteryPercentage) : session.currentBatteryPercentage;
    session.endBatteryPercentage = finalBattery;
    session.currentBatteryPercentage = finalBattery;
    session.status = 'COMPLETED';
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

    const request = await ChargingRequest.findById(session.requestId);
    if (request) {
      request.status = 'COMPLETED';
      await request.save();
    }

    await Payment.create({
      sessionId: session._id,
      riderId: session.riderId,
      providerId: session.providerId,
      grossAmount: session.finalAmount,
      platformFee,
      providerAmount,
      status: 'PAID'
    });

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
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActiveSession = async (req, res) => {
  try {
    const session = await ChargingSession.findOne({
      $or: [{ riderId: req.user._id }, { providerId: req.user._id }],
      status: { $in: ['CHARGING', 'IN_PROGRESS'] }
    }).populate('providerId riderId');
    res.json(session || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startSession, updateBattery, endSession, getSession, getActiveSession };
