// NXT Plus - Sistema de Gestão por Loja
// JavaScript Principal

// Dados de produtos (carregados do JSON)
let dadosProdutos = {};
let vendaAtualId = null;

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosProdutos();
    aplicarMascaras();
    inicializarCamposData();
});

function aplicarMascaras() {
    // Máscara de moeda
    document.querySelectorAll('.currency-input').forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value) {
                value = (parseInt(value) / 100).toFixed(2);
                e.target.value = 'R$ ' + value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            }
        });
        input.addEventListener('blur', function(e) {
            atualizarTotalVenda();
        });
    });

    // Máscara de telefone
    const telefone = document.getElementById('clienteTelefone');
    if (telefone) {
        telefone.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                value = value.replace(/(\d)(\d{4})$/, '$1-$2');
            }
            e.target.value = value;
        });
    }

    // Máscara de CPF
    const cpf = document.getElementById('clienteCPF');
    if (cpf) {
        cpf.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        });
    }

    // Máscara de CNPJ
    const cnpj = document.getElementById('clienteCNPJ');
    if (cnpj) {
        cnpj.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }

    // Máscara de CEP
    const cep = document.getElementById('clienteCEP');
    if (cep) {
        cep.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }
}

function inicializarCamposData() {
    const hoje = new Date().toISOString().split('T')[0];
    const dataVenda = document.getElementById('dataVenda');
    if (dataVenda) dataVenda.value = hoje;

    const prazoEntrega = document.getElementById('prazoEntrega');
    if (prazoEntrega) prazoEntrega.value = hoje;
}

async function carregarDadosProdutos() {
    try {
        const response = await fetch('dados/produtos.json');
        dadosProdutos = await response.json();
        console.log('Produtos carregados - Modelos:', dadosProdutos.modelos?.length, 'Cores:', dadosProdutos.cores?.length);
        preencherSelectsModelosCores();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function preencherSelectsModelosCores() {
    // Selects de modelo
    const selectsModelo = ['produtoModelo', 'entradaModelo'];
    selectsModelo.forEach(id => {
        const select = document.getElementById(id);
        if (select && dadosProdutos.modelos) {
            select.innerHTML = '<option value="">Selecione o modelo...</option>';
            dadosProdutos.modelos.forEach(modelo => {
                select.add(new Option(modelo, modelo));
            });
        }
    });

    // Selects de cor
    const selectsCor = ['produtoCor', 'entradaCor'];
    selectsCor.forEach(id => {
        const select = document.getElementById(id);
        if (select && dadosProdutos.cores) {
            select.innerHTML = '<option value="">Selecione a cor...</option>';
            dadosProdutos.cores.forEach(cor => {
                select.add(new Option(cor, cor));
            });
        }
    });
}

// ========================================
// FUNÇÕES DE LOGIN (usadas pelo firebase-config.js)
// ========================================

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    fazerLogin(email, senha);
}

function mostrarLoading(msg) {
    const loading = document.getElementById('loginLoading');
    if (loading) {
        loading.querySelector('span').textContent = msg || 'Carregando...';
        loading.style.display = 'flex';
    }
}

function esconderLoading() {
    const loading = document.getElementById('loginLoading');
    if (loading) loading.style.display = 'none';
}

function mostrarErro(msg) {
    // Tenta mostrar no elemento de erro do login, senão usa alert
    const error = document.getElementById('loginError');
    if (error && document.getElementById('telaLogin').style.display !== 'none') {
        error.textContent = msg;
        error.style.display = 'block';
    } else {
        alert('Erro: ' + msg);
    }
}

function mostrarSucesso(msg) {
    alert(msg);
}

function esconderErro() {
    const error = document.getElementById('loginError');
    if (error) error.style.display = 'none';
}

function mostrarTelaLogin() {
    document.getElementById('telaLogin').style.display = 'flex';
    document.getElementById('appPrincipal').classList.add('app-hidden');
}

function mostrarAppPrincipal() {
    document.getElementById('telaLogin').style.display = 'none';
    document.getElementById('appPrincipal').classList.remove('app-hidden');
    esconderLoading();
    esconderErro();
}

// ========================================
// CONFIGURAR INTERFACE POR ROLE
// ========================================

function configurarInterfacePorRole() {
    if (!currentUserData) return;

    // Atualizar header
    document.getElementById('headerUserEmail').textContent = currentUser.email;
    document.getElementById('headerUserRole').textContent = currentUserData.role.toUpperCase();

    // Mostrar/esconder aba Admin
    const adminTab = document.querySelector('.tab-btn[data-tab="admin"]');
    if (adminTab) {
        adminTab.style.display = isAdmin() ? 'flex' : 'none';
    }

    // Preencher seletor de lojas
    atualizarSeletorLoja();

    // Carregar dados iniciais
    if (lojaAtual) {
        carregarDadosLoja();
    }

    // Se admin, carregar dados admin
    if (isAdmin()) {
        carregarDadosAdmin();
    }
}

function atualizarSeletorLoja() {
    const select = document.getElementById('lojaSelector');
    if (!select) return;

    select.innerHTML = '';

    if (lojasDisponiveis.length === 0) {
        select.innerHTML = '<option value="">Nenhuma loja</option>';
        return;
    }

    lojasDisponiveis.forEach(loja => {
        const option = document.createElement('option');
        option.value = loja.id;
        option.textContent = loja.nome;
        if (loja.id === lojaAtual) option.selected = true;
        select.appendChild(option);
    });

    // Se só tem uma loja, esconder seletor
    if (lojasDisponiveis.length === 1) {
        document.getElementById('lojaSelectorContainer').style.display = 'none';
    } else {
        document.getElementById('lojaSelectorContainer').style.display = 'flex';
    }
}

// ========================================
// NAVEGAÇÃO POR ABAS
// ========================================

function mudarAba(aba) {
    // Atualizar botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === aba) btn.classList.add('active');
    });

    // Atualizar conteúdo
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${aba}`).classList.add('active');

    // Carregar dados específicos da aba
    if (aba === 'vendas') carregarVendasUI();
    if (aba === 'estoque') carregarEstoqueUI();
    if (aba === 'admin') carregarDadosAdmin();
}

// ========================================
// ABA: VENDAS
// ========================================

async function carregarVendasUI() {
    if (!lojaAtual) return;

    const filtros = {
        dataInicio: document.getElementById('filtroDataInicio').value,
        dataFim: document.getElementById('filtroDataFim').value
    };

    const vendas = await carregarVendas(filtros);
    renderizarListaVendas(vendas);
    atualizarResumoVendas(vendas);
}

function filtrarVendas() {
    carregarVendasUI();
}

function renderizarListaVendas(vendas) {
    const container = document.getElementById('vendasLista');

    if (vendas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>Nenhuma venda encontrada</p>
            </div>
        `;
        return;
    }

    container.innerHTML = vendas.map(venda => {
        const data = venda.createdAt ? new Date(venda.createdAt.toDate()).toLocaleDateString('pt-BR') : 'N/A';
        const valor = venda.valorTotal ? `R$ ${Number(venda.valorTotal).toFixed(2).replace('.', ',')}` : 'N/A';

        return `
            <div class="venda-item" onclick="abrirDetalheVenda('${venda.id}')">
                <div class="venda-info">
                    <div class="venda-cliente">${venda.cliente?.nome || 'Cliente não informado'}</div>
                    <div class="venda-detalhes">
                        ${data} • ${venda.vendedor || 'Vendedor não informado'} • ${venda.produtos?.length || 0} produto(s)
                    </div>
                </div>
                <div class="venda-valor">${valor}</div>
                <span class="venda-status ${venda.status || 'pendente'}">${venda.status === 'pago' ? 'Pago' : 'Pendente'}</span>
            </div>
        `;
    }).join('');
}

