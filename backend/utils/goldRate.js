const axios = require('axios'); // Optional if we use fetch natively (Node 18+)

let cachedGoldPricePerGram = 7250;
let lastFetchTime = 0;

async function getLiveGoldPrice() {
    const now = Date.now();
    // Cache for 1 hour to prevent rate limiting
    if (now - lastFetchTime < 3600000 && lastFetchTime !== 0) {
        return cachedGoldPricePerGram;
    }

    try {
        const url = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json';
        const response = await fetch(url);
        if (!response.ok) throw new Error('API fetch failed');
        const data = await response.json();
        
        const xauToInr = data.xau.inr;
        // 1 Troy Ounce = 31.1034768 grams. Add typical 10-15% Indian market premium (customs + GST)
        const gramPriceBasic = xauToInr / 31.1034768;
        const indianMarketPremium = 1.15; // approximate typical markup over spot
        const finalPrice = Math.round(gramPriceBasic * indianMarketPremium);
        
        cachedGoldPricePerGram = finalPrice;
        lastFetchTime = now;
        console.log(`Updated Gold Price to ₹${cachedGoldPricePerGram}/g`);
        return finalPrice;
    } catch (error) {
        console.error('Failed to fetch live gold price, using cache:', error.message);
        return cachedGoldPricePerGram; // fallback
    }
}

module.exports = { getLiveGoldPrice };
