# 🌾 AgroMind: AI Farming Assistant

AgroMind is a full-stack, data-driven web application designed to empower farmers with an AI-powered personal assistant.  
It integrates real-time environmental data, market insights, and crop health monitoring to provide contextual, multi-modal agricultural advice in the farmer’s own language.

---

live link: http://agromind-app.onrender.com/login.html

## 📌 Table of Contents
- [✨ Core Features](#-core-features)  
- [🛠️ Technology Stack & APIs](#️-technology-stack--apis)  
- [🎯 Why AgroMind](#-why-agromind)  
- [📦 Installation & Setup](#-installation--setup)  
- [📸 Screenshots / Demo](#-screenshots--demo)  
- [💡 Future Enhancements](#-future-enhancements)  
- [⚖️ License](#-license)  

---

## ✨ Core Features

### 🔑 1. Secure User Authentication
- Full registration & login system  
- Language preference selection during signup  
- Passwords securely hashed with **bcryptjs**  
- Safe login validation via stored hashes  

### 🗣️ 2. Multi-Modal AI Chat Interface
Interact using **Text, Voice, or Images**:  
- **Text Input** → Standard input bar  
- **Voice Input** → Multi-language transcription with Web Speech API (hi-IN, en-IN, bn-IN, ta-IN…)  
- **Image Input** →  
  - Upload photos or use live camera  
  - **Crop Disease Detection**: Detect diseases, deficiencies, pests directly from images  
  - Preview & remove images before submission  

**AI Responses**: Structured JSON + always in user’s preferred language  

### 🤖 3. AI Backend & Prompt Engineering
- Powered by **OpenAI GPT-4o**  
- Injects ground truth data (Weather, Soil, Market, Crops) before every query  
- Supports multi-modal queries (image + text)  
- Language locked to user preference, with fallback via **franc-min**  

### 📊 4. Responsive Dashboard & Data Integration
- **My Crops Card** – CRUD crops, linked by farmer_id  
- **Weather Forecast** – 5-day forecast via OpenWeatherMap  
- **Mandi Prices** – Live market prices from Data.gov.in API  
- **Interactive Soil Map** – Draw polygons/rectangles/circles on fields with **Leaflet.js + Leaflet.draw**  
- Fetch **SoilGrids** data (pH, organic carbon, clay content)  

---

## 🛠️ Technology Stack & APIs

**Frontend**: HTML5, CSS3, Vanilla JavaScript  
**Backend**: Node.js, Express.js  
**Database**: MongoDB (Mongoose)  

**Libraries & Tools**:  
- bcryptjs → Password hashing  
- franc-min → Language detection  
- Leaflet.js → Interactive maps  
- Leaflet.draw → Field drawing tools  

**APIs Integrated**:  
- 🌦️ OpenWeatherMap – Weather  
- 📈 Data.gov.in – Market prices  
- 🌍 SoilGrids – Soil analysis  
- 🧠 OpenAI GPT-4o – AI responses & crop disease detection  

---

## 🎯 Why AgroMind?
AgroMind is more than a farming tool—it’s a **personal AI assistant for farmers**.  

✅ Data-driven advice  
✅ Disease & soil analysis  
✅ Localized, multi-language support  
✅ Fully responsive dashboard  

---

## 📦 Installation & Setup

```bash
# 1. Clone repo
git clone https://github.com/MrAnkurSingh/agromind-app

# 2. Navigate to folder
cd AgroMind

# 3. Install dependencies
npm install

# 4. Setup .env file
OPENAI_API_KEY=your_api_key
WEATHER_API_KEY=your_api_key
MONGO_URI=your_mongo_uri

# 5. Start server
npm start
