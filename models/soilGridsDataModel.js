import mongoose from 'mongoose';

const soilGridsDataSchema = new mongoose.Schema({
    farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true, unique: true },
    ph: Number,
    soc: Number, 
    clay: Number,
    last_updated: { type: Date }
});

const SoilGridsData = mongoose.model('SoilGridsData', soilGridsDataSchema);
export default SoilGridsData;