# Conciliação de PIX no formulário PF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar registro detalhado de transações de PIX no formulário de venda PF do APP NXT, com dispatch paralelo a um webhook Make.com dedicado, espelhando o padrão já entregue para cartões.

**Architecture:** Estado novo `pixVenda` (array de transações), nova seção HTML `#pixGroup` que aparece quando o checkbox `pix` está marcado, conjunto de funções JS espelhadas das de cartão (CRUD/render/cálculo), payload da venda ganha `pagamento.pix` (array), sanitizador estendido pra aceitar tipo `conciliacaoPix`, e dispatch fire-and-forget para uma URL Make.com nova quando a venda tem PIX.

**Tech Stack:** HTML/CSS/JS vanilla, PWA com service worker, Firebase Hosting. Sem framework de testes — verificação é manual no browser.

**Spec:** `docs/superpowers/specs/2026-05-10-conciliacao-pix-design.md`

---

## File Structure

| Arquivo | Responsabilidade |
|---------|------------------|
| `app/script.js` | URL do webhook, estado `pixVenda`, funções CRUD/render/cálculo, integração com payload e webhook, geração de resumos/faturas |
| `app/index.html` | Marcação da seção `#pixGroup` com card de aviso, lista dinâmica, banner de pagador vazio e total |
| `app/style.css` | Classes `.pix-aviso-card`, `.pix-grid`, `.pix-pagador-vazio`, `.pix-aviso-banner` (demais classes herdadas do bloco de cartão) |
| `app/service-worker.js` | Bump de `CACHE_NAME` (`v33` → `v34`) pra forçar atualização nos clientes |

## Convenções e ferramentas para o executor

- **Servidor local**: use o que você costuma rodar nesse projeto (`firebase serve --only hosting` na raiz que tem `firebase.json`, ou `npx http-server app/`). Abra `http://localhost:5000` (ou porta equivalente) no Chrome.
- **DevTools**: deixe o **Console** aberto sempre — erros JS aparecem ali. Use a aba **Network** com filtro `make.com` pra verificar disparos de webhook.
- **Hard refresh** após cada mudança: `Ctrl+Shift+R` pra contornar o service worker durante desenvolvimento (ou desabilite o SW nas DevTools → Application → Service Workers → "Update on reload").
- **Linguagem dos commits**: PT-BR, conventional commits, sem `git add -A` (preferir adicionar arquivos por nome).
- **Não desabilitar hooks** (não usar `--no-verify`).
- **Não usar emojis decorativos** em código ou interface (convenção do projeto). Ícones funcionais (✕, ⚠️ no aviso) são OK.

---

## Task 1: URL do webhook e estado base

**Files:**
- Modify: `app/script.js` (linhas ~2-6 e ~43)

- [ ] **Step 1: Adicionar a URL placeholder pro novo webhook**

Localizar o bloco no topo de `app/script.js`:

```js
const POWER_AUTOMATE_URLS = {
    vendas: 'https://hook.us2.make.com/ku3pkl5io6mnh7k8tq275vhowhkcwxxo',
    inventario: 'https://hook.us2.make.com/xp9611ae67d4cf47frtwlzc9qmhafzck',
    conciliacaoCartoes: 'https://hook.us2.make.com/wjl421mft9kokf9ph3eur171yso5ds1w'
};
```

Substituir por:

```js
const POWER_AUTOMATE_URLS = {
    vendas: 'https://hook.us2.make.com/ku3pkl5io6mnh7k8tq275vhowhkcwxxo',
    inventario: 'https://hook.us2.make.com/xp9611ae67d4cf47frtwlzc9qmhafzck',
    conciliacaoCartoes: 'https://hook.us2.make.com/wjl421mft9kokf9ph3eur171yso5ds1w',
    // TODO: substituir antes do deploy — Claudia cria cenario Make.com e fornece a URL
    conciliacaoPix: 'https://hook.us2.make.com/PLACEHOLDER_AGUARDANDO_URL'
};
```

- [ ] **Step 2: Adicionar o estado global `pixVenda`**

Localizar a linha existente:

```js
let cartoesVenda = []; // transacoes de cartao da venda atual (conciliacao financeira)
```

Adicionar logo abaixo:

```js
let pixVenda = []; // transferencias de PIX da venda atual (conciliacao financeira)
```

- [ ] **Step 3: Verificação manual**

Recarregue a aplicação no browser, abra o Console. Confirme que **não há erros novos** ao carregar. Digite no console:

```js
typeof pixVenda
```

Deve retornar `"object"` (arrays são objetos em JS). Confirme:

```js
Array.isArray(pixVenda)
```

Deve retornar `true`.

- [ ] **Step 4: Commit**

```bash
git add app/script.js
git commit -m "feat(pix): adiciona URL placeholder e estado pixVenda

Constraint: URL conciliacaoPix substituida apos Claudia criar cenario
Make.com — atual e placeholder
Confidence: high
Scope-risk: narrow"
```

---

## Task 2: Marcação HTML da seção `#pixGroup`

**Files:**
- Modify: `app/index.html` (após `#cartoesGroup`, antes de `#pixInfoCard`)

- [ ] **Step 1: Adicionar a seção `#pixGroup`**

