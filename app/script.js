// URLs para automação com Make.com (Webhook)
const POWER_AUTOMATE_URLS = {
    vendas: 'https://hook.us2.make.com/ku3pkl5io6mnh7k8tq275vhowhkcwxxo',
    inventario: 'https://hook.us2.make.com/xp9611ae67d4cf47frtwlzc9qmhafzck'
};

// ========================================
// CONFIGURAÇÃO BLING API V3 (AUTENTICAÇÃO CENTRALIZADA)
// ========================================
const BLING_CONFIG = {
    // Status carregado do servidor
    isConfigured: false,
    isAuthenticated: false,
    statusMessage: 'Verificando conexão...',

    // Verificar status no servidor
    async checkStatus() {
        try {
            const response = await fetch('/api/bling/status');
            const data = await response.json();
            this.isConfigured = data.configured;
            this.isAuthenticated = data.authenticated;
            this.statusMessage = data.message;
            return data;
        } catch (error) {
            console.error('Erro ao verificar status Bling:', error);
            this.isConfigured = false;
            this.isAuthenticated = false;
            this.statusMessage = 'Erro ao conectar com servidor';
            return { configured: false, authenticated: false };
        }
    }
};

// Variáveis globais de dados
let dadosLojas = {};
let dadosProdutos = {};
let dadosVendedores = [];
let produtosDaVenda = [];
let itensInventario = [];
let ultimoResumoVenda = '';
let ultimaVendaRegistrada = null;

// Variáveis para o novo sistema de inventário
let abaAtualInventario = 'contagem';
let tipoMovimentacaoSelecionado = '';

// --- INICIALIZAÇÃO DO APLICATIVO ---
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosIniciais();
    configurarFormularios();
    limparFormularioVenda();
    definirDataAtual();

    // Inicializar novos sistemas
    setTimeout(() => {
        inicializarInventarioNovo();
        inicializarVendasNovo();
        inicializarBling();
    }, 100);
});

function inicializarInventarioNovo() {
    // Inicializar aba padrão
    mudarAbaInventario('contagem');

    // Inicializar tipo de item padrão
    selecionarTipoItem('moto');
    selecionarTipoItemMov('moto');

    // Atualizar lista inicial
    atualizarListaInventarioUI();
}

async function carregarDadosIniciais() {
    try {
        const [lojasRes, produtosRes, vendedoresRes] = await Promise.all([
            fetch('dados/lojas.json'),
            fetch('dados/produtos.json'),
            fetch('dados/vendedores_json.json')
        ]);
        if (!lojasRes.ok) throw new Error(`Erro ao buscar lojas.json: ${lojasRes.statusText}`);
        try {
            dadosLojas = await lojasRes.json();
        } catch (e) {
            throw new Error("Erro de sintaxe no arquivo 'lojas.json'. Verifique as vírgulas e chaves {}.");
        }

        if (!produtosRes.ok) throw new Error(`Erro ao buscar produtos.json: ${produtosRes.statusText}`);
        try {
            dadosProdutos = await produtosRes.json();
        } catch (e) {
            throw new Error("Erro de sintaxe no arquivo 'produtos.json'. Verifique as vírgulas e chaves {}.");
        }

        if (!vendedoresRes.ok) throw new Error(`Erro ao buscar vendedores_json.json: ${vendedoresRes.statusText}`);
        try {
            const vendedoresData = await vendedoresRes.json();
            dadosVendedores = vendedoresData.vendedores || [];
        } catch (e) {
            throw new Error("Erro de sintaxe no arquivo 'vendedores_json.json'. Verifique as vírgulas e chaves {}.");
        }

        preencherDropdowns();
    } catch (error) {
        console.error("Erro fatal ao carregar dados de configuração:", error);
        alert(error.message);
    }
}

function preencherDropdowns() {
    const lojaVendaSelect = document.getElementById('lojaVenda');
    const lojaSaidaSelect = document.getElementById('lojaSaida');
    const lojaInventarioSelect = document.getElementById('lojaInventario');
    const modeloProdutoSelect = document.getElementById('modeloProduto');
    const corProdutoSelect = document.getElementById('corProduto');
    const modeloInventarioSelect = document.getElementById('modeloInventario');
    const corInventarioSelect = document.getElementById('corInventario');
    // Novos campos de movimentação
    const modeloMovimentacaoSelect = document.getElementById('modeloMovimentacao');
    const corMovimentacaoSelect = document.getElementById('corMovimentacao');

    [lojaVendaSelect, lojaSaidaSelect, lojaInventarioSelect, modeloProdutoSelect, corProdutoSelect, modeloInventarioSelect, corInventarioSelect, modeloMovimentacaoSelect, corMovimentacaoSelect].forEach(select => {
        if(select) {
            const firstOption = select.options[0];
            select.innerHTML = '';
            if (firstOption) select.appendChild(firstOption);
        }
    });

    for (const id in dadosLojas) {
        if (dadosLojas[id].tipo === 'loja') {
            const option = new Option(dadosLojas[id].nome, id);
            lojaVendaSelect.add(option.cloneNode(true));
            lojaInventarioSelect.add(option.cloneNode(true));
            lojaSaidaSelect.add(option);
        }
    }

    dadosProdutos.modelos.forEach(modelo => {
        modeloProdutoSelect.add(new Option(modelo, modelo));
        modeloInventarioSelect.add(new Option(modelo, modelo));
        if (modeloMovimentacaoSelect) modeloMovimentacaoSelect.add(new Option(modelo, modelo));
    });
    dadosProdutos.cores.forEach(cor => {
        corProdutoSelect.add(new Option(cor, cor));
        corInventarioSelect.add(new Option(cor, cor));
        if (corMovimentacaoSelect) corMovimentacaoSelect.add(new Option(cor, cor));
    });
}

function configurarFormularios() {
    document.getElementById('vendaForm').addEventListener('submit', registrarVenda);
    document.getElementById('adicionarProdutoBtn').addEventListener('click', adicionarProduto);
    document.getElementById('cepCliente').addEventListener('blur', buscarCEP);

    // Listener para capacete - verificar se é o novo checkbox ou o select antigo
    const acompanhaCapaceteSelect = document.getElementById('acompanhaCapacete');
    const acompanhaCapaceteCheck = document.getElementById('acompanhaCapaceteCheck');
    if (acompanhaCapaceteCheck) {
        // Novo formato com checkbox - listener já está no HTML via onchange
    } else if (acompanhaCapaceteSelect && acompanhaCapaceteSelect.tagName === 'SELECT') {
        acompanhaCapaceteSelect.addEventListener('change', toggleCorCapacete);
    }

    document.querySelectorAll('input[name="pagamento"]').forEach(cb => cb.addEventListener('change', handlePagamentoChange));
    document.querySelectorAll('.valor-forma-pagamento').forEach(input => input.addEventListener('input', calcularTotalFormasPagamento));

    // Configurar formatação monetária para todos os campos de valor
    document.querySelectorAll('.currency-input').forEach(input => {
        input.addEventListener('input', formatarMoeda);
        input.addEventListener('blur', finalizarFormatacaoMoeda);
    });

    // Listener para tipo de entrega - verificar se é select ou hidden
    const tipoEntregaEl = document.getElementById('tipoEntrega');
    if (tipoEntregaEl && tipoEntregaEl.tagName === 'SELECT') {
        tipoEntregaEl.addEventListener('change', handleTipoEntregaChange);
    }

    document.getElementById('origemProduto').addEventListener('change', handleOrigemProdutoChange);

    document.getElementById('copiarResumoVenda').addEventListener('click', () => copiarResumoVenda(false));
    document.getElementById('gerarFaturaBtn').addEventListener('click', gerarFatura);
    document.getElementById('limparFormularioBtn').addEventListener('click', limparFormularioVenda);

    // Configurar busca de vendedores após DOM estar pronto
    configurarBuscaVendedor();
    
    // Campo de preço com formatação monetária livre (sem preenchimento automático)
    document.getElementById('precoProduto').addEventListener('input', calcularTotal);
    
    // Campo de frete que recalcula o total
    document.getElementById('valorFrete').addEventListener('input', calcularTotal);

    document.getElementById('inventarioForm').addEventListener('submit', adicionarItemInventario);
    document.getElementById('finalizarInventario').addEventListener('click', finalizarInventario);
    document.getElementById('copiarResumoInventario').addEventListener('click', copiarResumoInventario);

    // Novo formulário de movimentação
    const movimentacaoForm = document.getElementById('movimentacaoForm');
    if (movimentacaoForm) {
        movimentacaoForm.addEventListener('submit', adicionarItemMovimentacao);
    }

    const modal = document.getElementById('modalResumoVenda');
    const modalFatura = document.getElementById('modalFatura');

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.onclick = function() {
            modal.style.display = "none";
            modalFatura.style.display = "none";
        }
    });

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
        if (event.target == modalFatura) {
            modalFatura.style.display = "none";
        }
    }

    document.getElementById('copiarResumoModalBtn').addEventListener('click', () => copiarResumoVenda(true));
    document.getElementById('copiarFaturaBtn').addEventListener('click', copiarFatura);
    document.getElementById('gerarPdfBtn').addEventListener('click', gerarPDF);
    document.getElementById('imprimirFaturaBtn').addEventListener('click', imprimirFatura);
}

// --- LÓGICA DE VENDAS ---

function atualizarPrecoAutomatico() {
    // Função mantida para compatibilidade, mas não preenche mais o preço automaticamente
    calcularTotal();
}

function adicionarProduto() {
    const modelo = document.getElementById('modeloProduto').value;
    const cor = document.getElementById('corProduto').value;
    const preco = obterValorNumerico('precoProduto');

    if (!modelo || !cor || preco <= 0) {
        mostrarFeedback('Selecione modelo, cor e um preço válido', 'erro');
        return;
    }

    const produto = {
        id: Date.now(),
        modelo: modelo,
        cor: cor,
        chassi: document.getElementById('chassiProduto').value,
        motor: document.getElementById('motorProduto').value,
        preco: preco,
        capacete: document.getElementById('acompanhaCapacete').value,
        corCapacete: document.getElementById('corCapacete').value
    };

    produtosDaVenda.push(produto);
    atualizarListaProdutosUI();
    calcularTotal();
    limparCamposProduto();

    // Feedback de sucesso
    mostrarFeedback(`${modelo} adicionado à venda!`, 'sucesso');
}

function atualizarListaProdutosUI() {
    const container = document.getElementById('listaProdutosVenda');
    container.innerHTML = '';

    if (produtosDaVenda.length === 0) {
        container.innerHTML = `
            <div class="empty-state-produtos">
                <span class="empty-icon">🛒</span>
                <p>Nenhum produto adicionado</p>
                <p class="empty-hint">Preencha os dados acima e clique em adicionar</p>
            </div>
        `;
        atualizarContadorProdutos();
        atualizarProgressoVenda();
        return;
    }

    produtosDaVenda.forEach((produto, index) => {
        const div = document.createElement('div');
        div.className = 'produto-item-novo';

        const capaceteInfo = produto.capacete === 'sim'
            ? ` • 🪖 ${produto.corCapacete || 'Capacete'}`
            : '';

        div.innerHTML = `
            <div class="produto-info">
                <div class="produto-modelo">🏍️ ${produto.modelo} - ${produto.cor}</div>
                <div class="produto-detalhes">
                    ${produto.chassi ? `Chassi: ${produto.chassi}` : ''}
                    ${produto.motor ? ` • Motor: ${produto.motor}` : ''}
                    ${capaceteInfo}
                </div>
            </div>
            <div class="produto-preco">R$ ${formatarValorMonetario(produto.preco)}</div>
            <button class="btn-remover-produto" onclick="removerProduto(${index})">✕</button>
        `;
        container.appendChild(div);
    });

    atualizarContadorProdutos();
    atualizarProgressoVenda();
}

