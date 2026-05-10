// URLs para automação com Make.com (Webhook)
const POWER_AUTOMATE_URLS = {
    vendas: 'https://hook.us2.make.com/ku3pkl5io6mnh7k8tq275vhowhkcwxxo',
    inventario: 'https://hook.us2.make.com/xp9611ae67d4cf47frtwlzc9qmhafzck',
    conciliacaoCartoes: 'https://hook.us2.make.com/wjl421mft9kokf9ph3eur171yso5ds1w',
    // TODO: substituir antes do deploy — Claudia cria cenario Make.com e fornece a URL
    conciliacaoPix: 'https://hook.us2.make.com/PLACEHOLDER_AGUARDANDO_URL'
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
let dadosMatriculas = {};
let dadosFiscais = {};
let produtosDaVenda = [];
let cartoesVenda = []; // transacoes de cartao da venda atual (conciliacao financeira)
let pixVenda = []; // transferencias de PIX da venda atual (conciliacao financeira)
let itensInventario = [];
let ultimoResumoVenda = '';
let ultimaVendaRegistrada = null;

// Variáveis do Wizard de Pós-Venda
let wizardEtapaAtual = 1;
let vendaJaEnviada = false;
let wizardEnviadoParaBling = false;
let blingEnvioEmAndamento = false;
let wizardOperacaoEmAndamento = false;

// Mapeamento de manuais por modelo (links Google Drive)
const MANUAIS_MOTOS = {
    'Gataka': 'https://drive.google.com/file/d/1llarKG95Xf2YGci-LwCpEQ5exmjhmoep/view?usp=drive_link',
    'Pancho': 'https://drive.google.com/file/d/1C7BfTaWY48poRtaqybZzIZQJl9G7mAVw/view?usp=drive_link',
    'Luna': 'https://drive.google.com/file/d/1sDLyZY0VIVGBf1bF5gLMSlRKjbFJrxHT/view?usp=drive_link',
    'Smart-Juna': 'https://drive.google.com/file/d/1zweOMU1B16YOINTS3UYo6yVhLTe-U8vm/view?usp=drive_link',
    'Hyphen': 'https://drive.google.com/file/d/1PMQdDqnWdIOhC8L95HjvJeq5bS3hKA0V/view?usp=drive_link',
    'Vega': 'https://drive.google.com/file/d/1ucn5U4Ovjbh8QRSxt5wsAJ0Vk1kQCdhK/view?usp=drive_link',
    'Zilla': 'https://drive.google.com/file/d/14fd_EPwoz7vaALeyAVEA-iOGvAeJ4IRa/view?usp=drive_link',
    'Shaka': 'https://drive.google.com/file/d/1RUpPIUyvX1ij2GwH_NxkQaHvwWpScsow/view?usp=drive_link',
    'Jaya': 'https://drive.google.com/file/d/1egTizGVR1M3lqsNoZlLZV785TUWzwcdP/view?usp=drive_link',
    'Kay': 'https://drive.google.com/file/d/1QWG34X483sOxoByXPB9E22EuSew7QxOm/view?usp=drive_link',
    'Kimbo': 'https://drive.google.com/file/d/1WN78PntxDv5Mz2V27l7frOxiWtxd42P1/view?usp=drive_link',
    'Juna': 'https://drive.google.com/file/d/1iK7Ks-JznS__btmtAtkUh6hFwx2bIeQg/view?usp=drive_link',
};

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
        const [lojasRes, produtosRes, vendedoresRes, fiscalRes] = await Promise.all([
            fetch('dados/lojas.json'),
            fetch('dados/produtos.json'),
            fetch('dados/vendedores_json.json'),
            fetch('dados/produtos-fiscal.json')
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
            dadosMatriculas = vendedoresData.matriculas || {};
        } catch (e) {
            throw new Error("Erro de sintaxe no arquivo 'vendedores_json.json'. Verifique as vírgulas e chaves {}.");
        }

        if (fiscalRes.ok) {
            try {
                const fiscalData = await fiscalRes.json();
                // Extrair apenas os modelos (ignorar _info)
                Object.keys(fiscalData).forEach(key => {
                    if (key !== '_info') dadosFiscais[key] = fiscalData[key];
                });
                console.log('Dados fiscais carregados:', Object.keys(dadosFiscais));
            } catch (e) {
                console.warn('Erro ao parsear produtos-fiscal.json:', e);
            }
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
    const lojaDestinoMovimentacaoSelect = document.getElementById('lojaDestinoMovimentacao');
    const modeloProdutoSelect = document.getElementById('modeloProduto');
    const corProdutoSelect = document.getElementById('corProduto');
    const modeloInventarioSelect = document.getElementById('modeloInventario');
    const corInventarioSelect = document.getElementById('corInventario');
    // Novos campos de movimentação
    const modeloMovimentacaoSelect = document.getElementById('modeloMovimentacao');
    const corMovimentacaoSelect = document.getElementById('corMovimentacao');

    [lojaVendaSelect, lojaSaidaSelect, lojaInventarioSelect, lojaDestinoMovimentacaoSelect, modeloProdutoSelect, corProdutoSelect, modeloInventarioSelect, corInventarioSelect, modeloMovimentacaoSelect, corMovimentacaoSelect].forEach(select => {
        if(select) {
            const firstOption = select.options[0];
            select.innerHTML = '';
            if (firstOption) select.appendChild(firstOption);
        }
    });

    for (const id in dadosLojas) {
        if (dadosLojas[id].tipo === 'loja') {
            const option = new Option(dadosLojas[id].nome, id);
            if (lojaVendaSelect) lojaVendaSelect.add(option.cloneNode(true));
            if (lojaInventarioSelect) lojaInventarioSelect.add(option.cloneNode(true));
            if (lojaDestinoMovimentacaoSelect) lojaDestinoMovimentacaoSelect.add(option.cloneNode(true));
            if (lojaSaidaSelect) lojaSaidaSelect.add(option);
        }
    }

    if (dadosProdutos.modelos) {
        dadosProdutos.modelos.forEach(modelo => {
            if (modeloProdutoSelect) modeloProdutoSelect.add(new Option(modelo, modelo));
            if (modeloInventarioSelect) modeloInventarioSelect.add(new Option(modelo, modelo));
            if (modeloMovimentacaoSelect) modeloMovimentacaoSelect.add(new Option(modelo, modelo));
        });
    }
    if (dadosProdutos.cores) {
        dadosProdutos.cores.forEach(cor => {
            if (corProdutoSelect) corProdutoSelect.add(new Option(cor, cor));
            if (corInventarioSelect) corInventarioSelect.add(new Option(cor, cor));
            if (corMovimentacaoSelect) corMovimentacaoSelect.add(new Option(cor, cor));
        });
    }
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

    document.getElementById('limparFormularioBtn').addEventListener('click', () => limparFormularioVenda(false));

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

    // Reagir quando o usuário digita motivo manualmente
    const motivoInput = document.getElementById('motivoMovimentacao');
    if (motivoInput) {
        motivoInput.addEventListener('input', atualizarCamposCondicionaisMovimentacao);
    }

    const modalWizard = document.getElementById('modalWizardVenda');
    const modalFatura = document.getElementById('modalFatura');

    // Fechar modais ao clicar no X - fecha apenas o modal pai do botão
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.onclick = function() {
            const parentModal = this.closest('.modal-overlay');
            if (parentModal) {
                parentModal.style.display = "none";
                parentModal.style.zIndex = '';
            }
        }
    });

    // Fechar modal de fatura ao clicar fora (protege contra fechamento durante geração de PDF)
    window.onclick = function(event) {
        if (event.target == modalFatura && !wizardOperacaoEmAndamento) {
            modalFatura.style.display = "none";
            modalFatura.style.zIndex = '';
        }
    }

    // Event listeners para o modal de fatura (ainda usado para ver fatura completa)
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
            ? ` • ${produto.corCapacete || 'Capacete'}`
            : '';

        div.innerHTML = `
            <div class="produto-info">
                <div class="produto-modelo">${produto.modelo} - ${produto.cor}</div>
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
        // Proteção anti-duplicidade: verificar se a venda já foi enviada
        if (vendaJaEnviada) {
            mostrarFeedback('Esta venda já foi enviada! Clique em "Nova Venda" para registrar outra.', 'erro');
            return;
        }

        if (produtosDaVenda.length === 0) {
            mostrarFeedback('Adicione pelo menos um produto à venda', 'erro');
            return;
        }

        // Validar forma de pagamento selecionada
        const formasSelecionadas = document.querySelectorAll('input[name="pagamento"]:checked');
        if (formasSelecionadas.length === 0) {
            mostrarFeedback('Selecione pelo menos uma forma de pagamento', 'erro');
            const secaoPagamento = document.querySelector('[data-secao="4"]');
            if (secaoPagamento) {
                secaoPagamento.classList.remove('collapsed');
                secaoPagamento.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const form = event.target;

        // Expandir todas as seções para que a validação funcione em campos visíveis
        document.querySelectorAll('.secao-form-nova.collapsed').forEach(secao => {
            secao.classList.remove('collapsed');
        });

        if (!form.checkValidity()) {
            // Encontrar o primeiro campo inválido e scrollar até ele
            const primeiroInvalido = form.querySelector(':invalid');
            if (primeiroInvalido) {
                primeiroInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
                primeiroInvalido.focus();
            }
            form.reportValidity();
            mostrarFeedback('Preencha todos os campos obrigatórios', 'erro');
            return;
        }

        // Desabilitar botão de registrar imediatamente para evitar cliques duplos
        const btnRegistrar = document.querySelector('.btn-registrar-venda');
        btnRegistrar.disabled = true;
        btnRegistrar.innerHTML = '<span class="btn-icon">⏳</span> Enviando...';
    
    const lojaId = document.getElementById('lojaVenda').value;
    const nomeLoja = dadosLojas[lojaId]?.nome || lojaId;

    const venda = {
        id: `VNDA-${Date.now()}`,
        loja: nomeLoja,
        vendedor: document.getElementById('vendedor').value,
        matriculaVendedor: document.getElementById('matriculaVendedor')?.value || '',
        dataVenda: document.getElementById('dataVenda').value,
        cliente: {
            nome: document.getElementById('nomeCliente').value,
            cpf: document.getElementById('cpfCliente').value,
            cnpj: document.getElementById('cnpjCliente').value,
            telefone: document.getElementById('telefoneCliente').value,
            email: document.getElementById('emailCliente').value,
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
            cartoes: cartoesVenda.map(c => ({ ...c })),
            outros: document.getElementById('outrosPagamentoTexto').value,
            observacoes: document.getElementById('observacoesPagamento').value
        },
        aceiteDetalhes: coletarAceiteDetalhes(),
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

    venda._savedAt = Date.now();
    const vendasSalvas = JSON.parse(localStorage.getItem('vendas') || '[]');
    vendasSalvas.push(venda);
    localStorage.setItem('vendas', JSON.stringify(vendasSalvas));

    ultimaVendaRegistrada = venda;

    // Marcar venda como enviada para proteção anti-duplicidade
    vendaJaEnviada = true;

    // Atualizar botão para indicar que venda foi enviada
    btnRegistrar.innerHTML = '<span class="btn-icon">✅</span> Venda Enviada';

    // Mostrar wizard IMEDIATAMENTE - dados já salvos no localStorage
    // Evita fechamento precipitado: o usuário já vê a fatura mesmo se envios falharem
    mostrarResumoModal(venda, false);

    // Enviar para automação Make em background (não bloqueia o wizard)
    enviarParaAutomacao('vendas', venda).then(sucesso => {
        mostrarStatusAutomacao(sucesso);
    }).catch(error => {
        console.error('Erro no envio ao Make:', error);
        mostrarStatusAutomacao(false);
    });

    // Webhook paralelo de conciliacao de cartoes (so dispara se a venda tiver cartao)
    if (Array.isArray(venda.pagamento?.cartoes) && venda.pagamento.cartoes.length > 0) {
        enviarParaAutomacao('conciliacaoCartoes', venda).catch(error => {
            console.error('Erro no envio ao webhook de conciliacao:', error);
        });
    }

    // Baixa automática no Sistema de Estoque (fire-and-forget)
    venda.produtos.forEach(prod => {
        if (prod.chassi) {
            fetch('https://estoque-baixa-venda-yr6pk2gb3a-rj.a.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'e4218efd6d48b67425efe89efe602c9321b98c31d5c7c7315c6a579b235cafe4',
                    'X-App-Name': 'nxt-app'
                },
                body: JSON.stringify({
                    chassi: prod.chassi,
                    motor: prod.motor || '',
                    tipo: 'PF',
                    local: venda.loja,
                    formularioRef: venda.id + '-' + prod.chassi
                })
            }).catch(err => console.error('Baixa estoque erro:', err));
        }
    });

    // Enviar para Bling em background (se conectado)
    BLING_CONFIG.checkStatus().then(() => {
        if (BLING_CONFIG.isAuthenticated) {
            enviarVendaParaBling(venda).then(() => {
                wizardEnviadoParaBling = true;
                const checkBling = document.getElementById('checkBling');
                if (checkBling) {
                    checkBling.classList.add('done');
                    checkBling.querySelector('.checklist-icon').textContent = '✓';
                }
                // Regenerar resumo com a confirmação do Bling
                ultimoResumoVenda = gerarTextoResumoVenda(venda, true);
                const textArea = document.getElementById('textoResumoModal');
                if (textArea) {
                    textArea.value = ultimoResumoVenda;
                }
                atualizarStatusBling();
            }).catch(error => {
                console.error('Erro ao enviar para emissão:', error);
                const checkBling = document.getElementById('checkBling');
                if (checkBling) {
                    checkBling.querySelector('.checklist-icon').textContent = '✗';
                    checkBling.querySelector('span:last-child').textContent = 'Bling indisponível — continue normalmente';
                }
                atualizarStatusBling();
            });
        } else {
            // Bling não conectado — marcar como ignorado e seguir
            const checkBling = document.getElementById('checkBling');
            if (checkBling) {
                checkBling.querySelector('.checklist-icon').textContent = '—';
                checkBling.querySelector('span:last-child').textContent = 'Emissão não conectada — continue normalmente';
            }
            atualizarStatusBling();
        }
    });

    // Não limpa automaticamente o formulário para permitir usar copiar/enviar fatura
    // O usuário deve usar o botão "Nova Venda" no wizard quando desejar

    } catch (error) {
        console.error('Erro ao registrar venda:', error);
        mostrarFeedback('Erro ao registrar venda. Verifique o console.', 'erro');

        // Reabilitar botão em caso de erro
        const btnRegistrarErro = document.querySelector('.btn-registrar-venda');
        if (btnRegistrarErro) {
            btnRegistrarErro.disabled = false;
            btnRegistrarErro.innerHTML = '<span class="btn-icon">✅</span> Registrar Venda';
        }
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
            const icone = item.tipoItem === 'capacete' ? '' : '';
            const titulo = item.tipoItem === 'capacete'
                ? `${item.quantidade}x Capacete`
                : `${item.quantidade}x ${item.modelo} (${item.cor})`;
            const detalhes = item.tipoItem === 'capacete'
                ? `Contagem • ${dataFormatada}`
                : `${item.chassi ? `Chassi: ${item.chassi} • ` : ''}${item.motor ? `Motor: ${item.motor} • ` : ''}${dataFormatada}`;

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
            const itemIcone = item.tipoItem === 'capacete' ? '' : '';
            const titulo = item.tipoItem === 'capacete'
                ? `${item.quantidade}x Capacete`
                : `${item.quantidade}x ${item.modelo} (${item.cor})`;
            let extras = '';
            if (item.lojaDestinoNome) extras += ` • Loja: ${item.lojaDestinoNome}`;
            if (item.cliente) extras += ` • Cliente: ${item.cliente}`;
            const detalhes = item.tipoItem === 'capacete'
                ? `${item.motivo}${extras} • ${dataFormatada}`
                : `${item.chassi ? `Chassi: ${item.chassi} • ` : ''}${item.motor ? `Motor: ${item.motor} • ` : ''}${item.motivo}${extras} • ${dataFormatada}`;

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

    // Mostrar/ocultar campos de conferência de entrada
    const conferenciaDiv = document.getElementById('conferenciaEntrada');
    if (conferenciaDiv) {
        conferenciaDiv.style.display = tipo === 'entrada' ? 'block' : 'none';
    }

    // Habilitar botão de submit
    const btnSubmit = document.getElementById('btnSubmitMovimentacao');
    if (btnSubmit) {
        btnSubmit.disabled = false;
    }

    atualizarCamposCondicionaisMovimentacao();
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

    atualizarCamposCondicionaisMovimentacao();
}

function atualizarCamposCondicionaisMovimentacao() {
    const tipoMov = document.getElementById('tipoMovimentacaoHidden').value;
    const motivo = (document.getElementById('motivoMovimentacao').value || '').toLowerCase();
    const lojaDestinoWrap = document.getElementById('lojaDestinoWrap');
    const lojaDestinoLabel = document.getElementById('lojaDestinoLabel');
    const clienteWrap = document.getElementById('clienteVendaOutraLojaWrap');

    const isSaida = tipoMov === 'saida';
    const isTransferencia = motivo.includes('transfer');
    const isVendaOutraLoja = motivo.includes('venda de outra loja') || motivo.includes('venda outra loja');

    if (isSaida && (isTransferencia || isVendaOutraLoja)) {
        if (lojaDestinoWrap) lojaDestinoWrap.style.display = '';
        if (lojaDestinoLabel) {
            lojaDestinoLabel.innerHTML = isVendaOutraLoja
                ? 'Loja que vendeu: <span style="color: red;">*</span>'
                : 'Loja de destino: <span style="color: red;">*</span>';
        }
    } else {
        if (lojaDestinoWrap) lojaDestinoWrap.style.display = 'none';
        const lojaDestinoSelect = document.getElementById('lojaDestinoMovimentacao');
        if (lojaDestinoSelect) lojaDestinoSelect.value = '';
    }

    if (isSaida && isVendaOutraLoja) {
        if (clienteWrap) clienteWrap.style.display = '';
    } else {
        if (clienteWrap) clienteWrap.style.display = 'none';
        const clienteInput = document.getElementById('clienteVendaOutraLoja');
        if (clienteInput) clienteInput.value = '';
    }
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

    const motivoLower = motivo.toLowerCase();
    const isTransferencia = motivoLower.includes('transfer');
    const isVendaOutraLoja = motivoLower.includes('venda de outra loja') || motivoLower.includes('venda outra loja');

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

    // Saídas com loja relacionada: capturar destino e (quando aplicável) cliente
    if (tipoMovimentacao === 'saida' && (isTransferencia || isVendaOutraLoja)) {
        const lojaDestinoSelect = document.getElementById('lojaDestinoMovimentacao');
        const lojaDestinoId = lojaDestinoSelect ? lojaDestinoSelect.value : '';
        if (!lojaDestinoId) {
            mostrarFeedback(isVendaOutraLoja ? 'Selecione a loja que vendeu' : 'Selecione a loja de destino', 'erro');
            return;
        }
        item.lojaDestinoId = lojaDestinoId;
        item.lojaDestinoNome = dadosLojas[lojaDestinoId]?.nome || lojaDestinoId;

        if (isVendaOutraLoja) {
            const cliente = document.getElementById('clienteVendaOutraLoja').value.trim();
            if (!cliente) {
                mostrarFeedback('Informe o nome do cliente da venda', 'erro');
                return;
            }
            item.cliente = cliente;
        }
    }

    // Se for entrada, validar e capturar dados de conferência
    if (tipoMovimentacao === 'entrada') {
        const recebidoPor = document.getElementById('recebidoPor').value.trim();
        if (!recebidoPor) {
            mostrarFeedback('Informe quem recebeu fisicamente a moto (campo "Recebido por")', 'erro');
            return;
        }

        const inspecaoVisual = document.getElementById('inspecaoVisualOk').checked;
        const carregadorOk = document.getElementById('carregadorOk').checked;
        const acessoriosOk = document.getElementById('acessoriosOk').checked;

        // Alerta de conferência
        const confirma = confirm(
            'ATENÇÃO - CONFERÊNCIA DE ENTRADA\n\n' +
            'Todas as motos recebidas foram:\n' +
            `${inspecaoVisual ? '✅' : '❌'} Avaliadas visualmente? (riscos, amassados)\n` +
            `${carregadorOk ? '✅' : '❌'} Carregador conferido?\n` +
            `${acessoriosOk ? '✅' : '❌'} Peças e acessórios verificados?\n\n` +
            'Confirma que tudo foi conferido?'
        );

        if (!confirma) return;

        item.recebidoPor = recebidoPor;
        item.inspecaoVisual = inspecaoVisual;
        item.carregadorOk = carregadorOk;
        item.acessoriosOk = acessoriosOk;
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

    // Ocultar e resetar campos de conferência
    const conferenciaDiv = document.getElementById('conferenciaEntrada');
    if (conferenciaDiv) {
        conferenciaDiv.style.display = 'none';
    }
    const recebidoPor = document.getElementById('recebidoPor');
    if (recebidoPor) recebidoPor.value = '';
    const inspecaoVisualOk = document.getElementById('inspecaoVisualOk');
    if (inspecaoVisualOk) inspecaoVisualOk.checked = false;
    const carregadorOk = document.getElementById('carregadorOk');
    if (carregadorOk) carregadorOk.checked = false;
    const acessoriosOk = document.getElementById('acessoriosOk');
    if (acessoriosOk) acessoriosOk.checked = false;

    // Resetar tipo de item para moto
    selecionarTipoItemMov('moto');

    // Resetar e ocultar campos condicionais (loja destino e cliente)
    const lojaDestinoSelect = document.getElementById('lojaDestinoMovimentacao');
    if (lojaDestinoSelect) lojaDestinoSelect.value = '';
    const lojaDestinoWrap = document.getElementById('lojaDestinoWrap');
    if (lojaDestinoWrap) lojaDestinoWrap.style.display = 'none';
    const clienteInput = document.getElementById('clienteVendaOutraLoja');
    if (clienteInput) clienteInput.value = '';
    const clienteWrap = document.getElementById('clienteVendaOutraLojaWrap');
    if (clienteWrap) clienteWrap.style.display = 'none';
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

// ========== VALIDAÇÃO INLINE CPF E TELEFONE ==========

// Validar CPF pelo algoritmo dos dígitos verificadores
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    // Rejeitar sequências repetidas (000.000.000-00, 111.111.111-11, etc.)
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    // Calcular dígitos verificadores
    for (let t = 9; t < 11; t++) {
        let soma = 0;
        for (let i = 0; i < t; i++) {
            soma += parseInt(cpf[i]) * ((t + 1) - i);
        }
        let resto = (soma * 10) % 11;
        if (resto === 10) resto = 0;
        if (resto !== parseInt(cpf[t])) return false;
    }
    return true;
}

// Validar telefone (precisa ter DDD + número = 10 ou 11 dígitos)
function validarTelefone(tel) {
    const digitos = tel.replace(/\D/g, '');
    return digitos.length >= 10 && digitos.length <= 11;
}

// Aplicar validação visual inline nos campos
function aplicarValidacaoInline() {
    const cpfInput = document.getElementById('cpfCliente');
    const telInput = document.getElementById('telefoneCliente');
    const avisoCpf = document.getElementById('avisoCpf');
    const avisoTel = document.getElementById('avisoTelefone');

    if (cpfInput && avisoCpf) {
        cpfInput.addEventListener('blur', function() {
            const valor = this.value.replace(/\D/g, '');
            if (valor.length === 0) {
                // Campo vazio — sem aviso (é opcional)
                this.classList.remove('campo-invalido', 'campo-valido');
                avisoCpf.classList.remove('visivel');
            } else if (valor.length < 11) {
                // Incompleto
                this.classList.add('campo-invalido');
                this.classList.remove('campo-valido');
                avisoCpf.textContent = 'CPF incompleto — faltam números';
                avisoCpf.classList.add('visivel');
            } else if (!validarCPF(valor)) {
                // Inválido
                this.classList.add('campo-invalido');
                this.classList.remove('campo-valido');
                avisoCpf.textContent = 'CPF inválido — verifique os números';
                avisoCpf.classList.add('visivel');
            } else {
                // Válido
                this.classList.remove('campo-invalido');
                this.classList.add('campo-valido');
                avisoCpf.classList.remove('visivel');
            }
        });
        // Limpar aviso ao digitar
        cpfInput.addEventListener('input', function() {
            this.classList.remove('campo-invalido', 'campo-valido');
            avisoCpf.classList.remove('visivel');
        });
    }

    if (telInput && avisoTel) {
        telInput.addEventListener('blur', function() {
            const digitos = this.value.replace(/\D/g, '');
            if (digitos.length === 0) {
                // Vazio — a validação do required já cuida
                this.classList.remove('campo-invalido', 'campo-valido');
                avisoTel.classList.remove('visivel');
            } else if (!validarTelefone(this.value)) {
                this.classList.add('campo-invalido');
                this.classList.remove('campo-valido');
                avisoTel.classList.add('visivel');
            } else {
                this.classList.remove('campo-invalido');
                this.classList.add('campo-valido');
                avisoTel.classList.remove('visivel');
            }
        });
        telInput.addEventListener('input', function() {
            this.classList.remove('campo-invalido', 'campo-valido');
            avisoTel.classList.remove('visivel');
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

            // Mostrar info do Dinheiro se selecionado
            const dinheiroInfo = document.getElementById('dinheiroInfoCard');
            const dinheiroChecked = document.querySelector('input[name="pagamento"][value="dinheiro"]').checked;
            if (dinheiroInfo) {
                dinheiroInfo.style.display = dinheiroChecked ? 'block' : 'none';
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
    aplicarValidacaoInline();
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

    // Alerta de conferência obrigatória
    const conferiu = confirm(
        '⚠️ CONFERÊNCIA OBRIGATÓRIA\n\n' +
        'Antes de enviar, confira:\n\n' +
        '1️⃣ Estoque de ontem − vendas + entradas − saídas = inventário de hoje?\n\n' +
        '2️⃣ Os NOMES dos modelos estão corretos? (Não confundiu modelos parecidos?)\n\n' +
        '3️⃣ Contou SOMENTE o que está na loja e NÃO foi vendido?\n\n' +
        '4️⃣ Registrou TUDO que aconteceu desde o último inventário?\n\n' +
        '5️⃣ Nas SAÍDAS por Transferência, indicou a LOJA DE DESTINO?\n\n' +
        '6️⃣ Nas SAÍDAS por Venda de outra loja, indicou a LOJA e o NOME DO CLIENTE?\n\n' +
        '7️⃣ Preencheu CHASSI e MOTOR sempre que possível?\n\n' +
        'Está tudo correto?'
    );
    if (!conferiu) return;

    // Desabilitar botão e mostrar loading
    const btnFinalizar = document.getElementById('finalizarInventario');
    btnFinalizar.disabled = true;
    btnFinalizar.innerHTML = '<span class="btn-icon-left">⏳</span> Enviando...';

    try {
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

        const sucessoAutomacao = await enviarParaAutomacao('inventario', inventarioFinalizado);
        mostrarStatusAutomacao(sucessoAutomacao);

        alert(`Inventário com ${totalItens} itens finalizado e salvo!`);

        limparFormularioInventario();
    } catch (error) {
        console.error('Erro ao finalizar inventário:', error);
        alert('Erro ao finalizar inventário. Tente novamente.');
    } finally {
        // Sempre restaurar o botão
        btnFinalizar.disabled = false;
        btnFinalizar.innerHTML = '<span class="btn-icon-left">✅</span> Finalizar e Enviar';
    }
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
                        <strong style="font-size: 16px;">${inv.loja}</strong>
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
        versao: 'NXT V4.10',
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

function gerarTextoResumoVenda(venda, enviadoParaBling = false) {
    const dataFormatada = new Date(venda.dataVenda).toLocaleDateString('pt-BR', {timeZone: 'UTC'});

    let resumo = `=== SISTEMA NXT V4.10===\n*RESUMO DA VENDA — ${venda.loja}*\n`;
    resumo += `*Vendedor:* ${venda.matriculaVendedor ? venda.matriculaVendedor + ' - ' : ''}${venda.vendedor}\n`;
    resumo += `*Data:* ${dataFormatada}\n\n`;
    
    resumo += `*CLIENTE*\n`;
    resumo += `*Nome:* ${venda.cliente.nome}\n`;
    resumo += `*Telefone:* ${venda.cliente.telefone}\n`;
    if (venda.cliente.email) resumo += `*E-mail:* ${venda.cliente.email}\n`;
    if (venda.cliente.cpf) resumo += `*CPF:* ${venda.cliente.cpf}\n`;
    if (venda.cliente.cnpj) resumo += `*CNPJ:* ${venda.cliente.cnpj}\n`;
    const end = venda.cliente.endereco;
    const endereco = `${end.rua}, ${end.numero} - ${end.bairro}, ${end.cidade}/${end.estado} - CEP: ${end.cep}`;
    resumo += `*Endereço:* ${endereco}\n\n`;

    resumo += `*PRODUTOS*\n`;
    venda.produtos.forEach(p => {
        resumo += `- ${p.modelo} ${p.cor}\n`;
        if (p.chassi) resumo += `  *Chassi:* ${p.chassi}\n`;
        if (p.motor) resumo += `  *Motor:* ${p.motor}\n`;
        resumo += `  *Capacete:* ${p.capacete === 'sim' ? `Sim (${p.corCapacete || 'Cor não informada'})` : 'Não'}\n`;
        resumo += `  *Valor:* R$ ${formatarValorMonetario(p.preco)}\n`;
    });
    resumo += `\n`;

    resumo += `*PAGAMENTO*\n`;

    const _valoresEntries = Object.entries(venda.pagamento.valores || {});
    const _naoCartao = _valoresEntries.filter(([f]) => f !== 'debito' && f !== 'credito');
    const _cartoesArr = Array.isArray(venda.pagamento.cartoes) ? venda.pagamento.cartoes : [];
    const _nomeForma = f => f === 'pos' ? 'PIX POS' : f === 'pix' ? 'PIX' : f === 'debito' ? 'DÉBITO' : f === 'credito' ? 'CRÉDITO' : f === 'crediario' ? 'CREDIÁRIO' : f.toUpperCase();

    if (_cartoesArr.length > 0) {
        // Tem cartoes detalhados: linha de valores so para formas nao-cartao
        if (_naoCartao.length > 0) {
            const linhas = _naoCartao.map(([f, v]) => `${_nomeForma(f)}: R$ ${formatarValorMonetario(v)}`);
            resumo += linhas.join(' | ') + '\n';
        }
        resumo += `*Cartões:*\n`;
        _cartoesArr.forEach(c => {
            resumo += `  - ${descreverCartao(c)}\n`;
        });
    } else if (_valoresEntries.length > 0) {
        const linhas = _valoresEntries.map(([f, v]) => `${_nomeForma(f)}: R$ ${formatarValorMonetario(v)}`);
        resumo += linhas.join(' | ') + '\n';
        if (venda.pagamento.formas.includes('credito')) {
            resumo += `*Parcelas:* ${venda.pagamento.parcelas}x\n`;
        }
    } else {
        resumo += `*Formas:* ${venda.pagamento.formas.map(f => _nomeForma(f)).join(', ')}\n`;
    }


    if (venda.pagamento.observacoes) {
        resumo += `*Observações:* ${venda.pagamento.observacoes}\n`;
    }
    
    if (venda.valorFrete && venda.valorFrete > 0) {
        resumo += `*Frete:* R$ ${formatarValorMonetario(venda.valorFrete)}\n`;
    }
    
    resumo += `*TOTAL:* R$ ${formatarValorMonetario(venda.total)}\n\n`;

    resumo += `*ENTREGA*\n`;
    const tipoEntregaValue = document.getElementById('tipoEntrega').value;
    const tipoEntregaTexto = tipoEntregaValue === 'retirada' ? 'Retirado pelo Cliente' : 'Receber em Casa';
    resumo += `*Tipo:* ${tipoEntregaTexto}\n`;
    if (venda.entrega.prazo) {
        resumo += `*Prazo:* ${new Date(venda.entrega.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}\n`;
    }
    const lojaSaidaNome = dadosLojas[venda.entrega.localSaida]?.nome || venda.loja;
    if (venda.entrega.tipo === 'domicilio') {
        resumo += `*Local de Saída:* ${lojaSaidaNome}\n`;
    } else if (venda.entrega.tipo === 'retirada') {
        resumo += `*Local de Retirada:* ${lojaSaidaNome}\n`;
    }
    resumo += `\n`;

    resumo += gerarTextoAceiteWhatsApp(venda.aceiteDetalhes);

    if (enviadoParaBling) {
        resumo += `*Venda enviada ao sistema Bling para emissão da NF-e*\n`;
    }

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
                matriculaVendedor: document.getElementById('matriculaVendedor')?.value || '',
                dataVenda: document.getElementById('dataVenda').value,
                cliente: {
                    nome: document.getElementById('nomeCliente').value,
                    telefone: document.getElementById('telefoneCliente').value,
                    email: document.getElementById('emailCliente').value,
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
                    cartoes: cartoesVenda.map(c => ({ ...c })),
                    observacoes: document.getElementById('observacoesPagamento').value
                },
                aceiteDetalhes: coletarAceiteDetalhes(),
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

function mostrarResumoModal(venda, enviadoParaBling = false) {
    ultimoResumoVenda = gerarTextoResumoVenda(venda, enviadoParaBling);

    // Salvar resumo de venda no histórico
    salvarResumoVendaNoHistorico(venda, ultimoResumoVenda);

    // Usar o novo wizard de pós-venda
    iniciarWizardPosVenda(venda, enviadoParaBling);
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

    const _nomeForma = f => f === 'pos' ? 'PIX POS' : f === 'pix' ? 'PIX' : f === 'debito' ? 'DÉBITO' : f === 'credito' ? 'CRÉDITO' : f === 'crediario' ? 'CREDIÁRIO' : f.toUpperCase();
    const _valoresEntries = Object.entries(venda.pagamento.valores || {});
    const _naoCartao = _valoresEntries.filter(([f]) => f !== 'debito' && f !== 'credito');
    const _cartoesArr = Array.isArray(venda.pagamento.cartoes) ? venda.pagamento.cartoes : [];

    let formasPagamentoTexto = '';
    if (_cartoesArr.length > 0) {
        if (_naoCartao.length > 0) {
            formasPagamentoTexto = _naoCartao.map(([f, v]) => `${_nomeForma(f)}: R$ ${formatarValorMonetario(v)}`).join(', ');
        }
        const detalhes = _cartoesArr.map(c => descreverCartao(c)).join('<br>');
        formasPagamentoTexto += (formasPagamentoTexto ? '<br>' : '') + `<small>${detalhes}</small>`;
    } else if (_valoresEntries.length > 0) {
        formasPagamentoTexto = _valoresEntries.map(([f, v]) => `${_nomeForma(f)}: R$ ${formatarValorMonetario(v)}`).join(', ');
        if (venda.pagamento.formas.includes('credito')) {
            formasPagamentoTexto += ` (${venda.pagamento.parcelas}x)`;
        }
    } else {
        formasPagamentoTexto = venda.pagamento.formas.map(f => _nomeForma(f)).join(', ');
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

        ${gerarHTMLAceite(venda.aceiteDetalhes)}

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
            <p>Esta fatura foi gerada pelo Sistema NXT V4.10</p>
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

    const _nomeForma = f => f === 'pos' ? 'PIX POS' : f === 'pix' ? 'PIX' : f === 'debito' ? 'DÉBITO' : f === 'credito' ? 'CRÉDITO' : f === 'crediario' ? 'CREDIÁRIO' : f.toUpperCase();
    const _valoresEntries = Object.entries(venda.pagamento.valores || {});
    const _naoCartao = _valoresEntries.filter(([f]) => f !== 'debito' && f !== 'credito');
    const _cartoesArr = Array.isArray(venda.pagamento.cartoes) ? venda.pagamento.cartoes : [];

    let formasPagamentoTexto = '';
    if (_cartoesArr.length > 0) {
        if (_naoCartao.length > 0) {
            formasPagamentoTexto = _naoCartao.map(([f, v]) => `${_nomeForma(f)}: R$ ${formatarValorMonetario(v)}`).join(', ');
        }
        const detalhes = _cartoesArr.map(c => `  - ${descreverCartao(c)}`).join('\n');
        formasPagamentoTexto += (formasPagamentoTexto ? '\n' : '') + detalhes;
    } else if (_valoresEntries.length > 0) {
        formasPagamentoTexto = _valoresEntries.map(([f, v]) => `${_nomeForma(f)}: R$ ${formatarValorMonetario(v)}`).join(', ');
        if (venda.pagamento.formas.includes('credito')) {
            formasPagamentoTexto += ` (${venda.pagamento.parcelas}x)`;
        }
    } else {
        formasPagamentoTexto = venda.pagamento.formas.map(f => _nomeForma(f)).join(', ');
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

    faturaTexto += gerarTextoAceitePlano(venda.aceiteDetalhes);

    faturaTexto += `

TOTAL GERAL: R$ ${formatarValorMonetario(venda.total)}

INFORMAÇÕES DE GARANTIA DO FABRICANTE

Quadro: Garantia de 2 (dois) anos contra defeitos de fabricação, contados a partir da data da nota fiscal.
Motor: Garantia de 2 (dois) anos contra defeitos de fabricação, contados a partir da data da nota fiscal.
Bateria: Garantia de 6 (seis) meses contra defeitos de fabricação, contados a partir da data da nota fiscal.

Observação: As garantias acima referem-se exclusivamente a defeitos de fabricação. Danos causados por uso inadequado, acidentes ou desgaste natural não estão cobertos.

*IMPORTANTE: Este documento tem caráter informativo e não constitui documento fiscal para fins tributários. A nota fiscal eletrônica será emitida e enviada separadamente*

Esta fatura foi gerada pelo Sistema NXT V4.10
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

        mostrarFeedback('PDF gerado com sucesso!', 'sucesso');

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        mostrarFeedback('Erro ao gerar PDF. Tente novamente ou use a função de impressão.', 'erro');
    }
}

