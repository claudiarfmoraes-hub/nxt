// =============================================
// GOOGLE APPS SCRIPT - NXT PECAS
// Planilha + Bling (tudo centralizado)
// =============================================
//
// INSTRUÇÕES DE INSTALAÇÃO:
// 1. Abra a planilha Google Sheets
// 2. Menu: Extensões > Apps Script
// 3. Cole TODO este código no editor (substitua o conteúdo)
// 4. No editor, vá em: Configurações do projeto (engrenagem) > Propriedades do script
//    Adicione estas propriedades:
//      BLING_CLIENT_ID      = (seu client_id do Bling)
//      BLING_CLIENT_SECRET  = (seu client_secret do Bling)
//      BLING_REFRESH_TOKEN  = (seu refresh_token do Bling)
// 5. Clique em "Implantar" > "Nova implantação"
//    - Tipo: "App da Web"
//    - Executar como: "Eu"
//    - Acesso: "Qualquer pessoa"
// 6. Copie a URL gerada e cole no script.js (GOOGLE_SCRIPT_URL)
//
// PARA AUTORIZAR O BLING:
//   - Execute a função "autorizarBling" no editor do Apps Script
//   - Ou acesse: SUA_URL_APPS_SCRIPT?action=auth_bling
//   - Siga o link de autorização e cole o código recebido
//
// =============================================

// ========== CONFIGURAÇÃO ==========

var BLING_API_BASE = 'https://www.bling.com.br/Api/v3';

// ========== MAPEAMENTO FISCAL (Tabela Claudia Peças) ==========
// Cada peça do formulário → código Bling + descrição NFe + IPI
// Peças sem mapeamento (baterias, motor, carregador, alarme) continuam buscando por nome no Bling