function removerProduto(index) {
    produtosDaVenda.splice(index, 1);
    atualizarListaProdutosUI();
    calcularTotal();
}

function calcularTotal() {
    const totalProdutos = produtosDaVenda.reduce((acc, produto) => acc + produto.preco, 0);
    const valorFrete = obterValorNumerico('valorFrete');
    const total = totalProdutos + valorFrete;
    document.getElementById('totalVenda').textContent = `R$ ${formatarValorMonetario(total)}`;
    document.getElementById('totalVenda').style.color = '';
    calcularTotalFormasPagamento();
}

async function registrarVenda(event) {
    event.preventDefault();

    try {
        if (produtosDaVenda.length === 0) {
            mostrarFeedback('Adicione pelo menos um produto à venda', 'erro');
            return;
        }

        const form = event.target;

        // Expandir todas as seções para validação
        document.querySelectorAll('.secao-form-nova.collapsed').forEach(secao => {
            secao.classList.remove('collapsed');
        });

        if (!form.checkValidity()) {
            form.reportValidity(); // Mostra mensagens de validação nativas
            mostrarFeedback('Preencha todos os campos obrigatórios', 'erro');
            return;
        }
    
    const lojaId = document.getElementById('lojaVenda').value;
    const nomeLoja = dadosLojas[lojaId]?.nome || lojaId;

    const venda = {
        id: `VNDA-${Date.now()}`,
        loja: nomeLoja,
        vendedor: document.getElementById('vendedor').value,
        dataVenda: document.getElementById('dataVenda').value,
        cliente: {
            nome: document.getElementById('nomeCliente').value,
            cpf: document.getElementById('cpfCliente').value,
            cnpj: document.getElementById('cnpjCliente').value,
            telefone: document.getElementById('telefoneCliente').value,
            endereco: {
                cep: document.getElementById('cepCliente').value,
                rua: document.getElementById('ruaCliente').value,
                numero: document.getElementById('numeroCliente').value,
                bairro: document.getElementById('bairroCliente').value,
                cidade: document.getElementById('cidadeCliente').value,
                estado: document.getElementById('estadoCliente').value,
            }
        },
        produtos: produtosDaVenda,
        pagamento: {
            formas: Array.from(document.querySelectorAll('input[name="pagamento"]:checked')).map(cb => cb.value),
            valores: obterValoresFormasPagamento(),
            parcelas: document.getElementById('parcelasCredito').value,
            outros: document.getElementById('outrosPagamentoTexto').value,
            observacoes: document.getElementById('observacoesPagamento').value
        },
        entrega: {
            tipo: document.getElementById('tipoEntrega').value,
            prazo: document.getElementById('prazoEntrega').value,
            origem: document.getElementById('origemProduto').value,
            localSaida: document.getElementById('origemProduto').value === 'propria_loja'
                ? lojaId
                : document.getElementById('lojaSaida').value
        },
        valorFrete: obterValorNumerico('valorFrete'),
        total: produtosDaVenda.reduce((acc, produto) => acc + produto.preco, 0) + obterValorNumerico('valorFrete')
    };

    const vendasSalvas = JSON.parse(localStorage.getItem('vendas') || '[]');
    vendasSalvas.push(venda);
    localStorage.setItem('vendas', JSON.stringify(vendasSalvas));

    const sucessoAutomacao = await enviarParaAutomacao('vendas', venda);
    mostrarStatusAutomacao(sucessoAutomacao);

    ultimaVendaRegistrada = venda;
    atualizarStatusBling(); // Habilita o botão Enviar para Bling
    mostrarResumoModal(venda);

    // Não limpa automaticamente o formulário para permitir usar copiar/enviar fatura
    // O usuário pode usar o botão "Limpar Formulário" quando desejar

    } catch (error) {
        console.error('Erro ao registrar venda:', error);
        mostrarFeedback('Erro ao registrar venda. Verifique o console.', 'erro');
    }
}

// --- LÓGICA DE INVENTÁRIO ---

function adicionarItemInventario(event) {
    event.preventDefault();

    const tipoItem = document.getElementById('tipoItem').value;

    const item = {
        id: Date.now(),
        operacao: 'inventario',
        tipoItem: tipoItem,
        quantidade: parseInt(document.getElementById('quantidadeInventario').value) || 1,
        data: new Date().toISOString(),
    };

    // Se for moto, adiciona modelo, cor, chassi e motor
    if (tipoItem === 'moto') {
        item.modelo = document.getElementById('modeloInventario').value;
        item.cor = document.getElementById('corInventario').value;
        item.chassi = document.getElementById('chassiInventario').value;
        item.motor = document.getElementById('motorInventario').value;

        if (!item.modelo || !item.cor) {
            mostrarFeedback('Preencha o modelo e a cor da moto', 'erro');
            return;
        }
    }

    if (item.quantidade < 1) {
        mostrarFeedback('A quantidade deve ser no mínimo 1', 'erro');
        return;
    }

    itensInventario.push(item);
    atualizarListaInventarioUI();

    // Limpar campos mas manter tipo de item selecionado
    document.getElementById('modeloInventario').value = '';
    document.getElementById('corInventario').value = '';
    document.getElementById('chassiInventario').value = '';
    document.getElementById('motorInventario').value = '';
    document.getElementById('quantidadeInventario').value = 1;

    // Mostrar feedback de sucesso
    const itemNome = tipoItem === 'capacete' ? 'Capacete' : item.modelo;
    mostrarFeedback(`${item.quantidade}x ${itemNome} adicionado ao inventário!`, 'sucesso');
}

function atualizarListaInventarioUI() {
    const container = document.getElementById('listaInventarioAtual');
    const contador = document.getElementById('contadorInventario');
    const btnFinalizar = document.getElementById('finalizarInventario');
    const btnCopiar = document.getElementById('copiarResumoInventario');

    const totalItens = itensInventario.reduce((acc, item) => acc + item.quantidade, 0);
    contador.textContent = totalItens;
    container.innerHTML = '';

    if (itensInventario.length === 0) {
        container.innerHTML = `
            <div class="empty-state-novo">
                <span class="empty-icon">📭</span>
                <p id="mensagemVaziaInventario">Nenhum item registrado ainda</p>
                <p class="empty-hint">Selecione uma aba acima e adicione itens</p>
            </div>
        `;
        btnFinalizar.disabled = true;
        btnCopiar.disabled = true;
        return;
    }

    btnFinalizar.disabled = false;
    btnCopiar.disabled = false;

    itensInventario.forEach((item, index) => {
        const div = document.createElement('div');
        const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR');

        if (item.operacao === 'inventario') {
            div.className = 'item-card-novo';
            const icone = item.tipoItem === 'capacete' ? '🪖' : '🏍️';
            const titulo = item.tipoItem === 'capacete'
                ? `${item.quantidade}x Capacete`
                : `${item.quantidade}x ${item.modelo} (${item.cor})`;
            const detalhes = item.tipoItem === 'capacete'
                ? `Contagem • ${dataFormatada}`
                : `${item.chassi ? `Chassi: ${item.chassi} • ` : ''}${dataFormatada}`;

            div.innerHTML = `
                <div class="item-icon">${icone}</div>
                <div class="item-info">
                    <div class="item-titulo">${titulo}</div>
                    <div class="item-detalhes">${detalhes}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-remover-item" onclick="removerItemInventario(${index})">Remover</button>
                </div>
            `;
        } else {
            const tipoClasse = item.tipo === 'entrada' ? 'entrada' : 'saida';
            div.className = `item-card-novo ${tipoClasse}`;
            const icone = item.tipo === 'entrada' ? '📥' : '📤';
            const tipoTexto = item.tipo === 'entrada' ? 'Entrada' : 'Saída';
            const itemIcone = item.tipoItem === 'capacete' ? '🪖' : '🏍️';
            const titulo = item.tipoItem === 'capacete'
                ? `${item.quantidade}x Capacete`
                : `${item.quantidade}x ${item.modelo} (${item.cor})`;
            const detalhes = item.tipoItem === 'capacete'
                ? `${item.motivo} • ${dataFormatada}`
                : `${item.chassi ? `Chassi: ${item.chassi} • ` : ''}${item.motivo} • ${dataFormatada}`;

            div.innerHTML = `
                <div class="item-icon">${itemIcone}</div>
                <div class="item-info">
                    <div class="item-titulo">
                        <span class="item-badge ${tipoClasse}">${icone} ${tipoTexto}</span>
                        ${titulo}
                    </div>
                    <div class="item-detalhes">${detalhes}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-remover-item" onclick="removerItemInventario(${index})">Remover</button>
                </div>
            `;
        }

        container.appendChild(div);
    });
}

function removerItemInventario(index) {
    itensInventario.splice(index, 1);
    atualizarListaInventarioUI();
}

// ========================================
// NOVO SISTEMA DE ABAS E INVENTÁRIO
// ========================================

function mudarAbaInventario(aba) {
    abaAtualInventario = aba;

    // Atualizar botões de aba
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === aba) {
            btn.classList.add('active');
        }
    });

    // Atualizar conteúdo das abas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${aba}`).classList.add('active');

    // Atualizar o campo hidden de tipo de operação
    const tipoOperacaoInput = document.getElementById('tipoOperacao');
    if (tipoOperacaoInput) {
        tipoOperacaoInput.value = aba === 'contagem' ? 'inventario' : 'movimentacao';
    }
}

function selecionarTipoItem(tipo) {
    // Atualizar botões
    document.querySelectorAll('.tipo-item-selector:not(.mov) .tipo-item-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tipo === tipo) {
            btn.classList.add('active');
        }
    });

    // Atualizar campo hidden
    document.getElementById('tipoItem').value = tipo;

    // Mostrar/ocultar campos de moto
    const camposMoto = document.getElementById('camposMoto');
    if (tipo === 'capacete') {
        camposMoto.style.display = 'none';
    } else {
        camposMoto.style.display = 'block';
    }
}

function selecionarTipoItemMov(tipo) {
    // Atualizar botões
    document.querySelectorAll('.tipo-item-selector.mov .tipo-item-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tipo === tipo) {
            btn.classList.add('active');
        }
    });

    // Atualizar campo hidden
    document.getElementById('tipoItemMov').value = tipo;

    // Mostrar/ocultar campos de moto na movimentação
    const camposMotoMov = document.getElementById('camposMotoMov');
    if (tipo === 'capacete') {
        camposMotoMov.style.display = 'none';
    } else {
        camposMotoMov.style.display = 'block';
    }
}

function selecionarTipoMovimentacao(tipo) {
    tipoMovimentacaoSelecionado = tipo;

    // Atualizar botões visuais
    document.querySelectorAll('.mov-tipo-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tipo === tipo) {
            btn.classList.add('active');
        }
    });

    // Atualizar campo hidden
    document.getElementById('tipoMovimentacaoHidden').value = tipo;

    // Habilitar botão de submit
    const btnSubmit = document.getElementById('btnSubmitMovimentacao');
    if (btnSubmit) {
        btnSubmit.disabled = false;
    }
}

function selecionarMotivo(motivo) {
    const motivoInput = document.getElementById('motivoMovimentacao');
    motivoInput.value = motivo;

    // Atualizar visual dos botões de motivo
    document.querySelectorAll('.motivo-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(motivo.split(' ')[0])) {
            btn.classList.add('active');
        }
    });
}

function alterarQuantidade(delta) {
    const input = document.getElementById('quantidadeInventario');
    let valor = parseInt(input.value) || 1;
    valor = Math.max(1, valor + delta);
    input.value = valor;
}

function alterarQuantidadeMov(delta) {
    const input = document.getElementById('quantidadeMovimentacao');
    let valor = parseInt(input.value) || 1;
    valor = Math.max(1, valor + delta);
    input.value = valor;
}

