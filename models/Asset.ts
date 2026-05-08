import mongoose, { Schema, model, models } from 'mongoose';

const AssetSchema = new Schema({
  userId: {
    type: String, // Nanti ini akan diisi ID dari sistem Login (Clerk)
    required: true,
  },
  assetClass: { 
    type: String, 
    enum: ['CRYPTO', 'STOCK', 'COMMODITY', 'CASH'], 
    required: true 
  },
  assetTicker: {
    type: String,
    required: true,
    uppercase: true, // Otomatis mengubah 'btc' jadi 'BTC'
  },
  location: { 
    type: String, 
    default: "" 

  }, // TAMBAHKAN INI
  quantity: {
    type: Number,
    required: true,
    min: 0, // Tidak boleh minus
  },
  // Di dalam models/Asset.ts
  averagePurchasePrice: {
    type: Number,
    required: false, // Sekarang user tidak wajib mengisi ini
    default: 0,      // Jika kosong, anggap 0 agar tidak error (NaN)
    min: 0,
  },
  currentPrice: { 
    type: Number, 
    required: true, 
    min: 0 
  },

  marketSentiment: { 
    type: String, 
    enum: ['BULLISH', 'BEARISH', 'NEUTRAL'], 
    default: 'NEUTRAL' 
  },
  sentimentUpdatedAt: { 
    type: Date 
  }


}, { 
  timestamps: true // Otomatis membuat field createdAt dan updatedAt
});

// Penjagaan agar Next.js tidak membuat model ganda saat hot-reload
const Asset = models.Asset || model('Asset', AssetSchema);

export default Asset;
