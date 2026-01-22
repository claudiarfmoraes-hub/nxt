// Callback da autorização Bling
// Vercel Serverless Function - salva tokens automaticamente no Redis

import { saveTokens } from './tokenStore.js';

export default async function handler(req, res) {
    const { code, error, error_description } = req.query;

    if (error) {
        return res.status(400).send(`
            <html>
            <head><title>Erro na Autorização</title></head>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                <h1 style="color: #e74c3c;">Erro na Autorização</h1>
                <p>${error}: ${error_description || 'Erro desconhecido'}</p>
                <a href="/" style="color: #3498db;">Voltar ao formulário</a>
            </body>
            </html>
        `);
    }

    if (!code) {
        return res.status(400).send(`
            <html>
            <head><title>Erro</title></head>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                <h1 style="color: #e74c3c;">Erro</h1>
                <p>Código de autorização não recebido.</p>
                <a href="/" style="color: #3498db;">Voltar ao formulário</a>
            </body>
            </html>
        `);
    }

    // Trocar código por tokens
    const clientId = process.env.BLING_CLIENT_ID;
    const clientSecret = process.env.BLING_CLIENT_SECRET;
    const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/bling/callback`;

    try {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(400).send(`
                <html>
                <head><title>Erro na Autorização</title></head>
                <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                    <h1 style="color: #e74c3c;">Erro ao obter tokens</h1>
                    <p>${JSON.stringify(data)}</p>
                    <a href="/" style="color: #3498db;">Voltar ao formulário</a>
                </body>
                </html>
            `);
        }

        // Tentar salvar tokens no Redis automaticamente
        const saved = await saveTokens(data.access_token, data.refresh_token, data.expires_in);

        if (saved) {
            // Sucesso completo - tokens salvos automaticamente!
            return res.status(200).send(`
                <html>
                <head>
                    <title>Bling Conectado!</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; text-align: center; }
                        .success { color: #27ae60; }
                        .box { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 30px; margin: 20px 0; }
                        .icon { font-size: 60px; margin-bottom: 20px; }
                        button { background: #27ae60; color: white; border: none; padding: 15px 30px; border-radius: 4px; cursor: pointer; font-size: 16px; }
                        button:hover { background: #219a52; }
                    </style>
                </head>
                <body>
                    <div class="box">
                        <div class="icon">✅</div>
                        <h1 class="success">Bling Conectado com Sucesso!</h1>
                        <p>Os tokens foram salvos automaticamente.</p>
                        <p>O sistema está pronto para uso.</p>
                    </div>
                    <a href="/"><button>Voltar ao Formulário</button></a>
                </body>
                </html>
            `);
        } else {
            // Redis não configurado - mostrar instruções manuais
            return res.status(200).send(`
                <html>
                <head>
                    <title>Bling Autorizado!</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                        .success { color: #27ae60; }
                        .warning { color: #856404; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; padding: 20px; margin: 20px 0; }
                        .box { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0; }
                        .token { background: #fff3cd; padding: 15px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; }
                        button { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
                        button:hover { background: #2980b9; }
                    </style>
                </head>
                <body>
                    <h1 class="success">Bling Autorizado!</h1>

                    <div class="warning">
                        <strong>Upstash Redis não configurado.</strong><br>
                        Configure o Upstash para tokens persistentes automáticos, ou salve manualmente:
                    </div>

                    <div class="box">
                        <h3>Refresh Token (salve no Vercel):</h3>
                        <div class="token">${data.refresh_token}</div>
                        <button onclick="navigator.clipboard.writeText('${data.refresh_token}'); alert('Token copiado!');">
                            Copiar Token
                        </button>
                    </div>

                    <div class="box">
                        <h3>Para configurar Upstash (recomendado):</h3>
                        <ol>
                            <li>Acesse <a href="https://upstash.com" target="_blank">upstash.com</a> e crie uma conta gratuita</li>
                            <li>Crie um database Redis</li>
                            <li>Copie a REST URL e o Token</li>
                            <li>No Vercel, adicione:<br>
                                <code>UPSTASH_REDIS_REST_URL</code><br>
                                <code>UPSTASH_REDIS_REST_TOKEN</code>
                            </li>
                            <li>Faça redeploy e reautorize</li>
                        </ol>
                    </div>

                    <a href="/"><button>Voltar ao Formulário</button></a>
                </body>
                </html>
            `);
        }

    } catch (error) {
        return res.status(500).send(`
            <html>
            <head><title>Erro</title></head>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                <h1 style="color: #e74c3c;">Erro interno</h1>
                <p>${error.message}</p>
                <a href="/" style="color: #3498db;">Voltar ao formulário</a>
            </body>
            </html>
        `);
    }
}