Localizar o final do bloco `<div id="cartoesGroup" class="cartoes-section">` (próximo da linha 392). Logo após o `</div>` que fecha esse bloco, e ANTES do `<div class="pix-info-card" id="pixInfoCard">`, inserir:

```html
                                <!-- Detalhes de PIX: registro por transferencia para conciliacao financeira -->
                                <div id="pixGroup" class="cartoes-section pix-section" style="display: none;">
                                    <div class="cartoes-header">
                                        <h5>Detalhes do PIX</h5>
                                        <button type="button" class="btn-add-cartao" onclick="adicionarPix()">+ Adicionar PIX</button>
                                    </div>

                                    <div class="pix-aviso-card">
                                        <strong>ATENÇÃO — Preencha o nome de quem FEZ o PIX, não do cliente.</strong>
                                        O extrato bancário identifica o depositante (pode ser pai, mãe, cônjuge, amigo do cliente).
                                        É esse nome que concilia o PIX recebido com esta venda. O cadastro do cliente continua normal
                                        nos dados da venda — esses dois campos são independentes.
                                    </div>

                                    <div id="pixList"></div>

                                    <div class="pix-aviso-banner" id="pixAvisoSemPagador" style="display: none;">
                                        <span id="pixAvisoSemPagadorTexto"></span>
                                    </div>

                                    <div class="cartoes-totais">
                                        <span>Total PIX:</span>
                                        <strong id="totalPix">R$ 0,00</strong>
                                    </div>
                                </div>
```

- [ ] **Step 2: Verificação manual**

Recarregue. A seção PIX **não deve aparecer** (display:none). Abra o Console e digite:

```js
document.getElementById('pixGroup') !== null
document.getElementById('pixList') !== null
document.getElementById('pixAvisoSemPagador') !== null
document.getElementById('totalPix') !== null
```

Todos devem retornar `true`.

Force a exibição pra inspecionar visualmente:

```js
document.getElementById('pixGroup').style.display = 'block'
```

A seção aparece (sem estilos por enquanto — tá feio, normal). O botão "+ Adicionar PIX" vai dar erro se clicado (`adicionarPix is not defined`) — esperado. Volte:

```js
document.getElementById('pixGroup').style.display = 'none'
```

- [ ] **Step 3: Commit**

```bash
git add app/index.html
git commit -m "feat(pix): marcacao HTML da secao de detalhes de PIX

Confidence: high
Scope-risk: narrow"
```

---

## Task 3: Estilos CSS da seção PIX

**Files:**
- Modify: `app/style.css` (após o bloco de estilos do cartão, ~linha 2517)

- [ ] **Step 1: Adicionar os estilos**

Localizar o final do bloco de cartão em `style.css` (após o último seletor `.btn-add-cartao` e suas regras, antes do bloco `/* PIX Info Card */` na linha 2519). Inserir logo antes do `/* PIX Info Card */`:

```css
/* Detalhes de PIX (conciliacao financeira) */
.pix-section {
    margin-top: 1rem;
}

.pix-aviso-card {
    background: #FEF3C7;
    border-left: 4px solid #F59E0B;
    padding: 0.875rem 1rem;
    border-radius: 6px;
    margin-bottom: 0.875rem;
    color: #78350F;
    font-size: 0.875rem;
    line-height: 1.5;
}

.pix-aviso-card strong {
    display: block;
    margin-bottom: 0.375rem;
    color: #78350F;
}

.pix-row.pix-pagador-vazio {
    border-color: #F59E0B;
    box-shadow: 0 0 0 1px #F59E0B inset;
}

.pix-aviso-banner {
    background: #FEF3C7;
    border: 1px solid #F59E0B;
    padding: 0.625rem 0.875rem;
    border-radius: 6px;
    margin: 0.5rem 0 0.75rem;
    color: #78350F;
    font-size: 0.8125rem;
}

.pix-grid {
    grid-template-columns: 2fr 1fr 1.2fr auto;
}

@media (max-width: 600px) {
    .pix-grid {
        grid-template-columns: 1fr;
    }
}
```

- [ ] **Step 2: Verificação manual**

Recarregue. Force exibição da seção:

```js
document.getElementById('pixGroup').style.display = 'block'
```

A seção agora aparece estilizada: card amarelo de aviso no topo, lista vazia, total `R$ 0,00`. O banner de "PIX sem depositante" continua escondido (correto — ninguém adicionou nada).

Inspecione o card amarelo: deve ter fundo `#FEF3C7`, borda lateral âmbar, texto em tom marrom escuro. A mensagem em negrito deve estar destacada.

Esconda de novo:

```js
document.getElementById('pixGroup').style.display = 'none'
```

- [ ] **Step 3: Commit**

```bash
git add app/style.css
git commit -m "feat(pix): estilos da secao de detalhes de PIX

Confidence: high
Scope-risk: narrow"
```

---

## Task 4: Funções JS — CRUD, render, cálculo e aviso

**Files:**
- Modify: `app/script.js` (após o bloco de cartão, antes de `--- DETALHES INFORMADOS AO CLIENTE ---`)

- [ ] **Step 1: Adicionar as funções**