function atualizarResumoVendas(vendas) {
    const totalCount = vendas.length;
    const totalValor = vendas.reduce((sum, v) => sum + (Number(v.valorTotal) || 0), 0);
    const pendentes = vendas.filter(v => v.status !== 'pago').length;

    document.getElementById('totalVendasCount').textContent = totalCount;
    document.getElementById('totalVendasValor').textContent = `R$ ${totalValor.toFixed(2).replace('.', ',')}`;
    document.getElementById('totalVendasPendentes').textContent = pendentes;
}

async function abrirDetalheVenda(vendaId) {
    vendaAtualId = vendaId;

    const vendas = await carregarVendas();
    const venda = vendas.find(v => v.id === vendaId);

    if (!venda) return;

    const data = venda.createdAt ? new Date(venda.createdAt.toDate()).toLocaleString('pt-BR') : 'N/A';
    const produtos = venda.produtos?.map(p => `${p.modelo} - ${p.cor}`).join(', ') || 'N/A';

    document.getElementById('vendaDetalhes').innerHTML = `
        <div style="display: grid; gap: 15px;">
            <div><strong>Cliente:</strong> ${venda.cliente?.nome || 'N/A'}</div>
            <div><strong>Telefone:</strong> ${venda.cliente?.telefone || 'N/A'}</div>
            <div><strong>CPF:</strong> ${venda.cliente?.cpf || 'N/A'}</div>
            <div><strong>Produtos:</strong> ${produtos}</div>
            <div><strong>Valor Total:</strong> R$ ${Number(venda.valorTotal || 0).toFixed(2).replace('.', ',')}</div>
            <div><strong>Forma de Pagamento:</strong> ${venda.formaPagamento?.join(', ') || 'N/A'}</div>
            <div><strong>Vendedor:</strong> ${venda.vendedor || 'N/A'}</div>
            <div><strong>Data:</strong> ${data}</div>
            <div><strong>Status:</strong> <span class="venda-status ${venda.status || 'pendente'}">${venda.status === 'pago' ? 'Pago' : 'Pendente'}</span></div>
        </div>
    `;

    // Mostrar/esconder botão de marcar como pago
    document.getElementById('btnMarcarPago').style.display = venda.status === 'pago' ? 'none' : 'block';

    document.getElementById('modalVenda').style.display = 'flex';
}