function adicionarItemMovimentacao(event) {
    event.preventDefault();

    const tipoMovimentacao = document.getElementById('tipoMovimentacaoHidden').value;
    const tipoItem = document.getElementById('tipoItemMov').value;
    const motivo = document.getElementById('motivoMovimentacao').value;

    if (!tipoMovimentacao) {
        mostrarFeedback('Selecione o tipo de movimentação (Entrada ou Saída)', 'erro');
        return;
    }

    if (!motivo) {
        mostrarFeedback('Informe o motivo da movimentação', 'erro');
        return;
    }

    const item = {
        id: Date.now(),
        operacao: 'movimentacao',
        tipo: tipoMovimentacao,
        tipoItem: tipoItem,
        motivo: motivo,
        quantidade: parseInt(document.getElementById('quantidadeMovimentacao').value) || 1,
        data: new Date().toISOString(),
    };

    // Se for moto, adiciona modelo, cor, chassi e motor
    if (tipoItem === 'moto') {
        item.modelo = document.getElementById('modeloMovimentacao').value;
        item.cor = document.getElementById('corMovimentacao').value;
        item.chassi = document.getElementById('chassiMovimentacao').value;
        item.motor = document.getElementById('motorMovimentacao').value;

        if (!item.modelo || !item.cor) {
            mostrarFeedback('Preencha o modelo e a cor da moto', 'erro');
            return;
        }
    }

    itensInventario.push(item);
    atualizarListaInventarioUI();
    limparFormularioMovimentacao();
    mostrarFeedback(`${tipoMovimentacao === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`, 'sucesso');
}

function limparFormularioMovimentacao() {
    document.getElementById('movimentacaoForm').reset();
    document.getElementById('quantidadeMovimentacao').value = 1;
    document.getElementById('tipoMovimentacaoHidden').value = '';
    tipoMovimentacaoSelecionado = '';

    // Resetar visual dos botões
    document.querySelectorAll('.mov-tipo-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.motivo-btn').forEach(btn => btn.classList.remove('active'));

    // Desabilitar botão de submit
    const btnSubmit = document.getElementById('btnSubmitMovimentacao');
    if (btnSubmit) {
        btnSubmit.disabled = true;
    }

    // Resetar tipo de item para moto
    selecionarTipoItemMov('moto');
}

function mostrarFeedback(mensagem, tipo) {
    // Remove feedback anterior se existir
    const feedbackAnterior = document.querySelector('.feedback-toast');
    if (feedbackAnterior) {
        feedbackAnterior.remove();
    }

    const toast = document.createElement('div');
    toast.className = `feedback-toast ${tipo}`;
    toast.innerHTML = `
        <span class="feedback-icon">${tipo === 'sucesso' ? '✅' : '⚠️'}</span>
        <span class="feedback-msg">${mensagem}</span>
    `;
    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Remover após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// NOVO SISTEMA DE VENDAS - FUNÇÕES
// ========================================

// Toggle de seções colapsáveis
function toggleSecao(header) {
    const secao = header.closest('.secao-form-nova');
    secao.classList.toggle('collapsed');
}

// Atualizar indicador de progresso
function atualizarProgressoVenda() {
    const steps = document.querySelectorAll('.progress-step');

    // Step 1: Informações da Venda
    const loja = document.getElementById('lojaVenda').value;
    const vendedor = document.getElementById('vendedor').value;
    if (loja && vendedor) {
        steps[0].classList.add('completed');
    } else {
        steps[0].classList.remove('completed');
    }

    // Step 2: Cliente
    const nome = document.getElementById('nomeCliente').value;
    const telefone = document.getElementById('telefoneCliente').value;
    if (nome && telefone) {
        steps[1].classList.add('completed');
    } else {
        steps[1].classList.remove('completed');
    }

    // Step 3: Produto
    if (produtosDaVenda.length > 0) {
        steps[2].classList.add('completed');
    } else {
        steps[2].classList.remove('completed');
    }

    // Step 4: Pagamento
    const pagamentoSelecionado = document.querySelectorAll('input[name="pagamento"]:checked').length > 0;
    if (pagamentoSelecionado) {
        steps[3].classList.add('completed');
    } else {
        steps[3].classList.remove('completed');
    }

    // Atualizar step ativo baseado no foco
    updateActiveStep();
}

function updateActiveStep() {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach(step => step.classList.remove('active'));

    // Encontrar primeiro step não completado
    for (let i = 0; i < steps.length; i++) {
        if (!steps[i].classList.contains('completed')) {
            steps[i].classList.add('active');
            return;
        }
    }
    // Se todos completados, marcar último como ativo
    steps[steps.length - 1].classList.add('active');
}

// Máscaras para campos
function aplicarMascaras() {
    // Máscara CPF
    const cpfInput = document.getElementById('cpfCliente');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        });
    }

    // Máscara CNPJ
    const cnpjInput = document.getElementById('cnpjCliente');
    if (cnpjInput) {
        cnpjInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 14) value = value.slice(0, 14);
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }

    // Máscara Telefone
    const telefoneInput = document.getElementById('telefoneCliente');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length > 10) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
            } else if (value.length > 6) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
            }
            e.target.value = value;
        });
    }

    // Máscara CEP
    const cepInput = document.getElementById('cepCliente');
    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 8) value = value.slice(0, 8);
            value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }
}

// Toggle Capacete Visual
function toggleCapaceteVisual() {
    const checkbox = document.getElementById('acompanhaCapaceteCheck');
    const container = document.getElementById('corCapaceteContainer');
    const hiddenInput = document.getElementById('acompanhaCapacete');

    if (checkbox.checked) {
        container.style.display = 'block';
        hiddenInput.value = 'sim';
    } else {
        container.style.display = 'none';
        hiddenInput.value = 'nao';
        document.getElementById('corCapacete').value = '';
    }
}

// Selecionar tipo de entrega
function selecionarTipoEntrega(tipo) {
    // Atualizar cards visuais
    document.querySelectorAll('.entrega-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.tipo === tipo) {
            card.classList.add('active');
        }
    });

    // Atualizar input hidden
    document.getElementById('tipoEntrega').value = tipo;

    // Trigger handleTipoEntregaChange se existir
    handleTipoEntregaChange();
}

// Selecionar parcelas
function selecionarParcelas(parcelas) {
    // Atualizar botões visuais
    document.querySelectorAll('.parcela-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.parcelas === parcelas.toString()) {
            btn.classList.add('active');
        }
    });

    // Atualizar input hidden
    document.getElementById('parcelasCredito').value = parcelas;
}

// Configurar listeners dos cards de pagamento
function configurarPagamentoCards() {
    document.querySelectorAll('.pagamento-card input').forEach(input => {
        input.addEventListener('change', function() {
            handlePagamentoChange();
            atualizarProgressoVenda();

            // Mostrar info do PIX se selecionado
            const pixInfo = document.getElementById('pixInfoCard');
            const pixChecked = document.querySelector('input[name="pagamento"][value="pix"]').checked;
            if (pixInfo) {
                pixInfo.style.display = pixChecked ? 'block' : 'none';
            }
        });
    });

    // Configurar botões de parcelas
    document.querySelectorAll('.parcela-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selecionarParcelas(parseInt(this.dataset.parcelas));
        });
    });

    // Selecionar 1x por padrão
    selecionarParcelas(1);
}

// Atualizar contador de produtos
function atualizarContadorProdutos() {
    const contador = document.getElementById('produtosCounter');
    if (contador) {
        const numero = contador.querySelector('.counter-number');
        if (numero) {
            numero.textContent = produtosDaVenda.length;
        }
    }
}

// Inicializar funcionalidades do formulário de vendas
function inicializarVendasNovo() {
    aplicarMascaras();
    configurarPagamentoCards();

    // Listeners para atualizar progresso
    ['lojaVenda', 'vendedor', 'nomeCliente', 'telefoneCliente'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', atualizarProgressoVenda);
            el.addEventListener('input', atualizarProgressoVenda);
        }
    });

    // Inicializar progresso
    atualizarProgressoVenda();
}

async function finalizarInventario() {
    const lojaId = document.getElementById('lojaInventario').value;
    if (!lojaId) {
        alert('Por favor, selecione a loja do inventário.');
        return;
    }
    if (itensInventario.length === 0) {
        alert('Adicione itens antes de finalizar o inventário.');
        return;
    }
    
    const nomeLoja = dadosLojas[lojaId]?.nome || lojaId;
    const totalItens = itensInventario.reduce((acc, item) => acc + item.quantidade, 0);

    const inventarioFinalizado = {
        id: `INV-${Date.now()}`,
        loja: nomeLoja,
        data: new Date().toISOString(),
        totalItens: totalItens,
        itens: itensInventario
    };
    
    const inventariosSalvos = JSON.parse(localStorage.getItem('inventarios') || '[]');
    inventariosSalvos.push(inventarioFinalizado);
    localStorage.setItem('inventarios', JSON.stringify(inventariosSalvos));

    alert(`Inventário com ${totalItens} itens finalizado e salvo!`);
    
    const sucessoAutomacao = await enviarParaAutomacao('inventario', inventarioFinalizado);
    mostrarStatusAutomacao(sucessoAutomacao);

    limparFormularioInventario();
}

// --- FUNÇÕES DE CARREGAR INVENTÁRIO ---

function carregarUltimoInventario() {
    const inventariosSalvos = JSON.parse(localStorage.getItem('inventarios') || '[]');

    if (inventariosSalvos.length === 0) {
        alert('Nenhum inventário salvo encontrado.');
        return;
    }

    // Pega o último inventário (mais recente)
    const ultimoInventario = inventariosSalvos[inventariosSalvos.length - 1];
    carregarInventarioDados(ultimoInventario);
}

function carregarInventarioDados(inventario) {
    // Confirma com o usuário
    const dataInventario = new Date(inventario.data).toLocaleDateString('pt-BR');
    const confirma = confirm(
        `Deseja carregar o inventário da loja "${inventario.loja}" de ${dataInventario}?\n\n` +
        `Total de itens: ${inventario.totalItens}\n\n` +
        `Isso irá adicionar todos os itens ao inventário atual.`
    );

    if (!confirma) return;

    // Limpa o inventário atual se necessário
    if (itensInventario.length > 0) {
        const limpar = confirm('Deseja limpar o inventário atual antes de carregar?');
        if (limpar) {
            itensInventario = [];
        }
    }

    // Carrega os itens do inventário salvo
    inventario.itens.forEach(item => {
        itensInventario.push({...item}); // Clona o item
    });

    // Atualiza a interface
    atualizarListaInventarioUI();

    alert(`Inventário carregado com sucesso!\n${inventario.totalItens} itens adicionados.`);
}

function mostrarHistoricoInventario() {
    const inventariosSalvos = JSON.parse(localStorage.getItem('inventarios') || '[]');

    if (inventariosSalvos.length === 0) {
        alert('Nenhum inventário salvo encontrado.');
        return;
    }

    // Inverte para mostrar os mais recentes primeiro e pega os últimos 15
    const inventariosRecentes = inventariosSalvos.slice().reverse().slice(0, 15);

    const modal = document.getElementById('modalHistoricoInventario');
    const lista = document.getElementById('listaHistoricoInventario');

    let html = '';

    inventariosRecentes.forEach((inv, index) => {
        const data = new Date(inv.data).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const indexReal = inventariosSalvos.length - 1 - index;

        html += `
            <div class="historico-item-card" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; cursor: pointer; transition: background 0.2s;"
                 onmouseover="this.style.background='#f0f0f0'"
                 onmouseout="this.style.background='white'"
                 onclick="carregarInventarioPorIndice(${indexReal})">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="font-size: 16px;">🏪 ${inv.loja}</strong>
                        <div style="color: #666; margin-top: 5px;">
                            📅 ${data}
                        </div>
                        <div style="color: #666; margin-top: 3px;">
                            📦 ${inv.totalItens} itens
                        </div>
                    </div>
                    <div style="background: #007bff; color: white; padding: 8px 15px; border-radius: 5px; font-weight: bold;">
                        Carregar
                    </div>
                </div>
            </div>
        `;
    });

    if (inventariosSalvos.length > 15) {
        html += `<p style="text-align: center; color: #666; margin-top: 15px;">Mostrando os 15 inventários mais recentes de ${inventariosSalvos.length} total.</p>`;
    }

    lista.innerHTML = html;
    modal.style.display = 'flex';
}