var MAPEAMENTO_FISCAL = {
  // --- 04.0035 | GUIDÃO / PARTES DIVERSAS | IPI 9% ---
  'Guidão ferro':                    { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Display lcd':                     { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Suporte de celular':              { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Acelerador de dedo':              { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Acelerador de punho':             { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Punho':                           { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Mesa inferior':                   { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Mesa superior':                   { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Conjunto botões (buzina, luz alta)': { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Par bengala':                     { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Ignição':                         { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Manopla':                         { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Conjunto de direção':             { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Par manete com sensor':           { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Garfo completo':                  { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Painel display com acelerador':   { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Canote':                          { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Miolo trava':                     { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },
  'Suspensão dianteira':             { codigo: '04.0035', descricaoNfe: 'PARTES/DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: GUIDAO - PRODUTO NOVO.', ipi: 0.09 },

  // --- 04.0030 | ASSENTO / BANCO | IPI 9% ---
  'Banco traseiro':                  { codigo: '04.0030', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: ASSENTO ENCOSTO - ALMOFADA - PRODUTO NOVO.', ipi: 0.09 },
  'Banco passageiro':                { codigo: '04.0030', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: ASSENTO ENCOSTO - ALMOFADA - PRODUTO NOVO.', ipi: 0.09 },
  'Banco de encosto':                { codigo: '04.0030', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: ASSENTO ENCOSTO - ALMOFADA - PRODUTO NOVO.', ipi: 0.09 },
  'Encosto com alça':                { codigo: '04.0030', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: ASSENTO ENCOSTO - ALMOFADA - PRODUTO NOVO.', ipi: 0.09 },

  // --- 04.0038 | FRAME / QUADRO | IPI 9% ---
  'Cesto':                           { codigo: '04.0038', descricaoNfe: 'PARTES/DE MOTOCICLETAS INCLUINDO OS CICLOMOTORES - SENDO: FRAME - QUADRO, ARMACAO PARA MOTOCICLETA ELETRICA - MARCA: N', ipi: 0.09 },
  'Amortecedor':                     { codigo: '04.0038', descricaoNfe: 'PARTES/DE MOTOCICLETAS INCLUINDO OS CICLOMOTORES - SENDO: FRAME - QUADRO, ARMACAO PARA MOTOCICLETA ELETRICA - MARCA: N', ipi: 0.09 },
  'Par suspensão traseira':          { codigo: '04.0038', descricaoNfe: 'PARTES/DE MOTOCICLETAS INCLUINDO OS CICLOMOTORES - SENDO: FRAME - QUADRO, ARMACAO PARA MOTOCICLETA ELETRICA - MARCA: N', ipi: 0.09 },
  'Quadro chassi':                   { codigo: '04.0038', descricaoNfe: 'PARTES/DE MOTOCICLETAS INCLUINDO OS CICLOMOTORES - SENDO: FRAME - QUADRO, ARMACAO PARA MOTOCICLETA ELETRICA - MARCA: N', ipi: 0.09 },

  // --- 04.0007 | MÓDULO CONTROLADOR | IPI 9.75% ---
  'Módulo controlador':              { codigo: '04.0007', descricaoNfe: 'CONTROLLER -MODULO CONTROLADOR SCOOTER/MOTO ELETRICA', ipi: 0.0975 },
  'Módulo controlador 48v':          { codigo: '04.0007', descricaoNfe: 'CONTROLLER -MODULO CONTROLADOR SCOOTER/MOTO ELETRICA', ipi: 0.0975 },

  // --- 04.0049 | RETROVISOR | IPI 9% ---
  'Retrovisor':                      { codigo: '04.0049', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: ESPELHO RETROVISOR - PRODUTO NOVO. (REARVIEW MIRROR)', ipi: 0.09 },

  // --- 04.0002 | ILUMINAÇÃO / FARÓIS | IPI 9.75% ---
  'Farol dianteiro':                 { codigo: '04.0002', descricaoNfe: 'APARELHOS ELETRICOS  DE ILUMINACAO - SENDO: FAROIS - PRODUTO NOVO - MARCA NXT', ipi: 0.0975 },
  'Lanterna traseira':               { codigo: '04.0002', descricaoNfe: 'APARELHOS ELETRICOS  DE ILUMINACAO - SENDO: FAROIS - PRODUTO NOVO - MARCA NXT', ipi: 0.0975 },
  'Par pisca punho led':             { codigo: '04.0002', descricaoNfe: 'APARELHOS ELETRICOS  DE ILUMINACAO - SENDO: FAROIS - PRODUTO NOVO - MARCA NXT', ipi: 0.0975 },
  'Relê':                            { codigo: '04.0002', descricaoNfe: 'APARELHOS ELETRICOS  DE ILUMINACAO - SENDO: FAROIS - PRODUTO NOVO - MARCA NXT', ipi: 0.0975 },
  'Iluminação':                      { codigo: '04.0002', descricaoNfe: 'APARELHOS ELETRICOS  DE ILUMINACAO - SENDO: FAROIS - PRODUTO NOVO - MARCA NXT', ipi: 0.0975 },

  // --- 04.0018 | CARENAGEM / PLÁSTICO | IPI 9% ---
  'Assoalho':                        { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Carenagem bau':                   { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Carenagem escudo':                { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Carenagem frontal farol':         { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Carenagem lateral':               { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Para-brisa':                      { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Paralamas dianteiro':             { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Paralamas traseiro':              { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Plástico lateral':                { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Plástico peito':                  { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Tapete':                          { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Bico ventil':                     { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Calota':                          { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Bico dianteiro':                  { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Maleta de bateria':               { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Porta treco':                     { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Rabeta':                          { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Par protetor de balança':         { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },
  'Protetor de motor':               { codigo: '04.0018', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES),  SENDO: CARENAGEM/COBERTURA DE PLASTICO - PARTE DE CARROCARIA, PRO', ipi: 0.09 },

  // --- 04.0099 | RODA / PNEU | IPI 9% ---
  'Aro 10 dianteiro':                { codigo: '04.0099', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO:RODA DA FRENTE - PRODUTO NOVO.', ipi: 0.09 },
  'Pneu 10 2.75':                    { codigo: '04.0099', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO:RODA DA FRENTE - PRODUTO NOVO.', ipi: 0.09 },
  'Pneu 12 2.50':                    { codigo: '04.0099', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO:RODA DA FRENTE - PRODUTO NOVO.', ipi: 0.09 },
  'Camara de ar':                    { codigo: '04.0099', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO:RODA DA FRENTE - PRODUTO NOVO.', ipi: 0.09 },

  // --- 04.0031 | CABO DE FREIO | IPI 9% ---
  'Cabo de freio diant / traseiro':  { codigo: '04.0031', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO:CABO DE FREIO', ipi: 0.09 },
  'Reservatório de óleo':            { codigo: '04.0031', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO:CABO DE FREIO', ipi: 0.09 },

  // --- 04.0027 | FREIO DE TAMBOR | IPI 9% ---
  'Freio tambor':                    { codigo: '04.0027', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: FREIO DE TAMBOR', ipi: 0.09 },
  'Disco de freio':                  { codigo: '04.0027', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: FREIO DE TAMBOR', ipi: 0.09 },
  'Freio hidráulico completo':       { codigo: '04.0027', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: FREIO DE TAMBOR', ipi: 0.09 },
  'Pastilha freio par':              { codigo: '04.0027', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: FREIO DE TAMBOR', ipi: 0.09 },

  // --- 04.0021 | ALAVANCA DE FREIO | IPI 9% ---
  'Alavanca do freio':               { codigo: '04.0021', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: ALAVANCA DE FREIO', ipi: 0.09 },

  // --- 04.0045 | PEDAL | IPI 9% ---
  'Pedaleira com chapa':             { codigo: '04.0045', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: PEDAL - PRODUTO NOVO.', ipi: 0.09 },
  'Pezinho de descanso':             { codigo: '04.0045', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: PEDAL - PRODUTO NOVO.', ipi: 0.09 },

  // --- 04.0047 | MANIVELA | IPI 9% ---
  'Manivela':                        { codigo: '04.0047', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: MANIVELA - PRODUTO NOVO.', ipi: 0.09 },

  // --- 04.0048 | COROA DE TRANSMISSÃO | IPI 9% ---
  'Coroa de transmissão':            { codigo: '04.0048', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: COROA DE TRANSMISSAO - PRODUTO NOVO.', ipi: 0.09 },

  // --- 04.0020 | OLHO DE GATO | IPI 9% ---
  'Olho de gato':                    { codigo: '04.0020', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), REFETOR TIPO OLHO DE GATO ( CATADIOPTRICOS -DISPOSITIVO REFLETOR -', ipi: 0.09 },

  // --- 04.0024 | CABO DE BATERIA / ELÉTRICO | IPI 9% ---
  'Chicote':                         { codigo: '04.0024', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: CABO DE BATERIA', ipi: 0.09 },
  'Fonte do carregador':             { codigo: '04.0024', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: CABO DE BATERIA', ipi: 0.09 },
  'Tomada carregador':               { codigo: '04.0024', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: CABO DE BATERIA', ipi: 0.09 },
  'Fuzível':                         { codigo: '04.0024', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: CABO DE BATERIA', ipi: 0.09 },
  'Tomada maleta':                   { codigo: '04.0024', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: CABO DE BATERIA', ipi: 0.09 },
  'Conjunto cabos de bateria':       { codigo: '04.0024', descricaoNfe: 'PARTES / DE MOTOCICLETAS (INCLUINDO OS CICLOMOTORES), SENDO: CABO DE BATERIA', ipi: 0.09 }
};

// Busca o mapeamento fiscal pela descrição da peça (case-insensitive)
function buscarMapeamentoFiscal(descricaoPeca) {
  if (!descricaoPeca) return null;
  var desc = descricaoPeca.trim();
  // Busca exata primeiro
  if (MAPEAMENTO_FISCAL[desc]) return MAPEAMENTO_FISCAL[desc];
  // Busca case-insensitive
  var descLower = desc.toLowerCase();
  var keys = Object.keys(MAPEAMENTO_FISCAL);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === descLower) return MAPEAMENTO_FISCAL[keys[i]];
  }
  return null;
}

// ========== ARMAZENAMENTO DE TOKENS ==========

function getProperty(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function setProperty(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function getBlingTokens() {
  return {
    accessToken: getProperty('BLING_ACCESS_TOKEN'),
    refreshToken: getProperty('BLING_REFRESH_TOKEN'),
    expiry: parseInt(getProperty('BLING_TOKEN_EXPIRY') || '0')
  };
}

function saveBlingTokens(accessToken, refreshToken, expiresIn) {
  var expiry = Date.now() + (expiresIn * 1000);
  setProperty('BLING_ACCESS_TOKEN', accessToken);
  setProperty('BLING_REFRESH_TOKEN', refreshToken);
  setProperty('BLING_TOKEN_EXPIRY', expiry.toString());
}

// ========== BLING OAUTH ==========

function getBlingAccessToken() {
  var clientId = getProperty('BLING_CLIENT_ID');
  var clientSecret = getProperty('BLING_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Credenciais do Bling não configuradas. Adicione BLING_CLIENT_ID e BLING_CLIENT_SECRET nas Propriedades do Script.');
  }

  var tokens = getBlingTokens();

  if (!tokens.refreshToken) {
    throw new Error('Refresh token não encontrado. Execute a autorização do Bling primeiro.');
  }

  // Verificar se access_token ainda é válido (margem de 5 min)
  if (tokens.accessToken && tokens.expiry && Date.now() < tokens.expiry - 300000) {
    return tokens.accessToken;
  }

  // Renovar access_token usando refresh_token
  var credentials = Utilities.base64Encode(clientId + ':' + clientSecret);

  var response = UrlFetchApp.fetch(BLING_API_BASE + '/oauth/token', {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + credentials
    },
    payload: {
      'grant_type': 'refresh_token',
      'refresh_token': tokens.refreshToken
    },
    muteHttpExceptions: true
  });

  var data = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) {
    throw new Error('Erro ao renovar token Bling: ' + JSON.stringify(data));
  }

  // Salvar novos tokens
  saveBlingTokens(data.access_token, data.refresh_token, data.expires_in);

  return data.access_token;
}

// Fazer requisição à API do Bling
function blingRequest(endpoint, method, body) {
  var accessToken = getBlingAccessToken();
  var url = BLING_API_BASE + endpoint;

  var options = {
    method: method || 'get',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    muteHttpExceptions: true
  };

  if (body && (method === 'post' || method === 'POST' || method === 'put' || method === 'PUT')) {
    options.payload = JSON.stringify(body);
  }

  var response = UrlFetchApp.fetch(url, options);
  var responseData = JSON.parse(response.getContentText());

  if (response.getResponseCode() >= 400) {
    var errorMsg = '';
    if (responseData.error) {
      errorMsg = responseData.error.message || JSON.stringify(responseData.error);
      if (responseData.error.fields) {
        errorMsg += ' — ' + responseData.error.fields.map(function(f) { return f.msg || f.message || JSON.stringify(f); }).join('; ');
      }
    }
    throw new Error('Bling API erro ' + response.getResponseCode() + ': ' + errorMsg);
  }

  return responseData;
}

// ========== BLING: CONTATO + PEDIDO ==========

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  for (var t = 9; t < 11; t++) {
    var soma = 0;
    for (var i = 0; i < t; i++) {
      soma += parseInt(cpf[i]) * ((t + 1) - i);
    }
    var resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[t])) return false;
  }
  return true;
}

function buscarOuCriarContato(cliente) {
  var cpf = cliente.cpf || '';
  var telefone = cliente.telefone || '';

  // Buscar por CPF se existir
  if (cpf && cpf.length === 11 && validarCPF(cpf)) {
    try {
      var busca = blingRequest('/contatos?numeroDocumento=' + cpf, 'get');
      if (busca.data && busca.data.length > 0) {
        return busca.data[0].id;
      }
    } catch (e) {
      // Contato não encontrado, vai criar
    }
  }

  // Criar novo contato
  var tipoPessoa = cliente.tipo === 'J' ? 'J' : 'F';
  var novoContato = {
    nome: cliente.nome.toUpperCase(),
    tipo: tipoPessoa,
    situacao: 'A',
    indicadorIe: tipoPessoa === 'J' ? 1 : 9
  };

  if (telefone && telefone.length >= 10) {
    novoContato.telefone = telefone;
    novoContato.celular = telefone;
  }

  if (cpf && ((cpf.length === 11 && validarCPF(cpf)) || cpf.length === 14)) {
    novoContato.numeroDocumento = cpf;
  }

  if (cliente.ie) {
    novoContato.ie = cliente.ie;
  }

  if (cliente.email) {
    novoContato.email = cliente.email;
  }

  // Endereço
  if (cliente.endereco) {
    novoContato.endereco = {
      endereco: cliente.endereco,
      numero: cliente.numero || 'S/N',
      bairro: cliente.bairro || '',
      municipio: cliente.cidade || '',
      uf: cliente.uf || '',
      cep: cliente.cep || ''
    };
  }

  var resultado = blingRequest('/contatos', 'post', novoContato);
  return resultado.data.id;
}

function enviarPedidoBling(dados) {
  // 1. Buscar ou criar contato
  var contatoId = buscarOuCriarContato({
    nome: dados.nomeCliente,
    cpf: dados.cpfCnpjCliente,
    telefone: dados.telefoneCliente,
    email: '',
    tipo: dados.tipoCliente || 'F',
    ie: dados.ieCliente || '',
    endereco: dados.enderecoCliente || '',
    numero: dados.numeroCliente || '',
    bairro: dados.bairroCliente || '',
    cidade: dados.cidadeCliente || '',
    uf: dados.ufCliente || '',
    cep: dados.cepCliente || ''
  });

  // 2. Montar itens do pedido (com mapeamento fiscal da Claudia Peças)
  var itens = [];
  var pecas = dados.pecas || [];

  for (var i = 0; i < pecas.length; i++) {
    var peca = pecas[i];
    var fiscal = buscarMapeamentoFiscal(peca.descricao);

    // Se tem IPI no mapeamento fiscal, o valor enviado ao Bling deve ser o valor BASE (sem IPI)
    // Ex: cliente paga R$200, IPI 9% → valor base = 200 / 1.09 = R$183,49
    // Quando a nota for gerada, o Bling soma o IPI automaticamente e fecha no valor total
    var valorUnitario = peca.precoUnitario;
    if (fiscal && fiscal.ipi > 0) {
      valorUnitario = peca.precoUnitario / (1 + fiscal.ipi);
      valorUnitario = Math.round(valorUnitario * 100) / 100; // arredondar 2 casas
    }

    var item = {
      descricao: fiscal ? fiscal.descricaoNfe : peca.descricao.toUpperCase(),
      unidade: 'UN',
      quantidade: peca.quantidade,
      valor: valorUnitario
    };

    // Se tem mapeamento fiscal, usar o código da tabela da contabilidade
    if (fiscal) {
      item.codigo = fiscal.codigo;
      try {
        var busca = blingRequest('/produtos?codigo=' + encodeURIComponent(fiscal.codigo), 'get');
        if (busca.data && busca.data.length > 0) {
          item.produto = { id: busca.data[0].id };
        }
      } catch (e) {
        // Produto não encontrado por código fiscal
      }
    }

    // Se não tem mapeamento fiscal, tentar vincular por código manual ou nome (fallback)
    if (!fiscal) {
      if (peca.codigo) {
        try {
          var buscaCod = blingRequest('/produtos?codigo=' + encodeURIComponent(peca.codigo), 'get');
          if (buscaCod.data && buscaCod.data.length > 0) {
            item.produto = { id: buscaCod.data[0].id };
            item.codigo = peca.codigo;
          }
        } catch (e) {}
      }

      if (!item.produto) {
        try {
          var buscaNome = blingRequest('/produtos?nome=' + encodeURIComponent(peca.descricao), 'get');
          if (buscaNome.data && buscaNome.data.length > 0) {
            item.produto = { id: buscaNome.data[0].id };
            item.codigo = buscaNome.data[0].codigo || '';
          }
        } catch (e) {}
      }
    }

    itens.push(item);
  }

  // 3. Montar pedido de venda
  var pedido = {
    contato: { id: contatoId },
    data: dados.dataVenda,
    numero: dados.id.replace('PCA-', ''),
    numeroLoja: dados.id,
    vendedor: { nome: dados.vendedor },
    naturezaOperacao: { id: 15105967674 },
    itens: itens,
    observacoes: 'SAC - ' + (dados.tipoAtendimento || 'Peças') + (dados.protocoloSac ? ' | Protocolo: ' + dados.protocoloSac : '') + (dados.observacoes ? '\n' + dados.observacoes : '')
  };

  // 3.1 Adicionar transporte (frete + endereço de entrega para NF)
  var valorFrete = parseFloat(dados.valorFrete) || 0;
  pedido.transporte = {
    fretePorConta: 0 // 0 = por conta do remetente
  };
  if (valorFrete > 0) {
    pedido.transporte.frete = valorFrete;
  }

  var resultado = blingRequest('/pedidos/vendas', 'post', pedido);
  return resultado.data.id;
}

// ========== GRAVAR NA PLANILHA ==========

function gravarNaPlanilha(dados) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PEDIDOS')
           || ss.getSheetByName('Pedido de Peças')
           || ss.getSheetByName('Pecas')
           || ss.getSheets()[0];
  Logger.log('Aba encontrada: ' + sheet.getName());

  // Criar cabeçalho se a planilha estiver vazia
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'DATA', 'PEDIDO', 'PROTOCOLO SAC', 'ATENDENTE', 'Origem',
      'NOME DO CLIENTE', 'STATUS', 'NF', 'SOLICITAÇÃO', 'URGÊNCIA',
      'ENVIO', 'TELEFONE', 'ENDEREÇO', 'BAIRRO', 'CIDADE/ESTADO', 'CEP',
      'PEDIDO DE PEÇAS', 'TIPO DE PEÇA', 'MODELO', 'COR',
      'QTD', 'TOTAL PEÇA (R$)', 'PAGAMENTO', 'PREV. EMBARQUE',
      'FRETE (R$)', 'TOTAL GERAL (R$)',
      '', '', 'PESO / VOLUME', 'OBS',
      'BLING STATUS', 'BLING PEDIDO ID', 'FECHAMENTO'
    ]);
    var headerRange = sheet.getRange(1, 1, 1, 33);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a1a2e');
    headerRange.setFontColor('#c6ff00');
  }

  // Montar descrição das peças
  var pecas = dados.pecas || [];
  var pecasDesc = pecas.map(function(p) {
    return p.descricao + ' (' + p.modelo + ')' +
           (p.cor ? ' [Cor: ' + p.cor + ']' : '') +
           ' - ' + p.quantidade + 'x R$' + Number(p.precoUnitario).toFixed(2).replace('.', ',');
  }).join(' | ');

  // Extrair categorias, modelos e cores únicos
  var categorias = [];
  var modelos = [];
  var cores = [];
  pecas.forEach(function(p) {
    if (p.categoria && categorias.indexOf(p.categoria) === -1) categorias.push(p.categoria);
    if (p.modelo && modelos.indexOf(p.modelo) === -1) modelos.push(p.modelo);
    if (p.cor && cores.indexOf(p.cor) === -1) cores.push(p.cor);
  });

  var qtdTotal = pecas.reduce(function(sum, p) { return sum + (p.quantidade || 0); }, 0);

  // Formatar forma de pagamento
  var formaLabels = {
    'dinheiro': 'Dinheiro', 'pix': 'PIX', 'debito': 'Débito',
    'credito': 'Crédito', 'boleto': 'Boleto', 'link': 'Link de Pagamento', 'transferencia': 'Transferência'
  };
  var formaPag = formaLabels[dados.formaPagamento] || dados.formaPagamento || '';
  if ((dados.formaPagamento === 'credito' || dados.formaPagamento === 'link') && dados.parcelas) {
    formaPag += ' (' + dados.parcelas + 'x)';
  }

  var transpLabels = {
    'correios': 'Correios', 'rodonaves': 'Rodonaves', 'atual_cargas': 'Atual Cargas',
    'em_maos': 'Em Mãos', 'loja': 'Loja', 'outro': 'Outro'
  };

  var urgLabels = {
    'baixa': 'Baixa', 'normal': 'Normal', 'alta': 'Alta', 'urgente': 'URGENTE'
  };

  var cidadeEstado = (dados.cidadeCliente || '') + (dados.ufCliente ? '/' + dados.ufCliente : '');

  // Inserir linha (ordem conforme aba "PEDIDOS")
  sheet.appendRow([
    dados.dataVenda || '',                                          // A - DATA
    dados.id || '',                                                 // B - PEDIDO
    dados.protocoloSac || '',                                       // C - PROTOCOLO SAC
    dados.vendedor || '',                                           // D - ATENDENTE
    dados.origemSac || '',                                          // E - Origem
    dados.nomeCliente || '',                                        // F - NOME DO CLIENTE
    '',                                                             // G - STATUS (manual)
    '',                                                             // H - NF (manual)
    dados.tipoAtendimento || '',                                    // I - SOLICITAÇÃO
    urgLabels[dados.urgencia] || dados.urgencia || '',               // J - URGÊNCIA
    transpLabels[dados.transportadora] || dados.transportadora || '',// K - ENVIO
    dados.telefoneCliente || '',                                    // L - TELEFONE
    (dados.enderecoCliente || '') + (dados.numeroCliente ? ', ' + dados.numeroCliente : ''), // M - ENDEREÇO
    dados.bairroCliente || '',                                      // N - BAIRRO
    cidadeEstado,                                                   // O - CIDADE/ESTADO
    dados.cepCliente || '',                                         // P - CEP
    pecasDesc,                                                      // Q - PEDIDO DE PEÇAS
    categorias.join(', '),                                          // R - TIPO DE PEÇA
    modelos.join(', '),                                             // S - MODELO
    cores.join(', '),                                               // T - COR
    qtdTotal,                                                       // U - QTD
    dados.totalPecas || 0,                                          // V - TOTAL PEÇA (R$)
    formaPag,                                                       // W - PAGAMENTO
    dados.prevEmbarque || '',                                       // X - PREV. EMBARQUE
    dados.valorFrete || 0,                                          // Y - FRETE (R$)
    dados.totalGeral || 0,                                          // Z - TOTAL GERAL (R$)
    '',                                                             // AA - (vazio)
    '',                                                             // AB - (vazio)
    dados.pesoVolume || '',                                         // AC - PESO / VOLUME
    dados.observacoes || '',                                        // AD - OBS
    '',                                                             // AE - BLING STATUS
    '',                                                             // AF - BLING PEDIDO ID
    ''                                                              // AG - FECHAMENTO (manual)
  ]);

  var lastRow = sheet.getLastRow();

  // Formatar colunas de valor como moeda (V=22, Y=25, Z=26)
  sheet.getRange(lastRow, 22).setNumberFormat('R$ #.##0,00');
  sheet.getRange(lastRow, 25).setNumberFormat('R$ #.##0,00');
  sheet.getRange(lastRow, 26).setNumberFormat('R$ #.##0,00');

  return lastRow;
}

function atualizarBlingStatus(row, status, pedidoId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PEDIDOS')
           || ss.getSheetByName('Pedido de Peças')
           || ss.getSheetByName('Pecas')
           || ss.getSheets()[0];
  sheet.getRange(row, 31).setValue(status);
  sheet.getRange(row, 32).setValue(pedidoId || '');
}

// ========== ENDPOINT PRINCIPAL ==========

function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);
    var resultado = { planilha: false, bling: false, blingPedidoId: null, erros: [] };

    // 1. Gravar na planilha
    var row;
    try {
      row = gravarNaPlanilha(dados);
      resultado.planilha = true;
    } catch (errPlanilha) {
      resultado.erros.push('Planilha: ' + errPlanilha.toString());
    }

    // 2. Enviar para o Bling
    try {
      var pedidoId = enviarPedidoBling(dados);
      resultado.bling = true;
      resultado.blingPedidoId = pedidoId;

      // Atualizar status na planilha
      if (row) {
        atualizarBlingStatus(row, 'OK', pedidoId);
      }
    } catch (errBling) {
      resultado.erros.push('Bling: ' + errBling.toString());

      // Marcar erro na planilha
      if (row) {
        atualizarBlingStatus(row, 'ERRO: ' + errBling.message, '');
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: resultado.planilha || resultado.bling ? 'ok' : 'error',
        planilha: resultado.planilha,
        bling: resultado.bling,
        blingPedidoId: resultado.blingPedidoId,
        erros: resultado.erros
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  var code = (e && e.parameter && e.parameter.code) || '';

  // Se veio com código do Bling, tratar como callback automaticamente
  if (code && !action) {
    action = 'bling_callback';
  }

  // Página de status
  if (action === 'status') {
    var tokens = getBlingTokens();
    var hasCreds = !!(getProperty('BLING_CLIENT_ID') && getProperty('BLING_CLIENT_SECRET'));
    var hasRefresh = !!tokens.refreshToken;
    var tokenValido = tokens.accessToken && tokens.expiry && Date.now() < tokens.expiry - 300000;

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'ok',
        bling: {
          credenciais: hasCreds,
          refreshToken: hasRefresh,
          accessTokenValido: tokenValido
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Autorização Bling - etapa 1: gerar link
  if (action === 'auth_bling') {
    var clientId = getProperty('BLING_CLIENT_ID');
    if (!clientId) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'BLING_CLIENT_ID não configurado nas Propriedades do Script' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var scriptUrl = ScriptApp.getService().getUrl();
    var redirectUri = scriptUrl;

    var authUrl = BLING_API_BASE + '/oauth/authorize?response_type=code&client_id=' + clientId +
                  '&redirect_uri=' + encodeURIComponent(redirectUri) + '&state=pecas';

    // Retornar página HTML com link
    var html = '<html><head><title>Autorizar Bling</title>'
      + '<style>body{font-family:Arial;padding:40px;max-width:600px;margin:0 auto;text-align:center;}'
      + '.btn{display:inline-block;background:#27ae60;color:white;padding:15px 30px;border-radius:8px;text-decoration:none;font-size:16px;}'
      + '.btn:hover{background:#219a52;}</style></head>'
      + '<body><h1>Autorizar Bling - NXT Peças</h1>'
      + '<p>Clique no botão abaixo para autorizar o acesso ao Bling:</p>'
      + '<p><a class="btn" href="' + authUrl + '">Autorizar no Bling</a></p>'
      + '<p style="color:#888;font-size:12px;">Redirect URI: ' + redirectUri + '</p>'
      + '</body></html>';

    return HtmlService.createHtmlOutput(html);
  }

  // Autorização Bling - etapa 2: callback com código
  if (action === 'bling_callback') {
    if (!code) code = e.parameter.code;
    if (!code) {
      return HtmlService.createHtmlOutput('<h1 style="color:red;">Erro: código não recebido</h1>');
    }

    var clientId = getProperty('BLING_CLIENT_ID');
    var clientSecret = getProperty('BLING_CLIENT_SECRET');
    var credentials = Utilities.base64Encode(clientId + ':' + clientSecret);
    var scriptUrl = ScriptApp.getService().getUrl();
    var redirectUri = scriptUrl;

    var response = UrlFetchApp.fetch(BLING_API_BASE + '/oauth/token', {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + credentials
      },
      payload: {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirectUri
      },
      muteHttpExceptions: true
    });

    var data = JSON.parse(response.getContentText());

    if (response.getResponseCode() !== 200) {
      return HtmlService.createHtmlOutput(
        '<h1 style="color:red;">Erro ao obter tokens</h1><pre>' + JSON.stringify(data, null, 2) + '</pre>'
      );
    }

    // Salvar tokens!
    saveBlingTokens(data.access_token, data.refresh_token, data.expires_in);

    return HtmlService.createHtmlOutput(
      '<html><body style="font-family:Arial;padding:40px;text-align:center;">'
      + '<h1 style="color:#27ae60;">✅ Bling Conectado!</h1>'
      + '<p>Tokens salvos com sucesso. O NXT Peças está pronto para enviar pedidos ao Bling.</p>'
      + '</body></html>'
    );
  }

  // Default
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'NXT Pecas API ativa' }))
    .setMimeType(ContentService.MimeType.JSON);
}
