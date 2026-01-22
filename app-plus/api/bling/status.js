// Verifica status da conexão Bling (centralizada)
// Vercel Serverless Function

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verificar se as credenciais estão configuradas no servidor
    const clientId = process.env.BLING_CLIENT_ID;
    const clientSecret = process.env.BLING_CLIENT_SECRET;
    const refreshToken = process.env.BLING_REFRESH_TOKEN;

    const isConfigured = !!(clientId && clientSecret);
    const isAuthenticated = !!(clientId && clientSecret && refreshToken);

    return res.status(200).json({
        configured: isConfigured,
        authenticated: isAuthenticated,
        message: isAuthenticated
            ? 'Bling conectado'
            : isConfigured
                ? 'Bling configurado, aguardando autorização'
                : 'Bling não configurado no servidor'
    });
}