Localizar o final do bloco de cartão em `script.js` — termina com a função `recalcularValoresCartao()` (após a linha 2831). Logo após o fechamento dessa função e ANTES do comentário `// --- DETALHES INFORMADOS AO CLIENTE ---` (linha 2833), inserir o bloco:

```js
// --- DETALHES DE PIX (conciliacao financeira) ---

function descreverPix(p) {
    const dh = p.dataHora ? ` — ${formatarDataHoraCartaoBR(p.dataHora)}` : '';
    const pag = (p.pagador || '').trim() ? ` — ${p.pagador}` : '';
    return `PIX — R$ ${formatarValorMonetario(p.valor || 0)}${pag}${dh}`;
}

function adicionarPix() {
    pixVenda.push({
        pagador: '',
        valor: 0,
        dataHora: dataHoraLocalAgora()
    });
    renderPix();
    recalcularValoresPix();
}

function removerPix(index) {
    pixVenda.splice(index, 1);
    renderPix();
    recalcularValoresPix();
}

function renderPix() {
    const list = document.getElementById('pixList');
    if (!list) return;
    list.innerHTML = pixVenda.map((p, i) => {
        const pagadorEscaped = (p.pagador || '').replace(/"/g, '&quot;');
        const pagadorVazio = !(p.pagador || '').trim();
        return `
        <div class="cartao-row pix-row ${pagadorVazio ? 'pix-pagador-vazio' : ''}" data-index="${i}">
            <div class="cartao-grid pix-grid">
                <div class="cartao-field">
                    <label>Nome do depositante</label>
                    <input type="text" class="pix-pagador" placeholder="Quem fez o PIX" value="${pagadorEscaped}" oninput="atualizarLinhaPix(${i})">
                </div>
                <div class="cartao-field">
                    <label>Valor</label>
                    <input type="text" class="pix-valor currency-input" placeholder="R$ 0,00" value="${p.valor > 0 ? formatarValorMonetario(p.valor) : ''}" oninput="atualizarLinhaPix(${i})">
                </div>
                <div class="cartao-field">
                    <label>Data/Hora</label>
                    <input type="datetime-local" class="pix-datahora" value="${p.dataHora || ''}" onchange="atualizarLinhaPix(${i})">
                </div>
                <button type="button" class="btn-remove-cartao" onclick="removerPix(${i})" title="Remover">✕</button>
            </div>
        </div>
    `;
    }).join('');
}

function atualizarLinhaPix(index) {
    const row = document.querySelectorAll('.pix-row')[index];
    if (!row || !pixVenda[index]) return;

    const pagador = row.querySelector('.pix-pagador').value;
    const valorStr = row.querySelector('.pix-valor').value;
    const valor = parseFloat(valorStr.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    const dataHora = row.querySelector('.pix-datahora').value;

    pixVenda[index] = { pagador, valor, dataHora };

    row.classList.toggle('pix-pagador-vazio', !(pagador || '').trim());

    recalcularValoresPix();
}

function recalcularValoresPix() {
    const totalPix = pixVenda.reduce((s, p) => s + (p.valor || 0), 0);

    const elTotal = document.getElementById('totalPix');
    if (elTotal) elTotal.textContent = `R$ ${formatarValorMonetario(totalPix)}`;

    // Sincronizar input oculto legacy (valorPix alimenta fluxos antigos)
    const valPixInput = document.getElementById('valorPix');
    if (valPixInput) valPixInput.value = totalPix > 0 ? formatarValorMonetario(totalPix) : '';

    atualizarAvisoPixSemPagador();
    calcularTotalFormasPagamento();
}

function atualizarAvisoPixSemPagador() {
    const semPagador = pixVenda.filter(p => !(p.pagador || '').trim()).length;
    const banner = document.getElementById('pixAvisoSemPagador');
    const texto = document.getElementById('pixAvisoSemPagadorTexto');
    if (!banner || !texto) return;
    if (semPagador > 0) {
        texto.innerHTML = `<strong>${semPagador} PIX sem nome do depositante</strong> — recomendado preencher para conciliação automática com o extrato.`;
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }
}
```

- [ ] **Step 2: Verificação manual no Console**

Recarregue. Force exibição:

```js
document.getElementById('pixGroup').style.display = 'block'
```

Clique no botão "+ Adicionar PIX". Uma linha deve aparecer com bordas amarelas (pois pagador vazio), e o banner "1 PIX sem nome do depositante" aparece. Verifique:

```js
pixVenda.length  // 1
pixVenda[0]      // { pagador: '', valor: 0, dataHora: 'YYYY-MM-DDTHH:MM' }
```

Preencha o nome no campo "Nome do depositante" (ex: "Jefferson Silva"). A borda amarela some, banner some. Verifique:

```js
pixVenda[0].pagador  // 'Jefferson Silva'
```

Preencha o valor (ex: `5490,00`). O total no rodapé atualiza pra `R$ 5.490,00`. O hidden `#valorPix` também:

```js
document.getElementById('valorPix').value  // '5.490,00'
```

Clique "+ Adicionar PIX" de novo, deixa pagador vazio. O banner volta com "1 PIX sem nome do depositante". Clique no ✕ da segunda linha. Volta pra 1 linha.

