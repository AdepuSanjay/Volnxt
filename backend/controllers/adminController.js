const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const ChargingRequest = require('../models/ChargingRequest');
const ChargingSession = require('../models/ChargingSession');
const Payment = require('../models/Payment');
const Dispute = require('../models/Dispute');
const Rating = require('../models/Rating');
const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');

const resources = {
  users: { model: User, filter: { role: { $in: ['RIDER', 'PROVIDER'] } } },
  providers: { model: ProviderProfile, populate: [['userId', 'name email phone isActive']] },
  requests: { model: ChargingRequest, populate: [['riderId', 'name email phone'], ['providerId', 'name email phone']] },
  sessions: { model: ChargingSession, populate: [['riderId', 'name email'], ['providerId', 'name email'], 'requestId'] },
  payments: { model: Payment, populate: [['riderId', 'name email'], ['providerId', 'name email'], 'sessionId'] },
  disputes: { model: Dispute, populate: [['riderId', 'name email'], ['providerId', 'name email'], 'sessionId'] },
  ratings: { model: Rating, populate: [['fromUserId', 'name email'], ['toUserId', 'name email'], 'sessionId'] },
  reservations: { model: Reservation, populate: [['riderId', 'name email'], ['providerId', 'name email'], 'requestId'] },
  vehicles: { model: Vehicle, populate: [['userId', 'name email phone']] },
  notifications: { model: Notification, populate: [['userId', 'name email']] }
};

const statusOptions = {
  providers: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'],
  requests: ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'CHARGING', 'COMPLETED', 'CANCELLED', 'EXPIRED'],
  sessions: ['IN_PROGRESS', 'CHARGING', 'COMPLETED', 'DISPUTED'],
  payments: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'DISPUTED'],
  disputes: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
  reservations: ['ACTIVE', 'EXPIRED', 'COMPLETED', 'CANCELLED']
};

const applyPopulate = (query, populate) => {
  (populate || []).forEach((item) => {
    if (Array.isArray(item)) query.populate(item[0], item[1]);
    else query.populate(item);
  });
  return query;
};

const getSummary = async (req, res) => {
  try {
    const [riders, providers, pendingProviders, requests, activeSessions, payments, openDisputes, ratings] = await Promise.all([
      User.countDocuments({ role: 'RIDER' }),
      User.countDocuments({ role: 'PROVIDER' }),
      ProviderProfile.countDocuments({ verificationStatus: { $in: ['PENDING', 'UNDER_REVIEW'] } }),
      ChargingRequest.countDocuments(),
      ChargingSession.countDocuments({ status: { $in: ['IN_PROGRESS', 'CHARGING'] } }),
      Payment.aggregate([
        { $match: { status: 'PAID' } },
        { $group: { _id: null, grossAmount: { $sum: '$grossAmount' }, platformFee: { $sum: '$platformFee' } } }
      ]),
      Dispute.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } }),
      Rating.countDocuments()
    ]);

    res.json({
      riders,
      providers,
      pendingProviders,
      requests,
      activeSessions,
      paidGross: payments[0]?.grossAmount || 0,
      platformFees: payments[0]?.platformFee || 0,
      openDisputes,
      ratings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listModule = async (req, res) => {
  const resource = resources[req.params.module];
  if (!resource) return res.status(404).json({ message: 'Unknown admin module' });

  try {
    let query = resource.model.find(resource.filter || {}).sort({ createdAt: -1 }).limit(250);
    query = applyPopulate(query, resource.populate);
    res.json({ items: await query });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRecord = async (req, res) => {
  const { module } = req.params;
  const resource = resources[module];
  if (!resource) return res.status(404).json({ message: 'Unknown admin module' });

  try {
    const record = await resource.model.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    if (module === 'users') {
      if (String(record._id) === String(req.user._id)) {
        return res.status(400).json({ message: 'You cannot deactivate your own account' });
      }
      if (typeof req.body.isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean' });
      }
      record.isActive = req.body.isActive;
    } else {
      const allowedStatuses = statusOptions[module];
      if (!allowedStatuses || !allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid status for this module' });
      }
      if (module === 'providers') {
        record.verificationStatus = req.body.status;
        record.isAvailable = req.body.status === 'APPROVED';
        if (req.body.status !== 'APPROVED') record.isOnline = false;
      } else {
        record.status = req.body.status;
      }
    }

    await record.save();
    res.json({ item: record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSummary, listModule, updateRecord };