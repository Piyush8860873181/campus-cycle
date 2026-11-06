const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campuscycle';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[Database] Local MongoDB daemon not reachable at ${uri}.`);
    console.log(`[Database] Activating Resilient Persistent Data Engine (backend/data/campuscycle_store.json).`);
    console.log(`[Database] Note: To switch to MongoDB Atlas or local MongoDB, set MONGODB_URI in backend/.env`);
    isConnected = false;
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
