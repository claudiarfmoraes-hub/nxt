// Armazenamento de tokens Bling usando Upstash Redis
// Permite persistir e atualizar tokens automaticamente

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Chaves no Redis
const KEYS = {
    ACCESS_TOKEN: 'bling:access_token',
    REFRESH_TOKEN: 'bling:refresh_token',
    TOKEN_EXPIRY: 'bling:token_expiry'
};

// Função auxiliar para fazer requisições ao Upstash
async function redisCommand(command, ...args) {
    if (!UPSTASH_URL || !UPSTASH_TOKEN) {
        console.log('Upstash não configurado, usando variáveis de ambiente');
        return null;
    }

    try {
        const response = await fetch(`${UPSTASH_URL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${UPSTASH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([command, ...args])
        });

        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Erro Redis:', error);
        return null;
    }
}

// Obter tokens salvos
export async function getTokens() {
    // Tentar obter do Redis primeiro
    if (UPSTASH_URL && UPSTASH_TOKEN) {
        const [accessToken, refreshToken, expiry] = await Promise.all([
            redisCommand('GET', KEYS.ACCESS_TOKEN),
            redisCommand('GET', KEYS.REFRESH_TOKEN),
            redisCommand('GET', KEYS.TOKEN_EXPIRY)
        ]);

        if (refreshToken) {
            return {
                accessToken: accessToken || null,
                refreshToken: refreshToken,
                expiry: expiry ? parseInt(expiry) : 0
            };
        }
    }

    // Fallback para variáveis de ambiente
    return {
        accessToken: null,
        refreshToken: process.env.BLING_REFRESH_TOKEN || null,
        expiry: 0
    };
}

// Salvar tokens
export async function saveTokens(accessToken, refreshToken, expiresIn) {
    const expiry = Date.now() + (expiresIn * 1000);

    if (UPSTASH_URL && UPSTASH_TOKEN) {
        await Promise.all([
            redisCommand('SET', KEYS.ACCESS_TOKEN, accessToken),
            redisCommand('SET', KEYS.REFRESH_TOKEN, refreshToken),
            redisCommand('SET', KEYS.TOKEN_EXPIRY, expiry.toString())
        ]);
        console.log('Tokens salvos no Redis');
        return true;
    }

    console.log('Upstash não configurado - tokens não persistidos');
    return false;
}

// Verificar se token está válido (com margem de 5 minutos)
export function isTokenValid(expiry) {
    return expiry && Date.now() < expiry - 300000;
}