function fecharModalHistorico() {
    document.getElementById('modalHistoricoInventario').style.display = 'none';
}

function carregarInventarioPorIndice(indice) {
    const inventariosSalvos = JSON.parse(localStorage.getItem('inventarios') || '[]');
    const inventario = inventariosSalvos[indice];

    if (inventario) {
        fecharModalHistorico();
        carregarInventarioDados(inventario);
    } else {
        alert('Erro ao carregar inventário.');
    }
}

// --- FUNÇÕES DE BACKUP E RESTAURAÇÃO ---

function exportarInventarios() {
    const inventariosSalvos = JSON.parse(localStorage.getItem('inventarios') || '[]');

    if (inventariosSalvos.length === 0) {
        alert('Nenhum inventário para exportar.');
        return;
    }

    const dataExportacao = new Date().toISOString().split('T')[0];
    const dados = {
        versao: 'NXT V3.3',
        dataExportacao: new Date().toISOString(),
        totalInventarios: inventariosSalvos.length,
        inventarios: inventariosSalvos
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-inventarios-${dataExportacao}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Backup realizado com sucesso!\n${inventariosSalvos.length} inventários exportados.`);
}

function importarInventarios(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);

            if (!dados.inventarios || !Array.isArray(dados.inventarios)) {
                alert('Arquivo inválido! O arquivo deve conter inventários no formato correto.');
                return;
            }

            const confirma = confirm(
                `Deseja restaurar ${dados.inventarios.length} inventários do backup?\n\n` +
                `Data do backup: ${new Date(dados.dataExportacao).toLocaleDateString('pt-BR')}\n` +
                `Versão: ${dados.versao || 'Não especificada'}\n\n` +
                `ATENÇÃO: Escolha uma opção:\n` +
                `OK = Mesclar com inventários existentes\n` +
                `Cancelar = Não importar`
            );

            if (!confirma) return;

            const inventariosAtuais = JSON.parse(localStorage.getItem('inventarios') || '[]');
            const inventariosMesclados = [...inventariosAtuais, ...dados.inventarios];

            localStorage.setItem('inventarios', JSON.stringify(inventariosMesclados));

            alert(`Inventários restaurados com sucesso!\n${dados.inventarios.length} inventários importados.\nTotal agora: ${inventariosMesclados.length}`);

            // Limpa o input para permitir reimportar o mesmo arquivo
            event.target.value = '';

        } catch (error) {
            alert('Erro ao ler arquivo! Verifique se o arquivo é válido.\n\nDetalhes: ' + error.message);
        }
    };

    reader.readAsText(file);
}

// --- FUNÇÕES DE CÓPIA E MODAL ---

function gerarTextoResumoVenda(venda) {
    const dataFormatada = new Date(venda.dataVenda).toLocaleDateString('pt-BR', {timeZone: 'UTC'});

    let resumo = `=== SISTEMA NXT V3.3 ===\n🏍️ *RESUMO DA VENDAS - ${venda.loja}*\n`;
    resumo += `*Vendedor:* ${venda.vendedor}\n`;
    resumo += `*Data:* ${dataFormatada}\n\n`;
    
    resumo += `👤 *CLIENTE*\n`;
    resumo += `*Nome:* ${venda.cliente.nome}\n`;
    resumo += `*Telefone:* ${venda.cliente.telefone}\n`;
    if (venda.cliente.cpf) resumo += `*CPF:* ${venda.cliente.cpf}\n`;
    if (venda.cliente.cnpj) resumo += `*CNPJ:* ${venda.cliente.cnpj}\n`;
    const end = venda.cliente.endereco;
    const endereco = `${end.rua}, ${end.numero} - ${end.bairro}, ${end.cidade}/${end.estado} - CEP: ${end.cep}`;
    resumo += `*Endereço:* ${endereco}\n\n`;

    resumo += `📦 *PRODUTOS*\n`;
    venda.produtos.forEach(p => {
        resumo += `- ${p.modelo} ${p.cor}\n`;
        if (p.chassi) resumo += `  *Chassi:* ${p.chassi}\n`;
        if (p.motor) resumo += `  *Motor:* ${p.motor}\n`;
        resumo += `  *Capacete:* ${p.capacete === 'sim' ? `Sim (${p.corCapacete || 'Cor não informada'})` : 'Não'}\n`;
        resumo += `  *Valor:* R$ ${formatarValorMonetario(p.preco)}\n`;
    });
    resumo += `\n`;

    resumo += `💳 *PAGAMENTO*\n`;
    
    if (venda.pagamento.valores && Object.keys(venda.pagamento.valores).length > 0) {
        const formasPagamento = [];
        for (const [forma, valor] of Object.entries(venda.pagamento.valores)) {
            const nomeForma = forma === 'pos' ? 'PIX POS' : forma === 'pix' ? 'PIX' : forma === 'debito' ? 'DÉBITO' : forma === 'credito' ? 'CRÉDITO' : forma.toUpperCase();
            formasPagamento.push(`${nomeForma}: R$ ${formatarValorMonetario(valor)}`);
        }
        resumo += formasPagamento.join(' | ') + '\n';
    } else {
        resumo += `*Formas:* ${venda.pagamento.formas.map(f => f === 'pos' ? 'PIX POS' : f.toUpperCase()).join(', ')}\n`;
    }
    
    if (venda.pagamento.formas.includes('credito')) {
        resumo += `*Parcelas:* ${venda.pagamento.parcelas}x\n`;
    }
    
    
    if (venda.pagamento.observacoes) {
        resumo += `*Observações:* ${venda.pagamento.observacoes}\n`;
    }
    
    if (venda.valorFrete && venda.valorFrete > 0) {
        resumo += `*Frete:* R$ ${formatarValorMonetario(venda.valorFrete)}\n`;
    }
    
    resumo += `*TOTAL:* R$ ${formatarValorMonetario(venda.total)}\n\n`;

    resumo += `🚚 *ENTREGA*\n`;
    const tipoEntregaValue = document.getElementById('tipoEntrega').value;
    const tipoEntregaTexto = tipoEntregaValue === 'retirada' ? 'Retirado pelo Cliente' : 'Receber em Casa';
    resumo += `*Tipo:* ${tipoEntregaTexto}\n`;
    if (venda.entrega.prazo) {
        resumo += `*Prazo:* ${new Date(venda.entrega.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}\n`;
    }
    if (venda.entrega.tipo === 'domicilio') {
        const origemSelect = document.getElementById('origemProduto');
        resumo += `*Origem:* ${origemSelect.options[origemSelect.selectedIndex].text}\n`;
        if (venda.entrega.origem === 'outro_lugar') {
            const localSaidaSelect = document.getElementById('lojaSaida');
            resumo += `*Local de Saída:* ${localSaidaSelect.options[localSaidaSelect.selectedIndex].text}\n`;
        }
    } else if (venda.entrega.tipo === 'retirada') {
        // Mostra onde será a retirada (qual loja)
        const lojaRetirada = dadosLojas[venda.entrega.localSaida]?.nome || venda.loja;
        resumo += `*Local de Retirada:* ${lojaRetirada}\n`;
    }
    resumo += `\n`;
    
    return resumo;
}

function copiarResumoVenda(isFromModal) {
    try {
        let textoParaCopiar = '';
        if (isFromModal) {
            textoParaCopiar = ultimoResumoVenda;
        } else {
            if (produtosDaVenda.length === 0) {
                mostrarFeedback('Adicione produtos à venda para gerar um resumo', 'erro');
                return;
            }
            const lojaId = document.getElementById('lojaVenda').value;
            const nomeLoja = dadosLojas[lojaId]?.nome || lojaId;
            const vendaTemporaria = {
                loja: nomeLoja,
                vendedor: document.getElementById('vendedor').value,
                dataVenda: document.getElementById('dataVenda').value,
                cliente: {
                    nome: document.getElementById('nomeCliente').value,
                    telefone: document.getElementById('telefoneCliente').value,
                    cpf: document.getElementById('cpfCliente').value,
                    cnpj: document.getElementById('cnpjCliente').value,
                    endereco: {
                        rua: document.getElementById('ruaCliente').value,
                        numero: document.getElementById('numeroCliente').value,
                        bairro: document.getElementById('bairroCliente').value,
                        cidade: document.getElementById('cidadeCliente').value,
                        estado: document.getElementById('estadoCliente').value,
                        cep: document.getElementById('cepCliente').value
                    }
                },
                produtos: produtosDaVenda,
                pagamento: {
                    formas: Array.from(document.querySelectorAll('input[name="pagamento"]:checked')).map(cb => cb.value),
                    valores: obterValoresFormasPagamento(),
                    parcelas: document.getElementById('parcelasCredito').value,
                    observacoes: document.getElementById('observacoesPagamento').value
                },
                valorFrete: obterValorNumerico('valorFrete'),
                total: produtosDaVenda.reduce((acc, produto) => acc + produto.preco, 0) + obterValorNumerico('valorFrete'),
                entrega: {
                    tipo: document.getElementById('tipoEntrega').value,
                    prazo: document.getElementById('prazoEntrega').value,
                    origem: document.getElementById('origemProduto').value,
                    localSaida: document.getElementById('origemProduto').value === 'propria_loja' ? lojaId : document.getElementById('lojaSaida').value
                }
            };
            textoParaCopiar = gerarTextoResumoVenda(vendaTemporaria);
        }

        navigator.clipboard.writeText(textoParaCopiar).then(() => {
            mostrarFeedback('Resumo copiado para a área de transferência!', 'sucesso');
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            // Fallback para método antigo
            const textArea = document.createElement('textarea');
            textArea.value = textoParaCopiar;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            mostrarFeedback('Resumo copiado!', 'sucesso');
        });
    } catch (error) {
        console.error('Erro ao copiar resumo:', error);
        mostrarFeedback('Erro ao copiar resumo. Verifique o console.', 'erro');
    }
}

function mostrarResumoModal(venda) {
    ultimoResumoVenda = gerarTextoResumoVenda(venda);
    const modal = document.getElementById('modalResumoVenda');
    const textArea = document.getElementById('textoResumoModal');
    textArea.value = ultimoResumoVenda;
    modal.style.display = 'block';
}

// --- FUNÇÕES DE FATURA ---

function gerarFatura() {
    if (!ultimaVendaRegistrada) {
        alert('Não há venda registrada para gerar fatura.');
        return;
    }

    gerarHTMLFatura(ultimaVendaRegistrada);
    document.getElementById('modalFatura').style.display = 'block';
}

function gerarHTMLFatura(venda) {
    const dataFormatada = new Date(venda.dataVenda).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    const dataEmissao = new Date().toLocaleDateString('pt-BR');

    let formasPagamentoTexto = '';
    if (venda.pagamento.valores && Object.keys(venda.pagamento.valores).length > 0) {
        const formasPagamento = [];
        for (const [forma, valor] of Object.entries(venda.pagamento.valores)) {
            const nomeForma = forma === 'pos' ? 'PIX POS' : forma === 'pix' ? 'PIX' : forma === 'debito' ? 'DÉBITO' : forma === 'credito' ? 'CRÉDITO' : forma.toUpperCase();
            formasPagamento.push(`${nomeForma}: R$ ${formatarValorMonetario(valor)}`);
        }
        formasPagamentoTexto = formasPagamento.join(', ');
    } else {
        formasPagamentoTexto = venda.pagamento.formas.map(f => f === 'pos' ? 'PIX POS' : f.toUpperCase()).join(', ');
    }

    if (venda.pagamento.formas.includes('credito')) {
        formasPagamentoTexto += ` (${venda.pagamento.parcelas}x)`;
    }

    let produtosHTML = '';
    venda.produtos.forEach(produto => {
        produtosHTML += `
            <tr>
                <td>${produto.modelo}</td>
                <td>${produto.cor}</td>
                <td>${produto.chassi || 'N/A'}</td>
                <td>${produto.motor || 'N/A'}</td>
                <td>R$ ${formatarValorMonetario(produto.preco)}</td>
            </tr>
        `;
    });

    const faturaHTML = `
        <div class="fatura-header">
            <div class="fatura-logo">
                <img src="logo nxt.png" alt="NXT Lojas Logo">
                <h3>NXT LOJAS</h3>
            </div>
            <div class="fatura-info">
                <p><strong>Data de Emissão:</strong> ${dataEmissao}</p>
                <p><strong>CNPJ:</strong> 55.099.827/0001-96</p>
                <p><strong>Razão Social:</strong> Ni Hao Comércio e Serviços Ltda</p>
            </div>
        </div>

        <h2 class="fatura-titulo">Fatura de Venda</h2>

        <div class="fatura-dados">
            <div class="fatura-secao">
                <h4>Dados da Venda</h4>
                <p><strong>ID da Venda:</strong> ${venda.id}</p>
                <p><strong>Loja:</strong> ${venda.loja}</p>
                <p><strong>Vendedor:</strong> ${venda.vendedor}</p>
                <p><strong>Data da Venda:</strong> ${dataFormatada}</p>
            </div>

            <div class="fatura-secao">
                <h4>Dados do Cliente</h4>
                <p><strong>Nome:</strong> ${venda.cliente.nome}</p>
                <p><strong>Telefone:</strong> ${venda.cliente.telefone}</p>
                ${venda.cliente.cpf ? `<p><strong>CPF:</strong> ${venda.cliente.cpf}</p>` : ''}
                ${venda.cliente.cnpj ? `<p><strong>CNPJ:</strong> ${venda.cliente.cnpj}</p>` : ''}
                <p><strong>Endereço:</strong> ${venda.cliente.endereco.rua}, ${venda.cliente.endereco.numero} - ${venda.cliente.endereco.bairro}</p>
                <p>${venda.cliente.endereco.cidade}/${venda.cliente.endereco.estado} - CEP: ${venda.cliente.endereco.cep}</p>
            </div>
        </div>

        <div class="fatura-produtos">
            <h4>Produtos/Serviços</h4>
            <table>
                <thead>
                    <tr>
                        <th>Modelo</th>
                        <th>Cor</th>
                        <th>Chassi</th>
                        <th>Motor</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${produtosHTML}
                </tbody>
            </table>
        </div>

        <div class="fatura-dados">
            <div class="fatura-secao">
                <h4>Forma de Pagamento</h4>
                <p>${formasPagamentoTexto}</p>
                ${venda.pagamento.observacoes ? `<p><strong>Observações:</strong> ${venda.pagamento.observacoes}</p>` : ''}
            </div>

            <div class="fatura-secao">
                <h4>Entrega</h4>
                <p><strong>Tipo:</strong> ${venda.entrega.tipo === 'retirada' ? 'Retirado pelo Cliente' : 'Receber em Casa'}</p>
                ${venda.entrega.prazo ? `<p><strong>Prazo:</strong> ${new Date(venda.entrega.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>` : ''}
                ${venda.valorFrete && venda.valorFrete > 0 ? `<p><strong>Frete:</strong> R$ ${formatarValorMonetario(venda.valorFrete)}</p>` : ''}
            </div>
        </div>

        <div class="fatura-total">
            TOTAL GERAL: R$ ${formatarValorMonetario(venda.total)}
        </div>

        <div class="fatura-garantia">
            <h4>Informações de Garantia do Fabricante</h4>
            <p><strong>Quadro:</strong> Garantia de 2 (dois) anos contra defeitos de fabricação, contados a partir da data da nota fiscal.</p>
            <p><strong>Motor:</strong> Garantia de 2 (dois) anos contra defeitos de fabricação, contados a partir da data da nota fiscal.</p>
            <p><strong>Bateria:</strong> Garantia de 6 (seis) meses contra defeitos de fabricação, contados a partir da data da nota fiscal.</p>
            <p><strong>Observação:</strong> As garantias acima referem-se exclusivamente a defeitos de fabricação. Danos causados por uso inadequado, acidentes ou desgaste natural não estão cobertos.</p>
            <p><strong>*IMPORTANTE:</strong> Este documento tem caráter informativo e não constitui documento fiscal para fins tributários. A nota fiscal eletrônica será emitida e enviada separadamente*</p>
        </div>

        <div class="fatura-footer">
            <p>Esta fatura foi gerada pelo Sistema NXT V3.3</p>
            <p>NXT Lojas - Soluções em Mobilidade Urbana</p>
            <p><strong>Visite nosso site:</strong> <a href="https://www.nxt.eco.br/" target="_blank">www.nxt.eco.br</a></p>
            <p><small>Para dúvidas ou suporte, entre em contato através do nosso site.</small></p>
        </div>
    `;

    document.getElementById('faturaContent').innerHTML = faturaHTML;
}

function copiarFatura() {
    if (!ultimaVendaRegistrada) {
        alert('Não há fatura para copiar.');
        return;
    }

    const textoFatura = gerarTextoFatura(ultimaVendaRegistrada);

    navigator.clipboard.writeText(textoFatura).then(() => {
        alert('Fatura copiada para a área de transferência!');
    }).catch(() => {
        alert('Erro ao copiar fatura. Tente usar Ctrl+C manualmente.');
    });
}

function gerarTextoFatura(venda) {
    const dataFormatada = new Date(venda.dataVenda).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    const dataEmissao = new Date().toLocaleDateString('pt-BR');

    let formasPagamentoTexto = '';
    if (venda.pagamento.valores && Object.keys(venda.pagamento.valores).length > 0) {
        const formasPagamento = [];
        for (const [forma, valor] of Object.entries(venda.pagamento.valores)) {
            const nomeForma = forma === 'pos' ? 'PIX POS' : forma === 'pix' ? 'PIX' : forma === 'debito' ? 'DÉBITO' : forma === 'credito' ? 'CRÉDITO' : forma.toUpperCase();
            formasPagamento.push(`${nomeForma}: R$ ${formatarValorMonetario(valor)}`);
        }
        formasPagamentoTexto = formasPagamento.join(', ');
    } else {
        formasPagamentoTexto = venda.pagamento.formas.map(f => f === 'pos' ? 'PIX POS' : f.toUpperCase()).join(', ');
    }

    if (venda.pagamento.formas.includes('credito')) {
        formasPagamentoTexto += ` (${venda.pagamento.parcelas}x)`;
    }

    let produtosTexto = '';
    venda.produtos.forEach(produto => {
        produtosTexto += `- ${produto.modelo} ${produto.cor} | Chassi: ${produto.chassi || 'N/A'} | Motor: ${produto.motor || 'N/A'} | Valor: R$ ${formatarValorMonetario(produto.preco)}\n`;
    });

    let faturaTexto = `=== NXT LOJAS ===
FATURA DE VENDA

Data de Emissão: ${dataEmissao}
CNPJ: 55.099.827/0001-96
Razão Social: Ni Hao Comércio e Serviços Ltda

DADOS DA VENDA
ID da Venda: ${venda.id}
Loja: ${venda.loja}
Vendedor: ${venda.vendedor}
Data da Venda: ${dataFormatada}

DADOS DO CLIENTE
Nome: ${venda.cliente.nome}
Telefone: ${venda.cliente.telefone}`;

    if (venda.cliente.cpf) faturaTexto += `\nCPF: ${venda.cliente.cpf}`;
    if (venda.cliente.cnpj) faturaTexto += `\nCNPJ: ${venda.cliente.cnpj}`;

    faturaTexto += `
Endereço: ${venda.cliente.endereco.rua}, ${venda.cliente.endereco.numero} - ${venda.cliente.endereco.bairro}
${venda.cliente.endereco.cidade}/${venda.cliente.endereco.estado} - CEP: ${venda.cliente.endereco.cep}

PRODUTOS/SERVIÇOS
${produtosTexto}

FORMA DE PAGAMENTO
${formasPagamentoTexto}`;

    if (venda.pagamento.observacoes) {
        faturaTexto += `\nObservações: ${venda.pagamento.observacoes}`;
    }

    faturaTexto += `

ENTREGA
Tipo: ${venda.entrega.tipo === 'retirada' ? 'Retirado pelo Cliente' : 'Receber em Casa'}`;

    if (venda.entrega.prazo) {
        faturaTexto += `\nPrazo: ${new Date(venda.entrega.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`;
    }

    if (venda.valorFrete && venda.valorFrete > 0) {
        faturaTexto += `\nFrete: R$ ${formatarValorMonetario(venda.valorFrete)}`;
    }

    faturaTexto += `

TOTAL GERAL: R$ ${formatarValorMonetario(venda.total)}

INFORMAÇÕES DE GARANTIA DO FABRICANTE

Quadro: Garantia de 2 (dois) anos contra defeitos de fabricação, contados a partir da data da nota fiscal.
Motor: Garantia de 2 (dois) anos contra defeitos de fabricação, contados a partir da data da nota fiscal.
Bateria: Garantia de 6 (seis) meses contra defeitos de fabricação, contados a partir da data da nota fiscal.

Observação: As garantias acima referem-se exclusivamente a defeitos de fabricação. Danos causados por uso inadequado, acidentes ou desgaste natural não estão cobertos.

*IMPORTANTE: Este documento tem caráter informativo e não constitui documento fiscal para fins tributários. A nota fiscal eletrônica será emitida e enviada separadamente*

Esta fatura foi gerada pelo Sistema NXT V3.3
NXT Lojas - Soluções em Mobilidade Urbana

Visite nosso site: https://www.nxt.eco.br/
Para dúvidas ou suporte, entre em contato através do nosso site.`;

    return faturaTexto;
}

function imprimirFatura() {
    window.print();
}

async function gerarPDF() {
    if (!ultimaVendaRegistrada) {
        alert('Não há fatura para gerar PDF.');
        return;
    }

    try {
        // Verificar se as bibliotecas estão carregadas
        if (typeof window.jspdf === 'undefined') {
            alert('Biblioteca jsPDF não carregada. Verifique sua conexão com a internet.');
            return;
        }

        if (typeof html2canvas === 'undefined') {
            alert('Biblioteca html2canvas não carregada. Verifique sua conexão com a internet.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const faturaElement = document.getElementById('faturaContent');

        // Garantir que o elemento da fatura existe e tem conteúdo
        if (!faturaElement || !faturaElement.innerHTML.trim()) {
            alert('Conteúdo da fatura não encontrado. Gere a fatura primeiro.');
            return;
        }

        // Usar html2canvas para capturar a fatura como imagem com configurações melhoradas
        const canvas = await html2canvas(faturaElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: faturaElement.scrollWidth,
            height: faturaElement.scrollHeight,
            logging: false,
            removeContainer: true,
            imageTimeout: 10000
        });

        const imgData = canvas.toDataURL('image/png', 0.95);

        // Criar PDF com jsPDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pdfWidth - 20; // margem de 10mm de cada lado
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 10; // margem superior

        // Adicionar a primeira página
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);

        // Adicionar páginas adicionais se necessário
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);
        }

        // Gerar nome do arquivo mais seguro
        const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        const nomeCliente = ultimaVendaRegistrada.cliente.nome.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const nomeArquivo = `Fatura_${nomeCliente}_${dataAtual}.pdf`;

        // Fazer download do PDF
        pdf.save(nomeArquivo);

        alert('PDF gerado com sucesso!');

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert(`Erro ao gerar PDF: ${error.message}. Tente novamente ou use a função de impressão.`);
    }
}

function copiarResumoInventario() {
    const lojaSelect = document.getElementById('lojaInventario');
    if (!lojaSelect.value) {
        alert('Selecione a loja.');
        return;
    }
    if (itensInventario.length === 0) {
        alert('Adicione itens para gerar um resumo.');
        return;
    }

    const lojaNome = lojaSelect.options[lojaSelect.selectedIndex].text;
    const itensInventarioOnly = itensInventario.filter(item => item.operacao === 'inventario');
    const itensMovimentacao = itensInventario.filter(item => item.operacao === 'movimentacao');

    let resumo = `=== SISTEMA NXT V3.3 ===\n`;

    // Cabeçalho
    if (itensInventarioOnly.length > 0 && itensMovimentacao.length > 0) {
        resumo += `📦 *INVENTÁRIO E MOVIMENTAÇÃO - ${lojaNome}*\n`;
    } else if (itensMovimentacao.length > 0) {
        resumo += `📦 *MOVIMENTAÇÃO - ${lojaNome}*\n`;
    } else {
        resumo += `📦 *INVENTÁRIO - ${lojaNome}*\n`;
    }

    resumo += `*Data:* ${new Date().toLocaleDateString('pt-BR')}\n`;
    resumo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // ═══════════════════════════════
    // SEÇÃO INVENTÁRIO
    // ═══════════════════════════════
    if (itensInventarioOnly.length > 0) {
        // Calcular totais
        const contagemModelos = {};
        let totalMotos = 0;
        let totalCapacetes = 0;

        itensInventarioOnly.forEach(item => {
            if (item.tipoItem === 'capacete') {
                totalCapacetes += item.quantidade;
            } else {
                const modelo = item.modelo;
                if (!contagemModelos[modelo]) {
                    contagemModelos[modelo] = 0;
                }
                contagemModelos[modelo] += item.quantidade;
                totalMotos += item.quantidade;
            }
        });

        resumo += `📋 *INVENTÁRIO*\n\n`;

        // Resumo por modelo
        if (totalMotos > 0) {
            resumo += `🏍️ *Motos: ${totalMotos} unidades*\n`;
            Object.entries(contagemModelos).forEach(([modelo, qtd]) => {
                resumo += `   • ${qtd}x ${modelo}\n`;
            });
            resumo += `\n`;
        }

        if (totalCapacetes > 0) {
            resumo += `🪖 *Capacetes: ${totalCapacetes} unidades*\n\n`;
        }

        // Discriminação detalhada
        resumo += `*DISCRIMINAÇÃO:*\n`;
        itensInventarioOnly.forEach(item => {
            if (item.tipoItem === 'capacete') {
                resumo += `• ${item.quantidade}x Capacete\n`;
            } else {
                resumo += `• ${item.quantidade}x ${item.modelo} ${item.cor}`;
                if (item.chassi) {
                    resumo += ` | Chassi: ${item.chassi}`;
                }
                resumo += `\n`;
            }
        });
        resumo += `\n`;
    }

    // ═══════════════════════════════
    // SEÇÃO MOVIMENTAÇÕES
    // ═══════════════════════════════
    if (itensMovimentacao.length > 0) {
        const itensEntrada = itensMovimentacao.filter(item => item.tipo === 'entrada');
        const itensSaida = itensMovimentacao.filter(item => item.tipo === 'saida');
        const totalEntradas = itensEntrada.reduce((acc, item) => acc + item.quantidade, 0);
        const totalSaidas = itensSaida.reduce((acc, item) => acc + item.quantidade, 0);

        resumo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        resumo += `📊 *MOVIMENTAÇÕES*\n\n`;

        // Entradas
        if (itensEntrada.length > 0) {
            resumo += `📥 *ENTRADAS (${totalEntradas} unidades):*\n`;
            itensEntrada.forEach(item => {
                if (item.tipoItem === 'capacete') {
                    resumo += `• ${item.quantidade}x Capacete - ${item.motivo}\n`;
                } else {
                    resumo += `• ${item.quantidade}x ${item.modelo} ${item.cor} - ${item.motivo}`;
                    if (item.chassi) {
                        resumo += ` | Chassi: ${item.chassi}`;
                    }
                    resumo += `\n`;
                }
            });
            resumo += `\n`;
        }

        // Saídas
        if (itensSaida.length > 0) {
            resumo += `📤 *SAÍDAS (${totalSaidas} unidades):*\n`;
            itensSaida.forEach(item => {
                if (item.tipoItem === 'capacete') {
                    resumo += `• ${item.quantidade}x Capacete - ${item.motivo}\n`;
                } else {
                    resumo += `• ${item.quantidade}x ${item.modelo} ${item.cor} - ${item.motivo}`;
                    if (item.chassi) {
                        resumo += ` | Chassi: ${item.chassi}`;
                    }
                    resumo += `\n`;
                }
            });
        }
    }

    const tipoResumo = itensMovimentacao.length > 0 ? 'movimentação' : 'inventário';
    navigator.clipboard.writeText(resumo).then(() => {
        alert(`Resumo do ${tipoResumo} copiado para a área de transferência!`);
    });
}

// --- FUNÇÕES DE PAGAMENTO ---

function obterValoresFormasPagamento() {
    const valores = {};
    ['pix', 'pos', 'dinheiro', 'debito', 'credito', 'outros'].forEach(forma => {
        const input = document.getElementById(`valor${forma.charAt(0).toUpperCase() + forma.slice(1)}`);
        if (input) {
            // Revertido para a lógica original para garantir o envio correto dos dados.
            const valorNumerico = parseFloat(input.value.replace(/[R$\s.]/g, '').replace(',', '.'));
            if (!isNaN(valorNumerico) && valorNumerico > 0) {
                valores[forma] = valorNumerico;
            }
        }
    });
    return valores;
}

function calcularTotalFormasPagamento() {
    const checkedForms = Array.from(document.querySelectorAll('input[name="pagamento"]:checked'));

    const totalProdutos = produtosDaVenda.reduce((acc, produto) => acc + produto.preco, 0);
    const valorFrete = obterValorNumerico('valorFrete');
    const totalEsperado = totalProdutos + valorFrete;

    document.getElementById('totalVenda').textContent = `R$ ${formatarValorMonetario(totalEsperado)}`;
    document.getElementById('totalVenda').style.color = '';
}

// --- FUNÇÃO DE BUSCA DE VENDEDOR ---
function configurarBuscaVendedor() {
    const vendedorInput = document.getElementById('vendedor');
    const suggestionsDiv = document.getElementById('vendedorSuggestions');

    if (!vendedorInput || !suggestionsDiv) {
        console.error('Elementos de vendedor não encontrados!');
        return;
    }

    let selectedIndex = -1;

    vendedorInput.addEventListener('input', function() {
        const valor = this.value.trim().toLowerCase();
        suggestionsDiv.innerHTML = '';
        selectedIndex = -1;

        // Verificar se dados estão carregados
        if (!dadosVendedores || dadosVendedores.length === 0) {
            suggestionsDiv.classList.remove('show');
            return;
        }

        if (valor.length < 2) {
            suggestionsDiv.classList.remove('show');
            return;
        }

        const vendedoresFiltrados = dadosVendedores.filter(vendedor =>
            vendedor.toLowerCase().includes(valor)
        );

        if (vendedoresFiltrados.length > 0) {
            vendedoresFiltrados.slice(0, 10).forEach((vendedor, index) => {
                const suggestionDiv = document.createElement('div');
                suggestionDiv.className = 'vendedor-suggestion';
                suggestionDiv.textContent = vendedor;
                suggestionDiv.addEventListener('click', () => {
                    vendedorInput.value = vendedor;
                    suggestionsDiv.classList.remove('show');
                });
                suggestionsDiv.appendChild(suggestionDiv);
            });
            suggestionsDiv.classList.add('show');
        } else {
            suggestionsDiv.classList.remove('show');
        }
    });

    vendedorInput.addEventListener('keydown', function(e) {
        const suggestions = suggestionsDiv.querySelectorAll('.vendedor-suggestion');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
            updateSelection(suggestions);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelection(suggestions);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            suggestions[selectedIndex].click();
        } else if (e.key === 'Escape') {
            suggestionsDiv.classList.remove('show');
            selectedIndex = -1;
        }
    });

    function updateSelection(suggestions) {
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('highlighted', index === selectedIndex);
        });
    }

    // Fechar sugestões ao clicar fora
    document.addEventListener('click', function(e) {
        if (!vendedorInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.classList.remove('show');
            selectedIndex = -1;
        }
    });

    vendedorInput.addEventListener('blur', function() {
        // Delay para permitir clique nas sugestões
        setTimeout(() => {
            if (!suggestionsDiv.matches(':hover')) {
                suggestionsDiv.classList.remove('show');
                selectedIndex = -1;
            }
        }, 150);
    });
}

// --- FUNÇÕES AUXILIARES E DE UI ---

function limparFormularioVenda() {
    if (produtosDaVenda.length > 0 || document.getElementById('nomeCliente').value.trim() !== '') {
        if (!confirm('Tem certeza que deseja limpar todos os dados do formulário? Esta ação não pode ser desfeita.')) {
            return;
        }
    }

    document.getElementById('vendaForm').reset();
    produtosDaVenda = [];
    ultimoResumoVenda = '';
    ultimaVendaRegistrada = null;
    document.getElementById('valorFrete').value = '';
    document.getElementById('totalVenda').textContent = 'R$ 0,00';
    document.getElementById('totalVenda').style.color = '';
    document.getElementById('vendedorSuggestions').classList.remove('show');
    atualizarListaProdutosUI();
    handleTipoEntregaChange();
    toggleCorCapacete();
    handlePagamentoChange();
    definirDataAtual();
}

function limparCamposProduto() {
    document.getElementById('modeloProduto').value = '';
    document.getElementById('corProduto').value = '';
    document.getElementById('chassiProduto').value = '';
    document.getElementById('motorProduto').value = '';
    document.getElementById('precoProduto').value = '';
    document.getElementById('acompanhaCapacete').value = 'nao';
    document.getElementById('corCapacete').value = '';

    // Resetar checkbox visual de capacete
    const capaceteCheck = document.getElementById('acompanhaCapaceteCheck');
    if (capaceteCheck) {
        capaceteCheck.checked = false;
        toggleCapaceteVisual();
    } else {
        toggleCorCapacete();
    }
}

function limparFormularioInventario() {
    // Limpar formulário de inventário (contagem)
    const inventarioForm = document.getElementById('inventarioForm');
    if (inventarioForm) inventarioForm.reset();

    // Limpar formulário de movimentação
    const movimentacaoForm = document.getElementById('movimentacaoForm');
    if (movimentacaoForm) movimentacaoForm.reset();

    // Resetar loja
    const lojaInventario = document.getElementById('lojaInventario');
    if (lojaInventario) lojaInventario.value = '';

    // Resetar quantidades
    const quantidadeInventario = document.getElementById('quantidadeInventario');
    if (quantidadeInventario) quantidadeInventario.value = 1;

    const quantidadeMovimentacao = document.getElementById('quantidadeMovimentacao');
    if (quantidadeMovimentacao) quantidadeMovimentacao.value = 1;

    // Resetar tipo de item
    const tipoItem = document.getElementById('tipoItem');
    if (tipoItem) tipoItem.value = 'moto';

    // Limpar itens
    itensInventario = [];
    atualizarListaInventarioUI();

    // Resetar para aba de contagem
    mudarAbaInventario('contagem');

    // Resetar seleções visuais
    selecionarTipoItem('moto');

    // Limpar movimentação
    limparFormularioMovimentacao();
}

function definirDataAtual() {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today - timezoneOffset)).toISOString().split('T')[0];
    document.getElementById('dataVenda').value = localISOTime;
    document.getElementById('prazoEntrega').value = localISOTime;
}

function handlePagamentoChange() {
    const checkboxes = document.querySelectorAll('input[name="pagamento"]');
    const checkedForms = Array.from(checkboxes).filter(cb => cb.checked);
    const isCredito = document.querySelector('input[name="pagamento"][value="credito"]').checked;
    const isOutros = document.querySelector('input[name="pagamento"][value="outros"]').checked;
    
    document.getElementById('parcelasGroup').style.display = isCredito ? 'block' : 'none';
    document.getElementById('outrosPagamentoGroup').style.display = isOutros ? 'block' : 'none';
    
    const valoresGroup = document.getElementById('valoresFormasPagamento');
    valoresGroup.style.display = checkedForms.length > 1 ? 'block' : 'none';
    
    ['pix', 'pos', 'dinheiro', 'debito', 'credito', 'outros'].forEach(forma => {
        const isChecked = document.querySelector(`input[name="pagamento"][value="${forma}"]`).checked;
        const group = document.getElementById(`${forma}ValorGroup`);
        if (group) {
            group.style.display = (checkedForms.length > 1 && isChecked) ? 'block' : 'none';
        }
    });
    
    calcularTotalFormasPagamento();
}

function handleTipoEntregaChange() {
    // Não é mais necessário mostrar/ocultar opções baseado no tipo de entrega
    // A seleção de origem do produto está sempre visível
    handleOrigemProdutoChange();
}

function handleOrigemProdutoChange() {
    const origem = document.getElementById('origemProduto').value;
    const lojaSaidaGroup = document.getElementById('lojaSaidaGroup');
    // Mostra o select de loja apenas quando "De outro lugar" for selecionado
    lojaSaidaGroup.style.display = origem === 'outro_lugar' ? 'block' : 'none';
}

function toggleCorCapacete() {
    const acompanha = document.getElementById('acompanhaCapacete').value;
    document.getElementById('corCapaceteContainer').style.display = acompanha === 'sim' ? 'block' : 'none';
}

// Funções antigas mantidas para compatibilidade (podem ser removidas em versões futuras)
function handleTipoItemChange() {
    // A nova interface usa selecionarTipoItem() e selecionarTipoItemMov()
    const tipoItem = document.getElementById('tipoItem');
    if (tipoItem) {
        selecionarTipoItem(tipoItem.value);
    }
}

function handleTipoOperacaoChange() {
    // A nova interface usa o sistema de abas
    // Esta função não é mais necessária mas é mantida para compatibilidade
}

function buscarCEP() {
    const cepInput = document.getElementById('cepCliente');
    const cep = cepInput.value.replace(/\D/g, '');
    const loader = document.getElementById('cepLoader');
    const status = document.getElementById('cepStatus');

    if (cep.length !== 8) return;

    // Mostrar loader
    if (loader) loader.classList.add('loading');
    if (status) {
        status.textContent = '';
        status.className = 'cep-status';
    }
    cepInput.style.backgroundColor = '#fff3cd';

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => {
            if (!res.ok) throw new Error('Erro na consulta do CEP');
            return res.json();
        })
        .then(data => {
            cepInput.style.backgroundColor = '';

            if (!data.erro) {
                document.getElementById('ruaCliente').value = data.logradouro || '';
                document.getElementById('bairroCliente').value = data.bairro || '';
                document.getElementById('cidadeCliente').value = data.localidade || '';
                document.getElementById('estadoCliente').value = data.uf || '';
                cepInput.style.backgroundColor = '#d4edda';

                if (status) {
                    status.textContent = '✓ Encontrado';
                    status.className = 'cep-status success';
                }

                // Foca no campo de número
                document.getElementById('numeroCliente').focus();
            } else {
                cepInput.style.backgroundColor = '#f8d7da';
                if (status) {
                    status.textContent = '✕ Não encontrado';
                    status.className = 'cep-status error';
                }
            }
        })
        .catch(error => {
            cepInput.style.backgroundColor = '#f8d7da';
            if (status) {
                status.textContent = '✕ Erro';
                status.className = 'cep-status error';
            }
            console.error('Erro ao buscar CEP:', error);
        })
        .finally(() => {
            // Esconder loader
            if (loader) loader.classList.remove('loading');

            // Remove cor após 3 segundos
            setTimeout(() => {
                cepInput.style.backgroundColor = '';
            }, 3000);
        });
}

// --- AUTOMAÇÃO ---

async function enviarParaAutomacao(tipo, dados) {
    const url = POWER_AUTOMATE_URLS[tipo];
    if (!url || url.includes('URL_DO_FLUXO')) {
        console.log(`Automação para '${tipo}' não configurada.`);
        return false;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        return response.ok;
    } catch (error) {
        console.error(`Erro ao enviar dados para automação (${tipo}):`, error);
        return false;
    }
}

function mostrarStatusAutomacao(sucesso) {
    const statusEl = document.getElementById('statusAutomacao');
    if (sucesso) {
        statusEl.textContent = '✔️ Salvo na Planilha';
        statusEl.style.color = '#28a745';
    } else {
        statusEl.textContent = '❌ Erro ao salvar na planilha';
        statusEl.style.color = '#dc3545';
    }
    setTimeout(() => { statusEl.textContent = ''; }, 5000);
}

// --- FORMATAÇÃO MONETÁRIA ---

function formatarMoeda(event) {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor) {
        valor = (parseInt(valor) / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        event.target.value = valor;
    }
}

function finalizarFormatacaoMoeda(event) {
    let valor = event.target.value;
    if (!valor || valor === 'R$ 0,00') {
        event.target.value = '';
    } else {
        formatarMoeda(event);
    }
}

function formatarValorMonetario(valor) {
    if (typeof valor !== 'number' || isNaN(valor)) {
        return '0,00';
    }
    
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function obterValorNumerico(elementId) {
    const input = document.getElementById(elementId);
    if (!input || !input.value) return 0;
    const valorString = input.value.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(valorString) || 0;
}

// ========================================
// INTEGRAÇÃO BLING API V3
// ========================================

// Salvar configurações do Bling
function salvarConfigBling() {
    const clientId = document.getElementById('blingClientId').value.trim();
    const clientSecret = document.getElementById('blingClientSecret').value.trim();

    if (!clientId || !clientSecret) {
        mostrarFeedback('Preencha o Client ID e Client Secret', 'erro');
        return;
    }

    localStorage.setItem('bling_client_id', clientId);
    localStorage.setItem('bling_client_secret', clientSecret);

    mostrarFeedback('Configurações salvas! Agora autorize o aplicativo.', 'sucesso');
    atualizarStatusBling();
    fecharModalBling();
}

// Iniciar fluxo de autorização OAuth do Bling
function autorizarBling() {
    if (!BLING_CONFIG.clientId || !BLING_CONFIG.clientSecret) {
        mostrarFeedback('Configure o Client ID e Secret primeiro', 'erro');
        abrirModalBling();
        return;
    }

    // Gerar state para segurança
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('bling_oauth_state', state);

    // URL de callback - será a própria página
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);

    // Montar URL de autorização
    const authUrl = `${BLING_CONFIG.authUrl}?response_type=code&client_id=${BLING_CONFIG.clientId}&redirect_uri=${redirectUri}&state=${state}`;

    // Abrir em nova janela
    const authWindow = window.open(authUrl, 'BlingAuth', 'width=600,height=700');

    // Verificar periodicamente se a janela fechou
    const checkAuth = setInterval(() => {
        if (authWindow.closed) {
            clearInterval(checkAuth);
            // Verificar se recebemos o código
            verificarCallbackBling();
        }
    }, 1000);
}

// Verificar callback do OAuth
function verificarCallbackBling() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const savedState = localStorage.getItem('bling_oauth_state');

    if (code && state === savedState) {
        // Limpar URL
        window.history.replaceState({}, document.title, window.location.pathname);
        localStorage.removeItem('bling_oauth_state');

        // Trocar código por token
        trocarCodigoPorToken(code);
    }
}

// Trocar código de autorização por access token (via API Vercel)
async function trocarCodigoPorToken(code) {
    try {
        mostrarFeedback('Obtendo token de acesso...', 'sucesso');

        const redirectUri = window.location.origin + window.location.pathname;

        const response = await fetch('/api/bling/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                client_id: BLING_CONFIG.clientId,
                client_secret: BLING_CONFIG.clientSecret
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ao obter token: ${response.status}`);
        }

        const data = await response.json();

        // Salvar tokens
        localStorage.setItem('bling_access_token', data.access_token);
        localStorage.setItem('bling_refresh_token', data.refresh_token);
        localStorage.setItem('bling_token_expiry', Date.now() + (data.expires_in * 1000));

        mostrarFeedback('Sistema conectado com sucesso!', 'sucesso');
        atualizarStatusBling();

    } catch (error) {
        console.error('Erro ao trocar código por token:', error);
        mostrarFeedback('Erro ao conectar com sistema. Tente novamente.', 'erro');
    }
}

// Renovar token de acesso (via API Vercel)
async function renovarTokenBling() {
    try {
        if (!BLING_CONFIG.refreshToken) {
            throw new Error('Refresh token não disponível');
        }

        const response = await fetch('/api/bling/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'refresh_token',
                refresh_token: BLING_CONFIG.refreshToken,
                client_id: BLING_CONFIG.clientId,
                client_secret: BLING_CONFIG.clientSecret
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao renovar token');
        }

        const data = await response.json();

        localStorage.setItem('bling_access_token', data.access_token);
        localStorage.setItem('bling_refresh_token', data.refresh_token);
        localStorage.setItem('bling_token_expiry', Date.now() + (data.expires_in * 1000));

        return true;
    } catch (error) {
        console.error('Erro ao renovar token:', error);
        return false;
    }
}

// Fazer requisição autenticada ao Bling (via API Vercel - autenticação centralizada)
async function blingRequest(endpoint, method = 'GET', body = null) {
    // Verificar se está autenticado no servidor
    if (!BLING_CONFIG.isAuthenticated) {
        await BLING_CONFIG.checkStatus();
        if (!BLING_CONFIG.isAuthenticated) {
            throw new Error('Sistema de emissão não conectado. Contate a matriz.');
        }
    }

    const response = await fetch('/api/bling/proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            endpoint: endpoint,
            method: method,
            body: body
            // access_token agora é gerenciado pelo servidor
        })
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
        console.error('Erro Bling API - Status:', response.status);
        console.error('Erro Bling API - Detalhes:', JSON.stringify(responseData, null, 2));
        throw new Error(responseData.details?.error?.message || responseData.error || `Erro ${response.status}`);
    }

    return responseData;
}

