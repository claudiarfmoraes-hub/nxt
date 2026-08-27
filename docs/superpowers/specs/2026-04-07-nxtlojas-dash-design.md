# NXT Lojas Dash — Design Spec

**Data:** 2026-04-07
**Projeto:** nxtlojas-dash (evolucao do APP Plus)
**Objetivo:** Sistema de gestao de estoque e vendas por loja, com dados historicos, controle de acesso por roles e integracao com Bling ERP, Make.com e Cloud Run.
**Substitui:** APP atual (nxt-app/app) quando estiver 100%

---

## 1. Visao Geral

O NXT Lojas Dash e um rewrite completo do APP Plus. O APP atual continua no ar ate este projeto estar pronto.

**Problema que resolve:** O APP atual prioriza vendas e trata estoque de forma arcaica (contagem manual diaria, entradas nao somam automaticamente). O NXT Lojas Dash trata vendas e estoque como pares iguais — estoque vivo, atualizado em tempo real pelas vendas e entradas, com visao historica por loja.

**Diferenciais sobre o APP atual:**
- Estoque em tempo real por loja (Firestore onSnapshot)
- Baixa automatica de estoque ao registrar venda (incluindo vendas de estoque de outra loja)
- Historico completo de movimentacoes (quem, quando, o que, tipo)
- Controle de acesso por roles (admin, gerente, funcionario)
- Relatorios gerenciais de estoque e vendas
- Visual profissional, sem emojis, identidade NXT

---

## 2. Arquitetura

### 2.1 Stack

- **Frontend:** Vanilla JS modular (sem framework, sem bundler)
- **Backend:** Firebase (Auth + Firestore + Cloud Functions)
- **Proxy Bling:** Vercel (mantido do APP atual, fase 1)
- **Integracao:** Make.com (mesmos webhooks), Cloud Run (baixa estoque)
- **Hosting:** Firebase Hosting
- **Repositorio:** github.com/claudiarfmoraes-hub/nxtlojas-dash

### 2.2 Estrutura de Arquivos

```
nxtlojas-dash/
├── index.html                  # SPA
├── css/
│   ├── variables.css           # Design tokens NXT
│   ├── base.css                # Reset, tipografia, grid
│   ├── components.css          # Botoes, cards, inputs, modais, toasts
│   └── pages.css               # Estilos por aba
├── js/
│   ├── app.js                  # Init, router de abas, estado global
│   ├── firebase-init.js        # Config Firebase, refs globais
│   ├── auth.js                 # Login, logout, onAuthStateChanged, roles
│   ├── stock.js                # Estoque: visao por loja, entradas, saidas,
│   │                           #   historico, alertas, listener tempo real
│   ├── sales.js                # Vendas: formulario, baixa automatica,
│   │                           #   wizard pos-venda, historico
│   ├── invoice.js              # Fatura HTML/PDF, WhatsApp
│   ├── bling.js                # Integracao Bling (proxy Vercel)
│   ├── fiscal.js               # Decomposicao fiscal NF-e
│   ├── integrations.js         # Make.com webhooks, Cloud Run
│   ├── reports.js              # Relatorios gerenciais (tabelas)
│   ├── admin.js                # Gestao lojas + usuarios
│   ├── ui.js                   # Modais, toasts, loading, mascaras
│   └── utils.js                # Validacoes (CPF, CEP), formatacoes
├── dados/
│   ├── lojas.json              # 40 lojas
│   ├── produtos.json           # 12 modelos + 17 cores
│   ├── vendedores_json.json    # 81 vendedores + matriculas
│   └── produtos-fiscal.json    # Mapeamento fiscal por modelo
├── assets/
│   └── logo-nxt.svg            # Logo vetorial
├── functions/
│   └── index.js                # Cloud Functions (gestao usuarios)
├── manifest.json
├── service-worker.js
├── firebase.json
└── .firebaserc
```

### 2.3 Firestore Collections