- [ ] **Step 3: Commit**

```bash
git add app/script.js
git commit -m "feat(pix): funcoes CRUD, render, calculo e aviso de pagador vazio

Confidence: high
Scope-risk: narrow"
```

---

## Task 5: Toggle de visibilidade da seção `#pixGroup`

**Files:**
- Modify: `app/script.js` (~linha 1320, no handler que mostra/esconde `#pixInfoCard`)

- [ ] **Step 1: Localizar o handler atual**

No `script.js`, procure o trecho perto da linha 1323:

```js
            // Mostrar info do PIX se selecionado
            const pixInfo = document.getElementById('pixInfoCard');
            const pixChecked = document.querySelector('input[name="pagamento"][value="pix"]').checked;
            if (pixInfo) {
                pixInfo.style.display = pixChecked ? 'block' : 'none';
            }
```

- [ ] **Step 2: Estender o handler pra também alternar `#pixGroup`**

Substituir o bloco acima por:

```js
            // Mostrar info do PIX se selecionado
            const pixInfo = document.getElementById('pixInfoCard');
            const pixGroup = document.getElementById('pixGroup');
            const pixChecked = document.querySelector('input[name="pagamento"][value="pix"]').checked;
            if (pixInfo) {
                pixInfo.style.display = pixChecked ? 'block' : 'none';
            }
            if (pixGroup) {
                pixGroup.style.display = pixChecked ? 'block' : 'none';
                if (pixChecked && pixVenda.length === 0) {
                    adicionarPix(); // pre-adiciona uma linha pra facilitar
                }
            }
```

- [ ] **Step 3: Verificação manual**

Recarregue (hard refresh). Cadastre uma venda nova até a tela de pagamento. Marque o checkbox **PIX**:
- A seção amarela `#pixInfoCard` (CNPJ NXT) aparece (comportamento existente)
- A nova seção `#pixGroup` aparece
- Uma linha de PIX é adicionada automaticamente (com `dataHora` preenchida e bordas amarelas avisando pagador vazio)

Desmarque o checkbox PIX:
- Ambas as seções somem

Remarque:
- Seções voltam, mas `pixVenda` ainda tem a linha anterior (não duplica)

Marque cartão (débito ou crédito) junto com PIX:
- Seção de cartão e seção de PIX coexistem normalmente, cada uma com sua lista

- [ ] **Step 4: Commit**

```bash
git add app/script.js
git commit -m "feat(pix): toggle de visibilidade da secao ao marcar/desmarcar PIX

Pre-adiciona uma linha quando PIX e marcado pela primeira vez, pra
reduzir cliques da vendedora.

Confidence: high
Scope-risk: narrow"
```

---

## Task 6: Integração com `obterValoresFormasPagamento`

**Files:**
- Modify: `app/script.js` (`obterValoresFormasPagamento`, ~linha 2642)

- [ ] **Step 1: Localizar a função**

No `script.js`, achar:

```js
function obterValoresFormasPagamento() {
    const valores = {};
    const formasSelecionadas = Array.from(document.querySelectorAll('input[name="pagamento"]:checked')).map(cb => cb.value);

    // Cartoes: somar de cartoesVenda (preenchidos manualmente para conciliacao)
    const totalCartaoDebito = cartoesVenda.filter(c => c.tipo === 'debito').reduce((s, c) => s + (c.valor || 0), 0);
    const totalCartaoCredito = cartoesVenda.filter(c => c.tipo === 'credito').reduce((s, c) => s + (c.valor || 0), 0);
    if (formasSelecionadas.includes('debito')) valores.debito = totalCartaoDebito;
    if (formasSelecionadas.includes('credito')) valores.credito = totalCartaoCredito;

    const naoCartao = formasSelecionadas.filter(f => f !== 'debito' && f !== 'credito');
```

- [ ] **Step 2: Estender pra tratar PIX da mesma forma**

Substituir o trecho acima por:

```js
function obterValoresFormasPagamento() {
    const valores = {};
    const formasSelecionadas = Array.from(document.querySelectorAll('input[name="pagamento"]:checked')).map(cb => cb.value);

    // Cartoes: somar de cartoesVenda (preenchidos manualmente para conciliacao)
    const totalCartaoDebito = cartoesVenda.filter(c => c.tipo === 'debito').reduce((s, c) => s + (c.valor || 0), 0);
    const totalCartaoCredito = cartoesVenda.filter(c => c.tipo === 'credito').reduce((s, c) => s + (c.valor || 0), 0);
    if (formasSelecionadas.includes('debito')) valores.debito = totalCartaoDebito;
    if (formasSelecionadas.includes('credito')) valores.credito = totalCartaoCredito;

    // PIX: somar de pixVenda quando a vendedora preencheu transacoes detalhadas
    const totalPix = pixVenda.reduce((s, p) => s + (p.valor || 0), 0);
    const pixDetalhado = pixVenda.length > 0;
    if (formasSelecionadas.includes('pix') && pixDetalhado) {
        valores.pix = totalPix;
    }

    // Formas que sao tratadas pelo fluxo de campo individual (nao detalhadas)
    const naoCartao = formasSelecionadas.filter(f => {
        if (f === 'debito' || f === 'credito') return false;
        if (f === 'pix' && pixDetalhado) return false;
        return true;
    });
```