// Buscar ou criar contato no Bling
async function buscarOuCriarContato(cliente) {
    try {
        // Tentar buscar por CPF/CNPJ
        const documento = cliente.cnpj || cliente.cpf;

        if (documento) {
            const docLimpo = documento.replace(/\D/g, '');
            const busca = await blingRequest(`/contatos?numeroDocumento=${docLimpo}`);

            if (busca.data && busca.data.length > 0) {
                return busca.data[0].id;
            }
        }

        // Criar novo contato
        const tipoContato = cliente.cnpj ? 'J' : 'F'; // Jurídica ou Física
        const numeroDocumento = (cliente.cnpj || cliente.cpf || '').replace(/\D/g, '');

        const novoContato = {
            nome: cliente.nome,
            tipo: tipoContato,
            situacao: 'A',
            numeroDocumento: numeroDocumento,
            telefone: cliente.telefone.replace(/\D/g, ''),
            celular: cliente.telefone.replace(/\D/g, ''),
            email: cliente.email || '',
            endereco: {
                geral: {
                    endereco: cliente.endereco.rua,
                    numero: cliente.endereco.numero,
                    bairro: cliente.endereco.bairro,
                    municipio: cliente.endereco.cidade,
                    uf: cliente.endereco.estado,
                    cep: cliente.endereco.cep.replace(/\D/g, '')
                }
            }
        };

        const resultado = await blingRequest('/contatos', 'POST', novoContato);
        return resultado.data.id;

    } catch (error) {
        console.error('Erro ao buscar/criar contato:', error);
        throw error;
    }
}

