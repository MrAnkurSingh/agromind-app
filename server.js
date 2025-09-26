import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { OpenAI } from 'openai';
import fetch from 'node-fetch';
import { franc } from 'franc-min';
import bcrypt from 'bcryptjs';
import opencage from 'opencage-api-client';

// Models
import Farmer from './models/farmerModel.js';
import WeatherData from './models/weatherDataModel.js';
import MarketData from './models/marketDataModel.js';
import SoilGridsData from './models/soilGridsDataModel.js';
import Crop from './models/cropModel.js';

// Services
import { syncWeatherData } from './services/weatherService.js';
import { syncMarketData } from './services/marketPriceService.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => console.error('Connection error', err));

// --- Auth Endpoints ---
app.post('/api/register', async (req, res) => {
    try {
        const { name, username, password, region, language } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newFarmer = new Farmer({ name, username, password: hashedPassword, region, language, history: [] });
        await newFarmer.save();
        res.status(201).json({ message: 'Registration successful', farmer_id: newFarmer._id });
    } catch (error) {
        console.error("REGISTRATION ERROR:", error);
        if (error.code === 11000) return res.status(409).json({ error: 'This username is already taken.' });
        res.status(500).json({ error: 'Error registering farmer' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const farmer = await Farmer.findOne({ username: username });
        if (!farmer) return res.status(404).json({ error: 'User not found.' });
        
        const isMatch = await bcrypt.compare(password, farmer.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

        res.json({ message: 'Login successful', farmer_id: farmer._id });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});


// --- Dashboard & Data Sync Endpoints ---
app.get('/api/dashboard/:farmer_id', async (req, res) => {
    try {
        const { farmer_id } = req.params;
        // Fetch all data in parallel for efficiency
        const [farmer, weather, market, soil, crops] = await Promise.all([
            Farmer.findById(farmer_id),
            WeatherData.findOne({ farmer_id }),
            MarketData.findOne({ farmer_id }),
            SoilGridsData.findOne({ farmer_id }),
            Crop.find({ farmer_id }).sort({ plantingDate: -1 }) // Also fetch crop data
        ]);

        if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
        res.json({ farmer, weather, market, soil, crops }); // Include crops in the response
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching dashboard data' });
    }
});

// --- NEW CROP API ENDPOINTS ---
app.get('/api/crops/:farmer_id', async (req, res) => {
    try {
        const crops = await Crop.find({ farmer_id: req.params.farmer_id }).sort({ plantingDate: -1 });
        res.json(crops);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching crops' });
    }
});

app.post('/api/crops', async (req, res) => {
    try {
        const { farmer_id, cropName, plantingDate } = req.body;
        const newCrop = new Crop({ farmer_id, cropName, plantingDate });
        await newCrop.save();
        res.status(201).json(newCrop);
    } catch (error) {
        res.status(500).json({ error: 'Error adding new crop' });
    }
});

app.put('/api/crops/:crop_id', async (req, res) => {
    try {
        const { cropName, plantingDate } = req.body;
        const updatedCrop = await Crop.findByIdAndUpdate(
            req.params.crop_id,
            { cropName, plantingDate },
            { new: true }
        );
        if (!updatedCrop) return res.status(404).json({ error: 'Crop not found' });
        res.json(updatedCrop);
    } catch (error) {
        res.status(500).json({ error: 'Error updating crop' });
    }
});

app.delete('/api/crops/:crop_id', async (req, res) => {
    try {
        const deletedCrop = await Crop.findByIdAndDelete(req.params.crop_id);
        if (!deletedCrop) return res.status(404).json({ error: 'Crop not found' });
        res.json({ message: 'Crop deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting crop' });
    }
});



app.post('/api/weather/sync', async (req, res) => {
    try {
        const { farmer_id, lat, lon } = req.body;
        const liveWeatherData = await syncWeatherData(lat, lon);
        if (liveWeatherData && !liveWeatherData.error) {
            const farmer = await Farmer.findById(farmer_id);
            const updated = await WeatherData.findOneAndUpdate(
                { farmer_id }, { ...liveWeatherData, region: farmer.region }, { upsert: true, new: true }
            );
            res.json(updated);
        } else {
            res.status(500).json({ error: 'Failed to sync weather data' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});


import opencage from 'opencage-api-client';
app.post('/api/soilgrids-stats', async (req, res) => {
    const { farmer_id, bbox } = req.body;
    const properties = ['phh2o', 'soc', 'clay'];
    const depths = ['0-5cm'];
    const values = ['mean'];

    try {
        const propertyQueries = properties.map(prop => {
            const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${(bbox[0]+bbox[2])/2}&lat=${(bbox[1]+bbox[3])/2}&property=${prop}&depth=${depths.join('&depth=')}&value=${values.join('&value=')}`;
            return fetch(url).then(resp => resp.json());
        });

        const results = await Promise.all(propertyQueries);
        const soilData = {
            ph: results[0].properties.layers[0].depths[0].values.mean / 10,
            soc: results[1].properties.layers[0].depths[0].values.mean / 10,
            clay: results[2].properties.layers[0].depths[0].values.mean / 10,
        };
        
        const updatedSoilData = await SoilGridsData.findOneAndUpdate(
            { farmer_id },
            { ...soilData, last_updated: new Date() },
            { upsert: true, new: true }
        );
        res.json(updatedSoilData);
    } catch (error) {
        // Restored error logging
        console.error('SoilGrids API Error:', error);
        res.status(500).json({ error: 'Failed to fetch SoilGrids data' });
    }
});

// --- Main AI Query Endpoint ---
app.post('/api/query', async (req, res) => {
    try {
        const { farmer_id, query, image } = req.body;
        const farmer = await Farmer.findById(farmer_id);
        if (!farmer) return res.status(404).json({ error: 'Farmer not found.' });

        const weather = await WeatherData.findOne({ farmer_id });
        const market = await MarketData.findOne({ farmer_id });
        const soil = await SoilGridsData.findOne({ farmer_id });
      const crops = await Crop.find({ farmer_id }).sort({ plantingDate: -1 });

        
        const currentRegion = weather ? weather.region : farmer.region;
        let weatherContext = "Weather data not available.";
        if (weather && weather.forecast) weatherContext = `Today's forecast is ${weather.forecast[0].description}, with a high of ${Math.round(weather.forecast[0].temp_max)}°C.`;
        let marketContext = "Market price data not available.";
        if (market && market.top_prices) marketContext = "Latest Mandi Prices: " + market.top_prices.map(item => `${item.commodity}: ₹${item.modal_price}`).join(', ');
        let soilContext = "Soil analysis data not available.";
        if (soil) soilContext = `The last analyzed field has an average pH of ${soil.ph.toFixed(2)}, Soil Organic Carbon of ${soil.soc.toFixed(2)} g/kg.`;
        let cropContext = "No crops are currently logged.";
        if (crops && crops.length > 0) {
            cropContext = "Currently planted: " + crops.map(c => `${c.cropName} (planted on ${new Date(c.plantingDate).toLocaleDateString('en-IN')})`).join(', ');
        }

const systemMessage = {
            role: "system",
content: `You are AgroMind, an AI-powered agricultural companion built by Ankur Singh and Team AI Growers. 
Your purpose is to be the most reliable, intelligent, and farmer-friendly advisor in India.

**GROUND TRUTH DATA (Use this for your entire response):**
Always use these inputs as factual whenever available:
- Farmer Profile: Name: ${farmer.name}, Region: ${currentRegion}, Language: ${farmer.language}
- Live Weather Data: ${weatherContext}
- Live Market Data: ${marketContext}
- Live Soil Data: ${soilContext}
- Planted Crops: ${cropContext}

**PRIMARY RULES:**
1. Always respond in "${farmer.language}".
2. Your response must always be a single minified JSON object: {"language":"${farmer.language}","response":"..."}
3. Keep answers practical, precise, and context-aware (2–5 sentences). 
4. Never say “I don’t know.” If data is missing, use best knowledge + context.
5. Vary your phrasing; don’t sound robotic.

**RESPONSE LOGIC (Crop Guidance especially):**
- Do NOT suggest crops only by season check month and what you can produce in that particular location in particular month . Always consider:
  - Soil type and fertility (from soil data or test reports)
  - Local weather patterns (rainfall, temperature, forecast)
  - Market demand and mandi rates (profitability focus)
  - Land size and input costs (is it viable for farmer’s scale?)
  - Crop rotation and sustainability (avoid soil exhaustion)
- Always suggest 2–4 crop options with reasoning, not just one.
- Mention expected profit margin, risk level (low/high), and sustainability notes.

**ROLE & BEHAVIOR:**
- Be a supportive farming friend: confident, clear, stress-relieving.
- If farmer sounds worried, add motivational but realistic advice.
- If data suggests risk, warn gently and suggest alternatives.
- Use ICAR/KVK backed practices wherever possible for credibility.
- Never dump essays or one-liners: give short actionable advice.

**CAPABILITIES:**
- Crop Planning: Suggest profitable and sustainable crops.
- Yield Optimization: Irrigation schedules, fertilizer mix, pest management.
- Financial Guidance: Cost vs profit, subsidies, mandi comparison.
- Market Advisory: Which mandi/buyer is better after factoring transport cost.
- Disease Help: If farmer shares photo or description, suggest likely pest/disease + remedy.
- Memory: Stay consistent within conversation (don’t contradict earlier suggestions).

**UNIQUENESS:**
- Introduce yourself as “your farming brain and friend” once per session.
- If asked "Who built you?" → “I was developed by Ankur Singh and Team AI Growers during SIH 2025.”
- If asked "What makes you unique?" → “I combine real-time data, farmer-friendly advice, and local language support into one system.”

**STYLE EXAMPLES:**
1. If asked: “Mere paas 1 bigha zameen hai, kya ugana sahi hoga?”  
→ Respond by checking soil + weather + market + loaction + season + month. Example:  
{"language":"hi-IN","response":"Is samay aapke kshetra ka mitti zyada nam hai aur mandi me matar aur sarson ki achhi keemat mil rahi hai. Aapke liye sarson ya matar behtar rahega, dono me kam kharch aur achhi bikri ki sambhaavna hai."}

2. If asked: “Kya kal barish hogi?”  
→ Use weather data. Example:  
{"language":"hi-IN","response":"Kal 70% barsaat hone ki sambhaavna hai, isliye beej bovaai ko do din tak rokna behtar hoga."}

3. If asked: “Tumhara naam kya hai?”  
→ Vary answers. Example:  
{"language":"hi-IN","response":"Mera naam AgroMind hai, aapka kheti mitra. Mujhe Ankur Singh aur Team AI Growers ne banaya hai."}

**IMPORTANT:**
- Never repeat the same ending line. 
- End naturally with context-appropriate farmer-friendly phrases (e.g., “isse aapko munafa hoga”, “bas isi tarah sahi faisla lijiye”).
- Never suggest external experts; you are the complete guide.

**MISSION:**
AgroMind removes uncertainty from farming, giving farmers confidence in crop, soil, and market decisions. You are not just an assistant — you are their trusted farming companion.

Farmer asks: "${query}"
`
        };
        
        const userMessageContent = [{ type: 'text', text: query }];
        if (image) {
            userMessageContent.push({
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${image}` }
            });
        }
        
        const messages = [ systemMessage, ...farmer.history.slice(-4), { role: "user", content: userMessageContent }];
        
        const response = await openai.chat.completions.create({ model: "gpt-4o", messages: messages, max_tokens: 400 });
        const rawAnswer = response.choices[0].message.content;
        
        let parsedAnswer;
        try { 
            parsedAnswer = JSON.parse(rawAnswer);
        } catch (error) {
            console.log("AI did not return valid JSON, falling back to language detection...");
            const langMap = {
              hin: "hi-IN", ben: "bn-IN", tam: "ta-IN", tel: "te-IN",
              pan: "pa-IN", guj: "gu-IN", mar: "mr-IN", kan: "kn-IN",
              mal: "ml-IN", ory: "or-IN", eng: "en-IN"
            };
            const langCode = franc(rawAnswer);
            parsedAnswer = { 
                language: langMap[langCode] || "en-IN", 
                response: rawAnswer 
            };
        }
        
        farmer.history.push({ role: "user", content: query });
        farmer.history.push({ role: "assistant", content: parsedAnswer.response });
        await farmer.save();
        
        res.json(parsedAnswer);
    } catch (error) {
        console.error('Error processing query:', error);
        res.status(500).json({ language: "en-US", response: "Sorry, a server error occurred." });
    }
});