Importante: o resto da função fica inalterado. A mudança é nas três linhas iniciais que filtram `naoCartao` — agora PIX entra ou não conforme `pixDetalhado`.

- [ ] **Step 3: Verificação manual**

Cenário A — PIX sozinho:
1. Cadastre venda com 1 produto de R$ 7.400,00
2. Marque apenas PIX
3. Linha de PIX foi auto-adicionada. Preencha pagador "Alexandre" e valor `7.400,00`
4. Console: `obterValoresFormasPagamento()` → `{ pix: 7400 }`

Cenário B — PIX detalhado + dinheiro:
1. Mesma venda
2. Marque PIX **e** Dinheiro
3. Na linha de PIX, valor `5.000,00`
4. No campo "Dinheiro (R$)" que aparece no grid antigo, valor `2.400,00`
5. Console: `obterValoresFormasPagamento()` → `{ pix: 5000, dinheiro: 2400 }`

Cenário C — PIX marcado mas sem linhas detalhadas:
1. Marque PIX
2. Remova a linha auto-adicionada com ✕
3. Console: `pixVenda.length` → `0`
4. Console: `obterValoresFormasPagamento()` → `{ pix: 0 }` (cai no fluxo legado de campo único — comportamento atual preservado)

- [ ] **Step 4: Commit**

```bash
git add app/script.js
git commit -m "feat(pix): integra pixVenda com obterValoresFormasPagamento

Quando ha transacoes detalhadas de PIX, soma de pixVenda alimenta
valores.pix. Sem transacoes detalhadas, cai no fluxo legado de
campo unico — preserva compat com fluxos antigos.

Confidence: high
Scope-risk: narrow"
```

---

## Task 7: Estender sanitizador pra aceitar tipo `conciliacaoPix` e forwarding de `pagamento.pix`

**Files:**
- Modify: `app/script.js` (`sanitizarDadosParaEnvio`, ~linha 3304)

- [ ] **Step 1: Localizar o branch atual do sanitizador**

No `script.js`, achar:

```js
function sanitizarDadosParaEnvio(tipo, dados) {
    if (tipo === 'vendas' || tipo === 'conciliacaoCartoes') {
```

- [ ] **Step 2: Adicionar `conciliacaoPix` ao branch**

Substituir essa linha por:

```js
function sanitizarDadosParaEnvio(tipo, dados) {
    if (tipo === 'vendas' || tipo === 'conciliacaoCartoes' || tipo === 'conciliacaoPix') {
```

- [ ] **Step 3: Adicionar `pagamento.pix` na saída sanitizada**

Localizar o bloco `pagamento:` dentro do mesmo branch. Procure por `cartoes:` dentro de `pagamento`. Logo após a linha que sanitiza `cartoes`, adicionar a sanitização de `pix`. O bloco final deve ter algo equivalente a:

```js
            pagamento: {
                // ...campos existentes (formas, valores, etc.)
                cartoes: Array.isArray(dados.pagamento?.cartoes) ? dados.pagamento.cartoes.map(c => ({
                    tipo: c.tipo || '',
                    modalidade: c.modalidade || '',
                    parcelas: c.parcelas || 1,
                    valor: c.valor || 0,
                    dataHora: c.dataHora || ''
                })) : [],
                pix: Array.isArray(dados.pagamento?.pix) ? dados.pagamento.pix.map(p => ({
                    tipo: p.tipo || 'pix',
                    modalidade: p.modalidade || 'av',
                    parcelas: p.parcelas || 1,
                    pagador: p.pagador || '',
                    valor: p.valor || 0,
                    dataHora: p.dataHora || ''
                })) : []
            },
```

Se o `pagamento.cartoes` atual no sanitizador tem formato diferente (ex: passa o array adiante sem mapear), siga o mesmo padrão para `pix` — mas garanta que cada item de PIX tenha os campos `tipo`, `modalidade`, `parcelas`, `pagador`, `valor`, `dataHora`. Se preciso, leia o sanitizador completo primeiro pra ajustar.

- [ ] **Step 4: Verificação manual no Console**

Recarregue. No console, monte um objeto fake e teste:

```js
const fake = {
    id: 'VNDA-TEST',
    pagamento: {
        formas: ['pix'],
        valores: { pix: 5490 },
        pix: [{ tipo: 'pix', modalidade: 'av', parcelas: 1, pagador: 'Jefferson Silva', valor: 5490, dataHora: '2026-05-10T14:32' }]
    }
};
console.log(sanitizarDadosParaEnvio('conciliacaoPix', fake));
```

Inspecione: o objeto retornado deve ter `pagamento.pix` como array com 1 item, todos os campos preenchidos.

Teste também com `'vendas'`:

```js
console.log(sanitizarDadosParaEnvio('vendas', fake));
```

Deve incluir `pagamento.pix` também (mesmo branch).

- [ ] **Step 5: Commit**

```bash
git add app/script.js
git commit -m "feat(pix): estende sanitizador para conciliacaoPix e forwarding de pagamento.pix

Mesmo branch ja aplicado a vendas e conciliacaoCartoes — todos
os tres tipos passam a incluir pagamento.pix no payload.

Confidence: high
Scope-risk: narrow"
```

