const https = require('https');
let instruments = [];

async function loadInstruments() {
    console.log("Loading Angel One Instruments...");
    try {
        const response = await fetch("https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json");
        const data = await response.json();
        // Keep equities & mutual funds (BSE_MF or similar). For simplicity, filter to NSE and BSE equities first
        instruments = data.filter(item => 
            item.exch_seg === 'NSE' || item.exch_seg === 'BSE' || item.exch_seg === 'BSE_MF' || (item.name && item.name.includes("FUND"))
        );
        console.log(`Loaded ${instruments.length} instruments for Angel One.`);
    } catch (e) {
        console.error("Failed to load Angel One instruments:", e.message);
    }
}

function searchInstruments(query) {
    if (!query || instruments.length === 0) return [];
    const lowerQuery = query.toLowerCase();
    
    // Find absolute matches first
    const exactMatches = instruments.filter(item => item.name && item.name.toLowerCase() === lowerQuery);
    // Find partial matches
    const partialMatches = instruments.filter(item => 
        (item.name && item.name.toLowerCase().includes(lowerQuery)) || 
        (item.symbol && item.symbol.toLowerCase().includes(lowerQuery))
    ).slice(0, 20);

    const merged = [...exactMatches, ...partialMatches];
    // Remove duplicates
    const unique = [];
    const uniqueTokens = new Set();
    for (const item of merged) {
        if (!uniqueTokens.has(item.token)) {
            uniqueTokens.add(item.token);
            unique.push(item);
        }
    }
    return unique.slice(0, 15);
}

module.exports = { loadInstruments, searchInstruments, get instruments() { return instruments; } };