// === FATURAS DO DIA ===

function abrirModalFaturasDoDia() {
    document.getElementById('modalFaturasDoDia').style.display = 'flex';
    renderizarListaFaturasDoDia();
}

function fecharModalFaturasDoDia() {
    document.getElementById('modalFaturasDoDia').style.display = 'none';
}

function renderizarListaFaturasDoDia() {
    const vendasSalvas = JSON.parse(localStorage.getItem('vendas') || '[]');
    const limite24h = Date.now() - (24 * 60 * 60 * 1000);
    const hojeISO = new Date().toISOString().split('T')[0];

    const vendasRecentes = vendasSalvas.filter(v => {
        if (v._savedAt) return v._savedAt >= limite24h;
        return v.dataVenda === hojeISO; // fallback para vendas antigas sem timestamp
    }).slice().reverse(); // mais recentes primeiro

    const lista = document.getElementById('listaFaturasDoDia');
    if (vendasRecentes.length === 0) {
        lista.innerHTML = '<div class="empty-state"><p>Nenhuma venda registrada nas últimas 24 horas neste dispositivo.</p></div>';
        return;
    }

    lista.innerHTML = vendasRecentes.map(venda => {
        const ts = venda._savedAt ? new Date(venda._savedAt) : null;
        const hora = ts ? ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const produtos = (venda.produtos || []).map(p => p.modelo).join(', ');
        const total = `R$ ${formatarValorMonetario(venda.total || 0)}`;
        const temTelefone = (venda.cliente?.telefone || '').replace(/\D/g, '').length >= 10;
        const idEscapado = venda.id.replace(/'/g, "\\'");
        return `
        <div class="fatura-dia-item">
            <div class="fatura-dia-info">
                <span class="fatura-dia-hora">${hora}</span>
                <div class="fatura-dia-detalhes">
                    <strong>${venda.cliente?.nome || 'Cliente'}</strong>
                    <span class="fatura-dia-modelos">${produtos}</span>
                    <span class="fatura-dia-total">${total}</span>
                </div>
            </div>
            <div class="fatura-dia-acoes">
                <button class="btn-fatura-ver" onclick="reabrirFaturaDoDia('${idEscapado}')">📄 Ver Fatura</button>
                ${temTelefone ? `<button class="btn-fatura-whats" onclick="enviarFaturaDiaWhatsApp('${idEscapado}')">📲 WhatsApp</button>` : ''}
            </div>
        </div>`;
    }).join('');
}

function reabrirFaturaDoDia(vendaId) {
    const vendasSalvas = JSON.parse(localStorage.getItem('vendas') || '[]');
    const venda = vendasSalvas.find(v => v.id === vendaId);
    if (!venda) {
        alert('Fatura não encontrada.');
        return;
    }
    fecharModalFaturasDoDia();
    ultimaVendaRegistrada = venda;
    gerarHTMLFatura(venda);
    document.getElementById('modalFatura').style.display = 'block';
}

function enviarFaturaDiaWhatsApp(vendaId) {
    const vendasSalvas = JSON.parse(localStorage.getItem('vendas') || '[]');
    const venda = vendasSalvas.find(v => v.id === vendaId);
    if (!venda) return;
    const texto = gerarTextoFatura(venda);
    const telefone = (venda.cliente?.telefone || '').replace(/\D/g, '');
    const telefoneCompleto = telefone.startsWith('55') ? telefone : '55' + telefone;
    window.open(`https://wa.me/${telefoneCompleto}?text=${encodeURIComponent(texto)}`, '_blank');
}

function copiarResumoInventario() {
    try {
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

        const ordemFixa = ['Juna', 'Kay', 'Pancho', 'Luna', 'Hyphen', 'Vega', 'V0', 'Gataka', 'Jaya', 'Jay', 'Smart-Juna', 'Shaka', 'Zilla', 'Akasha'];

        let resumo = '';

        // ══════════════════════════════
        // CABEÇALHO PROFISSIONAL
        // ══════════════════════════════
        resumo += `╔══════════════════════════════════╗\n`;
        resumo += `   *SISTEMA NXT V4.10 - INVENTÁRIO*\n`;
        resumo += `   Loja: *${lojaNome}*\n`;
        resumo += `   Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
        resumo += `╚══════════════════════════════════╝\n\n`;

        // ══════════════════════════════
        // SEÇÃO: ESTOQUE ATUAL
        // ══════════════════════════════
        const contagemModelos = {};
        let totalMotos = 0;
        let totalCapacetes = 0;

        itensInventarioOnly.forEach(item => {
            if (item.tipoItem === 'capacete') {
                totalCapacetes += item.quantidade;
            } else {
                if (!contagemModelos[item.modelo]) contagemModelos[item.modelo] = 0;
                contagemModelos[item.modelo] += item.quantidade;
                totalMotos += item.quantidade;
            }
        });

        resumo += `▸ *ESTOQUE ATUAL (O que tem na loja)*\n`;
        resumo += `┌──────────────────────────────────┐\n`;
        resumo += `│ *Motos: ${totalMotos} unidades*\n`;
        resumo += `│\n`;

        // Grade fixa - SEMPRE mostra todos os modelos
        ordemFixa.forEach(modelo => {
            const qtd = contagemModelos[modelo] || 0;
            const pontos = '.'.repeat(Math.max(1, 18 - modelo.length));
            resumo += `│  ${modelo} ${pontos} ${qtd}\n`;
        });
        // Modelos fora da lista fixa (ex: Kimbo) só se tiverem contagem
        Object.entries(contagemModelos).forEach(([modelo, qtd]) => {
            if (!ordemFixa.includes(modelo) && qtd > 0) {
                const pontos = '.'.repeat(Math.max(1, 18 - modelo.length));
                resumo += `│  ${modelo} ${pontos} ${qtd}\n`;
            }
        });

        if (totalCapacetes > 0) {
            resumo += `│\n`;
            resumo += `│ *Capacetes: ${totalCapacetes} unidades*\n`;
        }
        resumo += `└──────────────────────────────────┘\n\n`;

        // ══════════════════════════════
        // SEÇÃO: DETALHAMENTO POR UNIDADE
        // ══════════════════════════════
        if (itensInventarioOnly.length > 0) {
            resumo += `▸ *DETALHAMENTO POR UNIDADE*\n`;

            const motosInventario = itensInventarioOnly.filter(i => i.tipoItem !== 'capacete');
            const capacetesInventario = itensInventarioOnly.filter(i => i.tipoItem === 'capacete');

            // Ordenar motos pela ordem fixa
            motosInventario.sort((a, b) => {
                const idxA = ordemFixa.indexOf(a.modelo);
                const idxB = ordemFixa.indexOf(b.modelo);
                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
            });

            motosInventario.forEach(item => {
                resumo += `  • *${item.modelo} ${item.cor}*\n`;
                const partes = [];
                if (item.chassi) partes.push(`Chassi ${item.chassi}`);
                if (item.motor) partes.push(`Motor ${item.motor}`);
                if (partes.length > 0) {
                    resumo += `    _${partes.join(' · ')}_\n`;
                }
            });
            capacetesInventario.forEach(item => {
                resumo += `  • *${item.quantidade}x Capacete*\n`;
            });

            if (motosInventario.length === 0 && capacetesInventario.length === 0) {
                resumo += `  (nenhum item registrado)\n`;
            }
            resumo += `\n`;
        }

        // ══════════════════════════════
        // SEÇÃO: O QUE ACONTECEU
        // ══════════════════════════════
        if (itensMovimentacao.length > 0) {
            const itensEntrada = itensMovimentacao.filter(item => item.tipo === 'entrada');
            const itensSaida = itensMovimentacao.filter(item => item.tipo === 'saida');
            const totalEntradas = itensEntrada.reduce((acc, item) => acc + item.quantidade, 0);
            const totalSaidas = itensSaida.reduce((acc, item) => acc + item.quantidade, 0);

            resumo += `▸ *O QUE ACONTECEU (Entradas e Saídas)*\n`;
            resumo += `┌──────────────────────────────────┐\n`;

            // Entradas
            if (itensEntrada.length > 0) {
                resumo += `│ *ENTRADAS: ${totalEntradas} unidades*\n`;
                itensEntrada.forEach(item => {
                    if (item.tipoItem === 'capacete') {
                        resumo += `│  • *${item.quantidade}x Capacete*\n`;
                    } else {
                        resumo += `│  • *${item.quantidade}x ${item.modelo} ${item.cor}*\n`;
                        const partes = [];
                        if (item.chassi) partes.push(`Chassi ${item.chassi}`);
                        if (item.motor) partes.push(`Motor ${item.motor}`);
                        if (partes.length > 0) {
                            resumo += `│    _${partes.join(' · ')}_\n`;
                        }
                    }
                });

                // Bloco consolidado: motivo + recebedor + conferencia
                const motivos = [...new Set(itensEntrada.map(i => i.motivo).filter(Boolean))];
                const recebedores = [...new Set(itensEntrada.map(i => i.recebidoPor).filter(Boolean))];
                const inspNok = itensEntrada.filter(i => i.recebidoPor && !i.inspecaoVisual);
                const cargNok = itensEntrada.filter(i => i.recebidoPor && !i.carregadorOk);
                const acesNok = itensEntrada.filter(i => i.recebidoPor && !i.acessoriosOk);
                const algumComConferencia = itensEntrada.some(i => i.recebidoPor);

                if (motivos.length > 0 || recebedores.length > 0 || algumComConferencia) {
                    resumo += `│\n`;
                }
                if (motivos.length === 1) {
                    resumo += `│ Motivo: ${motivos[0]}\n`;
                } else if (motivos.length > 1) {
                    resumo += `│ Motivos: ${motivos.join('; ')}\n`;
                }
                if (recebedores.length === 1) {
                    resumo += `│ Recebido por: ${recebedores[0]}\n`;
                } else if (recebedores.length > 1) {
                    resumo += `│ Recebido por: ${recebedores.join(', ')}\n`;
                }
                if (algumComConferencia) {
                    if (inspNok.length === 0 && cargNok.length === 0 && acesNok.length === 0) {
                        resumo += `│ Conferência: OK\n`;
                    } else {
                        resumo += `│ ⚠️ DIVERGÊNCIAS NA CONFERÊNCIA:\n`;
                        const fmt = arr => arr.map(i => `${i.modelo} ${i.cor}`).join(', ');
                        if (inspNok.length) resumo += `│   Inspeção visual: ${fmt(inspNok)}\n`;
                        if (cargNok.length) resumo += `│   Carregador: ${fmt(cargNok)}\n`;
                        if (acesNok.length) resumo += `│   Acessórios: ${fmt(acesNok)}\n`;
                    }
                }
            }

            if (itensEntrada.length > 0 && itensSaida.length > 0) {
                resumo += `│\n`;
            }

            // Saídas (motivo/destino/cliente variam por item — mantido por linha)
            if (itensSaida.length > 0) {
                resumo += `│ *SAÍDAS: ${totalSaidas} unidades*\n`;
                itensSaida.forEach(item => {
                    if (item.tipoItem === 'capacete') {
                        resumo += `│  • *${item.quantidade}x Capacete* — ${item.motivo}\n`;
                    } else {
                        resumo += `│  • *${item.quantidade}x ${item.modelo} ${item.cor}* — ${item.motivo}\n`;
                        const partes = [];
                        if (item.chassi) partes.push(`Chassi ${item.chassi}`);
                        if (item.motor) partes.push(`Motor ${item.motor}`);
                        if (partes.length > 0) {
                            resumo += `│    _${partes.join(' · ')}_\n`;
                        }
                    }
                    const motivoLower = (item.motivo || '').toLowerCase();
                    const isVendaOutraLoja = motivoLower.includes('venda de outra loja') || motivoLower.includes('venda outra loja');
                    if (item.lojaDestinoNome) {
                        const rotulo = isVendaOutraLoja ? 'Loja que vendeu' : 'Loja de destino';
                        resumo += `│    → ${rotulo}: ${item.lojaDestinoNome}\n`;
                    }
                    if (item.cliente) {
                        resumo += `│    → Cliente: ${item.cliente}\n`;
                    }
                });
            }
            resumo += `└──────────────────────────────────┘\n`;
        } else {
            resumo += `▸ *O QUE ACONTECEU (Entradas e Saídas)*\n`;
            resumo += `  (nenhuma movimentação registrada)\n`;
        }

        // Salvar resumo no histórico
        salvarResumoNoHistorico(lojaNome, resumo);

        navigator.clipboard.writeText(resumo).then(() => {
            alert('Resumo copiado para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar inventário:', err);
            const textArea = document.createElement('textarea');
            textArea.value = resumo;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Resumo copiado para a área de transferência!');
        });
    } catch (error) {
        console.error('Erro ao gerar resumo do inventário:', error);
        alert('Erro ao copiar resumo. Tente novamente.');
    }
}

// === HISTÓRICO DE RESUMOS DE INVENTÁRIO ===

function salvarResumoNoHistorico(lojaNome, resumo) {
    const historico = JSON.parse(localStorage.getItem('historicoResumos') || '[]');
    historico.push({
        id: `RES-${Date.now()}`,
        loja: lojaNome,
        data: new Date().toISOString(),
        texto: resumo
    });
    // Manter apenas os últimos 50 resumos
    if (historico.length > 50) historico.splice(0, historico.length - 50);
    localStorage.setItem('historicoResumos', JSON.stringify(historico));
}

function abrirModalHistoricoResumos() {
    document.getElementById('modalHistoricoResumos').style.display = 'flex';
    renderizarListaHistoricoResumos();
}

function fecharModalHistoricoResumos() {
    document.getElementById('modalHistoricoResumos').style.display = 'none';
}

function renderizarListaHistoricoResumos() {
    const historico = JSON.parse(localStorage.getItem('historicoResumos') || '[]');
    const limite7dias = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const resumosRecentes = historico
        .filter(r => new Date(r.data).getTime() >= limite7dias)
        .slice()
        .reverse();

    const lista = document.getElementById('listaHistoricoResumos');
    if (resumosRecentes.length === 0) {
        lista.innerHTML = '<div class="empty-state"><p>Nenhum resumo salvo nos últimos 7 dias.</p></div>';
        return;
    }

    lista.innerHTML = resumosRecentes.map(resumo => {
        const data = new Date(resumo.data);
        const dataStr = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const idEscapado = resumo.id.replace(/'/g, "\\'");
        const previewTexto = resumo.texto.substring(0, 100).replace(/\n/g, ' ') + '...';
        return `
        <div class="fatura-dia-item" style="margin-bottom: 8px;">
            <div class="fatura-dia-info">
                <span class="fatura-dia-hora">${horaStr}</span>
                <div class="fatura-dia-detalhes">
                    <strong>${resumo.loja}</strong>
                    <span class="fatura-dia-modelos">${dataStr}</span>
                    <span style="color:#888; font-size:0.8rem;">${previewTexto}</span>
                </div>
            </div>
            <div class="fatura-dia-acoes">
                <button class="btn-fatura-ver" onclick="copiarResumoDoHistorico('${idEscapado}')">📋 Copiar</button>
            </div>
        </div>`;
    }).join('');
}

function copiarResumoDoHistorico(resumoId) {
    const historico = JSON.parse(localStorage.getItem('historicoResumos') || '[]');
    const resumo = historico.find(r => r.id === resumoId);
    if (!resumo) {
        alert('Resumo não encontrado.');
        return;
    }

    navigator.clipboard.writeText(resumo.texto).then(() => {
        mostrarFeedback('Resumo copiado para a área de transferência!', 'sucesso');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = resumo.texto;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        mostrarFeedback('Resumo copiado para a área de transferência!', 'sucesso');
    });
}

function limparHistoricoResumos() {
    if (confirm('Tem certeza que deseja limpar todo o histórico de resumos?')) {
        localStorage.removeItem('historicoResumos');
        renderizarListaHistoricoResumos();
        mostrarFeedback('Histórico de resumos limpo.', 'sucesso');
    }
}

// === HISTÓRICO DE RESUMOS DE VENDAS ===

function salvarResumoVendaNoHistorico(venda, textoResumo) {
    const historico = JSON.parse(localStorage.getItem('historicoResumoVendas') || '[]');
    const modelos = (venda.produtos || []).map(p => p.modelo).join(', ');
    historico.push({
        id: `RESV-${Date.now()}`,
        loja: venda.loja || '',
        cliente: venda.cliente?.nome || 'Cliente',
        modelos: modelos,
        total: venda.total || 0,
        data: new Date().toISOString(),
        texto: textoResumo
    });
    if (historico.length > 50) historico.splice(0, historico.length - 50);
    localStorage.setItem('historicoResumoVendas', JSON.stringify(historico));
}

function abrirModalHistoricoResumoVendas() {
    document.getElementById('modalHistoricoResumoVendas').style.display = 'flex';
    renderizarListaHistoricoResumoVendas();
}

function fecharModalHistoricoResumoVendas() {
    document.getElementById('modalHistoricoResumoVendas').style.display = 'none';
}

function renderizarListaHistoricoResumoVendas() {
    const historico = JSON.parse(localStorage.getItem('historicoResumoVendas') || '[]');
    const limite7dias = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const resumosRecentes = historico
        .filter(r => new Date(r.data).getTime() >= limite7dias)
        .slice()
        .reverse();

    const lista = document.getElementById('listaHistoricoResumoVendas');
    if (resumosRecentes.length === 0) {
        lista.innerHTML = '<div class="empty-state"><p>Nenhum resumo de venda nos últimos 7 dias.</p></div>';
        return;
    }

    lista.innerHTML = resumosRecentes.map(resumo => {
        const data = new Date(resumo.data);
        const dataStr = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const idEscapado = resumo.id.replace(/'/g, "\\'");
        const totalStr = `R$ ${formatarValorMonetario(resumo.total)}`;
        return `
        <div class="fatura-dia-item" style="margin-bottom: 8px;">
            <div class="fatura-dia-info">
                <span class="fatura-dia-hora">${horaStr}</span>
                <div class="fatura-dia-detalhes">
                    <strong>${resumo.cliente}</strong>
                    <span class="fatura-dia-modelos">${resumo.modelos}</span>
                    <span class="fatura-dia-total">${totalStr}</span>
                    <span style="color:#888; font-size:0.8rem;">${dataStr} • ${resumo.loja}</span>
                </div>
            </div>
            <div class="fatura-dia-acoes">
                <button class="btn-fatura-ver" onclick="copiarResumoVendaDoHistorico('${idEscapado}')">📋 Copiar</button>
            </div>
        </div>`;
    }).join('');
}

function copiarResumoVendaDoHistorico(resumoId) {
    const historico = JSON.parse(localStorage.getItem('historicoResumoVendas') || '[]');
    const resumo = historico.find(r => r.id === resumoId);
    if (!resumo) {
        alert('Resumo não encontrado.');
        return;
    }

    navigator.clipboard.writeText(resumo.texto).then(() => {
        mostrarFeedback('Resumo de venda copiado!', 'sucesso');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = resumo.texto;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        mostrarFeedback('Resumo de venda copiado!', 'sucesso');
    });
}

function limparHistoricoResumoVendas() {
    if (confirm('Tem certeza que deseja limpar todo o histórico de resumos de vendas?')) {
        localStorage.removeItem('historicoResumoVendas');
        renderizarListaHistoricoResumoVendas();
        mostrarFeedback('Histórico de resumos de vendas limpo.', 'sucesso');
    }
}

// --- FUNÇÕES DE PAGAMENTO ---

function obterValoresFormasPagamento() {
    const valores = {};
    const formasSelecionadas = Array.from(document.querySelectorAll('input[name="pagamento"]:checked')).map(cb => cb.value);

    // Cartoes: somar de cartoesVenda (preenchidos manualmente para conciliacao)
    const totalCartaoDebito = cartoesVenda.filter(c => c.tipo === 'debito').reduce((s, c) => s + (c.valor || 0), 0);
    const totalCartaoCredito = cartoesVenda.filter(c => c.tipo === 'credito').reduce((s, c) => s + (c.valor || 0), 0);
    if (formasSelecionadas.includes('debito')) valores.debito = totalCartaoDebito;
    if (formasSelecionadas.includes('credito')) valores.credito = totalCartaoCredito;

    const naoCartao = formasSelecionadas.filter(f => f !== 'debito' && f !== 'credito');

    // Se UMA unica forma e nao e cartao, auto-atribuir o total da venda
    if (formasSelecionadas.length === 1 && naoCartao.length === 1) {
        const totalProdutos = produtosDaVenda.reduce((acc, produto) => acc + produto.preco, 0);
        const valorFrete = obterValorNumerico('valorFrete');
        const totalVenda = totalProdutos + valorFrete;
        if (totalVenda > 0) valores[naoCartao[0]] = totalVenda;
        return valores;
    }

    // Multiplas formas: ler campos individuais (apenas nao-cartao)
    naoCartao.forEach(forma => {
        const input = document.getElementById(`valor${forma.charAt(0).toUpperCase() + forma.slice(1)}`);
        if (input) {
            const valorNumerico = parseFloat(input.value.replace(/[R$\s.]/g, '').replace(',', '.'));
            if (!isNaN(valorNumerico) && valorNumerico > 0) {
                valores[forma] = valorNumerico;
            }
        }
    });

    // Garantir que toda forma selecionada tenha entrada (mesmo que 0)
    formasSelecionadas.forEach(forma => {
        if (!(forma in valores)) valores[forma] = 0;
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

// --- DETALHES DE CARTAO (conciliacao financeira) ---

function dataHoraLocalAgora() {
    const now = new Date();
    const tz = now.getTimezoneOffset() * 60000;
    return new Date(now - tz).toISOString().slice(0, 16);
}

function formatarDataHoraCartaoBR(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function descreverCartao(c) {
    const tipo = c.tipo === 'debito' ? 'DÉBITO' : 'CRÉDITO';
    let modalidadeStr = '';
    if (c.tipo === 'credito') {
        modalidadeStr = c.modalidade === 'parc' ? ` ${c.parcelas}x parcelado` : ' à vista';
    }
    const dh = c.dataHora ? ` — ${formatarDataHoraCartaoBR(c.dataHora)}` : '';
    return `${tipo}${modalidadeStr} — R$ ${formatarValorMonetario(c.valor || 0)}${dh}`;
}

function adicionarCartao() {
    const isCredito = document.querySelector('input[name="pagamento"][value="credito"]').checked;
    const isDebito = document.querySelector('input[name="pagamento"][value="debito"]').checked;
    const tipoDefault = (isCredito && !isDebito) ? 'credito' : 'debito';
    cartoesVenda.push({
        tipo: tipoDefault,
        modalidade: 'av',
        parcelas: 1,
        valor: 0,
        dataHora: dataHoraLocalAgora()
    });
    renderCartoes();
    recalcularValoresCartao();
}

function removerCartao(index) {
    cartoesVenda.splice(index, 1);
    renderCartoes();
    recalcularValoresCartao();
}

function renderCartoes() {
    const list = document.getElementById('cartoesList');
    if (!list) return;
    list.innerHTML = cartoesVenda.map((c, i) => `
        <div class="cartao-row" data-index="${i}">
            <div class="cartao-grid">
                <div class="cartao-field">
                    <label>Tipo</label>
                    <select class="cartao-tipo" onchange="atualizarLinhaCartao(${i})">
                        <option value="debito" ${c.tipo === 'debito' ? 'selected' : ''}>Débito</option>
                        <option value="credito" ${c.tipo === 'credito' ? 'selected' : ''}>Crédito</option>
                    </select>
                </div>
                <div class="cartao-field">
                    <label>Modalidade</label>
                    <select class="cartao-modalidade" onchange="atualizarLinhaCartao(${i})" ${c.tipo === 'debito' ? 'disabled' : ''}>
                        <option value="av" ${c.modalidade === 'av' ? 'selected' : ''}>À vista</option>
                        <option value="parc" ${c.modalidade === 'parc' ? 'selected' : ''}>Parcelado</option>
                    </select>
                </div>
                <div class="cartao-field">
                    <label>Parcelas</label>
                    <select class="cartao-parcelas" onchange="atualizarLinhaCartao(${i})" ${(c.tipo !== 'credito' || c.modalidade !== 'parc') ? 'disabled' : ''}>
                        ${Array.from({length: 12}, (_, n) => `<option value="${n+1}" ${String(c.parcelas) === String(n+1) ? 'selected' : ''}>${n+1}x</option>`).join('')}
                    </select>
                </div>
                <div class="cartao-field">
                    <label>Valor</label>
                    <input type="text" class="cartao-valor currency-input" placeholder="R$ 0,00" value="${c.valor > 0 ? formatarValorMonetario(c.valor) : ''}" oninput="atualizarLinhaCartao(${i})">
                </div>
                <div class="cartao-field">
                    <label>Data/Hora</label>
                    <input type="datetime-local" class="cartao-datahora" value="${c.dataHora || ''}" onchange="atualizarLinhaCartao(${i})">
                </div>
                <button type="button" class="btn-remove-cartao" onclick="removerCartao(${i})" title="Remover">✕</button>
            </div>
        </div>
    `).join('');
}

function atualizarLinhaCartao(index) {
    const row = document.querySelectorAll('.cartao-row')[index];
    if (!row || !cartoesVenda[index]) return;

    const tipo = row.querySelector('.cartao-tipo').value;
    let modalidade = row.querySelector('.cartao-modalidade').value;
    let parcelas = parseInt(row.querySelector('.cartao-parcelas').value, 10) || 1;
    const valorStr = row.querySelector('.cartao-valor').value;
    const valor = parseFloat(valorStr.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    const dataHora = row.querySelector('.cartao-datahora').value;

    // Regras: debito sempre av/1x; credito a vista forca 1x
    if (tipo === 'debito') {
        modalidade = 'av';
        parcelas = 1;
    } else if (modalidade === 'av') {
        parcelas = 1;
    }

    cartoesVenda[index] = { tipo, modalidade, parcelas, valor, dataHora };

    const modalidadeEl = row.querySelector('.cartao-modalidade');
    const parcelasEl = row.querySelector('.cartao-parcelas');
    modalidadeEl.disabled = (tipo === 'debito');
    modalidadeEl.value = modalidade;
    parcelasEl.disabled = (tipo !== 'credito' || modalidade !== 'parc');
    parcelasEl.value = String(parcelas);

    recalcularValoresCartao();
}

function recalcularValoresCartao() {
    const totalDebito = cartoesVenda.filter(c => c.tipo === 'debito').reduce((s, c) => s + (c.valor || 0), 0);
    const totalCredito = cartoesVenda.filter(c => c.tipo === 'credito').reduce((s, c) => s + (c.valor || 0), 0);

    const elDebito = document.getElementById('totalCartaoDebito');
    const elCredito = document.getElementById('totalCartaoCredito');
    if (elDebito) elDebito.textContent = `R$ ${formatarValorMonetario(totalDebito)}`;
    if (elCredito) elCredito.textContent = `R$ ${formatarValorMonetario(totalCredito)}`;

    // Sincronizar inputs ocultos legacy (valorDebito/valorCredito alimentam fluxos antigos)
    const valDebInput = document.getElementById('valorDebito');
    const valCredInput = document.getElementById('valorCredito');
    if (valDebInput) valDebInput.value = totalDebito > 0 ? formatarValorMonetario(totalDebito) : '';
    if (valCredInput) valCredInput.value = totalCredito > 0 ? formatarValorMonetario(totalCredito) : '';

    // parcelas legacy: parcelas do primeiro cartao de credito
    const primeiroCredito = cartoesVenda.find(c => c.tipo === 'credito');
    const parcelasInput = document.getElementById('parcelasCredito');
    if (parcelasInput) parcelasInput.value = primeiroCredito ? String(primeiroCredito.parcelas) : '1';

    calcularTotalFormasPagamento();
}

// --- HELPER DE ESCAPING HTML (compartilhado) ---

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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
        const pagadorEscaped = escapeHtml(p.pagador);
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

// --- DETALHES INFORMADOS AO CLIENTE (aceite / pre-pos-venda) ---

function handleDetalhesAceiteChange() {
    const houve = document.getElementById('houveDetalhesAceite').value;
    document.getElementById('detalhesAceiteFields').style.display = houve === 'sim' ? 'block' : 'none';
}

function coletarAceiteDetalhes() {
    const houve = document.getElementById('houveDetalhesAceite')?.value || 'nao';
    if (houve !== 'sim') {
        return { houve: 'nao' };
    }
    const descricao = (document.getElementById('detalhesAceiteDescricao')?.value || '').trim();
    const descontoStr = document.getElementById('detalhesAceiteDesconto')?.value || '';
    const desconto = parseFloat(descontoStr.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    const confirmadoPor = (document.getElementById('detalhesAceiteCliente')?.value || '').trim();
    const cienciaConfirmada = !!document.getElementById('detalhesAceiteCiencia')?.checked;
    return {
        houve: 'sim',
        descricao,
        desconto,
        confirmadoPor,
        cienciaConfirmada,
        timestamp: new Date().toISOString()
    };
}

function temAceiteDetalhes(aceite) {
    return aceite && aceite.houve === 'sim' && (aceite.descricao || '').trim().length > 0;
}

function gerarTextoAceiteWhatsApp(aceite) {
    if (!temAceiteDetalhes(aceite)) return '';
    let txt = `\n*DETALHES INFORMADOS AO CLIENTE*\n`;
    txt += `${aceite.descricao}\n`;
    if (aceite.desconto > 0) txt += `*Desconto concedido:* R$ ${formatarValorMonetario(aceite.desconto)}\n`;
    if (aceite.confirmadoPor) txt += `*Confirmado por:* ${aceite.confirmadoPor}\n`;
    if (aceite.cienciaConfirmada) txt += `_Cliente declarou ciência destes detalhes no momento da compra._\n`;
    return txt;
}

function gerarTextoAceitePlano(aceite) {
    if (!temAceiteDetalhes(aceite)) return '';
    let txt = `\nDETALHES INFORMADOS AO CLIENTE\n`;
    txt += `${aceite.descricao}\n`;
    if (aceite.desconto > 0) txt += `Desconto concedido: R$ ${formatarValorMonetario(aceite.desconto)}\n`;
    if (aceite.confirmadoPor) txt += `Confirmado por: ${aceite.confirmadoPor}\n`;
    if (aceite.cienciaConfirmada) txt += `Cliente declarou ciência destes detalhes no momento da compra.\n`;
    return txt;
}

function gerarHTMLAceite(aceite) {
    if (!temAceiteDetalhes(aceite)) return '';
    let h = `<h3 style="margin-top:1.5rem;border-bottom:1px solid #eee;padding-bottom:0.5rem;">Detalhes Informados ao Cliente</h3>`;
    h += `<p>${aceite.descricao.replace(/\n/g, '<br>')}</p>`;
    if (aceite.desconto > 0) h += `<p><strong>Desconto concedido:</strong> R$ ${formatarValorMonetario(aceite.desconto)}</p>`;
    if (aceite.confirmadoPor) h += `<p><strong>Confirmado por:</strong> ${aceite.confirmadoPor}</p>`;
    if (aceite.cienciaConfirmada) h += `<p><em>Cliente declarou ciência destes detalhes no momento da compra.</em></p>`;
    return h;
}

// --- FUNÇÃO DE BUSCA DE VENDEDOR ---
function configurarBuscaVendedor() {
    const vendedorInput = document.getElementById('vendedor');
    const suggestionsDiv = document.getElementById('vendedorSuggestions');
    const matriculaInput = document.getElementById('matriculaVendedor');

    if (!vendedorInput || !suggestionsDiv) {
        console.error('Elementos de vendedor não encontrados!');
        return;
    }

    let selectedIndex = -1;

    // --- Busca por MATRÍCULA (campo separado) ---
    if (matriculaInput) {
        matriculaInput.addEventListener('input', function() {
            const mat = this.value.trim();

            // Só buscar quando tiver 4 dígitos
            if (mat.length === 4 && dadosMatriculas[mat]) {
                const dados = dadosMatriculas[mat];

                // Se for array (matrícula duplicada), mostrar opções no suggestions
                if (Array.isArray(dados)) {
                    suggestionsDiv.innerHTML = '';
                    dados.forEach(v => {
                        const suggestionDiv = document.createElement('div');
                        suggestionDiv.className = 'vendedor-suggestion';
                        suggestionDiv.innerHTML = `<strong>${v.nome}</strong> <small style="opacity:0.7">(${v.loja})</small>`;
                        suggestionDiv.addEventListener('click', () => {
                            vendedorInput.value = v.nome;
                            suggestionsDiv.classList.remove('show');
                        });
                        suggestionsDiv.appendChild(suggestionDiv);
                    });
                    suggestionsDiv.classList.add('show');
                } else {
                    // Matrícula única - preencher direto
                    vendedorInput.value = dados.nome;
                    suggestionsDiv.classList.remove('show');
                }
            } else if (mat.length === 4) {
                // Matrícula não encontrada - não travar, deixar preencher manualmente
                suggestionsDiv.classList.remove('show');
            }
        });
    }

    // --- Busca por NOME (campo vendedor) ---
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

        // Buscar por matrícula se digitou 4 números no campo de nome
        if (/^\d{4}$/.test(valor) && dadosMatriculas[valor]) {
            const dados = dadosMatriculas[valor];
            const lista = Array.isArray(dados) ? dados : [dados];
            lista.forEach(v => {
                const suggestionDiv = document.createElement('div');
                suggestionDiv.className = 'vendedor-suggestion';
                suggestionDiv.innerHTML = `<strong>${v.nome}</strong> <small style="opacity:0.7">(Mat: ${valor} - ${v.loja})</small>`;
                suggestionDiv.addEventListener('click', () => {
                    vendedorInput.value = v.nome;
                    if (matriculaInput) matriculaInput.value = valor;
                    suggestionsDiv.classList.remove('show');
                });
                suggestionsDiv.appendChild(suggestionDiv);
            });
            suggestionsDiv.classList.add('show');
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
                    // Preencher matrícula automaticamente se encontrar
                    if (matriculaInput) {
                        const mat = Object.entries(dadosMatriculas).find(([k, v]) => {
                            if (Array.isArray(v)) return v.some(item => item.nome === vendedor);
                            return v.nome === vendedor;
                        });
                        if (mat) matriculaInput.value = mat[0];
                    }
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

function limparFormularioVenda(skipConfirm = false) {
    if (!skipConfirm && (produtosDaVenda.length > 0 || document.getElementById('nomeCliente').value.trim() !== '')) {
        if (!confirm('Tem certeza que deseja limpar todos os dados do formulário? Esta ação não pode ser desfeita.')) {
            return;
        }
    }

    document.getElementById('vendaForm').reset();
    produtosDaVenda = [];
    cartoesVenda = [];
    renderCartoes();
    recalcularValoresCartao();
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
    handleDetalhesAceiteChange();
    definirDataAtual();

    // Limpar estados de validação inline
    document.querySelectorAll('.campo-invalido, .campo-valido').forEach(el => {
        el.classList.remove('campo-invalido', 'campo-valido');
    });
    document.querySelectorAll('.campo-aviso').forEach(el => {
        el.classList.remove('visivel');
    });

    // Resetar proteção anti-duplicidade
    vendaJaEnviada = false;
    wizardEtapaAtual = 1;
    wizardEnviadoParaBling = false;
    blingEnvioEmAndamento = false;

    // Reabilitar botão de registrar venda
    const btnRegistrar = document.querySelector('.btn-registrar-venda');
    if (btnRegistrar) {
        btnRegistrar.disabled = false;
        btnRegistrar.innerHTML = '<span class="btn-icon">✅</span> Registrar Venda';
    }
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
    const isDebito = document.querySelector('input[name="pagamento"][value="debito"]').checked;
    const isOutros = document.querySelector('input[name="pagamento"][value="outros"]').checked;

    document.getElementById('outrosPagamentoGroup').style.display = isOutros ? 'block' : 'none';

    // Detalhes de cartao: aparece sempre que debito ou credito esta marcado
    const cartoesGroup = document.getElementById('cartoesGroup');
    if (cartoesGroup) {
        const showCartoes = isCredito || isDebito;
        cartoesGroup.style.display = showCartoes ? 'block' : 'none';
        if (showCartoes && cartoesVenda.length === 0) {
            adicionarCartao();
        } else if (!showCartoes && cartoesVenda.length > 0) {
            cartoesVenda = [];
            renderCartoes();
            recalcularValoresCartao();
        }
    }

    const valoresGroup = document.getElementById('valoresFormasPagamento');
    valoresGroup.style.display = checkedForms.length > 1 ? 'block' : 'none';

    // Apenas formas nao-cartao tem valor-group visivel (debito/credito vem da secao de cartoes)
    ['pix', 'pos', 'dinheiro', 'crediario', 'outros'].forEach(forma => {
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

// Sanitiza os dados antes de enviar ao Make, garantindo que nenhum campo seja null/undefined
function sanitizarDadosParaEnvio(tipo, dados) {
    if (tipo === 'vendas' || tipo === 'conciliacaoCartoes') {
        return {
            id: dados.id || `VNDA-${Date.now()}`,
            loja: dados.loja || '',
            vendedor: dados.vendedor || '',
            matriculaVendedor: dados.matriculaVendedor || '',
            dataVenda: dados.dataVenda || '',
            cliente: {
                nome: dados.cliente?.nome || '',
                cpf: dados.cliente?.cpf || '',
                cnpj: dados.cliente?.cnpj || '',
                telefone: dados.cliente?.telefone || '',
                email: dados.cliente?.email || '',
                endereco: {
                    cep: dados.cliente?.endereco?.cep || '',
                    rua: dados.cliente?.endereco?.rua || '',
                    numero: dados.cliente?.endereco?.numero || '',
                    bairro: dados.cliente?.endereco?.bairro || '',
                    cidade: dados.cliente?.endereco?.cidade || '',
                    estado: dados.cliente?.endereco?.estado || ''
                }
            },
            produtos: (dados.produtos || []).map(p => ({
                id: p.id || 0,
                modelo: p.modelo || '',
                cor: p.cor || '',
                chassi: p.chassi || '',
                motor: p.motor || '',
                preco: p.preco || 0,
                capacete: p.capacete || 'nao',
                corCapacete: p.corCapacete || ''
            })),
            pagamento: {
                formas: dados.pagamento?.formas || [],
                valores: dados.pagamento?.valores || {},
                parcelas: dados.pagamento?.parcelas || '1',
                cartoes: Array.isArray(dados.pagamento?.cartoes) ? dados.pagamento.cartoes : [],
                outros: dados.pagamento?.outros || '',
                observacoes: dados.pagamento?.observacoes || ''
            },
            entrega: {
                tipo: dados.entrega?.tipo || 'retirada',
                prazo: dados.entrega?.prazo || '',
                origem: dados.entrega?.origem || 'propria_loja',
                localSaida: dados.entrega?.localSaida || dados.loja || ''
            },
            aceiteDetalhes: dados.aceiteDetalhes && dados.aceiteDetalhes.houve === 'sim' ? {
                houve: 'sim',
                descricao: dados.aceiteDetalhes.descricao || '',
                desconto: dados.aceiteDetalhes.desconto || 0,
                confirmadoPor: dados.aceiteDetalhes.confirmadoPor || '',
                cienciaConfirmada: !!dados.aceiteDetalhes.cienciaConfirmada,
                timestamp: dados.aceiteDetalhes.timestamp || ''
            } : { houve: 'nao' },
            valorFrete: dados.valorFrete || 0,
            total: dados.total || 0
        };
    }

    if (tipo === 'inventario') {
        return {
            id: dados.id || `INV-${Date.now()}`,
            loja: dados.loja || '',
            data: dados.data || new Date().toISOString(),
            totalItens: dados.totalItens || 0,
            itens: (dados.itens || []).map(item => ({
                tipo: item.tipo || '',
                modelo: item.modelo || '',
                cor: item.cor || '',
                quantidade: item.quantidade || 0,
                chassi: item.chassi || '',
                motor: item.motor || '',
                observacao: item.observacao || ''
            }))
        };
    }

    return dados;
}

// Gera fingerprint baseado no CONTEÚDO da venda (não no ID/timestamp)
function gerarFingerprintVenda(dados) {
    const partes = [
        dados.cliente?.nome || '',
        dados.cliente?.cpf || dados.cliente?.cnpj || '',
        dados.dataVenda || '',
        String(dados.total || 0),
        (dados.produtos || []).map(p => `${p.modelo}-${p.cor}`).sort().join('|')
    ];
    // Hash simples mas eficaz
    const str = partes.join('::');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return 'FP' + Math.abs(hash).toString(36);
}

// Verifica se uma venda com mesmo conteúdo já foi enviada recentemente
function vendaJaEnviadaAoWebhook(dados) {
    if (!dados || !dados.cliente) return false;
    const fingerprint = gerarFingerprintVenda(dados);
    const enviadas = JSON.parse(localStorage.getItem('webhookEnviados') || '{}');
    const agora = Date.now();
    // Limpar entradas com mais de 24h
    for (const fp in enviadas) {
        if (agora - enviadas[fp] > 24 * 60 * 60 * 1000) {
            delete enviadas[fp];
        }
    }
    localStorage.setItem('webhookEnviados', JSON.stringify(enviadas));
    return !!enviadas[fingerprint];
}

// Marca a venda como enviada ao webhook
function marcarVendaEnviadaWebhook(dados) {
    if (!dados || !dados.cliente) return;
    const fingerprint = gerarFingerprintVenda(dados);
    const enviadas = JSON.parse(localStorage.getItem('webhookEnviados') || '{}');
    enviadas[fingerprint] = Date.now();
    localStorage.setItem('webhookEnviados', JSON.stringify(enviadas));
}

async function enviarParaAutomacao(tipo, dados) {
    const url = POWER_AUTOMATE_URLS[tipo];
    if (!url || url.includes('URL_DO_FLUXO')) {
        console.log(`Automação para '${tipo}' não configurada.`);
        return false;
    }

    // Proteção anti-duplicidade: verificar se venda com mesmo conteúdo já foi enviada
    if (tipo === 'vendas' && vendaJaEnviadaAoWebhook(dados)) {
        console.warn('Venda duplicada bloqueada pelo fingerprint:', dados.id);
        return true; // Retorna true pois a venda original já foi enviada
    }

    // Sanitizar dados para garantir que nenhum campo vai como null/undefined
    const dadosSanitizados = sanitizarDadosParaEnvio(tipo, dados);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosSanitizados),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok && tipo === 'vendas') {
            marcarVendaEnviadaWebhook(dados);
        }

        return response.ok;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`Timeout ao enviar dados para automação (${tipo})`);
            // Em caso de timeout, marcar como enviada pois o Make pode ter recebido
            if (tipo === 'vendas') marcarVendaEnviadaWebhook(dados);
        } else {
            console.error(`Erro ao enviar dados para automação (${tipo}):`, error);
        }
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
        // Extrair mensagem de erro mais detalhada do Bling
        const blingError = responseData.details?.error;
        const errorFields = Array.isArray(blingError?.fields)
            ? blingError.fields.map(f => f.msg || f.message || JSON.stringify(f)).join('; ')
            : '';
        const errorMsg = blingError?.message || responseData.error || `Erro ${response.status}`;
        throw new Error(errorFields ? `${errorMsg} — ${errorFields}` : errorMsg);
    }

    return responseData;
}

// Buscar ou criar contato no Bling
async function buscarOuCriarContato(cliente) {
    try {
        // Tentar buscar por CPF/CNPJ (com validação preventiva)
        const documento = cliente.cnpj || cliente.cpf;
        let docLimpo = documento ? documento.replace(/\D/g, '') : '';

        // Se for CPF (11 dígitos), validar antes de enviar ao Bling
        if (docLimpo.length === 11 && !validarCPF(docLimpo)) {
            console.warn('CPF inválido removido antes do envio ao Bling:', docLimpo);
            docLimpo = '';
        }

        // Validar telefone — se incompleto, não enviar
        const telLimpo = (cliente.telefone || '').replace(/\D/g, '');
        if (telLimpo && telLimpo.length < 10) {
            console.warn('Telefone incompleto removido antes do envio ao Bling:', telLimpo);
        }

        if (docLimpo) {
            try {
                // API v3 do Bling usa parâmetro 'pesquisa' para buscar por CPF/CNPJ
                const busca = await blingRequest(`/contatos?pesquisa=${docLimpo}`);
                if (busca.data && busca.data.length > 0) {
                    console.log(`Contato encontrado por pesquisa: ID ${busca.data[0].id}`);
                    return busca.data[0].id;
                }
            } catch (e) {
                console.log('Busca de contato por CPF/CNPJ falhou, tentando criar:', e.message);
            }
        }

        // Criar novo contato
        const tipoContato = (cliente.cnpj && cliente.cnpj.replace(/\D/g, '').length === 14) ? 'J' : 'F';
        const telefone = (cliente.telefone || '').replace(/\D/g, '');
        const cep = (cliente.endereco?.cep || '').replace(/\D/g, '');

        const novoContato = {
            nome: (cliente.nome || 'Cliente').toUpperCase(),
            tipo: tipoContato,
            situacao: 'A',
            indicadorIe: 9 // 9 = Não contribuinte (padrão para PF e vendas ao consumidor)
        };

        // Só incluir telefone/celular se preenchidos e com tamanho válido (10-11 dígitos)
        if (telefone && telefone.length >= 10) {
            novoContato.telefone = telefone;
            novoContato.celular = telefone;
        }

        // Só incluir documento se existir e for válido
        if (docLimpo) {
            novoContato.numeroDocumento = docLimpo;
        }

        // Só incluir email se existir
        if (cliente.email) {
            novoContato.email = cliente.email;
        }

        // Só incluir endereço se tiver pelo menos rua preenchida
        if (cliente.endereco?.rua) {
            novoContato.endereco = {
                geral: {
                    endereco: cliente.endereco.rua || '',
                    numero: cliente.endereco.numero || 'S/N',
                    bairro: cliente.endereco.bairro || '',
                    municipio: cliente.endereco.cidade || '',
                    uf: cliente.endereco.estado || '',
                    cep: cep || ''
                }
            };
        }

        console.log('Criando contato no Bling:', JSON.stringify(novoContato, null, 2));

        try {
            const resultado = await blingRequest('/contatos', 'POST', novoContato);
            console.log('Contato criado com sucesso:', resultado.data?.id);
            return resultado.data.id;
        } catch (criarError) {
            // Se falhou porque CPF já existe, buscar o contato existente
            if (docLimpo && criarError.message && (
                criarError.message.toLowerCase().includes('cpf') ||
                criarError.message.toLowerCase().includes('cnpj') ||
                criarError.message.toLowerCase().includes('já está cadastrado') ||
                criarError.message.toLowerCase().includes('ja esta cadastrado') ||
                criarError.message.toLowerCase().includes('documento já cadastrado') ||
                criarError.message.toLowerCase().includes('documento ja cadastrado')
            )) {
                console.log('CPF/CNPJ já cadastrado no Bling, buscando contato existente...');
                try {
                    const buscaRetry = await blingRequest(`/contatos?pesquisa=${docLimpo}`);
                    if (buscaRetry.data && buscaRetry.data.length > 0) {
                        console.log(`Contato existente encontrado na segunda busca: ID ${buscaRetry.data[0].id}`);
                        return buscaRetry.data[0].id;
                    }
                } catch (retryError) {
                    console.error('Falha na segunda busca de contato:', retryError.message);
                }
            }
            throw criarError;
        }

    } catch (error) {
        console.error('Erro ao buscar/criar contato:', error);
        throw new Error(`Erro ao salvar contato: ${error.message}`);
    }
}

// Enviar venda para o Bling
async function enviarVendaParaBling(venda) {
    // Proteção contra envio duplicado ao Bling
    if (wizardEnviadoParaBling) {
        console.log('Venda já enviada ao Bling, ignorando envio duplicado');
        return;
    }
    if (blingEnvioEmAndamento) {
        console.log('Envio ao Bling já em andamento, ignorando');
        return;
    }
    blingEnvioEmAndamento = true;

    try {
        mostrarFeedback('Enviando para emissão...', 'sucesso');

        // 1. Buscar ou criar contato
        const contatoId = await buscarOuCriarContato(venda.cliente);

        // 2. Detectar se é operação interestadual (cliente fora de SC - matriz em Santa Catarina)
        const estadoCliente = venda.cliente?.endereco?.estado?.toUpperCase() || '';
        const isInterestadual = estadoCliente && estadoCliente !== 'SC';
        const cfopSugerido = isInterestadual ? '6102' : '5102';
        console.log(`Estado cliente: ${estadoCliente}, Interestadual: ${isInterestadual}, CFOP: ${cfopSugerido}`);

        // 4. Montar itens do pedido - mapeamento fiscal por modelo
        const itensPedido = [];
        for (let i = 0; i < venda.produtos.length; i++) {
            const produto = venda.produtos[i];
            const fiscal = dadosFiscais[produto.modelo];

            if (fiscal) {
                // Modelo com mapeamento fiscal - distribuição por percentual do valor total
                const precoBase = produto.preco; // Preço total do produto (sem frete)
                console.log(`Mapeamento fiscal para ${produto.modelo}: ${fiscal.itens.length} itens, preço base R$${precoBase}`);

                // Capacete: R$0,01 simbólico sai do valor total do produto
                const valorCapacete = (produto.capacete === 'sim' && fiscal.capacete) ? (fiscal.capacete.valor || 0.01) : 0;
                const precoItens = Math.round((precoBase - valorCapacete) * 100) / 100;

                // Calcular valor unitário de cada item pelo percentual (sobre preço sem capacete)
                let indicePrincipal = 0;
                const itensCalculados = fiscal.itens.map((itemFiscal, j) => {
                    const valorUnitario = Math.round(precoItens * itemFiscal.percentual * 100) / 100;
                    if (itemFiscal.principal) indicePrincipal = j;
                    return { ...itemFiscal, valorCalculado: valorUnitario };
                });

                // Somar total e ajustar diferença de arredondamento no item principal
                const totalCalculado = itensCalculados.reduce((sum, ic) => {
                    return sum + Math.round(ic.valorCalculado * ic.quantidade * 100) / 100;
                }, 0);
                const diferenca = Math.round((precoItens - totalCalculado) * 100) / 100;
                if (diferenca !== 0) {
                    itensCalculados[indicePrincipal].valorCalculado =
                        Math.round((itensCalculados[indicePrincipal].valorCalculado + diferenca) * 100) / 100;
                    console.log(`Ajuste de arredondamento: R$${diferenca.toFixed(2)} no item principal`);
                }

                // Criar itens do pedido com valores calculados
                for (const itemCalc of itensCalculados) {
                    const item = {
                        descricao: itemCalc.descricao,
                        unidade: itemCalc.unidade,
                        quantidade: itemCalc.quantidade,
                        valor: itemCalc.valorCalculado
                    };

                    // Vincular ao produto no Bling por código ou nome
                    if (itemCalc.codigo) {
                        item.codigo = itemCalc.codigo;
                        try {
                            const busca = await blingRequest(`/produtos?codigo=${encodeURIComponent(itemCalc.codigo)}`);
                            if (busca.data && busca.data.length > 0) {
                                item.produto = { id: busca.data[0].id };
                                console.log(`Vinculado por código: ${itemCalc.codigo} -> ID ${busca.data[0].id}`);
                            }
                        } catch (e) {
                            console.log(`Produto não encontrado no Bling por código: ${itemCalc.codigo}`);
                        }
                    } else {
                        try {
                            const busca = await blingRequest(`/produtos?nome=${encodeURIComponent(itemCalc.descricao)}`);
                            if (busca.data && busca.data.length > 0) {
                                item.produto = { id: busca.data[0].id };
                                item.codigo = busca.data[0].codigo || '';
                                console.log(`Vinculado por nome: ${itemCalc.descricao} -> ID ${busca.data[0].id}`);
                            }
                        } catch (e) {
                            console.log(`Produto não encontrado no Bling: ${itemCalc.descricao}`);
                        }
                    }

                    itensPedido.push(item);
                    console.log(`  ${itemCalc.descricao}: ${itemCalc.quantidade}x R$${itemCalc.valorCalculado.toFixed(2)} (${(itemCalc.percentual * 100).toFixed(2)}%)`);
                }

                // Capacete (se a venda inclui capacete)
                if (produto.capacete === 'sim' && fiscal.capacete) {
                    const capItem = {
                        descricao: fiscal.capacete.descricao,
                        unidade: fiscal.capacete.unidade,
                        quantidade: fiscal.capacete.quantidade,
                        valor: fiscal.capacete.valor || 0.01
                    };

                    // Buscar capacete no Bling pelo nome exato
                    try {
                        const busca = await blingRequest(`/produtos?nome=${encodeURIComponent(fiscal.capacete.descricao)}`);
                        if (busca.data && busca.data.length > 0) {
                            capItem.produto = { id: busca.data[0].id };
                            capItem.codigo = busca.data[0].codigo || '';
                            console.log(`Capacete vinculado: ${fiscal.capacete.descricao} -> ID ${busca.data[0].id}`);
                        }
                    } catch (e) {
                        console.log('Capacete não encontrado no Bling');
                    }

                    itensPedido.push(capItem);
                }

            } else {
                // Modelo sem mapeamento fiscal: enviar como item único SEM cor no nome
                const descricaoBling = `NXT Autopropelido ${produto.modelo}`;
                const itemPedido = {
                    descricao: descricaoBling,
                    unidade: 'UN',
                    quantidade: 1,
                    valor: produto.preco
                };

                try {
                    const busca = await blingRequest(`/produtos?nome=${encodeURIComponent(descricaoBling)}`);
                    if (busca.data && busca.data.length > 0) {
                        itemPedido.produto = { id: busca.data[0].id };
                        itemPedido.codigo = busca.data[0].codigo || '';
                    }
                } catch (e) {
                    console.log('Produto não encontrado no Bling, usando descrição manual');
                }

                if (!itemPedido.codigo) {
                    itemPedido.codigo = produto.chassi || `MOTO-${i + 1}`;
                }

                itensPedido.push(itemPedido);

                // Capacete para modelos sem mapeamento fiscal
                if (produto.capacete === 'sim') {
                    const capItem = {
                        descricao: 'CAPACETE DE PLASTICO PVC',
                        unidade: 'UN',
                        quantidade: 1,
                        valor: 0.01
                    };
                    try {
                        const busca = await blingRequest(`/produtos?nome=${encodeURIComponent('CAPACETE DE PLASTICO PVC')}`);
                        if (busca.data && busca.data.length > 0) {
                            capItem.produto = { id: busca.data[0].id };
                            capItem.codigo = busca.data[0].codigo || '';
                        }
                    } catch (e) {
                        console.log('Capacete não encontrado no Bling');
                    }
                    itensPedido.push(capItem);
                }
            }
        }

        // 5. Frete NÃO vai como item - vai apenas no campo transporte.valorFrete

        // 6. Montar informações adicionais com dados dos produtos e garantia
        let infoProdutos = '';
        venda.produtos.forEach((produto, index) => {
            infoProdutos += `\nModelo: ${produto.modelo}
Cor: ${produto.cor}
Chassi: ${produto.chassi || 'N/A'}
Motor: ${produto.motor || 'N/A'}`;
            if (produto.capacete === 'sim') {
                infoProdutos += `\nCor do Capacete: ${produto.corCapacete || 'Não informada'}`;
            }
            if (index < venda.produtos.length - 1) infoProdutos += '\n---';
        });

        const anoAtual = new Date().getFullYear();
        let observacoesCompletas = `O uso de equipamentos de segurança é obrigatório.
Fabricante NXT${infoProdutos}
Ano ${anoAtual}

Informações de Garantia do Fabricante:
Quadro: Garantia de 2 (dois) anos contra defeitos de fabricação, contados a partir da data da nota fiscal.
Motor: Garantia de 2 (dois) anos contra defeitos de fabricação, contados a partir da data da nota fiscal.
Bateria: Garantia de 6 (seis) meses contra defeitos de fabricação, contados a partir da data da nota fiscal.

Observação: As garantias acima referem-se exclusivamente a defeitos de fabricação. Danos causados por uso inadequado, acidentes ou desgaste natural não estão cobertos.`;

        // Detalhes informados ao cliente — registrados na NF para futura conferencia do SAC
        const aceiteTxt = gerarTextoAceitePlano(venda.aceiteDetalhes);
        if (aceiteTxt) {
            observacoesCompletas += `\n\n${aceiteTxt.trim()}`;
        }

        // 7. Calcular frete para transporte
        const valorFrete = venda.valorFrete || 0;

        // 8. Montar pedido de venda
        const pedido = {
            contato: { id: contatoId },
            data: venda.dataVenda,
            numero: venda.id.replace('VNDA-', ''),
            numeroLoja: venda.id,
            vendedor: { nome: venda.vendedor },
            naturezaOperacao: { id: 15105967674 }, // Venda de mercadoria interestadual PF
            itens: itensPedido,
            transporte: {
                fretePorConta: venda.entrega.tipo === 'domicilio' ? 1 : 0, // 0=Emitente, 1=Destinatário
                frete: valorFrete
            },
            observacoes: observacoesCompletas
        };

        // 8. Criar pedido de venda
        console.log('Enviando pedido ao Bling:', JSON.stringify(pedido, null, 2));
        const resultadoPedido = await blingRequest('/pedidos/vendas', 'POST', pedido);
        const pedidoId = resultadoPedido.data.id;

        mostrarFeedback(`Pedido #${pedidoId} enviado! O sistema de notas recebeu seu pedido, a NF-e será gerada o mais breve possível.`, 'sucesso');

        return pedidoId;

    } catch (error) {
        console.error('Erro ao enviar para Bling:', error);
        mostrarFeedback(`Erro: ${error.message}`, 'erro');
        blingEnvioEmAndamento = false;
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
        'crediario': 99,    // Crediário
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

// ========================================
// WIZARD DE PÓS-VENDA
// ========================================

// Iniciar o wizard de pós-venda
function iniciarWizardPosVenda(venda, enviadoParaBling) {
    wizardEtapaAtual = 1;
    wizardEnviadoParaBling = enviadoParaBling;

    // Preencher o resumo no textarea
    const textArea = document.getElementById('textoResumoModal');
    if (textArea) {
        textArea.value = ultimoResumoVenda;
    }

    // Atualizar checklist de envio
    const checkBling = document.getElementById('checkBling');
    if (checkBling) {
        if (enviadoParaBling) {
            checkBling.classList.add('done');
            checkBling.querySelector('.checklist-icon').textContent = '✓';
        } else {
            checkBling.classList.remove('done');
            checkBling.querySelector('.checklist-icon').textContent = '⏳';
        }
    }

    // Preencher preview da fatura na etapa 2
    preencherPreviewFatura(venda);

    // Resetar progress bar
    atualizarWizardProgress(1);

    // Mostrar etapa 1, esconder outras
    mostrarEtapaWizard(1);

    // Abrir o modal
    document.getElementById('modalWizardVenda').style.display = 'flex';
}

// Preencher preview resumido da fatura
function preencherPreviewFatura(venda) {
    const preview = document.getElementById('wizardFaturaPreview');
    if (!preview || !venda) return;

    const dataFormatada = new Date(venda.dataVenda).toLocaleDateString('pt-BR', {timeZone: 'UTC'});

    let produtosLista = venda.produtos.map(p => `${p.modelo} ${p.cor}`).join(', ');

    preview.innerHTML = `
        <p><strong>Cliente:</strong> ${venda.cliente.nome}</p>
        <p><strong>Telefone:</strong> ${venda.cliente.telefone}</p>
        <p><strong>Produtos:</strong> ${produtosLista}</p>
        <p><strong>Total:</strong> R$ ${formatarValorMonetario(venda.total)}</p>
        <p><strong>Data:</strong> ${dataFormatada}</p>
    `;
}

// Atualizar progress bar do wizard
function atualizarWizardProgress(etapa) {
    const steps = document.querySelectorAll('.wizard-step');
    const lines = document.querySelectorAll('.wizard-progress-line');

    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNum < etapa) {
            step.classList.add('completed');
        } else if (stepNum === etapa) {
            step.classList.add('active');
        }
    });

    lines.forEach((line, index) => {
        if (index < etapa - 1) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    });
}