async function marcarComoPago() {
    if (!vendaAtualId) return;

    await atualizarStatusVenda(vendaAtualId, 'pago');
    fecharModal('modalVenda');
    carregarVendasUI();
    alert('Venda marcada como paga!');
}

function copiarResumoVenda() {
    const detalhes = document.getElementById('vendaDetalhes').innerText;
    navigator.clipboard.writeText(detalhes);
    alert('Resumo copiado!');
}

// ========================================
// ABA: NOVA VENDA
// ========================================

// Lista de produtos da venda atual
let produtosVenda = [];

function atualizarCoresProduto() {
    const selectCor = document.getElementById('produtoCor');
    selectCor.innerHTML = '<option value="">Selecione a cor...</option>';

    if (dadosProdutos.cores) {
        dadosProdutos.cores.forEach(cor => {
            selectCor.add(new Option(cor, cor));
        });
    }
}

// Toggle capacete
function toggleCapacete() {
    const checkbox = document.getElementById('acompanhaCapacete');
    const corGroup = document.getElementById('corCapaceteGroup');
    corGroup.style.display = checkbox.checked ? 'block' : 'none';
}

// Adicionar produto à lista
function adicionarProduto() {
    const modelo = document.getElementById('produtoModelo').value;
    const cor = document.getElementById('produtoCor').value;
    const precoStr = document.getElementById('produtoPreco').value;
    const chassi = document.getElementById('produtoChassi').value;
    const motor = document.getElementById('produtoMotor').value;
    const capacete = document.getElementById('acompanhaCapacete').checked;
    const corCapacete = document.getElementById('corCapacete').value;

    if (!modelo || !cor) {
        alert('Selecione modelo e cor!');
        return;
    }

    // Converter preço
    const preco = parseFloat(precoStr.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

    const produto = {
        id: Date.now(),
        modelo,
        cor,
        preco,
        chassi,
        motor,
        capacete,
        corCapacete: capacete ? corCapacete : ''
    };

    produtosVenda.push(produto);
    atualizarListaProdutosVenda();
    limparCamposProduto();
}

// Remover produto da lista
function removerProduto(id) {
    produtosVenda = produtosVenda.filter(p => p.id !== id);
    atualizarListaProdutosVenda();
}

// Atualizar lista visual de produtos
function atualizarListaProdutosVenda() {
    const lista = document.getElementById('listaProdutosVenda');
    const counter = document.getElementById('produtosCounter');
    const totalEl = document.getElementById('totalProdutos');

    counter.textContent = `(${produtosVenda.length})`;

    if (produtosVenda.length === 0) {
        lista.innerHTML = '<div class="empty-state-mini"><p>Nenhum produto adicionado</p></div>';
        totalEl.textContent = 'R$ 0,00';
        return;
    }

    let total = 0;
    lista.innerHTML = produtosVenda.map(p => {
        total += p.preco;
        const capaceteInfo = p.capacete ? ` | Capacete: ${p.corCapacete || 'Sim'}` : '';
        return `
            <div class="produto-item">
                <div class="produto-item-info">
                    <div class="produto-item-nome">${p.modelo} - ${p.cor}</div>
                    <div class="produto-item-detalhes">
                        ${p.chassi ? 'Chassi: ' + p.chassi + ' | ' : ''}
                        ${p.motor ? 'Motor: ' + p.motor : ''}
                        ${capaceteInfo}
                    </div>
                </div>
                <span class="produto-item-preco">${formatarMoeda(p.preco)}</span>
                <button class="produto-item-remover" onclick="removerProduto(${p.id})">✕</button>
            </div>
        `;
    }).join('');

    totalEl.textContent = formatarMoeda(total);
}

// Limpar campos do produto
function limparCamposProduto() {
    document.getElementById('produtoModelo').value = '';
    document.getElementById('produtoCor').innerHTML = '<option value="">Selecione a cor...</option>';
    document.getElementById('produtoPreco').value = '';
    document.getElementById('produtoChassi').value = '';
    document.getElementById('produtoMotor').value = '';
    document.getElementById('acompanhaCapacete').checked = false;
    document.getElementById('corCapacete').value = '';
    document.getElementById('corCapaceteGroup').style.display = 'none';
}

// Formatar moeda
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function registrarNovaVenda(event) {
    event.preventDefault();

    if (!lojaAtual) {
        alert('Selecione uma loja primeiro!');
        return;
    }

    // Validar se tem produtos
    if (produtosVenda.length === 0) {
        alert('Adicione pelo menos um produto a venda!');
        return;
    }

    // Coletar formas de pagamento
    const formasPagamento = Array.from(document.querySelectorAll('input[name="formaPagamento"]:checked'))
        .map(cb => cb.value);

    if (formasPagamento.length === 0) {
        alert('Selecione pelo menos uma forma de pagamento!');
        return;
    }

    // Coletar valores por forma de pagamento
    const valoresPagamento = {};
    formasPagamento.forEach(forma => {
        const input = document.getElementById('valor' + forma.charAt(0).toUpperCase() + forma.slice(1));
        if (input && input.value) {
            valoresPagamento[forma] = parseFloat(input.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        }
    });

    // Coletar dados de entrega
    const tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked')?.value || 'retirada';
    const prazoEntrega = document.getElementById('prazoEntrega').value;
    const valorFrete = tipoEntrega === 'domicilio' ?
        (parseFloat(document.getElementById('valorFrete').value.replace(/[^\d,]/g, '').replace(',', '.')) || 0) : 0;

    // Calcular total
    const totalProdutos = produtosVenda.reduce((acc, p) => acc + p.preco, 0);
    const valorTotal = totalProdutos + valorFrete;

    const venda = {
        cliente: {
            nome: document.getElementById('clienteNome').value,
            telefone: document.getElementById('clienteTelefone').value,
            cpf: document.getElementById('clienteCPF').value,
            cnpj: document.getElementById('clienteCNPJ').value,
            endereco: {
                cep: document.getElementById('clienteCEP').value,
                rua: document.getElementById('clienteRua').value,
                numero: document.getElementById('clienteNumero').value,
                complemento: document.getElementById('clienteComplemento').value,
                bairro: document.getElementById('clienteBairro').value,
                cidade: document.getElementById('clienteCidade').value,
                uf: document.getElementById('clienteUF').value
            }
        },
        produtos: produtosVenda.map(p => ({
            modelo: p.modelo,
            cor: p.cor,
            preco: p.preco,
            chassi: p.chassi,
            motor: p.motor,
            capacete: p.capacete,
            corCapacete: p.corCapacete
        })),
        valorTotal: valorTotal,
        pagamento: {
            formas: formasPagamento,
            valores: valoresPagamento,
            parcelas: formasPagamento.includes('credito') ? parcelasSelecionadas : null,
            outrosEspec: formasPagamento.includes('outros') ? document.getElementById('outrosEspec').value : null,
            observacoes: document.getElementById('pagamentoObs').value
        },
        entrega: {
            tipo: tipoEntrega,
            prazo: prazoEntrega,
            valorFrete: valorFrete,
            origem: document.getElementById('origemProduto').value,
            localSaida: document.getElementById('origemProduto').value === 'propria_loja'
                ? lojaAtual
                : document.getElementById('lojaSaida').value
        },
        vendedor: document.getElementById('vendedorNome').value,
        dataVenda: document.getElementById('dataVenda').value || new Date().toISOString().split('T')[0]
    };

    const vendaId = await salvarVenda(venda);

    if (vendaId) {
        alert('Venda registrada com sucesso!');
        limparFormularioVenda();
        mudarAba('vendas');
    } else {
        alert('Erro ao registrar venda. Verifique o estoque.');
    }
}

function limparFormularioVenda() {
    document.getElementById('novaVendaForm').reset();
    document.getElementById('produtoCor').innerHTML = '<option value="">Selecione...</option>';

    // Limpar lista de produtos
    produtosVenda = [];
    atualizarListaProdutosVenda();

    // Resetar pagamentos
    document.querySelectorAll('input[name="formaPagamento"]').forEach(cb => cb.checked = false);
    document.getElementById('valoresPagamento').style.display = 'none';
    document.getElementById('parcelasGroup').style.display = 'none';
    document.getElementById('outrosEspecGroup').style.display = 'none';

    // Resetar entrega
    document.querySelector('input[name="tipoEntrega"][value="retirada"]').checked = true;
    document.getElementById('freteGroup').style.display = 'none';
    document.querySelectorAll('.entrega-card').forEach(card => {
        card.classList.remove('active');
        if (card.querySelector('input').value === 'retirada') {
            card.classList.add('active');
        }
    });

    // Resetar origem do produto
    document.getElementById('origemProduto').value = 'propria_loja';
    document.getElementById('lojaSaidaGroup').style.display = 'none';

    // Resetar total
    atualizarTotalVenda();
}

function copiarResumoNovaVenda() {
    if (produtosVenda.length === 0) {
        alert('Adicione pelo menos um produto para copiar o resumo!');
        return;
    }

    const clienteNome = document.getElementById('clienteNome').value || 'Nao informado';
    const clienteTelefone = document.getElementById('clienteTelefone').value || 'Nao informado';

    // Produtos
    let produtosTexto = produtosVenda.map(p => {
        let texto = `- ${p.modelo} ${p.cor} - ${formatarMoeda(p.preco)}`;
        if (p.chassi) texto += ` (Chassi: ${p.chassi})`;
        if (p.capacete) texto += ` | Capacete: ${p.corCapacete || 'Sim'}`;
        return texto;
    }).join('\n');

    // Pagamento
    const formasPag = Array.from(document.querySelectorAll('input[name="formaPagamento"]:checked'))
        .map(cb => cb.value.charAt(0).toUpperCase() + cb.value.slice(1));

    // Total
    const totalProdutos = produtosVenda.reduce((acc, p) => acc + p.preco, 0);
    const tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked')?.value || 'retirada';
    let valorFrete = 0;
    if (tipoEntrega === 'domicilio') {
        valorFrete = parseFloat(document.getElementById('valorFrete').value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    }
    const valorTotal = totalProdutos + valorFrete;

    // Origem do produto
    const origemProduto = document.getElementById('origemProduto').value;
    const origemTexto = origemProduto === 'propria_loja' ? 'Da propria Loja' : 'De outro lugar';
    let origemInfo = `*Origem:* ${origemTexto}`;
    if (origemProduto === 'outro_lugar') {
        const lojaSaida = document.getElementById('lojaSaida');
        if (lojaSaida && lojaSaida.value) {
            origemInfo += ` (${lojaSaida.options[lojaSaida.selectedIndex].text})`;
        }
    }

    const resumo = `*RESUMO DA VENDA - NXT Plus*

*Cliente:* ${clienteNome}
*Telefone:* ${clienteTelefone}

*Produtos:*
${produtosTexto}

*Pagamento:* ${formasPag.join(', ') || 'Nao selecionado'}
*Entrega:* ${tipoEntrega === 'retirada' ? 'Retirada na Loja' : 'Entrega em Casa'}
${origemInfo}
${valorFrete > 0 ? '*Frete:* ' + formatarMoeda(valorFrete) + '\n' : ''}
*TOTAL:* ${formatarMoeda(valorTotal)}

_Vendedor:_ ${document.getElementById('vendedorNome').value || 'Nao informado'}`;

    navigator.clipboard.writeText(resumo).then(() => {
        alert('Resumo copiado para a area de transferencia!');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar resumo. Tente novamente.');
    });
}

// ========================================
// FUNÇÕES DE PAGAMENTO
// ========================================

let parcelasSelecionadas = 1;

function togglePagamento(tipo) {
    const checkbox = document.getElementById('pag' + tipo.charAt(0).toUpperCase() + tipo.slice(1));
    checkbox.checked = !checkbox.checked;

    atualizarValoresPagamento();

    // Mostrar/ocultar parcelas para crédito
    if (tipo === 'credito') {
        document.getElementById('parcelasGroup').style.display = checkbox.checked ? 'block' : 'none';
    }

    // Mostrar/ocultar especificação para outros
    if (tipo === 'outros') {
        document.getElementById('outrosEspecGroup').style.display = checkbox.checked ? 'flex' : 'none';
    }
}

function atualizarValoresPagamento() {
    const formasSelecionadas = Array.from(document.querySelectorAll('input[name="formaPagamento"]:checked'))
        .map(cb => cb.value);

    const valoresContainer = document.getElementById('valoresPagamento');

    if (formasSelecionadas.length > 0) {
        valoresContainer.style.display = 'block';

        // Mostrar/ocultar inputs de valor
        ['pix', 'dinheiro', 'debito', 'credito', 'outros'].forEach(tipo => {
            const grupo = document.getElementById('valor' + tipo.charAt(0).toUpperCase() + tipo.slice(1) + 'Group');
            if (grupo) {
                grupo.style.display = formasSelecionadas.includes(tipo) ? 'block' : 'none';
            }
        });
    } else {
        valoresContainer.style.display = 'none';
    }
}

function selecionarParcelas(num) {
    parcelasSelecionadas = num;
    document.getElementById('parcelasCredito').value = num;

    // Atualizar visual dos botões
    document.querySelectorAll('.parcela-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// ========================================
// FUNÇÕES DE ENTREGA
// ========================================

function selecionarEntrega(tipo) {
    // Atualizar visual dos cards
    document.querySelectorAll('.entrega-card').forEach(card => {
        card.classList.remove('active');
    });
    event.target.closest('.entrega-card').classList.add('active');

    // Mostrar/ocultar campo de frete
    const freteGroup = document.getElementById('freteGroup');
    freteGroup.style.display = tipo === 'domicilio' ? 'block' : 'none';

    // Atualizar total se necessário
    atualizarTotalVenda();
}

function atualizarTotalVenda() {
    // Calcular total dos produtos
    let totalProdutos = produtosVenda.reduce((acc, p) => acc + p.preco, 0);

    // Adicionar frete se entrega a domicílio
    const tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked')?.value;
    let valorFrete = 0;

    if (tipoEntrega === 'domicilio') {
        const freteInput = document.getElementById('valorFrete');
        if (freteInput && freteInput.value) {
            valorFrete = parseFloat(freteInput.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        }
    }

    const total = totalProdutos + valorFrete;

    // Atualizar display do total
    const totalGrande = document.getElementById('totalVendaGrande');
    if (totalGrande) {
        totalGrande.textContent = formatarMoeda(total);
    }
}

function handleOrigemProdutoChange() {
    const origem = document.getElementById('origemProduto').value;
    const lojaSaidaGroup = document.getElementById('lojaSaidaGroup');

    lojaSaidaGroup.style.display = origem === 'outro_lugar' ? 'block' : 'none';

    // Preencher select de lojas se necessário
    if (origem === 'outro_lugar') {
        preencherSelectLojasSaida();
    }
}

function preencherSelectLojasSaida() {
    const selectLoja = document.getElementById('lojaSaida');
    if (!selectLoja) return;

    // Usar lojasDisponiveis do firebase-config.js
    if (typeof lojasDisponiveis !== 'undefined' && lojasDisponiveis.length > 0) {
        selectLoja.innerHTML = '<option value="">Selecione...</option>';
        lojasDisponiveis.forEach(loja => {
            // Não mostrar a loja atual
            if (loja.id !== lojaAtual) {
                selectLoja.add(new Option(loja.nome, loja.id));
            }
        });
    }
}

// ========================================
// ABA: ESTOQUE
// ========================================

function atualizarListaEstoque(produtos) {
    const container = document.getElementById('estoqueGrid');

    if (!produtos || produtos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📦</span>
                <p>Estoque vazio</p>
                <p class="empty-hint">Adicione produtos ao estoque</p>
            </div>
        `;
        return;
    }

    container.innerHTML = produtos.map(p => {
        const classes = ['estoque-card'];
        if (p.quantidade === 0) classes.push('estoque-zerado');
        else if (p.quantidade <= 2) classes.push('estoque-alerta');

        return `
            <div class="${classes.join(' ')}">
                <div class="estoque-modelo">${p.modelo}</div>
                <div class="estoque-cor">${p.cor}</div>
                <div class="estoque-quantidade">
                    <div>
                        <div class="quantidade-numero">${p.quantidade}</div>
                        <div class="quantidade-label">unidades</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function carregarEstoqueUI() {
    // O estoque já é carregado em tempo real pelo listener
    // Mas vamos carregar as movimentações
    const movimentacoes = await carregarMovimentacoes(20);
    renderizarMovimentacoes(movimentacoes);
}

function renderizarMovimentacoes(movimentacoes) {
    const container = document.getElementById('movimentacoesLista');

    if (!movimentacoes || movimentacoes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📊</span>
                <p>Nenhuma movimentacao</p>
            </div>
        `;
        return;
    }

    container.innerHTML = movimentacoes.map(m => {
        const data = m.createdAt ? new Date(m.createdAt.toDate()).toLocaleString('pt-BR') : 'N/A';
        const icon = m.tipo === 'entrada' ? '📥' : '📤';
        const sinal = m.tipo === 'entrada' ? '+' : '-';

        return `
            <div class="movimentacao-item">
                <span class="movimentacao-icon">${icon}</span>
                <div class="movimentacao-info">
                    <div class="movimentacao-produto">${m.modelo} - ${m.cor}</div>
                    <div class="movimentacao-detalhes">${data} • ${m.usuario} • ${m.observacao || ''}</div>
                </div>
                <span class="movimentacao-qtd ${m.tipo}">${sinal}${m.quantidade}</span>
            </div>
        `;
    }).join('');
}

// Modal Entrada de Estoque
function mostrarModalEntrada() {
    document.getElementById('formEntrada').reset();
    document.getElementById('entradaCor').innerHTML = '<option value="">Selecione...</option>';
    document.getElementById('modalEntrada').style.display = 'flex';
}

function atualizarCoresEntrada() {
    const selectCor = document.getElementById('entradaCor');
    selectCor.innerHTML = '<option value="">Selecione a cor...</option>';

    if (dadosProdutos.cores) {
        dadosProdutos.cores.forEach(cor => {
            selectCor.add(new Option(cor, cor));
        });
    }
}

async function registrarEntrada(event) {
    event.preventDefault();

    const modelo = document.getElementById('entradaModelo').value;
    const cor = document.getElementById('entradaCor').value;
    const quantidade = parseInt(document.getElementById('entradaQtd').value);
    const observacao = document.getElementById('entradaObs').value;

    const resultado = await entradaEstoque(modelo, cor, quantidade, observacao);

    if (resultado) {
        alert('Entrada registrada com sucesso!');
        fecharModal('modalEntrada');
    } else {
        alert('Erro ao registrar entrada.');
    }
}

// ========================================
// ABA: ADMIN
// ========================================

async function carregarDadosAdmin() {
    if (!isAdmin()) return;

    // Carregar lojas
    const lojas = await listarTodasLojas();
    renderizarLojasAdmin(lojas);

    // Carregar usuários
    const usuarios = await listarUsuarios();
    renderizarUsuariosAdmin(usuarios);

    // Preencher selects nos modais
    preencherSelectsLojas(lojas);
}

function renderizarLojasAdmin(lojas) {
    const container = document.getElementById('adminLojasLista');

    if (!lojas || lojas.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhuma loja cadastrada</p></div>';
        return;
    }

    container.innerHTML = lojas.map(loja => `
        <div class="admin-item">
            <div class="admin-item-info">
                <div class="admin-item-nome">${loja.nome}</div>
                <div class="admin-item-detalhes">${loja.endereco || 'Sem endereço'}</div>
            </div>
            <span class="admin-item-badge">${loja.ativo ? 'Ativa' : 'Inativa'}</span>
        </div>
    `).join('');
}

function renderizarUsuariosAdmin(usuarios) {
    const container = document.getElementById('adminUsuariosLista');

    if (!usuarios || usuarios.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum usuario cadastrado</p></div>';
        return;
    }

    container.innerHTML = usuarios.map(user => `
        <div class="admin-item">
            <div class="admin-item-info">
                <div class="admin-item-nome">${user.nome || user.email}</div>
                <div class="admin-item-detalhes">
                    ${user.email} •
                    ${user.role === 'funcionario' ? `Loja: ${user.loja || 'N/A'}` : ''}
                    ${user.role === 'gerente' ? `Lojas: ${user.lojas?.length || 0}` : ''}
                </div>
            </div>
            <span class="admin-item-badge">${user.role}</span>
        </div>
    `).join('');
}

function preencherSelectsLojas(lojas) {
    // Select para funcionário
    const selectFuncionario = document.getElementById('novoUserLoja');
    if (selectFuncionario) {
        selectFuncionario.innerHTML = '<option value="">Selecione...</option>';
        lojas.forEach(loja => {
            const option = document.createElement('option');
            option.value = loja.id;
            option.textContent = loja.nome;
            selectFuncionario.appendChild(option);
        });
    }

    // Checkboxes para gerente
    const checkboxContainer = document.getElementById('novoUserLojasCheckboxes');
    if (checkboxContainer) {
        checkboxContainer.innerHTML = lojas.map(loja => `
            <label>
                <input type="checkbox" name="gerenteLojas" value="${loja.id}">
                ${loja.nome}
            </label>
        `).join('');
    }
}

function toggleLojaFields() {
    const role = document.getElementById('novoUserRole').value;
    document.getElementById('novoUserLojaGroup').style.display = role === 'funcionario' ? 'block' : 'none';
    document.getElementById('novoUserLojasGroup').style.display = role === 'gerente' ? 'block' : 'none';
}

// Modal Nova Loja
function mostrarModalNovaLoja() {
    document.getElementById('formNovaLoja').reset();
    document.getElementById('modalNovaLoja').style.display = 'flex';
}

async function criarNovaLoja(event) {
    event.preventDefault();

    const dados = {
        nome: document.getElementById('novaLojaNome').value,
        endereco: document.getElementById('novaLojaEndereco').value,
        telefone: document.getElementById('novaLojaTelefone').value
    };

    const lojaId = await criarLoja(dados);

    if (lojaId) {
        alert('Loja criada com sucesso!');
        fecharModal('modalNovaLoja');
        carregarDadosAdmin();
        await carregarLojasDisponiveis();
        atualizarSeletorLoja();
    } else {
        alert('Erro ao criar loja.');
    }
}

// Modal Novo Usuário
function mostrarModalNovoUsuario() {
    document.getElementById('formNovoUsuario').reset();
    toggleLojaFields();
    document.getElementById('modalNovoUsuario').style.display = 'flex';
}

async function criarNovoUsuario(event) {
    event.preventDefault();

    const role = document.getElementById('novoUserRole').value;
    const senha = document.getElementById('novoUserSenha').value;

    const dados = {
        nome: document.getElementById('novoUserNome').value,
        email: document.getElementById('novoUserEmail').value,
        role: role
    };

    if (role === 'funcionario') {
        dados.loja = document.getElementById('novoUserLoja').value;
    } else if (role === 'gerente') {
        dados.lojas = Array.from(document.querySelectorAll('input[name="gerenteLojas"]:checked'))
            .map(cb => cb.value);
    }

    // Processo manual: criar usuário no Firebase Auth primeiro
    const uid = prompt(
        'PASSO 1: Crie o usuário no Firebase Console:\n\n' +
        '1. Vá em Authentication > Users > Adicionar usuário\n' +
        '2. Email: ' + dados.email + '\n' +
        '3. Senha: ' + senha + '\n' +
        '4. Copie o UID gerado\n\n' +
        'Cole o UID aqui:'
    );

    if (uid && uid.trim()) {
        console.log('Criando usuário com UID:', uid.trim(), 'Dados:', dados);
        try {
            const resultado = await criarUsuarioFirestore(uid.trim(), dados);
            console.log('Resultado:', resultado);
            if (resultado) {
                alert('Usuário cadastrado com sucesso!');
                fecharModal('modalNovoUsuario');
                carregarDadosAdmin();
            } else {
                alert('Erro ao cadastrar usuário. Verifique o console (F12).');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro: ' + error.message);
        }
    }
}

// ========================================
// UTILITÁRIOS
// ========================================

function fecharModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// ========================================
// BUSCA DE CEP
// ========================================

async function buscarCEP() {
    const cepInput = document.getElementById('clienteCEP');
    const cep = cepInput.value.replace(/\D/g, '');

    if (cep.length !== 8) return;

    const loader = document.getElementById('cepLoader');
    if (loader) loader.style.display = 'inline';

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            alert('CEP não encontrado');
            return;
        }

        document.getElementById('clienteRua').value = data.logradouro || '';
        document.getElementById('clienteBairro').value = data.bairro || '';
        document.getElementById('clienteCidade').value = data.localidade || '';
        document.getElementById('clienteUF').value = data.uf || '';

        // Foca no campo número
        document.getElementById('clienteNumero').focus();

    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        alert('Erro ao buscar CEP');
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

// ========================================
// MÁSCARAS DE ENTRADA
// ========================================

function aplicarMascaras() {
    // Máscara Telefone
    const telefone = document.getElementById('clienteTelefone');
    if (telefone) {
        telefone.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length > 6) {
                value = `(${value.slice(0,2)}) ${value.slice(2,7)}-${value.slice(7)}`;
            } else if (value.length > 2) {
                value = `(${value.slice(0,2)}) ${value.slice(2)}`;
            } else if (value.length > 0) {
                value = `(${value}`;
            }
            e.target.value = value;
        });
    }

    // Máscara CPF
    const cpf = document.getElementById('clienteCPF');
    if (cpf) {
        cpf.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length > 9) {
                value = `${value.slice(0,3)}.${value.slice(3,6)}.${value.slice(6,9)}-${value.slice(9)}`;
            } else if (value.length > 6) {
                value = `${value.slice(0,3)}.${value.slice(3,6)}.${value.slice(6)}`;
            } else if (value.length > 3) {
                value = `${value.slice(0,3)}.${value.slice(3)}`;
            }
            e.target.value = value;
        });
    }

    // Máscara CNPJ
    const cnpj = document.getElementById('clienteCNPJ');
    if (cnpj) {
        cnpj.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 14) value = value.slice(0, 14);
            if (value.length > 12) {
                value = `${value.slice(0,2)}.${value.slice(2,5)}.${value.slice(5,8)}/${value.slice(8,12)}-${value.slice(12)}`;
            } else if (value.length > 8) {
                value = `${value.slice(0,2)}.${value.slice(2,5)}.${value.slice(5,8)}/${value.slice(8)}`;
            } else if (value.length > 5) {
                value = `${value.slice(0,2)}.${value.slice(2,5)}.${value.slice(5)}`;
            } else if (value.length > 2) {
                value = `${value.slice(0,2)}.${value.slice(2)}`;
            }
            e.target.value = value;
        });
    }

    // Máscara CEP
    const cep = document.getElementById('clienteCEP');
    if (cep) {
        cep.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 8) value = value.slice(0, 8);
            if (value.length > 5) {
                value = `${value.slice(0,5)}-${value.slice(5)}`;
            }
            e.target.value = value;
        });
    }
}

// Inicializar máscaras quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    aplicarMascaras();
});

function atualizarInterfaceLoja() {
    // Atualiza interface quando muda de loja
    carregarVendasUI();
    carregarEstoqueUI();
}