---

## Task 8: Incluir `pagamento.pix` no payload da venda

**Files:**
- Modify: `app/script.js` (em `registrarVenda` ~linha 441 e em `salvarVendaPendente` ~linha 1743)

- [ ] **Step 1: Localizar onde `pagamento.cartoes` é atribuído**

Procure em `script.js` por `cartoes: cartoesVenda` (deve aparecer duas vezes — uma em `registrarVenda` e outra em `salvarVendaPendente` ou função equivalente).

- [ ] **Step 2: Adicionar `pix` paralelo ao `cartoes` em ambos os locais**

Em CADA ocorrência, logo após a linha que atribui `cartoes:`, adicionar a atribuição de `pix:`:

```js
            cartoes: cartoesVenda.map(c => ({ ...c })),
            pix: pixVenda.map(p => ({
                tipo: 'pix',
                modalidade: 'av',
                parcelas: 1,
                pagador: p.pagador || '',
                valor: p.valor,
                dataHora: p.dataHora
            })),
```

Se a forma exata como `cartoes` é atribuído for diferente (sem `.map(c => ({...c}))`), siga o padrão do código existente — o importante é que **o array `pix` no payload tenha esses 6 campos** em cada item.

- [ ] **Step 3: Verificação manual**

Cadastre uma venda PF de teste:
1. Selecione loja, produto, vendedor, cliente
2. Marque PIX, preencha 1 linha (pagador "Teste", valor R$ 100,00)
3. **Antes** de clicar "Registrar Venda", abra o Console e cole:

```js
// Intercepta o proximo registro pra inspecionar o payload
const _orig = enviarParaAutomacao;
window.enviarParaAutomacao = function(tipo, venda) {
    console.log('=== WEBHOOK', tipo, '===', JSON.parse(JSON.stringify(venda)));
    return _orig.apply(this, arguments);
};
```

4. Clique "Registrar Venda"
5. No Console, deve aparecer ao menos um log `=== WEBHOOK vendas === { ... }` com `venda.pagamento.pix` como array de 1 item com todos os campos preenchidos
6. Restaure: `window.enviarParaAutomacao = _orig;`

- [ ] **Step 4: Commit**

```bash
git add app/script.js
git commit -m "feat(pix): inclui pagamento.pix no payload da venda

Atribuido em registrarVenda e salvarVendaPendente paralelo a
pagamento.cartoes. Cada item carrega tipo/modalidade/parcelas
fixos (pix/av/1) pra simetrizar com schema do cartao no Make.com.

Confidence: high
Scope-risk: narrow"
```

---

## Task 9: Dispatch do webhook paralelo `conciliacaoPix`

**Files:**
- Modify: `app/script.js` (após o bloco do webhook de cartão, ~linha 504-509)

- [ ] **Step 1: Localizar o dispatch atual do cartão**

Achar:

```js
    // Webhook paralelo de conciliacao de cartoes (so dispara se a venda tiver cartao)
    if (Array.isArray(venda.pagamento?.cartoes) && venda.pagamento.cartoes.length > 0) {
        enviarParaAutomacao('conciliacaoCartoes', venda).catch(error => {
            console.error('Erro no envio ao webhook de conciliacao:', error);
        });
    }
```

- [ ] **Step 2: Adicionar dispatch paralelo de PIX logo abaixo**

Adicionar imediatamente após o bloco acima:

```js
    // Webhook paralelo de conciliacao de PIX (so dispara se a venda tiver PIX)
    if (Array.isArray(venda.pagamento?.pix) && venda.pagamento.pix.length > 0) {
        enviarParaAutomacao('conciliacaoPix', venda).catch(error => {
            console.error('Erro no envio ao webhook de conciliacao PIX:', error);
        });
    }
```

- [ ] **Step 3: Verificação manual**

1. Recarregue. Cadastre venda PF com PIX (1 linha, pagador "Teste E2E", valor R$ 1,00 — valor baixo pra não bagunçar)
2. Abra DevTools → Network, filtre por `make.com`
3. Clique "Registrar Venda"
4. Você deve ver **duas** requisições paralelas pra `hook.us2.make.com`:
   - Uma pro cenário `vendas`
   - Uma pro cenário `conciliacaoPix` (com URL placeholder — vai retornar erro 404 ou similar, esperado)
5. Console mostra: `Erro no envio ao webhook de conciliacao PIX: ...` (esperado enquanto a URL é placeholder)

Agora cadastre outra venda **sem** PIX (só Dinheiro). Confirma que apenas **uma** requisição vai (a de `vendas`), nenhuma com `conciliacaoPix`.

- [ ] **Step 4: Commit**

```bash
git add app/script.js
git commit -m "feat(pix): dispatch paralelo do webhook conciliacaoPix

So dispara se a venda tem PIX (Array.isArray + length > 0). Fire-and-
forget, erro vai pro console — fluxo principal de venda intocado.

Constraint: webhook novo so dispara quando ha PIX (evita gastar
operations do Make sem necessidade)
Constraint: URL ainda e placeholder — substituir antes do deploy
Confidence: high
Scope-risk: narrow"
```