// Mostrar uma etapa específica do wizard
function mostrarEtapaWizard(etapa) {
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`wizardStep${i}`);
        if (stepEl) {
            stepEl.style.display = (i === etapa) ? 'block' : 'none';
        }
    }
}

// Avançar para próxima etapa
function wizardAvancar() {
    if (wizardEtapaAtual < 4) {
        wizardEtapaAtual++;
        atualizarWizardProgress(wizardEtapaAtual);
        mostrarEtapaWizard(wizardEtapaAtual);

        // Na etapa 4, atualizar checklist final
        if (wizardEtapaAtual === 4) {
            atualizarChecklistFinal();
        }
    }
}

// Voltar para etapa anterior
function wizardVoltar() {
    if (wizardEtapaAtual > 1) {
        wizardEtapaAtual--;
        atualizarWizardProgress(wizardEtapaAtual);
        mostrarEtapaWizard(wizardEtapaAtual);
    }
}

// Atualizar checklist final na etapa 4
function atualizarChecklistFinal() {
    const checkBlingFinal = document.getElementById('checkBlingFinal');
    if (checkBlingFinal) {
        if (wizardEnviadoParaBling) {
            checkBlingFinal.style.display = 'flex';
        } else {
            checkBlingFinal.style.display = 'none';
        }
    }
}

