import fetch from 'node-fetch';
 
export const syncMarketData = async (state) => {
    try {
        const apiKey = process.env.GOVT_API_KEY; 
        if (!state) {
            console.log("State not provided; cannot fetch market data.");
            return null;
        }
        
           
        
        
        const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&filters%5Bstate.keyword%5D=${state}`;

        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Govt Market Data API responded with status ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        if (!data.records || data.records.length === 0) {
            console.log(`Govt API connected, but no records were found for state: ${state}`);
            return { top_prices: [] };
        }

    
        const uniqueCommodities = {};
        for (const record of data.records) {
            if (Object.keys(uniqueCommodities).length >= 10) break;
            if (!uniqueCommodities[record.commodity]) {
                uniqueCommodities[record.commodity] = {
                    commodity: record.commodity,
                    mandi: record.market,
                    modal_price: parseInt(record.modal_price)
                };
            }
        }
        
        return { 
            top_prices: Object.values(uniqueCommodities),
            last_updated: new Date()
        };

    } catch (error) {
        console.error("Error in marketPriceService:", error);
        return null;
    }
};