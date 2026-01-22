// Callback da autorização Bling
// Vercel Serverless Function

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

        // Sucesso! Mostrar o refresh_token para ser salvo
        return res.status(200).send(`
            <html>
            <head>
                <title>Bling Autorizado!</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    .success { color: #27ae60; }
                    .box { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0; }
                    .token { background: #fff3cd; padding: 15px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; }
                    .steps { text-align: left; }
                    .steps li { margin: 10px 0; }
                    button { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
                    button:hover { background: #2980b9; }
                </style>
            </head>
            <body>
                <h1 class="success">Bling Autorizado com Sucesso!</h1>

                <div class="box">
                    <h3>Passo Final: Salvar o Refresh Token</h3>
                    <p>Copie o token abaixo e adicione nas variáveis de ambiente do Vercel:</p>

                    <div class="token" id="tokenValue">${data.refresh_token}</div>

                    <button onclick="navigator.clipboard.writeText('${data.refresh_token}'); alert('Token copiado!');">
                        Copiar Token
                    </button>
                </div>

                <div class="box steps">
                    <h3>Instruções:</h3>
                    <ol>
                        <li>Acesse <a href="https://vercel.com/dashboard" target="_blank">vercel.com/dashboard</a></li>
                        <li>Selecione o projeto <strong>nxt</strong></li>
                        <li>Vá em <strong>Settings</strong> > <strong>Environment Variables</strong></li>
                        <li>Adicione uma nova variável:
                            <br>Nome: <code>BLING_REFRESH_TOKEN</code>
                            <br>Valor: <em>(cole o token copiado)</em>
                        </li>
                        <li>Clique em <strong>Save</strong></li>
                        <li>Vá em <strong>Deployments</strong> e clique em <strong>Redeploy</strong> no último deploy</li>
                    </ol>
                </div>

                <a href="/"><button>Voltar ao Formulário</button></a>
            </body>
            </html>
        `);

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
