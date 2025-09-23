import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    language: { type: String, default: 'en-IN' },
    region: { type: String },
    history: { type: Array }
});

const Farmer = mongoose.model('Farmer', farmerSchema);
export default Farmer;