// API Route proxy para requisições ao Bling
// Vercel Serverless Function

export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { endpoint, method = 'GET', body, access_token } = req.body;

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint é obrigatório' });
        }

        if (!access_token) {
            return res.status(401).json({ error: 'Token de acesso é obrigatório' });
        }

        // Montar URL completa do Bling
        const blingUrl = `https://www.bling.com.br/Api/v3${endpoint}`;

        // Configurar requisição
        const fetchOptions = {
            method: method,
            headers: {
                'Authorization': `Bearer ${access_token}`,
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