// Enviar fatura por WhatsApp (monta a fatura como texto na mensagem)
function enviarFaturaWhatsApp() {
    if (!ultimaVendaRegistrada) {
        mostrarFeedback('Nenhuma venda registrada', 'erro');
        return;
    }

    const venda = ultimaVendaRegistrada;
    const telefone = venda.cliente.telefone.replace(/\D/g, '');
    const nomeCliente = venda.cliente.nome.split(' ')[0];
    const dataVenda = new Date(venda.dataVenda).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    const dataEmissao = new Date().toLocaleDateString('pt-BR');

    // Montar formas de pagamento
    const _nomeForma = f => f === 'pos' ? 'PIX POS' : f === 'pix' ? 'PIX' : f === 'debito' ? 'DÉBITO' : f === 'credito' ? 'CRÉDITO' : f === 'crediario' ? 'CREDIÁRIO' : f.toUpperCase();
    const _valoresEntries = Object.entries(venda.pagamento.valores || {});
    const _naoCartao = _valoresEntries.filter(([f]) => f !== 'debito' && f !== 'credito');
    const _cartoesArr = Array.isArray(venda.pagamento.cartoes) ? venda.pagamento.cartoes : [];

    let pagamentoTexto = '';
    if (_cartoesArr.length > 0) {
        if (_naoCartao.length > 0) {
            pagamentoTexto = _naoCartao.map(([f, v]) => `${_nomeForma(f)}: R$ ${formatarValorMonetario(v)}`).join('\n');
        }
        const detalhes = _cartoesArr.map(c => `  ${descreverCartao(c)}`).join('\n');
        pagamentoTexto += (pagamentoTexto ? '\n' : '') + detalhes;
    } else if (_valoresEntries.length > 0) {
        pagamentoTexto = _valoresEntries.map(([f, v]) => `${_nomeForma(f)}: R$ ${formatarValorMonetario(v)}`).join('\n');
        if (venda.pagamento.formas.includes('credito')) {
            pagamentoTexto += ` (${venda.pagamento.parcelas}x)`;
        }
    } else {
        pagamentoTexto = venda.pagamento.formas.map(f => _nomeForma(f)).join(', ');
    }

    // Montar lista de produtos
    let produtosTexto = '';
    venda.produtos.forEach((p, i) => {
        produtosTexto += `${i + 1}. *${p.modelo}* - ${p.cor}\n`;
        produtosTexto += `   Chassi: ${p.chassi || 'N/A'} | Motor: ${p.motor || 'N/A'}\n`;
        produtosTexto += `   Valor: R$ ${formatarValorMonetario(p.preco)}\n`;
    });

    // Entrega
    let entregaTexto = venda.entrega.tipo === 'retirada' ? 'Retirado pelo Cliente' : 'Receber em Casa';
    if (venda.entrega.prazo) {
        entregaTexto += ` - Prazo: ${new Date(venda.entrega.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`;
    }
    if (venda.valorFrete && venda.valorFrete > 0) {
        entregaTexto += ` - Frete: R$ ${formatarValorMonetario(venda.valorFrete)}`;
    }

    // Montar mensagem completa
    const mensagem = `Olá ${nomeCliente}!

Segue a fatura da sua compra:

━━━━━━━━━━━━━━━━━
*FATURA DE VENDA - NXT LOJAS*
━━━━━━━━━━━━━━━━━

*Cliente:* ${venda.cliente.nome}
*Telefone:* ${venda.cliente.telefone}${venda.cliente.cpf ? `\n*CPF:* ${venda.cliente.cpf}` : ''}${venda.cliente.cnpj ? `\n*CNPJ:* ${venda.cliente.cnpj}` : ''}
*Endereço:* ${venda.cliente.endereco.rua}, ${venda.cliente.endereco.numero} - ${venda.cliente.endereco.bairro}
${venda.cliente.endereco.cidade}/${venda.cliente.endereco.estado} - CEP: ${venda.cliente.endereco.cep}

*PRODUTOS*
${produtosTexto}
*PAGAMENTO*
${pagamentoTexto}${venda.pagamento.observacoes ? `\nObs: ${venda.pagamento.observacoes}` : ''}

*ENTREGA*
${entregaTexto}
${gerarTextoAceiteWhatsApp(venda.aceiteDetalhes)}
━━━━━━━━━━━━━━━━━
*TOTAL: R$ ${formatarValorMonetario(venda.total)}*
━━━━━━━━━━━━━━━━━

🛡️ *GARANTIA DO FABRICANTE*
• Quadro: 2 anos contra defeitos de fabricação
• Motor: 2 anos contra defeitos de fabricação
• Bateria: 6 meses contra defeitos de fabricação
_Danos por uso inadequado, acidentes ou desgaste natural não são cobertos pela garantia._

Data da Venda: ${dataVenda}
Emissão: ${dataEmissao}
Loja: ${venda.loja}
${(() => {
    const modelos = [...new Set(venda.produtos.map(p => p.modelo))];
    const manuaisTexto = modelos
        .filter(m => MANUAIS_MOTOS[m])
        .map(m => `📖 Manual ${m}: ${MANUAIS_MOTOS[m]}`)
        .join('\n');
    return manuaisTexto ? '\n' + manuaisTexto + '\n' : '';
})()}
⚠️ _Este documento tem caráter informativo e não substitui a nota fiscal. A nota fiscal eletrônica será emitida e enviada separadamente._

_*NXT Lojas - Mobilidade Urbana*_
CNPJ: 55.099.827/0001-96
Ni Hao Comércio e Serviços Ltda
www.nxt.eco.br`;

    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');

    mostrarFeedback('WhatsApp aberto com a fatura! É só enviar.', 'sucesso');
}

