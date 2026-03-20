const { SmartAPI } = require('smartapi-javascript');
const { authenticator } = require('otplib');

const getAngelOneHoldings = async (passedApiKey) => {
    const clientCode = process.env.ANGEL_ONE_CLIENT_ID;
    const password = process.env.ANGEL_ONE_PASSWORD;
    const apiKey = passedApiKey || process.env.ANGEL_ONE_API_KEY;
    const totpSecret = process.env.ANGEL_ONE_TOTP_SECRET;

    if (!clientCode || !password || !apiKey || !totpSecret) {
        throw new Error('Angel One credentials or TOTP Secret not configured in .env');
    }

    let smart_api = new SmartAPI({
        api_key: apiKey
    });

    try {
        // Generate TOTP
        const totp = authenticator.generate(totpSecret);

        const session = await smart_api.generateSession(clientCode, password, totp);
        if (!session.status) {
            throw new Error(session.message || 'Failed to generate Angel One session');
        }

        const holdings = await smart_api.getHolding();
        if (!holdings.status) {
            throw new Error(holdings.message || 'Failed to fetch holdings');
        }

        return holdings.data;
    } catch (error) {
        console.error('Angel One Integration Error:', error.message);
        throw error;
    }
};

module.exports = { getAngelOneHoldings };
