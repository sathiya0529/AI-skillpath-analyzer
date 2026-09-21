const mongoose = require('mongoose');

let dbReady = false;
const isDbReady = () => dbReady;

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillpath';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    dbReady = true;
    console.log('✅ MongoDB connected:', uri.replace(/\/\/.*@/, '//***@'));
  } catch (err) {
    dbReady = false;
    console.warn('⚠️  MongoDB unreachable:', err.message);
    if (process.env.ALLOW_MEM_FALLBACK !== 'false') {
      console.warn('⚠️  Running in IN-MEMORY mode (data resets on restart). Start MongoDB / Compass to persist.');
    } else {
      throw err;
    }
  }
}

module.exports = { connectDB, isDbReady };
