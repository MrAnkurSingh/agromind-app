import mongoose from 'mongoose';

const marketDataSchema = new mongoose.Schema({
    farmer_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Farmer' },
    state: { type: String, required: true },
    top_prices: [
        {
            commodity: { type: String },
            modal_price: { type: Number }
        }
    ],
    updatedAt: { type: Date, default: Date.now }
});

const MarketData = mongoose.model('MarketData', marketDataSchema);
export default MarketData;