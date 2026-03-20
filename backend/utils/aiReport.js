const generateAIReport = async (portfolio) => {
    const llmUrl = process.env.LOCAL_LLM_URL || 'http://localhost:11434/api/generate';
    const model = process.env.LOCAL_LLM_MODEL || 'llama3';

    const prompt = `
        You are an expert AI Financial Analyst for the Indian market.
        Analyze the following consolidated portfolio:
        
        SYCNED STOCKS: ${JSON.stringify(portfolio.syncedStocks)}
        MANUAL STOCKS: ${JSON.stringify(portfolio.manualStocks)}
        MUTUAL FUNDS: ${JSON.stringify(portfolio.mutualFunds)}
        REAL ESTATE: ${JSON.stringify(portfolio.properties)}

        Please provide a professional technical analysis including:
        1. **Portfolio Breakdown**: Total value in ₹ and asset allocation percentage.
        2. **Sector Concentration**: Identify over-exposed sectors across stocks.
        3. **Performance Audit**: analyze returns (P&L) for each category.
        4. **Personalized Recommendations**: Specific advice based on this performance.
        
        Rules:
        - Use ₹ symbol for all currency values.
        - Be technical and specific.
        - Format in clear Markdown.
    `;

    try {
        const response = await fetch(llmUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) throw new Error('LLM Service Unavailable');
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('AI Report Error:', error.message);
        return `### 📊 Portfolio Summary (AI Offline)
        
        **Holdings Summary:**
        - Total Asset Classes: 4 (Stocks, Funds, Gold, Real Estate)
        - Synced Stocks: ${portfolio.syncedStocks.length}
        - Manual Stocks: ${portfolio.manualStocks.length}
        - Mutual Funds: ${portfolio.mutualFunds.length}
        - Real Estate Properties: ${portfolio.properties.length}
        
        *Please start your local LLM (Ollama) to get full technical insights.*`;
    }
};

module.exports = { generateAIReport };
