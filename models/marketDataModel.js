import mongoose from 'mongoose';

const marketDataSchema = new mongoose.Schema({
    farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true, unique: true },
    top_prices: [{
        commodity: String,
        mandi: String,
        modal_price: String
    }],
    last_updated: { type: Date }
});

const MarketData = mongoose.model('MarketData', marketDataSchema);
export default MarketData;