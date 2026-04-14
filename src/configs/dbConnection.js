const mongoose = require('mongoose');

/**
 * Chuỗi kết nối MongoDB:
 * - Ưu tiên MONGO_URI (mongodb+srv Atlas hoặc mongodb:// localhost / Docker).
 * - Nếu không có: ghép từ DB_HOST, DB_PORT, DB_NAME và tùy chọn DB_USER / DB_PASSWORD.
 */
function resolveMongoUri() {
  const raw = process.env.MONGO_URI != null ? String(process.env.MONGO_URI).trim() : '';
  if (raw) {
    return { uri: raw, label: 'MONGO_URI' };
  }

  const DB_HOST = (process.env.DB_HOST || '127.0.0.1').trim();
  const DB_PORT = (process.env.DB_PORT || '27017').trim();
  const DB_NAME = (process.env.DB_NAME || 'warranty_toppilife').trim();
  const DB_USER = process.env.DB_USER != null ? String(process.env.DB_USER).trim() : '';
  const DB_PASSWORD = process.env.DB_PASSWORD != null ? String(process.env.DB_PASSWORD).trim() : '';
  const DB_AUTH_SOURCE = (process.env.DB_AUTH_SOURCE || 'admin').trim();

  let uri;
  if (DB_USER && DB_PASSWORD) {
    uri = `mongodb://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=${encodeURIComponent(DB_AUTH_SOURCE)}`;
  } else {
    uri = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  }

  return {
    uri,
    label: `DB_* (${DB_HOST}:${DB_PORT}/${DB_NAME})`,
  };
}

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      console.log('🟢 Already connected to MongoDB');
      return;
    }

    const { uri, label } = resolveMongoUri();

    const options = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      retryReads: true,
    };

    try {
      await mongoose.connect(uri, options);
      this.isConnected = true;

      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.isConnected = true;
      });

      console.log(`🟢 MongoDB connected (${label}})`);

      return mongoose.connection;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ MongoDB disconnected gracefully');
    } catch (error) {
      console.error('❌ Error disconnecting MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  isConnectedToDB() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();
