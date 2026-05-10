# Conciliação de PIX no formulário PF — Design

**Data**: 2026-05-10
**Status**: Aprovado em brainstorming, aguardando aprovação do spec escrito
**Escopo**: app principal NXT (`ativos/nxt-app/app`), venda PF apenas

## Contexto

A conciliação de cartões foi entregue nos commits `ea577ba`, `66c25f1` e `880a86b`. O formulário PF passou a registrar transações de cartão individualmente (tipo/modalidade/parcelas/valor/dataHora), o payload da venda ganhou `pagamento.cartoes`, e um webhook paralelo (`conciliacaoCartoes`) dispara em paralelo ao `vendas` quando há cartões, alimentando uma planilha de conciliação que cruza com o extrato da maquininha.

Este spec replica esse padrão para PIX direto (não inclui PIX POS), com adaptações para a natureza diferente do meio de pagamento.

## Particularidades do PIX que moldam o design

1. **Extrato bancário não traz E2E ID nem horário** — só `data + descrição truncada (7 chars) + valor`. A chave de match na planilha de conciliação usa apenas `data + valor + tipo`.
2. **O nome no extrato é o do depositante, não do cliente** — pode ser pai, mãe, cônjuge, amigo. A vendedora precisa registrar **quem fez o PIX**, não os dados do cliente. Esse nome não entra na chave de match automático (truncado em 7 chars), mas aparece na planilha de conciliação para validação humana ("PIX RECEBIDO JEFFERS R$ 5.490 → venda VNDA-X cliente Maria com depositante Jefferson → bate").
3. **Múltiplos PIX por venda são possíveis** — cliente pode dividir pagamento em duas transferências (R$ 5.000 + R$ 2.400). Cada PIX vira uma linha no extrato, então cada PIX precisa ser uma transação separada no APP também.
4. **Schema reaproveita o do cartão** — `tipo/modalidade/parcelas` ficam fixos (`'pix'`/`'av'`/`1`) para que o cenário Make.com siga o mesmo padrão de explosão de array em linhas.
5. **Sem swap DIA↔MÊS** — o input `<input type="datetime-local" id="dataVenda">` já entrega ISO `YYYY-MM-DDTHH:MM` correto. O swap do cartão existe no cenário Make.com do cartão (não no APP) e não será replicado no cenário PIX.

## Estado e modelo de dados

Nova variável global em `script.js` (próxima a `cartoesVenda`, ~linha 43):

```js
let pixVenda = []; // transferencias de PIX da venda atual (conciliacao financeira)
```

Cada transação:

```js
{
  pagador: string,    // nome de quem fez o PIX (pode ficar vazio)
  valor: number,      // R$
  dataHora: string    // ISO local YYYY-MM-DDTHH:MM
}
```

## UI

### Marcação no `index.html`

Nova seção `#pixGroup` logo após `#cartoesGroup` (~linha 392), com display oculto por padrão. Aparece quando o checkbox `pix` está marcado, some quando desmarcado.

Estrutura:

```html
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

O `#pixInfoCard` atual (com CNPJ NXT) **permanece como hoje**, abaixo dessa nova seção, para a vendedora copiar dados ao orientar o cliente.

### Render de cada linha de PIX (`renderPix`)

```html
<div class="cartao-row pix-row" data-index="${i}">
    <div class="cartao-grid pix-grid">
        <div class="cartao-field">
            <label>Nome do depositante</label>
            <input type="text" class="pix-pagador" placeholder="Quem fez o PIX"
                   value="${escape(p.pagador)}" oninput="atualizarLinhaPix(${i})">
        </div>
        <div class="cartao-field">
            <label>Valor</label>
            <input type="text" class="pix-valor currency-input" placeholder="R$ 0,00"
                   value="${p.valor > 0 ? formatarValorMonetario(p.valor) : ''}"
                   oninput="atualizarLinhaPix(${i})">
        </div>
        <div class="cartao-field">
            <label>Data/Hora</label>
            <input type="datetime-local" class="pix-datahora"
                   value="${p.dataHora || ''}" onchange="atualizarLinhaPix(${i})">
        </div>
        <button type="button" class="btn-remove-cartao" onclick="removerPix(${i})" title="Remover">✕</button>
    </div>
</div>
```

