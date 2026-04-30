// API Route para autenticação OAuth do Bling
// Vercel Serverless Function

export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { grant_type, code, refresh_token, redirect_uri, client_id, client_secret } = req.body;

        if (!client_id || !client_secret) {
            return res.status(400).json({ error: 'Client ID e Client Secret são obrigatórios' });
        }

        // Montar credenciais Basic Auth
        const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

        // Montar body da requisição
        const bodyParams = new URLSearchParams();
        bodyParams.append('grant_type', grant_type);

        if (grant_type === 'authorization_code') {
            bodyParams.append('code', code);
            bodyParams.append('redirect_uri', redirect_uri);
        } else if (grant_type === 'refresh_token') {
            bodyParams.append('refresh_token', refresh_token);
        }

        // Fazer requisição para o Bling
        const response = await fetch('https://api.bling.com.br/Api/v3/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            },
            body: bodyParams
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Erro Bling OAuth:', data);
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('Erro no servidor:', error);
        return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
}