```
usuarios/{uid}
  ├── email, nome, role, loja, lojas[], ativo, createdAt, createdBy

lojas/{lojaId}
  ├── nome, endereco, telefone, ativo, createdAt, createdBy

estoques/{lojaId}/produtos/{produtoId}
  ├── modelo, cor, quantidade, chassi[], motor[], updatedAt, updatedBy

vendas/{lojaId}/registros/{vendaId}
  ├── ...dadosVenda, lojaOrigem, lojaVendedor, vendedor, vendedorMatricula,
  │   usuario, status, createdAt

movimentacoes/{lojaId}/registros/{movId}
  ├── tipo (entrada|saida|venda|transferencia), modelo, cor, quantidade,
  │   chassi, motor, observacao, vendaRef, usuario, createdAt
```

### 2.4 Fluxo Central

```
Entrada manual ──> Estoque (Firestore, tempo real) <── Baixa automatica por venda
                        │
                        v
              Historico de movimentacoes
              (quem, quando, o que, tipo)
```

---

## 3. Controle de Acesso (Roles)

### 3.1 Papeis

| Role | Estoque | Vendas | Relatorios | Admin |
|---|---|---|---|---|
| **Funcionario** | Sua loja (ver + registrar entradas/saidas) | Suas vendas apenas | Nao | Nao |
| **Gerente** | Todas as lojas atribuidas, alterna entre elas | Vendas de todas as lojas dele, todos os vendedores | Sim (suas lojas) | Nao |
| **Admin** | Todas as lojas | Todas as vendas | Sim (tudo) | Sim |

### 3.2 Verificacao

- Client-side: funcoes `isAdmin()`, `isGerente()`, `temAcessoLoja(lojaId)` controlam UI
- Server-side: Firestore Security Rules reforcam (fonte de verdade)
- Cloud Functions: verificam role via Admin SDK antes de executar

---

## 4. Abas do Sistema

### 4.1 Estoque (aba padrao ao logar)

**Visao atual do estoque:**
- Grid de cards: modelo + cor + quantidade
- Indicadores visuais: barra lateral verde (ok), amarela (<=2), vermelha (0)
- Gerente/Admin: seletor de loja no topo

**Entrada de estoque:**
- Formulario: modelo (dropdown), cor (dropdown), quantidade, chassi (opcional), motor (opcional)
- Motivo: Transferencia, Fabrica, Ajuste, Devolucao (botoes rapidos ou texto livre)
- Ao salvar: incrementa quantidade no Firestore, registra movimentacao

**Saida manual:**
- Mesma estrutura da entrada, para saidas que nao sao venda (transferencia, defeito, etc.)
- Ao salvar: decrementa quantidade (transacao atomica, impede negativo), registra movimentacao

**Historico de movimentacoes:**
- Tabela com colunas: data, tipo, modelo, cor, quantidade, chassi, usuario, observacao
- Filtros: periodo, tipo (entrada/saida/venda/transferencia)
- Tempo real via Firestore onSnapshot

### 4.2 Vendas

**Formulario de nova venda (5 secoes colapsaveis com progress bar):**

1. **Informacoes da Venda**
   - Loja (pre-selecionada baseado no login, editavel para gerente/admin)
   - Matricula do vendedor (4 digitos) com autocomplete por matricula ou nome
   - Data da venda (auto-preenchida)

2. **Dados do Cliente**
   - Nome, telefone (mascara), email (opcional)
   - CPF (mascara + validacao) / CNPJ (opcional)
   - Endereco: CEP (busca ViaCEP), rua, numero, bairro, cidade, UF

3. **Produtos (multiplos)**
   - Modelo + cor (dropdowns)
   - Preco (campo monetario BRL)
   - Chassi e motor (opcionais)
   - Toggle capacete + cor do capacete
   - Botao "Adicionar Produto" — acumula em lista
   - Origem do produto: "Desta loja" ou "De outra loja" (seletor de loja de origem)

4. **Pagamento**
   - Formas: PIX, PIX POS, Dinheiro, Debito, Credito, Crediario, Outros
   - Valor individual por forma selecionada
   - Parcelas (1x-12x) quando credito
   - Card dados PIX / dados bancarios conforme forma selecionada
   - Observacoes