// Enviar venda para o Bling
async function enviarVendaParaBling(venda) {
    try {
        mostrarFeedback('Enviando para emissão...', 'sucesso');

        // 1. Buscar ou criar contato
        const contatoId = await buscarOuCriarContato(venda.cliente);

        // 2. Mapear formas de pagamento do Bling
        const formaPagamentoBling = mapearFormaPagamento(venda.pagamento.formas);

        // 3. Detectar se é operação interestadual (cliente fora de SC - matriz em Santa Catarina)
        const estadoCliente = venda.cliente?.endereco?.estado?.toUpperCase() || '';
        const isInterestadual = estadoCliente && estadoCliente !== 'SC';
        const cfopSugerido = isInterestadual ? '6102' : '5102';
        console.log(`Estado cliente: ${estadoCliente}, Interestadual: ${isInterestadual}, CFOP: ${cfopSugerido}`);

        // 4. Montar itens do pedido - buscar produto no Bling
        const itensPedido = [];
        for (let i = 0; i < venda.produtos.length; i++) {
            const produto = venda.produtos[i];
            const descricaoBling = `NXT Autopropelido ${produto.modelo} ${produto.cor}`;

            // Tentar buscar produto no Bling pela descrição
            let produtoBling = null;
            try {
                const busca = await blingRequest(`/produtos?nome=${encodeURIComponent(descricaoBling)}`);
                if (busca.data && busca.data.length > 0) {
                    produtoBling = busca.data[0];
                    console.log('Produto encontrado no Bling:', produtoBling);
                }
            } catch (e) {
                console.log('Produto não encontrado no Bling, usando descrição manual');
            }

            const itemPedido = {
                descricao: descricaoBling,
                unidade: 'UN',
                quantidade: 1,
                valor: produto.preco
            };

            // Se encontrou o produto no Bling, vincular pelo ID
            if (produtoBling && produtoBling.id) {
                itemPedido.produto = { id: produtoBling.id };
                itemPedido.codigo = produtoBling.codigo || '';
                console.log(`Vinculando ao produto Bling ID: ${produtoBling.id}`);
            } else {
                itemPedido.codigo = produto.chassi || `MOTO-${i + 1}`;
            }

            itensPedido.push(itemPedido);
        }

        // 5. Adicionar frete se houver
        if (venda.valorFrete > 0) {
            itensPedido.push({
                codigo: 'FRETE',
                descricao: 'Frete',
                unidade: 'UN',
                quantidade: 1,
                valor: venda.valorFrete
            });
        }

        // 6. Montar pedido de venda
        const pedido = {
            contato: { id: contatoId },
            data: venda.dataVenda,
            numero: venda.id.replace('VNDA-', ''),
            numeroLoja: venda.id,
            vendedor: { nome: venda.vendedor },
            itens: itensPedido,
            parcelas: [{
                dataVencimento: venda.dataVenda,
                valor: venda.total
            }],
            transporte: {
                fretePorConta: venda.entrega.tipo === 'domicilio' ? 1 : 0, // 0=Emitente, 1=Destinatário
                valorFrete: venda.valorFrete || 0
            },
            observacoes: `Loja: ${venda.loja}\nVendedor: ${venda.vendedor}\nCFOP sugerido: ${cfopSugerido}${isInterestadual ? ' (interestadual - cliente ' + estadoCliente + ')' : ''}\n${venda.pagamento.observacoes || ''}`
        };

        // 7. Criar pedido de venda
        const resultadoPedido = await blingRequest('/pedidos/vendas', 'POST', pedido);
        const pedidoId = resultadoPedido.data.id;

        mostrarFeedback(`Pedido #${pedidoId} enviado! O sistema de notas recebeu seu pedido, a NF-e será gerada o mais breve possível.`, 'sucesso');

        return pedidoId;

    } catch (error) {
        console.error('Erro ao enviar para Bling:', error);
        mostrarFeedback(`Erro: ${error.message}`, 'erro');
        throw error;
    }
}