// Gerar PDF no wizard
async function wizardGerarPDF() {
    if (!ultimaVendaRegistrada) {
        mostrarFeedback('Nenhuma venda registrada', 'erro');
        return;
    }

    wizardOperacaoEmAndamento = true;

    // Primeiro gera o HTML da fatura (necessário para o PDF)
    gerarHTMLFatura(ultimaVendaRegistrada);

    // Mostrar o modal da fatura temporariamente (necessário para html2canvas)
    const modalFatura = document.getElementById('modalFatura');
    const estadoAnterior = modalFatura.style.display;

    // Posicionar fora da tela (visível para html2canvas mas não para o usuário)
    modalFatura.style.position = 'fixed';
    modalFatura.style.left = '-9999px';
    modalFatura.style.top = '0';
    modalFatura.style.display = 'block';

    // Aguarda renderização completa do HTML antes de capturar
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
        await gerarPDF();
    } finally {
        // Restaurar estado do modal
        modalFatura.style.display = estadoAnterior;
        modalFatura.style.position = '';
        modalFatura.style.left = '';
        modalFatura.style.top = '';
        wizardOperacaoEmAndamento = false;
    }
}

// Ver fatura completa no wizard (abre por cima sem fechar o wizard)
function wizardVerFatura() {
    wizardOperacaoEmAndamento = true;
    gerarFatura();
    // Elevar z-index da fatura para ficar acima do wizard
    const modalFatura = document.getElementById('modalFatura');
    if (modalFatura) {
        modalFatura.style.zIndex = '10003';
        // Liberar flag quando modalFatura for fechada
        const observer = new MutationObserver(() => {
            if (modalFatura.style.display === 'none' || modalFatura.style.display === '') {
                wizardOperacaoEmAndamento = false;
                observer.disconnect();
            }
        });
        observer.observe(modalFatura, { attributes: true, attributeFilter: ['style'] });
    }
}