5. **Entrega**
   - Tipo: Retirada na Loja / Entrega em Casa
   - Data prevista
   - Valor do frete (somado ao total)

**Ao registrar venda:**
1. Salva venda no Firestore (colecao da loja do vendedor)
2. Baixa estoque na loja de ORIGEM do produto (pode ser outra loja)
   - Registra movimentacao de saida na loja de origem: "Venda para Loja X"
   - Transacao atomica: se estoque insuficiente, falha e nao registra
3. Envia ao Bling (contato + pedido + NF-e) via proxy Vercel
4. Envia ao Make.com webhook
5. Envia baixa ao Cloud Run (se chassi informado)
6. Abre wizard pos-venda

**Venda de estoque de outra loja (transacao atomica):**
```
1. Baixa estoque na LOJA DE ORIGEM
2. Registra venda na LOJA DO VENDEDOR
3. Registra movimentacao de saida na loja de origem
   (observacao: "Venda para Loja X - Vendedor Y")
-- Se qualquer etapa falhar, rollback completo --
```

**Wizard pos-venda (modal em etapas):**
1. Confirmacao + checklist (status Bling, resumo)
2. Fatura completa (HTML, copiar, PDF via jsPDF, imprimir, WhatsApp)
3. Manual da moto (link Google Drive)
4. Botao "Nova Venda"

**Historico de vendas:**
- Tabela com filtros: periodo, vendedor, status (pendente/pago)
- Funcionario ve so suas vendas
- Gerente ve todas das lojas dele
- Admin ve tudo

### 4.3 Relatorios (gerente e admin)

**Relatorios de Estoque:**
- Posicao atual por loja (tabela comparativa)
- Giro de produtos por periodo (quais modelos/cores mais movimentam)
- Evolucao de estoque ao longo do tempo por item
- Itens zerados / em alerta por loja

**Relatorios de Vendas:**
- Vendas por periodo (dia/semana/mes)
- Ranking de vendedores por loja e geral
- Vendas por modelo/cor (o que mais vende)
- Comparativo entre lojas

**Formato:** tabelas com filtros + exportar CSV/Excel
**Sem graficos** — apenas tabelas com numeros

### 4.4 Admin (so admin)

- **Gestao de Lojas:** criar, editar, ativar/desativar
- **Gestao de Usuarios:** criar, editar, desativar, reativar, resetar senha
- **Atribuicao de lojas a gerentes** (checkboxes)

### 4.5 Perfil

- Dados do usuario logado
- Loja atual
- Logout

---

## 5. Integracoes Externas

### 5.1 Bling ERP (via proxy Vercel — fase 1)

- OAuth2 com renovacao automatica de token
- Proxy em `/api/bling/proxy.js` (Vercel) com Upstash Redis para tokens
- Chamadas: buscar/criar contato, criar pedido de venda, gerar NF-e, enviar NF-e
- Logica fiscal: decomposicao por modelo (quadro, motor, baterias) usando `produtos-fiscal.json`
- CFOP interestadual (6102) vs intraestadual (5102)
- Anti-duplicidade com flags

### 5.2 Make.com

- Webhook vendas: `https://hook.us2.make.com/ku3pkl5io6mnh7k8tq275vhowhkcwxxo`
- Webhook inventario: `https://hook.us2.make.com/xp9611ae67d4cf47frtwlzc9qmhafzck`
- Mesmos webhooks do APP atual
- Fire-and-forget com timeout 30s

### 5.3 Cloud Run (baixa estoque)

- POST `https://estoque-baixa-venda-yr6pk2gb3a-rj.a.run.app`
- Autenticacao via X-API-Key (mover para variavel de ambiente)
- Payload: chassi, motor, tipo, local, formularioRef
- Fire-and-forget

### 5.4 ViaCEP

- Busca de endereco por CEP no formulario de cliente

---

## 6. Visual e Identidade

### 6.1 Direcao

