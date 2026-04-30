// API Route proxy para requisições ao Bling (autenticação centralizada)
// Vercel Serverless Function - com persistência de tokens via Upstash Redis

import { getTokens, saveTokens, isTokenValid } from './tokenStore.js';

// Função para obter access_token (renova automaticamente se necessário)
async function getAccessToken() {
    const clientId = process.env.BLING_CLIENT_ID;
    const clientSecret = process.env.BLING_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Credenciais do Bling não configuradas no servidor');
    }

    // Obter tokens salvos (Redis ou env)
    const tokens = await getTokens();

    if (!tokens.refreshToken) {
        throw new Error('Refresh token não encontrado. Autorize o Bling primeiro.');
    }

    // Verificar se access_token ainda é válido
    if (tokens.accessToken && isTokenValid(tokens.expiry)) {
        console.log('Usando access_token em cache');
        return tokens.accessToken;
    }

    // Renovar access_token usando refresh_token
    console.log('Renovando access_token...');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://api.bling.com.br/Api/v3/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokens.refreshToken
        })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('Erro ao renovar token:', data);
        throw new Error('Erro ao renovar token do Bling. Reautorize em /api/bling/auth');
    }

    // Salvar novos tokens (incluindo o novo refresh_token!)
    await saveTokens(data.access_token, data.refresh_token, data.expires_in);
    console.log('Tokens renovados e salvos');

    return data.access_token;
}

export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { endpoint, method = 'GET', body } = req.body;

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint é obrigatório' });
        }

        // Obter access_token automaticamente
        const accessToken = await getAccessToken();

        // Montar URL completa do Bling
        const blingUrl = `https://api.bling.com.br/Api/v3${endpoint}`;

        // Configurar requisição
        const fetchOptions = {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        // Adicionar body se necessário
        if (body && (method === 'POST' || method === 'PUT')) {
            fetchOptions.body = JSON.stringify(body);
        }

        // Fazer requisição para o Bling
        const response = await fetch(blingUrl, fetchOptions);

        // Tentar parsear resposta como JSON
        let data;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            console.error('Erro Bling API:', data);
            return res.status(response.status).json({
                error: 'Erro na API do Bling',
                status: response.status,
                details: data
            });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('Erro no servidor:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
}
