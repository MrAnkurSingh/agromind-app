import fetch from 'node-fetch';

const GOVT_API_KEY = process.env.GOVT_API_KEY;

export const syncMarketData = async (region) => {
const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${GOVT_API_KEY}&format=json&limit=50&filters[state]=${region}`;    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Market API responded with status ${response.status}`);
        }
        const data = await response.json();
        
        const topPrices = data.records
            .sort((a, b) => parseInt(b.modal_price) - parseInt(a.modal_price))
            .slice(0, 10)
            .map(record => ({
                commodity: record.commodity,
                mandi: record.market,
                modal_price: record.modal_price
            }));
        
        return { top_prices: topPrices };

    } catch (error) {
        console.error("Error in marketPriceService:", error);
        return null;
    }
};