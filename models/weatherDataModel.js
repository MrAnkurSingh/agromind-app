import mongoose from 'mongoose';

const dailyForecastSchema = new mongoose.Schema({
    date: String,
    temp_min: Number,
    temp_max: Number,
    description: String,
    icon: String
});

const weatherDataSchema = new mongoose.Schema({
    farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true, unique: true },
    region: { type: String, required: true },
    forecast: [dailyForecastSchema],
    last_updated: { type: Date }
});

const WeatherData = mongoose.model('WeatherData', weatherDataSchema);
export default WeatherData;