// Copiar resumo no wizard
function copiarResumoWizard() {
    const textArea = document.getElementById('textoResumoModal');
    if (!textArea || !textArea.value) {
        mostrarFeedback('Nenhum resumo para copiar', 'erro');
        return;
    }

    navigator.clipboard.writeText(textArea.value).then(() => {
        // Mostrar feedback visual
        const feedbackEl = document.getElementById('feedbackCopiado');
        if (feedbackEl) {
            feedbackEl.style.display = 'block';
            setTimeout(() => {
                feedbackEl.style.display = 'none';
            }, 3000);
        }
        mostrarFeedback('Resumo copiado!', 'sucesso');
    }).catch(() => {
        // Fallback
        textArea.select();
        document.execCommand('copy');
        mostrarFeedback('Resumo copiado!', 'sucesso');
    });
}

// Abrir WhatsApp para enviar resumo ao grupo
function abrirWhatsAppGrupo() {
    // Abre o WhatsApp Web/App sem número específico (usuário escolhe o grupo)
    const url = 'https://wa.me/?text=' + encodeURIComponent(ultimoResumoVenda);
    window.open(url, '_blank');
    mostrarFeedback('WhatsApp aberto! Cole o resumo no grupo.', 'sucesso');
}

// Finalizar wizard e iniciar nova venda
function wizardNovaVenda() {
    // Fechar o modal
    document.getElementById('modalWizardVenda').style.display = 'none';

    // Limpar formulário sem pedir confirmação
    limparFormularioVenda(true);

    mostrarFeedback('Formulário limpo! Pronto para nova venda.', 'sucesso');
}