Quando `pagador` vazio: a `.pix-row` ganha classe `.pix-pagador-vazio` (borda amarela suave).

### Banner de aviso de pagador vazio

Aparece no rodapé da seção quando há pelo menos uma transação sem pagador:

> "**N PIX sem nome do depositante** — recomendado preencher para conciliação automática com o extrato."

Não bloqueia a venda. Apenas alerta visual.

## CSS

Adicionar em `style.css` (após o bloco existente de cartão, ~linha 2510):

- `.pix-aviso-card` — fundo amarelo claro (`#FEF3C7`), borda lateral amarela mais escura, padding generoso, texto destacado. Estilo similar aos cards de aviso existentes mas com cor própria pra contrastar com o `#pixInfoCard` azul.
- `.pix-row` — herda de `.cartao-row`
- `.pix-grid` — variação de `.cartao-grid` com 3 campos + botão remover (Nome do depositante | Valor | Data/Hora | ✕), ao invés dos 5 campos + botão remover do cartão (Tipo | Modalidade | Parcelas | Valor | Data/Hora | ✕)
- `.pix-pagador-vazio` — borda amarela na linha quando pagador vazio
- `.pix-aviso-banner` — banner amarelo no rodapé com ícone de aviso

Responsivo: no mobile, grid colapsa pra 1 coluna (mesmo padrão do cartão).

## Funções JS

Adicionar em `script.js` após o bloco de cartão (~linha 2832, antes de `--- DETALHES INFORMADOS AO CLIENTE ---`):

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

function renderPix() { /* gera o HTML acima a partir de pixVenda */ }

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

    // Sincroniza input oculto legacy
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

### Toggle de visibilidade da seção

No handler que mostra/esconde os grupos de valores conforme as checkboxes de pagamento (perto do `pixInfoCard`, ~linha 1323), adicionar lógica para mostrar `#pixGroup` quando `pix` está checked.

## Integração com pagamento

`obterValoresFormasPagamento` (script.js:2642) — adicionar:

```js
// PIX: somar de pixVenda (preenchidos manualmente para conciliacao)
const totalPix = pixVenda.reduce((s, p) => s + (p.valor || 0), 0);
if (formasSelecionadas.includes('pix')) {
    // sobrescreve o valor unico antigo quando pix tem transacoes detalhadas
    if (pixVenda.length > 0) valores.pix = totalPix;
}
```

A lógica de "uma única forma → auto-atribui total" continua funcionando porque `pixVenda` está vazio quando vendedora não abriu transações.

## Payload da venda

Onde `pagamento.cartoes` é atribuído ao objeto da venda (em `registrarVenda` e em `salvarVendaPendente`, próximas a `script.js:441` e `:1743`), adicionar paralelo:

```js
pagamento: {
    // ...campos existentes
    cartoes: cartoesVenda.map(c => ({ ...c })),
    pix: pixVenda.map(p => ({
        tipo: 'pix',
        modalidade: 'av',
        parcelas: 1,
        pagador: p.pagador || '',
        valor: p.valor,
        dataHora: p.dataHora
    }))
}
```

### Sanitizador (`sanitizarDadosParaEnvio`, script.js:3304)

Estender o branch existente:

```js
if (tipo === 'vendas' || tipo === 'conciliacaoCartoes' || tipo === 'conciliacaoPix') {
    // ...mesma estrutura, garantir que pagamento.pix esteja no output
}
```

## Webhook paralelo

### URL

Adicionar em `POWER_AUTOMATE_URLS` (script.js:2):

```js
const POWER_AUTOMATE_URLS = {
    vendas: 'https://hook.us2.make.com/ku3pkl5io6mnh7k8tq275vhowhkcwxxo',
    inventario: 'https://hook.us2.make.com/xp9611ae67d4cf47frtwlzc9qmhafzck',
    conciliacaoCartoes: 'https://hook.us2.make.com/wjl421mft9kokf9ph3eur171yso5ds1w',
    conciliacaoPix: '<URL NOVA — Claudia cria cenário no Make e fornece antes do deploy>'
};
```

### Dispatch

Após o bloco do webhook de cartão (script.js:504-509):

```js
// Webhook paralelo de conciliacao de PIX (so dispara se a venda tiver PIX)
if (Array.isArray(venda.pagamento?.pix) && venda.pagamento.pix.length > 0) {
    enviarParaAutomacao('conciliacaoPix', venda).catch(error => {
        console.error('Erro no envio ao webhook de conciliacao PIX:', error);
    });
}
```

