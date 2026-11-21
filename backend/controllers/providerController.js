const ProviderProfile = require('../models/ProviderProfile');

const getNearbyProviders = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    // Find providers who are APPROVED or PENDING
    const providers = await ProviderProfile.find({
      verificationStatus: { $in: ['APPROVED', 'PENDING'] }
    }).populate('userId', 'name email phone');
    
    // Haversine formula
    const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
      const d = R * c; // Distance in km
      return d;
    };

    if (!lat || !lng) {
      // Fallback: return all providers with null distance
      const fallbackList = providers.map(p => ({
        ...p.toObject(),
        distance: null
      }));
      return res.json(fallbackList);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxRadius = radius ? parseFloat(radius) : 50; // default 50 km

    const mapped = providers.map(p => {
      const hasCoords = p.latitude != null && p.longitude != null && !isNaN(p.latitude) && !isNaN(p.longitude);
      const dist = hasCoords 
        ? getDistanceFromLatLonInKm(latitude, longitude, p.latitude, p.longitude)
        : 9999;
      return { 
        ...p.toObject(), 
        distance: Math.round(dist * 10) / 10 
      };
    });

    // Sort by distance ascending (closest first)
    mapped.sort((a, b) => a.distance - b.distance);

    // Filter within radius; if none within radius, return all closest providers
    const withinRadius = mapped.filter(p => p.distance <= maxRadius);
    const result = withinRadius.length > 0 ? withinRadius : mapped;

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProviderById = async (req, res) => {
  try {
    const provider = await ProviderProfile.findById(req.params.id).populate('userId', 'name email phone');
    if (provider) {
      res.json(provider);
    } else {
      res.status(404).json({ message: 'Provider not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNearbyProviders, getProviderById, updateProfile };
