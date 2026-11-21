const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const User = require('./models/User');
const ProviderProfile = require('./models/ProviderProfile');
const Vehicle = require('./models/Vehicle');
const ChargingRequest = require('./models/ChargingRequest');
const ChargingSession = require('./models/ChargingSession');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await ProviderProfile.deleteMany();
    await Vehicle.deleteMany();
    await ChargingRequest.deleteMany();
    await ChargingSession.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const users = [];
    
    // 1 Admin
    users.push({ name: 'Admin', email: 'admin@voltroute.com', phone: '0000000000', password, role: 'ADMIN' });
    
    // 5 Riders
    for (let i = 1; i <= 5; i++) {
      users.push({ name: `Rider ${i}`, email: `rider${i}@test.com`, phone: `100000000${i}`, password, role: 'RIDER' });
    }

    // 3 Partner Businesses
    const businessNames = ['Green EV Service Center', 'ChargeCafe', 'QuickCharge Bikes'];
    for (let i = 0; i < 3; i++) {
      users.push({ name: `Business ${i+1}`, email: `business${i+1}@test.com`, phone: `200000000${i}`, password, role: 'PROVIDER' });
    }

    // 5 Verified Individuals
    const individualNames = ['Ravi Charging Point', 'Kumar Home Charging', 'Sai EV Charge', 'Arun Private Charger', 'City Home EV Charging'];
    for (let i = 0; i < 5; i++) {
      users.push({ name: individualNames[i], email: `individual${i+1}@test.com`, phone: `300000000${i}`, password, role: 'PROVIDER' });
    }

    const createdUsers = await User.insertMany(users);

    const adminUser = createdUsers[0];
    const riders = createdUsers.slice(1, 6);
    const businesses = createdUsers.slice(6, 9);
    const individuals = createdUsers.slice(9, 14);

    // Create Vehicles for Riders
    const vehicles = riders.map((rider, i) => ({
      userId: rider._id,
      vehicleModel: `EV Model ${i+1}`,
      connectorType: i % 2 === 0 ? 'Type 2' : 'CCS',
      batteryCapacity: `${20 + i * 5} kWh`
    }));
    await Vehicle.insertMany(vehicles);

    // Create Provider Profiles
    const providerProfiles = [];

    // Business Profiles
    businesses.forEach((b, i) => {
      providerProfiles.push({
        userId: b._id,
        providerType: 'BUSINESS',
        businessName: businessNames[i],
        ownerName: b.name,
        phone: b.phone,
        address: `${i+1} Main St, City`,
        latitude: 12.9716 + (Math.random() * 0.05),
        longitude: 77.5946 + (Math.random() * 0.05),
        chargingType: 'DC',
        connectorType: 'CCS',
        chargingPower: '50 kW',
        pricingModel: 'PER_KWH',
        price: 15,
        availability: 'AVAILABLE',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '08:00 AM',
        endTime: '10:00 PM',
        verificationStatus: 'APPROVED',
        safetyDeclaration: true,
        rating: 4.5 + (Math.random() * 0.5),
        totalRatings: 15 + Math.floor(Math.random() * 50),
        isOnline: true,
        isAvailable: true
      });
    });

    // Individual Profiles
    individuals.forEach((ind, i) => {
      providerProfiles.push({
        userId: ind._id,
        providerType: 'INDIVIDUAL',
        businessName: individualNames[i],
        ownerName: ind.name,
        phone: ind.phone,
        address: `${i+1} Residential Layout, City`,
        latitude: 12.9716 - (Math.random() * 0.05),
        longitude: 77.5946 - (Math.random() * 0.05),
        chargingType: 'AC',
        connectorType: 'Type 2',
        chargingPower: '7.2 kW',
        pricingModel: 'FIXED',
        price: 50,
        availability: 'AVAILABLE',
        availableDays: ['Saturday', 'Sunday'],
        startTime: '06:00 PM',
        endTime: '11:00 PM',
        verificationStatus: 'APPROVED',
        safetyDeclaration: true,
        rating: 4.2 + (Math.random() * 0.8),
        totalRatings: 5 + Math.floor(Math.random() * 20),
        isOnline: true,
        isAvailable: true
      });
    });

    await ProviderProfile.insertMany(providerProfiles);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();