---

## Task 10: Resumo, fatura HTML, fatura texto, mensagem WhatsApp

**Files:**
- Modify: `app/script.js` (em `gerarTextoResumoVenda` ~linha 1638, `gerarHTMLFatura` ~linha 1821, `gerarTextoFatura` ~linha 1968, e mensagem WhatsApp ~linha 4422)

- [ ] **Step 1: Identificar como o cartão é listado em cada gerador**

Procure por `descreverCartao` em `script.js` — vai aparecer em 4 geradores: `gerarTextoResumoVenda` (~1638), `gerarHTMLFatura` (~1821), `gerarTextoFatura` (~1968), e a função de mensagem WhatsApp (~4418-4492).

**Em cada uma, anote o nome da variável acumuladora** (provavelmente `resumo`, `texto`, `html` e `msg`/`mensagem` respectivamente). Os blocos de PIX abaixo usam nomes ilustrativos — **substitua pelo nome real** da função correspondente. O resto da estrutura (`if Array.isArray + venda.pagamento?.pix && length > 0`, o forEach, o `descreverPix(p)`) é idêntico.

- [ ] **Step 2: Adicionar listagem paralela de PIX em `gerarTextoResumoVenda` (~linha 1638)**

Localize o bloco que lista cartões dentro dessa função. Logo após o `if` que trata cartões, adicionar:

```js
    if (Array.isArray(venda.pagamento?.pix) && venda.pagamento.pix.length > 0) {
        resumo += `\nPIX detalhado:\n`;
        venda.pagamento.pix.forEach(p => {
            resumo += `  - ${descreverPix(p)}\n`;
        });
    }
```

(Ajuste a string `resumo += ...` conforme a variável usada na função — pode ser `resumo`, `texto`, ou outra. Mantenha consistência com o que cartão já faz.)

- [ ] **Step 3: Adicionar listagem em `gerarHTMLFatura` (~linha 1821)**

Logo após o bloco que renderiza cartões em HTML, adicionar:

```js
    if (Array.isArray(venda.pagamento?.pix) && venda.pagamento.pix.length > 0) {
        html += `<h4 style="margin-top:1rem;">PIX detalhado:</h4><ul>`;
        venda.pagamento.pix.forEach(p => {
            html += `<li>${descreverPix(p)}</li>`;
        });
        html += `</ul>`;
    }
```

(Ajuste a variável `html` conforme a função real. Use o mesmo estilo do bloco de cartão.)

- [ ] **Step 4: Adicionar listagem em `gerarTextoFatura` (~linha 1968)**

Mesmo padrão do Step 2 (variável texto puro). Logo após o bloco de cartão:

```js
    if (Array.isArray(venda.pagamento?.pix) && venda.pagamento.pix.length > 0) {
        texto += `\nPIX detalhado:\n`;
        venda.pagamento.pix.forEach(p => {
            texto += `  - ${descreverPix(p)}\n`;
        });
    }
```

- [ ] **Step 5: Adicionar listagem na mensagem WhatsApp (~linha 4422)**

Localize a função `gerarMensagemWhatsApp` ou similar (onde está `descreverCartao` perto da linha 4418-4492). Logo após o bloco que lista cartões com `*PIX detalhado*` markdown, adicionar:

```js
    if (Array.isArray(venda.pagamento?.pix) && venda.pagamento.pix.length > 0) {
        msg += `\n*PIX detalhado:*\n`;
        venda.pagamento.pix.forEach(p => {
            msg += `_${descreverPix(p)}_\n`;
        });
    }
```

(Convenção do projeto: `*bold*` e `_italic_` no WhatsApp. Cabeçalho bold, itens italic.)

- [ ] **Step 6: Verificação manual**

1. Cadastre uma venda PF com PIX (2 linhas: "Maria" R$ 3.000 e "João" R$ 2.490)
2. Clique "Registrar Venda"
3. Aparece o resumo da venda — role até o fim e confirme que aparece bloco "PIX detalhado:" com 2 linhas tipo `PIX — R$ 3.000,00 — Maria — 10/05/26 14:32`
4. Clique "Ver Fatura" — fatura HTML deve mostrar lista de PIX
5. Clique "Copiar Fatura (Texto)" — cole no Bloco de Notas; deve ter "PIX detalhado:" com as 2 linhas
6. Clique "Enviar WhatsApp" — verifique a mensagem gerada (cole no Notepad antes de enviar); deve ter `*PIX detalhado:*` em bold e os itens em italic

Cadastre uma venda **sem** PIX. Confirme que os geradores **não** mostram bloco vazio de PIX.

- [ ] **Step 7: Commit**

```bash
git add app/script.js
git commit -m "feat(pix): lista transacoes de PIX em resumo, fatura HTML, fatura texto e WhatsApp

Cada PIX vira uma linha com pagador, valor e data/hora. Vendas antigas
sem pagamento.pix nao mostram o bloco (fallback automatico).

Confidence: high
Scope-risk: narrow"
```

---

## Task 11: Bump do service worker

**Files:**
- Modify: `app/service-worker.js`

- [ ] **Step 1: Localizar e atualizar `CACHE_NAME`**