// Mapear forma de pagamento para ID do Bling
function mapearFormaPagamento(formas) {
    // IDs padrão do Bling para formas de pagamento
    const mapeamento = {
        'dinheiro': 1,      // Dinheiro
        'pix': 17,          // PIX
        'pos': 17,          // PIX (mesmo ID)
        'debito': 4,        // Cartão de Débito
        'credito': 3,       // Cartão de Crédito
        'boleto': 15,       // Boleto
        'outros': 99        // Outros
    };

    // Pegar primeira forma de pagamento
    const primeirForma = formas[0] || 'outros';
    return mapeamento[primeirForma] || 99;
}

// Gerar NF-e a partir do pedido
async function gerarNFeBling(pedidoId) {
    try {
        mostrarFeedback('Gerando NF-e...', 'sucesso');

        // Gerar nota a partir do pedido
        const resultado = await blingRequest(`/nfe/pedidos/${pedidoId}`, 'POST', {
            tipo: 1, // 1 = Saída
            finalidade: 1, // 1 = Normal
            naturezaOperacao: { id: 0 } // Usar natureza padrão
        });

        const nfeId = resultado.data.id;

        // Tentar enviar para SEFAZ
        try {
            await blingRequest(`/nfe/${nfeId}/enviar`, 'POST');
            mostrarFeedback(`NF-e #${nfeId} enviada para SEFAZ!`, 'sucesso');
        } catch (envioError) {
            mostrarFeedback(`NF-e criada (ID: ${nfeId}). Envie manualmente pelo Bling.`, 'sucesso');
        }

        return nfeId;

    } catch (error) {
        console.error('Erro ao gerar NF-e:', error);
        mostrarFeedback(`Erro ao gerar NF-e: ${error.message}`, 'erro');
    }
}

