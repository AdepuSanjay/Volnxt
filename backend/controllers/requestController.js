const ChargingRequest = require('../models/ChargingRequest');

const createRequest = async (req, res) => {
  try {
    const { 
      providerId, 
      batteryStart, 
      targetBattery, 
      estimatedPrice, 
      estimatedTime, 
      distance,
      riderLat,
      riderLng,
      riderAddress 
    } = req.body;
    
    const initialDistance = Number(distance) || 2.4;
    const initialEta = Math.max(3, Math.round(initialDistance * 2.8));

    const request = await ChargingRequest.create({
      riderId: req.user._id,
      providerId,
      batteryStart,
      targetBattery,
      estimatedPrice,
      estimatedTime,
      distance: initialDistance,
      currentDistanceKm: initialDistance,
      etaMinutes: initialEta,
      riderLat: riderLat || 12.9716,
      riderLng: riderLng || 77.5946,
      riderAddress: riderAddress || 'Current GPS Location',
      currentLat: riderLat ? (Number(riderLat) + 0.015) : 12.9866,
      currentLng: riderLng ? (Number(riderLng) + 0.015) : 77.6096,
      status: 'PENDING'
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('createRequest error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await ChargingRequest.find({ riderId: req.user._id })
      .populate('providerId', 'name phone email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProviderRequests = async (req, res) => {
  try {
    const requests = await ChargingRequest.find({ providerId: req.user._id })
      .populate('riderId', 'name phone email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const current = await ChargingRequest.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Request not found' });

    const dist = current.distance || 2.4;
    const updateData = {
      status: 'ON_THE_WAY',
      currentDistanceKm: dist,
      etaMinutes: Math.max(3, Math.round(dist * 2.8)),
      bikerName: req.body.bikerName || 'Ramesh K. (Certified EV Tech)',
      bikerPhone: req.body.bikerPhone || '+91 98450 12345',
      bikerVehicle: req.body.bikerVehicle || 'VOLNXT Mobile DC Van (KA-01-EV-4421)'
    };

    const request = await ChargingRequest.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('riderId', 'name phone email')
      .populate('providerId', 'name phone email');
      
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const request = await ChargingRequest.findByIdAndUpdate(req.params.id, { status: 'REJECTED' }, { new: true });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTracking = async (req, res) => {
  try {
    const { currentDistanceKm, etaMinutes, currentLat, currentLng, status } = req.body;
    const updateFields = {};
    if (currentDistanceKm !== undefined) updateFields.currentDistanceKm = currentDistanceKm;
    if (etaMinutes !== undefined) updateFields.etaMinutes = etaMinutes;
    if (currentLat !== undefined) updateFields.currentLat = currentLat;
    if (currentLng !== undefined) updateFields.currentLng = currentLng;
    if (status) updateFields.status = status;

    const request = await ChargingRequest.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('riderId', 'name phone email')
      .populate('providerId', 'name phone email');

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await ChargingRequest.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('riderId', 'name phone email')
      .populate('providerId', 'name phone email');
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createRequest, 
  getMyRequests, 
  getProviderRequests, 
  acceptRequest, 
  rejectRequest, 
  updateTracking,
  updateRequestStatus 
};