- **Tema escuro:** fundo `#121212` / `#1a1a1a`
- **Accent NXT:** verde `#C6FF00` — botoes primarios, badges, indicadores ativos
- **Tipografia:** Inter (Google Fonts), limpa, sem emojis em nenhum lugar
- **Cards:** bordas sutis (`1px solid #2a2a2a`), sombras minimas
- **Indicadores de estoque:** barra lateral no card (verde/amarelo/vermelho)
- **Feedback:** toasts em vez de `alert()` nativo
- **Tabelas:** linhas alternadas para legibilidade, header fixo
- **Mobile-first:** responsivo, funciona bem no celular dos vendedores na loja
- **Tom:** dashboard corporativo profissional (referencia: Shopify admin em tema escuro)

### 6.2 Design Tokens (variables.css)

```css
:root {
  /* Cores */
  --bg-primary: #121212;
  --bg-secondary: #1a1a1a;
  --bg-card: #1e1e1e;
  --bg-input: #252525;
  --border: #2a2a2a;
  --text-primary: #f5f5f5;
  --text-secondary: #a0a0a0;
  --accent: #C6FF00;
  --accent-hover: #d4ff33;
  --danger: #ff4444;
  --warning: #ffaa00;
  --success: #44cc44;

  /* Tipografia */
  --font-family: 'Inter', sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.5rem;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

---

## 7. PWA

- `manifest.json`: nome "NXT Lojas", display standalone, theme-color #C6FF00, background #121212
- `service-worker.js`: Network First com cache fallback. Cache versionado automaticamente (hash no nome)
- Arquivos cacheados: HTML, CSS, JS, JSONs de dados, logo
- APIs e POSTs excluidos do cache

---

## 8. Seguranca

- Firestore Security Rules reforcam roles (source of truth)
- Cloud Functions verificam role via Admin SDK
- API keys em variaveis de ambiente (nao hardcoded)
- Webhooks Make.com como constantes configuraveis
- Proxy Bling com CORS restrito
- Tokens Bling em Upstash Redis (nao expostos ao frontend)

---

## 9. Migracao e Deploy

### 9.1 Repositorio

- Criar `nxtlojas-dash` no GitHub (claudiarfmoraes-hub)
- Projeto independente do nxt-app
- APP atual (nxt-app/app) permanece no ar e intocado

### 9.2 Firebase

- Projeto: `nxt-plus` (ja existe)
- Hosting: Firebase Hosting
- Auth: email/senha
- Firestore: collections conforme secao 2.3
- Cloud Functions: gestao de usuarios

### 9.3 Dados

- Copiar JSONs atualizados do APP live (lojas, produtos, vendedores, fiscal)
- Estoque inicial alimentado manualmente por loja

### 9.4 Proxy Bling (fase 1)

- Manter na Vercel como servico separado
- APP chama via URL configuravel
- Fase 2 (futuro): migrar para Cloud Functions + Firestore/Secret Manager

---

## 10. Visao Futura — Portal NXT

O NXT Lojas Dash e uma das instancias de um ecossistema maior. Ja existem outras aplicacoes NXT prontas (Revendedores, SAC, etc.). No futuro, sera criado um **Portal NXT** — app de entrada com cards que direcionam para cada sistema:

- **NXT Lojas** (este projeto)
- **NXT Revendedores** (existente)
- **NXT SAC** (existente)
- Outros sistemas conforme necessidade

**Premissas para integracao futura:**
- Firebase Auth compartilhado entre todas as instancias (mesmo projeto Firebase ou projetos vinculados)
- Cada sistema vive no seu proprio repositorio e hosting
- Portal exibe cards conforme permissoes do usuario
- Login unico (SSO via Firebase Auth) — usuario faz login uma vez e navega entre sistemas
- Nenhuma mudanca necessaria no design atual do NXT Lojas — a integracao sera feita no portal

---

## 11. Fora de Escopo

- Financeiro (faturamento, ticket medio, projecoes)
- Graficos visuais nos relatorios
- Notificacoes push
- Modo offline completo (PWA cache apenas para abertura rapida)
- Migracao de dados historicos do APP atual (localStorage dos dispositivos)
- Portal NXT (sera projeto separado quando as instancias estiverem consolidadas)