// Atualizar status visual do Bling (autenticação centralizada)
function atualizarStatusBling() {
    const statusEl = document.getElementById('blingStatus');
    const statusIcon = document.getElementById('blingStatusIcon');
    const statusText = document.getElementById('blingStatusText');
    const btnEnviar = document.getElementById('btnEnviarBling');
    const configStatus = document.getElementById('blingConfigStatus');

    // Atualizar status no footer da venda
    if (statusEl && statusIcon && statusText) {
        statusEl.classList.remove('conectado', 'erro');

        if (BLING_CONFIG.isAuthenticated) {
            statusIcon.textContent = '🟢';
            statusText.textContent = 'Emissão conectada';
            statusEl.classList.add('conectado');
            if (btnEnviar) btnEnviar.disabled = !ultimaVendaRegistrada;
        } else if (BLING_CONFIG.isConfigured) {
            statusIcon.textContent = '🟡';
            statusText.textContent = 'Aguardando autorização';
            if (btnEnviar) btnEnviar.disabled = true;
        } else {
            statusIcon.textContent = '⚪';
            statusText.textContent = 'Emissão não configurada';
            if (btnEnviar) btnEnviar.disabled = true;
        }
    }

    // Atualizar status no modal (modo centralizado - sem formulário de config)
    if (configStatus) {
        if (BLING_CONFIG.isAuthenticated) {
            configStatus.innerHTML = `
                <div class="bling-status-card conectado">
                    <span class="bling-status-icon-large">✅</span>
                    <div class="bling-status-info">
                        <h5>Sistema Conectado</h5>
                        <p>A integração está ativa e funcionando</p>
                    </div>
                </div>`;
        } else if (BLING_CONFIG.isConfigured) {
            configStatus.innerHTML = `
                <div class="bling-status-card configurado">
                    <span class="bling-status-icon-large">⚠️</span>
                    <div class="bling-status-info">
                        <h5>Aguardando Autorização</h5>
                        <p>A matriz precisa autorizar a conexão com o sistema</p>
                        <a href="/api/bling/auth" class="btn-primary" style="margin-top:10px;display:inline-block;padding:8px 16px;text-decoration:none;border-radius:4px;">Autorizar (Matriz)</a>
                    </div>
                </div>`;
        } else {
            configStatus.innerHTML = `
                <div class="bling-status-card nao-configurado">
                    <span class="bling-status-icon-large">⚙️</span>
                    <div class="bling-status-info">
                        <h5>Não Configurado</h5>
                        <p>Configure as variáveis de ambiente no Vercel (BLING_CLIENT_ID, BLING_CLIENT_SECRET)</p>
                    </div>
                </div>`;
        }
    }
}

// Abrir modal de configuração do Bling
function abrirModalBling() {
    const modal = document.getElementById('modalBling');
    if (modal) {
        // Preencher valores salvos
        const clientIdInput = document.getElementById('blingClientId');
        const clientSecretInput = document.getElementById('blingClientSecret');

        if (clientIdInput) clientIdInput.value = BLING_CONFIG.clientId;
        if (clientSecretInput) clientSecretInput.value = BLING_CONFIG.clientSecret;

        // Atualizar URL de callback
        const callbackUrl = document.getElementById('blingCallbackUrl');
        if (callbackUrl) {
            callbackUrl.textContent = window.location.origin + window.location.pathname;
        }

        // Atualizar status no modal
        atualizarStatusBling();

        modal.style.display = 'flex';
    }
}

// Fechar modal de configuração do Bling
function fecharModalBling() {
    const modal = document.getElementById('modalBling');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Desconectar do Bling
function desconectarBling() {
    if (confirm('Deseja desconectar do Bling?\n\nAs credenciais serão mantidas, apenas a sessão será encerrada.')) {
        localStorage.removeItem('bling_access_token');
        localStorage.removeItem('bling_refresh_token');
        localStorage.removeItem('bling_token_expiry');
        atualizarStatusBling();
        mostrarFeedback('Desconectado do Bling', 'sucesso');
    }
}

// Limpar todas as configurações do Bling
function limparConfigBling() {
    if (confirm('Deseja remover todas as configurações do Bling?\n\nVocê precisará configurar novamente.')) {
        localStorage.removeItem('bling_client_id');
        localStorage.removeItem('bling_client_secret');
        localStorage.removeItem('bling_access_token');
        localStorage.removeItem('bling_refresh_token');
        localStorage.removeItem('bling_token_expiry');
        atualizarStatusBling();
        mostrarFeedback('Configurações do Bling removidas', 'sucesso');
    }
}

// Enviar última venda registrada para o Bling
async function enviarUltimaVendaBling() {
    if (!ultimaVendaRegistrada) {
        mostrarFeedback('Nenhuma venda registrada para enviar', 'erro');
        return;
    }

    if (!BLING_CONFIG.isAuthenticated) {
        mostrarFeedback('Conecte ao Bling primeiro', 'erro');
        abrirModalBling();
        return;
    }

    try {
        await enviarVendaParaBling(ultimaVendaRegistrada);
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Inicializar Bling na carga da página
async function inicializarBling() {
    // Verificar status no servidor (autenticação centralizada)
    await BLING_CONFIG.checkStatus();

    // Atualizar interface
    atualizarStatusBling();

    console.log('Bling Status:', BLING_CONFIG.statusMessage);
}

// Copiar URL de callback para área de transferência
function copiarCallbackUrl() {
    const callbackUrl = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(callbackUrl).then(() => {
        mostrarFeedback('URL copiada!', 'sucesso');
    }).catch(() => {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = callbackUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        mostrarFeedback('URL copiada!', 'sucesso');
    });
}