// Fechar modal wizard - backdrop NÃO fecha nas etapas 1-3 (evita fechamento acidental)
document.addEventListener('DOMContentLoaded', () => {
    const modalWizard = document.getElementById('modalWizardVenda');
    if (modalWizard) {
        modalWizard.addEventListener('click', (e) => {
            if (e.target === modalWizard) {
                if (wizardOperacaoEmAndamento) {
                    mostrarFeedback('Aguarde a operação em andamento...', 'erro');
                    return;
                }
                // Na etapa 4 (Concluir), permite fechar pelo backdrop
                if (wizardEtapaAtual >= 4) {
                    modalWizard.style.display = 'none';
                    return;
                }
                // Nas etapas 1-3, NÃO fecha pelo backdrop - só pelo botão X
                mostrarFeedback('Use o botão ✕ para fechar o wizard.', 'erro');
            }
        });
    }
});

// Fechar wizard pelo botão X (com confirmação)
function fecharWizardVenda() {
    if (wizardOperacaoEmAndamento) {
        mostrarFeedback('Aguarde a operação em andamento...', 'erro');
        return;
    }
    if (wizardEtapaAtual < 4) {
        if (!confirm('Você ainda não completou todas as etapas do pós-venda.\n\nA venda já foi salva, mas a fatura pode não ter sido enviada ao cliente.\n\nDeseja fechar mesmo assim?')) {
            return;
        }
    }
    document.getElementById('modalWizardVenda').style.display = 'none';
}