Abrir `app/service-worker.js`. Procurar a constante `CACHE_NAME`. Deve estar com valor terminando em `v33` (algo como `'nxt-cache-v33'`).

Substituir o sufixo de versão: `v33` → `v34`.

- [ ] **Step 2: Verificação manual**

Recarregue duas vezes (a primeira atualiza o SW, a segunda usa o novo cache). Em DevTools → Application → Service Workers, confirme que o SW está ativo com a nova versão. Em Cache Storage, deve aparecer `nxt-cache-v34`.

- [ ] **Step 3: Commit**

```bash
git add app/service-worker.js
git commit -m "chore(pix): bump service worker v33 -> v34

Forca atualizacao nos clientes apos mudancas no script.js, index.html
e style.css.

Confidence: high
Scope-risk: narrow"
```

---

## Task 12: Smoke test end-to-end manual

**Files:** nenhum — apenas verificação.

- [ ] **Step 1: Cenário golden path — venda PF com PIX único**

1. Recarregue a aplicação
2. Cadastre venda PF: loja, vendedor, cliente "Maria da Silva", produto Pancho R$ 7.400
3. Forma de pagamento: marcar **PIX**
4. Seção amarela `#pixGroup` aparece, com 1 linha auto-adicionada (bordas amarelas, banner aviso)
5. Preencher pagador: "Jefferson Silva" (irmão da Maria)
6. Valor: `7.400,00`
7. Data/hora: aceitar o auto-preenchido (now)
8. Bordas amarelas somem, banner some
9. Clicar "Registrar Venda"
10. Resumo aparece com bloco "PIX detalhado: PIX — R$ 7.400,00 — Jefferson Silva — DD/MM/AA HH:MM"
11. DevTools → Network: duas requisições paralelas pra `make.com` (vendas + conciliacaoPix)
12. Em LocalStorage (`historicoResumoVendas`), a venda salva tem `pagamento.pix` com 1 item

- [ ] **Step 2: Cenário múltiplos PIX**

1. Nova venda PF, mesmo produto R$ 7.400
2. Marcar PIX
3. Auto-adiciona 1 linha. Preencher: "Maria" / `3.000,00`
4. Clicar "+ Adicionar PIX"
5. Segunda linha: deixar pagador VAZIO inicialmente — confirma banner "1 PIX sem nome do depositante"
6. Preencher: "João" / `4.400,00`
7. Total `R$ 7.400,00`. Banner some.
8. Registrar venda → resumo tem 2 linhas de PIX, WhatsApp tem 2 itens italic

- [ ] **Step 3: Cenário PIX + outra forma**

1. Nova venda PF, R$ 7.400
2. Marcar **PIX** e **Dinheiro**
3. Na seção PIX: pagador "Cliente final" valor `5.000,00`
4. No campo Dinheiro: `2.400,00`
5. Total da venda confere: R$ 7.400,00
6. Registrar → resumo mostra ambas as formas; webhook `conciliacaoPix` dispara (porque tem PIX); webhook `conciliacaoCartoes` NÃO dispara (sem cartão)

- [ ] **Step 4: Cenário sem PIX (regressão)**

1. Nova venda PF, R$ 7.400
2. Marcar apenas **Dinheiro**, valor `7.400,00`
3. Registrar
4. Network: apenas 1 requisição (vendas). Nenhum dispatch de `conciliacaoPix`.
5. Resumo e fatura **não** mostram bloco "PIX detalhado"

- [ ] **Step 5: Cenário pagador opcional (aviso amarelo)**

1. Nova venda PF, R$ 100 (teste pequeno)
2. Marcar PIX, deixar pagador VAZIO, valor `100,00`
3. Borda amarela na linha permanece, banner mostra "1 PIX sem nome do depositante"
4. Clicar "Registrar Venda" — venda **é registrada normalmente** (validação suave, não bloqueia)
5. Webhook `conciliacaoPix` dispara com `pagador: ''` (string vazia)

- [ ] **Step 6: Cenário PIX POS (não deve mudar)**

1. Nova venda PF, R$ 7.400
2. Marcar **PIX POS** (não PIX direto)
3. Seção `#pixGroup` **não** aparece (correto — PIX POS está fora de escopo)
4. Campo legacy `valorPos` aparece como hoje
5. Registrar → fluxo antigo intocado

- [ ] **Step 7: Validar lint/console**

Console DevTools: zero `Uncaught` errors em todos os cenários acima.

- [ ] **Step 8: Reportar resultado da bateria**

Se todos os cenários passam, marque como pronto. Se algum falhar, documente o problema e volte na task correspondente.

---

## Pendências fora do escopo deste plano

- **URL real do Make.com**: Claudia cria o cenário e substitui `'https://hook.us2.make.com/PLACEHOLDER_AGUARDANDO_URL'` antes do deploy. Commit separado quando a URL chegar.
- **Atualizar prompt da planilha**: o prompt do Claude Excel precisa do schema **A-L** (com coluna L=Depositante) e dos ajustes críticos já levantados na revisão anterior (filtro pra linhas PIX, alerta duplicata pela chave, tolerância de divergência, preservar abas existentes).
- **Deploy**: `firebase deploy --only hosting` na pasta do app (ou método de deploy padrão do projeto).