## Resumo / fatura / WhatsApp

Os geradores (`gerarTextoResumoVenda`, `gerarHTMLFatura`, `gerarTextoFatura`, mensagem WhatsApp) já listam cada cartão via `descreverCartao`. Adicionar lógica paralela: se `venda.pagamento?.pix?.length > 0`, listar cada PIX com `descreverPix`.

Fallback de venda antiga (sem `pagamento.pix`): continua mostrando `valores.pix` agregado como hoje.

## Compatibilidade

- Input oculto `#valorPix` (já presente em `index.html:344`) é mantido e sincronizado pelo `recalcularValoresPix`. Fluxos legados (Bling, resumo antigo, vendas pendentes do histórico) continuam lendo dele.
- Vendas antigas no histórico (sem `pagamento.pix`) caem no fallback de exibição agregada nos resumos.

## Service worker

`app/service-worker.js`: bump `CACHE_NAME` de `v33` para `v34` para forçar atualização nos clientes.

## Implicações na planilha (responsabilidade da Claudia)

O prompt do Claude Excel para construir "Vendas PIX APP" e "Conciliacao PIX" precisa de ajuste antes de rodar:

1. **Aba "Vendas PIX APP"**: schema passa de A-K para **A-L**. Nova coluna **L=Depositante** (vem de `pagamento.pix[].pagador`). Modalidade=`'av'` e Parcelas=`1` continuam preenchidas pelo array explodido.
2. **Aba "Conciliacao PIX"**: PROCX deve trazer Depositante junto com Cliente, para que ao olhar uma linha do extrato "PIX RECEBIDO JEFFERS09/05 R$ 5.490" você veja `Cliente: Maria Silva | Depositante: Jefferson Silva` — match humano evidente.
3. **Chave de match**: continua `data + valor + tipo` (não usa Depositante porque o extrato trunca o nome).
4. **Ajustes críticos do prompt já identificados** (revisão anterior): gerar chave só para linhas PIX (filtro pela descrição), alerta de duplicata pela coluna E (chave) ao invés de B (descrição), definir tolerância de divergência (R$ 0,01), preservar abas existentes.

## Escopo e não-escopo

**Em escopo:**
- Venda PF (formulário principal)
- Múltiplas transações PIX por venda
- Validação opcional de pagador (banner amarelo, não bloqueia)
- Webhook paralelo independente, fire-and-forget
- Resumo, fatura HTML, fatura texto, mensagem WhatsApp atualizados

**Fora de escopo:**
- PIX POS (`pos`) — continua com valor único agregado
- PJ e Peças — fluxo antigo
- Edição de venda pendente PF — não popula `pixVenda` (mesma limitação do cartão)
- Histórico de vendas antigas — cai no fallback agregado

## Restrições e suposições

- A URL nova do webhook `conciliacaoPix` precisa ser criada por Claudia no Make.com antes do deploy.
- O cenário Make.com do PIX deve mapear datas em ISO sem o swap DIA↔MÊS que existe no cenário antigo do cartão (configuração no próprio cenário, não no APP).
- O schema A-L da "Vendas PIX APP" depende da configuração do cenário Make.com mapear os campos do array `pagamento.pix` corretamente.

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Vendedora ignora aviso amarelo e não preenche pagador | Banner é visível e claro; conciliação manual ainda possível pelo extrato (valor+data) |
| URL Make.com nova ainda não criada no deploy | Webhook dispara mas falha silenciosamente (fire-and-forget, console.error apenas) — venda principal não afetada |
| Vendedora adiciona PIX e depois desmarca o checkbox | `obterValoresFormasPagamento` só usa `pixVenda` se `pix` está checked — valores corretos |
| Múltiplos PIX de mesmo valor no mesmo dia | Banner de duplicata na planilha alerta para conferência manual |

## Não-funcional

- **Performance**: payload da venda cresce em ~100-300 bytes por transação PIX (negligível).
- **Robustez**: dispatch do webhook é fire-and-forget e isolado do webhook `vendas` — risco zero ao fluxo principal de venda.
- **Visual**: mantém o padrão profissional sem emojis decorativos, conforme convenções do projeto.
