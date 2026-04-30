// Endpoint de autorização Bling (para matriz)
// Vercel Serverless Function

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const clientId = process.env.BLING_CLIENT_ID;
    const clientSecret = process.env.BLING_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return res.status(500).json({
            error: 'Credenciais não configuradas no servidor',
            instructions: 'Configure BLING_CLIENT_ID e BLING_CLIENT_SECRET nas variáveis de ambiente do Vercel'
        });
    }

    // GET = Redirecionar para autorização do Bling
    if (req.method === 'GET') {
        const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/bling/callback`;
        const authUrl = `https://api.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=matriz`;

        return res.redirect(302, authUrl);
    }

    // POST = Trocar código por tokens (chamado pelo callback)
    if (req.method === 'POST') {
        const { code, redirect_uri } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Código de autorização não fornecido' });
        }

        try {
            const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

            const response = await fetch('https://api.bling.com.br/Api/v3/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${credentials}`
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirect_uri
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return res.status(response.status).json({
                    error: 'Erro ao obter tokens',
                    details: data
                });
            }

            // Retorna o refresh_token para ser salvo nas variáveis de ambiente
            return res.status(200).json({
                success: true,
                message: 'Autorização concluída! Copie o refresh_token abaixo e adicione nas variáveis de ambiente do Vercel.',
                refresh_token: data.refresh_token,
                instructions: [
                    '1. Acesse: https://vercel.com/dashboard',
                    '2. Selecione o projeto NXT',
                    '3. Vá em Settings > Environment Variables',
                    '4. Adicione: BLING_REFRESH_TOKEN = ' + data.refresh_token,
                    '5. Faça redeploy do projeto'
                ]
            });

        } catch (error) {
            return res.status(500).json({
                error: 'Erro interno',
                details: error.message
            });
        }
    }

    return res.status(405).json({ error: 'Método não permitido' });
}
