import mongoose from 'mongoose';

const cropSchema = new mongoose.Schema({
    farmer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    },
    cropName: {
        type: String,
        required: true,
        trim: true
    },
    plantingDate: {
        type: Date,
        default: Date.now,
        required: true
    }
});

const Crop = mongoose.model('Crop', cropSchema);

export default Crop;