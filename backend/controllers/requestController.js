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

    const request = await ChargingRequest.create({
      riderId: req.user._id,
      providerId,
      batteryStart,
      targetBattery,
      estimatedPrice,
      estimatedTime,
      distance: initialDistance,
      riderLat: riderLat || 12.9716,
      riderLng: riderLng || 77.5946,
      riderAddress: riderAddress || 'Current GPS Location',
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

    const updateData = {
      status: 'ON_THE_WAY',
      currentLat: null,
      currentLng: null,
      currentDistanceKm: null,
      etaMinutes: null,
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
    const request = await ChargingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (String(request.providerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned provider can update tracking' });
    }

    const currentLat = Number(req.body.currentLat);
    const currentLng = Number(req.body.currentLng);
    if (!Number.isFinite(currentLat) || !Number.isFinite(currentLng)
      || currentLat < -90 || currentLat > 90 || currentLng < -180 || currentLng > 180) {
      return res.status(400).json({ message: 'Valid provider coordinates are required' });
    }

    const updateFields = { currentLat, currentLng };
    if (Number.isFinite(request.riderLat) && Number.isFinite(request.riderLng)) {
      const toRadians = (degrees) => degrees * Math.PI / 180;
      const latDelta = toRadians(request.riderLat - currentLat);
      const lngDelta = toRadians(request.riderLng - currentLng);
      const value = Math.sin(latDelta / 2) ** 2
        + Math.cos(toRadians(currentLat)) * Math.cos(toRadians(request.riderLat)) * Math.sin(lngDelta / 2) ** 2;
      const rangeKm = 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
      updateFields.currentDistanceKm = Number(rangeKm.toFixed(2));
      updateFields.etaMinutes = Math.ceil(rangeKm * 2);
    }

    const updatedRequest = await ChargingRequest.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('riderId', 'name phone email')
      .populate('providerId', 'name phone email');

    res.json(updatedRequest);
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
