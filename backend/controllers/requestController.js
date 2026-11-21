const ChargingRequest = require('../models/ChargingRequest');

const createRequest = async (req, res) => {
  try {
    const { providerId, batteryStart, targetBattery, estimatedPrice, estimatedTime, distance } = req.body;
    
    const request = await ChargingRequest.create({
      riderId: req.user._id,
      providerId,
      batteryStart,
      targetBattery,
      estimatedPrice,
      estimatedTime,
      distance,
      status: 'PENDING'
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await ChargingRequest.find({ riderId: req.user._id }).populate('providerId', 'name');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProviderRequests = async (req, res) => {
  try {
    const requests = await ChargingRequest.find({ providerId: req.user._id }).populate('riderId', 'name');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const request = await ChargingRequest.findByIdAndUpdate(req.params.id, { status: 'ACCEPTED' }, { new: true });
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

const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await ChargingRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRequest, getMyRequests, getProviderRequests, acceptRequest, rejectRequest, updateRequestStatus };
