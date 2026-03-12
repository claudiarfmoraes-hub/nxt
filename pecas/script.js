// ========================================
// NXT PEÇAS V1.0 - Script Principal
// SAC - Venda de Peças e Garantia
// ========================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytZgFvvhTvYRgufyvFTGbMb27sxHnIQp256XQ6r7VZuX2B0RTdO3MIpbf4EcF8KgnYlw/exec';

// ========================================
// CATÁLOGO DE PEÇAS
// ========================================

const CATALOGO_PECAS = {
    "Baterias e Elétrico": [
        { nome: "Bateria 12v 12ah chumbo ácido", cliente: 298.80, revenda: 270.00 },
        { nome: "Bateria 12v 20ah chumbo ácido", cliente: 358.80, revenda: 322.80 },
        { nome: "Bateria 12v 20ah grafeno", cliente: 450.00, revenda: 382.50 },
        { nome: "Bateria 12v 35ah grafeno", cliente: 600.00, revenda: 510.00 },
        { nome: "Bateria 48v lítio", cliente: 0, revenda: 0 },
        { nome: "Carregador 60v / 48v", cliente: 346.80, revenda: 318.00 },
        { nome: "Chicote", cliente: 0, revenda: 0 },
        { nome: "Conjunto cabos de bateria", cliente: 25.00, revenda: 21.25 },
        { nome: "Fonte do carregador", cliente: 0, revenda: 0 },
        { nome: "Fuzível", cliente: 0, revenda: 0 },
        { nome: "Maleta de bateria", cliente: 0, revenda: 0 },
        { nome: "Módulo controlador", cliente: 354.00, revenda: 300.90 },
        { nome: "Módulo controlador 48v", cliente: 334.00, revenda: 283.90 },
        { nome: "Tomada carregador", cliente: 0, revenda: 0 },
        { nome: "Tomada maleta", cliente: 0, revenda: 0 }
    ],
    "Pneus e Rodas": [
        { nome: "Aro 10 dianteiro", cliente: 206.00, revenda: 175.10 },
        { nome: "Bico ventil", cliente: 0, revenda: 0 },
        { nome: "Camara de ar", cliente: 54.00, revenda: 26.40 },
        { nome: "Calota", cliente: 0, revenda: 0 },
        { nome: "Olho de gato", cliente: 0, revenda: 0 },
        { nome: "Pneu 10 2.75", cliente: 346.80, revenda: 226.80 },
        { nome: "Pneu 12 2.50", cliente: 358.80, revenda: 238.80 }
    ],
    "Motor e Transmissão": [
        { nome: "Coroa de transmissão", cliente: 0, revenda: 0 },
        { nome: "Motor 1000w", cliente: 1250.00, revenda: 1062.50 },
        { nome: "Protetor de motor", cliente: 0, revenda: 0 }
    ],
    "Freios": [
        { nome: "Alavanca do freio", cliente: 0, revenda: 0 },
        { nome: "Cabo de freio diant / traseiro", cliente: 106.80, revenda: 96.00 },
        { nome: "Disco de freio", cliente: 52.00, revenda: 44.20 },
        { nome: "Freio hidráulico completo", cliente: 125.00, revenda: 106.25 },
        { nome: "Freio tambor", cliente: 118.80, revenda: 106.80 },
        { nome: "Par protetor de balança", cliente: 144.00, revenda: 86.40 },
        { nome: "Pastilha freio par", cliente: 50.00, revenda: 42.50 },
        { nome: "Reservatório de óleo", cliente: 0, revenda: 0 }
    ],
    "Suspensão, Direção e Estrutura": [
        { nome: "Amortecedor", cliente: 0, revenda: 0 },
        { nome: "Canote", cliente: 0, revenda: 0 },
        { nome: "Conjunto de direção", cliente: 57.00, revenda: 48.45 },
        { nome: "Garfo completo", cliente: 350.00, revenda: 297.50 },
        { nome: "Manivela", cliente: 0, revenda: 0 },
        { nome: "Mesa inferior", cliente: 211.00, revenda: 179.35 },
        { nome: "Mesa superior", cliente: 0, revenda: 0 },
        { nome: "Miolo trava", cliente: 0, revenda: 0 },
        { nome: "Par suspensão traseira", cliente: 165.00, revenda: 140.25 },
        { nome: "Pedaleira com chapa", cliente: 57.00, revenda: 48.45 },
        { nome: "Pezinho de descanso", cliente: 0, revenda: 0 },
        { nome: "Quadro chassi", cliente: 450.00, revenda: 382.50 },
        { nome: "Rabeta", cliente: 0, revenda: 0 },
        { nome: "Suspensão dianteira", cliente: 0, revenda: 0 }
    ],
    "Carenagens e Plásticos": [
        { nome: "Assoalho", cliente: 125.00, revenda: 106.25 },
        { nome: "Carenagem bau", cliente: 89.00, revenda: 75.65 },
        { nome: "Carenagem escudo", cliente: 189.00, revenda: 160.65 },
        { nome: "Carenagem frontal farol", cliente: 269.00, revenda: 228.65 },
        { nome: "Carenagem lateral", cliente: 56.00, revenda: 47.60 },
        { nome: "Para-brisa", cliente: 0, revenda: 0 },
        { nome: "Paralamas dianteiro", cliente: 190.80, revenda: 171.60 },
        { nome: "Paralamas traseiro", cliente: 166.80, revenda: 150.00 },
        { nome: "Plástico lateral", cliente: 45.00, revenda: 38.25 },
        { nome: "Plástico peito", cliente: 0, revenda: 0 },
        { nome: "Tapete", cliente: 0, revenda: 0 }
    ],
    "Iluminação": [
        { nome: "Bico dianteiro", cliente: 0, revenda: 0 },
        { nome: "Farol dianteiro", cliente: 145.00, revenda: 123.25 },
        { nome: "Iluminação", cliente: 0, revenda: 0 },
        { nome: "Lanterna traseira", cliente: 75.00, revenda: 63.75 },
        { nome: "Par pisca punho led", cliente: 66.00, revenda: 54.00 },
        { nome: "Relê", cliente: 0, revenda: 0 }
    ],
    "Controles e Painel": [
        { nome: "Acelerador de dedo", cliente: 118.80, revenda: 106.80 },
        { nome: "Acelerador de punho", cliente: 125.00, revenda: 106.25 },
        { nome: "Alarme completo", cliente: 126.00, revenda: 107.10 },
        { nome: "Conjunto botões (buzina, luz alta)", cliente: 58.80, revenda: 52.80 },
        { nome: "Display lcd", cliente: 145.00, revenda: 123.25 },
        { nome: "Ignição", cliente: 0, revenda: 0 },
        { nome: "Manopla", cliente: 0, revenda: 0 },
        { nome: "Painel display com acelerador", cliente: 186.00, revenda: 162.00 },
        { nome: "Par manete com sensor", cliente: 214.80, revenda: 193.20 },
        { nome: "Punho", cliente: 0, revenda: 0 }
    ],
    "Banco e Conforto": [
        { nome: "Banco de encosto", cliente: 0, revenda: 0 },
        { nome: "Banco passageiro", cliente: 0, revenda: 0 },
        { nome: "Banco traseiro", cliente: 0, revenda: 0 },
        { nome: "Encosto com alça", cliente: 126.00, revenda: 107.10 }
    ],
    "Acessórios": [
        { nome: "Cesto", cliente: 0, revenda: 0 },
        { nome: "Guidão ferro", cliente: 115.00, revenda: 97.75 },
        { nome: "Par bengala", cliente: 165.60, revenda: 150.00 },
        { nome: "Porta treco", cliente: 0, revenda: 0 },
        { nome: "Retrovisor", cliente: 0, revenda: 0 },
        { nome: "Suporte de celular", cliente: 0, revenda: 0 }
    ]
};

const MODELOS_MOTO = [
    "Gataka", "Pancho", "Luna", "Smart-Juna", "Hyphen", "Vega",
    "Zilla", "Shaka", "Jaya", "Kay", "Kimbo", "Juna"
];

// ========================================
// ESTADO DA APLICAÇÃO
// ========================================

let pecasAdicionadas = [];
let ultimoResumo = '';
let envioEmAndamento = false;

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    configurarDataHoje();
    carregarCategorias();
    carregarModelos();
    configurarMascaras();
    configurarFormaPagamento();
    configurarTipoCliente();
    configurarSubtotalCalc();
    document.getElementById('vendaPecaForm').addEventListener('submit', registrarVenda);
    console.log('NXT Peças V1.0 inicializado');
});

function configurarDataHoje() {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataVenda').value = hoje;
}

function carregarCategorias() {
    const select = document.getElementById('categoriaPeca');
    Object.keys(CATALOGO_PECAS).forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}

function carregarModelos() {
    const select = document.getElementById('modeloMoto');
    MODELOS_MOTO.forEach(modelo => {
        const opt = document.createElement('option');
        opt.value = modelo;
        opt.textContent = modelo;
        select.appendChild(opt);
    });
}

function filtrarPecas() {
    const categoria = document.getElementById('categoriaPeca').value;
    const select = document.getElementById('descricaoPeca');
    select.innerHTML = '<option value="">Selecione a peça...</option>';

    if (!categoria || !CATALOGO_PECAS[categoria]) return;

    CATALOGO_PECAS[categoria].forEach(peca => {
        const opt = document.createElement('option');
        opt.value = peca.nome;
        opt.textContent = peca.nome;
        select.appendChild(opt);
    });
}

function preencherPreco() {
    const categoria = document.getElementById('categoriaPeca').value;
    const pecaNome = document.getElementById('descricaoPeca').value;
    const tipoPreco = document.getElementById('tipoPrecoPeca').value;
    const precoInput = document.getElementById('precoPeca');

    if (!categoria || !pecaNome) return;

    const peca = CATALOGO_PECAS[categoria].find(p => p.nome === pecaNome);
    if (!peca) return;

    const preco = tipoPreco === 'revenda' ? peca.revenda : peca.cliente;
    if (preco > 0) {
        precoInput.value = preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        precoInput.value = '';
    }
    calcularSubtotal();
}

function configurarSubtotalCalc() {
    document.getElementById('qtdPeca').addEventListener('input', calcularSubtotal);
    document.getElementById('precoPeca').addEventListener('input', calcularSubtotal);
}

function calcularSubtotal() {
    const qtd = parseInt(document.getElementById('qtdPeca').value) || 0;
    const preco = parseMoeda(document.getElementById('precoPeca').value);
    document.getElementById('subtotalPeca').textContent = `R$ ${formatarValor(qtd * preco)}`;
}

// ========================================
// MÁSCARAS E VALIDAÇÃO
// ========================================

function configurarMascaras() {
    // Máscara de telefone
    const telInput = document.getElementById('telefoneCliente');
    telInput.addEventListener('input', () => {
        let v = telInput.value.replace(/\D/g, '');
        if (v.length > 11) v = v.substring(0, 11);
        if (v.length > 6) {
            if (v.length === 11) {
                v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
            } else {
                v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
            }
        } else if (v.length > 2) {
            v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
        }
        telInput.value = v;
        validarCampoTelefone();
    });

    // Máscara de CPF/CNPJ
    const docInput = document.getElementById('cpfCnpjCliente');
    docInput.addEventListener('input', () => {
        let v = docInput.value.replace(/\D/g, '');
        const tipo = document.getElementById('tipoCliente').value;
        if (tipo === 'J') {
            if (v.length > 14) v = v.substring(0, 14);
            v = v.replace(/^(\d{2})(\d)/, '$1.$2');
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
            v = v.replace(/(\d{4})(\d)/, '$1-$2');
            docInput.maxLength = 18;
            docInput.placeholder = '00.000.000/0000-00';
        } else {
            if (v.length > 11) v = v.substring(0, 11);
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            docInput.maxLength = 14;
            docInput.placeholder = '000.000.000-00';
        }
        docInput.value = v;
    });

    // Máscara de CEP
    const cepInput = document.getElementById('cepCliente');
    cepInput.addEventListener('input', () => {
        let v = cepInput.value.replace(/\D/g, '');
        if (v.length > 8) v = v.substring(0, 8);
        if (v.length > 5) {
            v = v.replace(/^(\d{5})(\d)/, '$1-$2');
        }
        cepInput.value = v;
    });

    // Buscar endereço por CEP
    cepInput.addEventListener('blur', async () => {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await resp.json();
                if (!data.erro) {
                    document.getElementById('enderecoCliente').value = data.logradouro || '';
                    document.getElementById('bairroCliente').value = data.bairro || '';
                    document.getElementById('cidadeCliente').value = data.localidade || '';
                    document.getElementById('ufCliente').value = data.uf || '';
                }
            } catch (e) {
                console.log('Erro ao buscar CEP:', e);
            }
        }
    });

    // Máscara de moeda nos campos de preço e frete
    document.querySelectorAll('.mask-moeda').forEach(input => {
        input.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v) {
                v = (parseInt(v) / 100).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                e.target.value = v;
            }
        });
    });

    // Atualizar total geral quando frete mudar
    document.getElementById('valorFrete').addEventListener('input', atualizarTotalGeral);
}

function configurarTipoCliente() {
    document.getElementById('tipoCliente').addEventListener('change', () => {
        const docInput = document.getElementById('cpfCnpjCliente');
        docInput.value = '';
        const tipo = document.getElementById('tipoCliente').value;
        if (tipo === 'J') {
            docInput.placeholder = '00.000.000/0000-00';
            docInput.maxLength = 18;
        } else {
            docInput.placeholder = '000.000.000-00';
            docInput.maxLength = 14;
        }
    });
}

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
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

function validarTelefone(tel) {
    const digitos = tel.replace(/\D/g, '');
    return digitos.length >= 10 && digitos.length <= 11;
}

function validarCampoTelefone() {
    const input = document.getElementById('telefoneCliente');
    const aviso = document.getElementById('avisoTelefone');
    const digitos = input.value.replace(/\D/g, '');
    if (digitos.length > 0 && digitos.length < 10) {
        input.classList.add('campo-invalido');
        input.classList.remove('campo-valido');
        aviso.classList.add('visivel');
    } else if (digitos.length >= 10) {
        input.classList.remove('campo-invalido');
        input.classList.add('campo-valido');
        aviso.classList.remove('visivel');
    } else {
        input.classList.remove('campo-invalido', 'campo-valido');
        aviso.classList.remove('visivel');
    }
}

// ========================================
// FORMA DE PAGAMENTO
// ========================================

function configurarFormaPagamento() {
    const select = document.getElementById('formaPagamento');
    const parcelasContainer = document.getElementById('parcelasContainer');

    select.addEventListener('change', () => {
        parcelasContainer.style.display = (select.value === 'credito' || select.value === 'link') ? 'block' : 'none';
    });
}

// ========================================
// GERENCIAMENTO DE PEÇAS
// ========================================

function adicionarPeca() {
    const categoria = document.getElementById('categoriaPeca').value;
    const descricao = document.getElementById('descricaoPeca').value;
    const modelo = document.getElementById('modeloMoto').value;
    const qtd = parseInt(document.getElementById('qtdPeca').value) || 1;
    const precoTexto = document.getElementById('precoPeca').value;
    const tipoPreco = document.getElementById('tipoPrecoPeca').value;

    if (!descricao) {
        mostrarFeedback('Selecione a peça', 'erro');
        return;
    }

    if (!modelo) {
        mostrarFeedback('Selecione o modelo da moto', 'erro');
        return;
    }

    const preco = parseMoeda(precoTexto);
    if (preco <= 0) {
        mostrarFeedback('Informe o preço da peça', 'erro');
        return;
    }

    const peca = {
        id: Date.now(),
        categoria,
        descricao,
        modelo,
        tipoPreco,
        quantidade: qtd,
        precoUnitario: preco,
        total: preco * qtd
    };

    pecasAdicionadas.push(peca);
    renderizarPecas();
    atualizarTotal();

    // Limpar campos de peça
    document.getElementById('descricaoPeca').value = '';
    document.getElementById('qtdPeca').value = '1';
    document.getElementById('precoPeca').value = '';
    document.getElementById('subtotalPeca').textContent = 'R$ 0,00';
}

function removerPeca(id) {
    pecasAdicionadas = pecasAdicionadas.filter(p => p.id !== id);
    renderizarPecas();
    atualizarTotal();
}

function renderizarPecas() {
    const lista = document.getElementById('listaPecas');
    if (pecasAdicionadas.length === 0) {
        lista.innerHTML = '';
        return;
    }

    lista.innerHTML = pecasAdicionadas.map(p => `
        <div class="peca-item">
            <div class="peca-info">
                <div class="peca-nome">${p.descricao}</div>
                <div class="peca-detalhe">${p.modelo} | ${p.categoria} | ${p.quantidade}x R$ ${formatarValor(p.precoUnitario)} (${p.tipoPreco})</div>
            </div>
            <span class="peca-preco">R$ ${formatarValor(p.total)}</span>
            <button type="button" class="btn-remover-peca" onclick="removerPeca(${p.id})">✕</button>
        </div>
    `).join('');
}

function atualizarTotal() {
    const total = pecasAdicionadas.reduce((sum, p) => sum + p.total, 0);
    document.getElementById('totalVenda').textContent = `R$ ${formatarValor(total)}`;
    atualizarTotalGeral();
}

function atualizarTotalGeral() {
    const totalPecas = pecasAdicionadas.reduce((sum, p) => sum + p.total, 0);
    const frete = parseMoeda(document.getElementById('valorFrete').value);
    document.getElementById('totalGeral').textContent = `R$ ${formatarValor(totalPecas + frete)}`;
}

// ========================================
// UTILITÁRIOS DE FORMATAÇÃO
// ========================================

function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMoeda(texto) {
    if (!texto) return 0;
    let limpo = texto.replace(/[R$\s]/g, '').trim();
    limpo = limpo.replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(limpo);
    return isNaN(valor) ? 0 : valor;
}

function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarTelefoneExibicao(digitos) {
    if (digitos.length === 11) {
        return digitos.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    return digitos.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
}

// ========================================
// REGISTRAR VENDA
// ========================================

async function registrarVenda(event) {
    event.preventDefault();

    if (envioEmAndamento) return;

    // Validações
    const tipoVenda = document.getElementById('tipoVenda').checked;
    const tipoGarantia = document.getElementById('tipoGarantia').checked;
    const origemSac = document.getElementById('origemSac').value;
    const protocoloSac = document.getElementById('protocoloSac').value.trim();
    const data = document.getElementById('dataVenda').value;
    const vendedor = document.getElementById('vendedor').value.trim();
    const prevEmbarque = document.getElementById('prevEmbarque').value;
    const nomeCliente = document.getElementById('nomeCliente').value.trim();
    const tipoCliente = document.getElementById('tipoCliente').value;
    const cpfCnpj = document.getElementById('cpfCnpjCliente').value.trim();
    const ie = document.getElementById('ieCliente').value.trim();
    const telefone = document.getElementById('telefoneCliente').value.trim();
    const endereco = document.getElementById('enderecoCliente').value.trim();
    const bairro = document.getElementById('bairroCliente').value.trim();
    const cidade = document.getElementById('cidadeCliente').value.trim();
    const uf = document.getElementById('ufCliente').value;
    const cep = document.getElementById('cepCliente').value.trim();
    const urgencia = document.getElementById('urgencia').value;
    const transportadora = document.getElementById('transportadora').value;
    const valorFrete = parseMoeda(document.getElementById('valorFrete').value);
    const pesoVolume = document.getElementById('pesoVolume').value.trim();
    const formaPagamento = document.getElementById('formaPagamento').value;
    const parcelas = document.getElementById('parcelas').value;
    const observacoes = document.getElementById('observacoes').value.trim();

    if (!tipoVenda && !tipoGarantia) { mostrarFeedback('Selecione o tipo de atendimento', 'erro'); return; }
    if (!data) { mostrarFeedback('Informe a data', 'erro'); return; }
    if (!vendedor) { mostrarFeedback('Informe o vendedor (SAC)', 'erro'); return; }
    if (!nomeCliente) { mostrarFeedback('Informe o nome do cliente', 'erro'); return; }
    if (!telefone || !validarTelefone(telefone)) { mostrarFeedback('Telefone inválido', 'erro'); return; }
    if (pecasAdicionadas.length === 0) { mostrarFeedback('Adicione ao menos uma peça', 'erro'); return; }
    if (tipoVenda && !formaPagamento) { mostrarFeedback('Selecione a forma de pagamento', 'erro'); return; }

    envioEmAndamento = true;
    const btnSubmit = document.querySelector('.btn-registrar-venda');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando...';

    const totalPecas = pecasAdicionadas.reduce((sum, p) => sum + p.total, 0);
    const totalGeral = totalPecas + valorFrete;

    // Montar tipo de atendimento
    let tipoAtendimento = [];
    if (tipoVenda) tipoAtendimento.push('Venda');
    if (tipoGarantia) tipoAtendimento.push('Garantia');

    const venda = {
        id: `PCA-${Date.now()}`,
        tipoAtendimento: tipoAtendimento.join(' + '),
        origemSac,
        protocoloSac,
        dataVenda: data,
        vendedor,
        prevEmbarque,
        cliente: {
            nome: nomeCliente,
            tipo: tipoCliente,
            cpfCnpj: cpfCnpj.replace(/\D/g, ''),
            ie,
            telefone: telefone.replace(/\D/g, ''),
            endereco,
            bairro,
            cidade,
            uf,
            cep: cep.replace(/\D/g, '')
        },
        pecas: pecasAdicionadas.map(p => ({
            categoria: p.categoria,
            descricao: p.descricao,
            modelo: p.modelo,
            tipoPreco: p.tipoPreco,
            quantidade: p.quantidade,
            precoUnitario: p.precoUnitario,
            total: p.total
        })),
        pagamento: {
            forma: formaPagamento,
            parcelas: (formaPagamento === 'credito' || formaPagamento === 'link') ? parcelas : '1'
        },
        urgencia,
        frete: {
            transportadora,
            valor: valorFrete
        },
        pesoVolume,
        observacoes,
        totalPecas,
        totalGeral
    };

    // Mostrar modal de resumo
    mostrarResumoModal(venda);

    // Enviar ao Google Apps Script
    const resultado = await enviarParaGoogle(venda);

    // Atualizar checklist do modal
    atualizarChecklist('checkPlanilha', resultado.planilha);
    atualizarChecklist('checkBling', resultado.bling);

    envioEmAndamento = false;
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<span class="btn-icon">✅</span> Registrar Atendimento';
}

// ========================================
// ENVIO PARA GOOGLE APPS SCRIPT
// ========================================

async function enviarParaGoogle(venda) {
    const resultado = { planilha: false, bling: false };

    if (GOOGLE_SCRIPT_URL.includes('SUBSTITUIR')) {
        console.warn('Google Apps Script não configurado');
        return resultado;
    }

    if (vendaJaEnviada(venda)) {
        console.warn('Venda duplicada bloqueada');
        return { planilha: true, bling: true };
    }

    const payload = {
        id: venda.id,
        tipoAtendimento: venda.tipoAtendimento,
        origemSac: venda.origemSac,
        protocoloSac: venda.protocoloSac,
        dataVenda: venda.dataVenda,
        vendedor: venda.vendedor,
        prevEmbarque: venda.prevEmbarque,
        nomeCliente: venda.cliente.nome,
        tipoCliente: venda.cliente.tipo,
        cpfCnpjCliente: venda.cliente.cpfCnpj,
        ieCliente: venda.cliente.ie,
        telefoneCliente: venda.cliente.telefone,
        enderecoCliente: venda.cliente.endereco,
        bairroCliente: venda.cliente.bairro,
        cidadeCliente: venda.cliente.cidade,
        ufCliente: venda.cliente.uf,
        cepCliente: venda.cliente.cep,
        pecas: venda.pecas,
        formaPagamento: venda.pagamento.forma,
        parcelas: venda.pagamento.parcelas,
        urgencia: venda.urgencia,
        transportadora: venda.frete.transportadora,
        valorFrete: venda.frete.valor,
        pesoVolume: venda.pesoVolume,
        observacoes: venda.observacoes,
        totalPecas: venda.totalPecas,
        totalGeral: venda.totalGeral
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        try {
            const data = await response.json();
            resultado.planilha = data.planilha || false;
            resultado.bling = data.bling || false;
            if (data.erros && data.erros.length > 0) {
                console.warn('Erros no envio:', data.erros);
            }
        } catch (parseError) {
            console.log('Resposta não-JSON do Google — considerando sucesso');
            resultado.planilha = true;
            resultado.bling = true;
        }

        marcarVendaEnviada(venda);
        return resultado;

    } catch (error) {
        console.error('Erro ao enviar para Google:', error);
        if (error.name === 'AbortError') {
            marcarVendaEnviada(venda);
            resultado.planilha = true;
        }
        return resultado;
    }
}

// ========================================
// ANTI-DUPLICIDADE
// ========================================

function gerarFingerprint(venda) {
    const partes = [
        venda.cliente.nome,
        venda.cliente.cpfCnpj || '',
        venda.dataVenda,
        String(venda.totalGeral),
        venda.pecas.map(p => `${p.descricao}-${p.quantidade}`).sort().join('|')
    ];
    const str = partes.join('::');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return 'FP' + Math.abs(hash).toString(36);
}

function vendaJaEnviada(venda) {
    const fingerprint = gerarFingerprint(venda);
    const enviadas = JSON.parse(localStorage.getItem('pecasWebhookEnviados') || '{}');
    const agora = Date.now();
    for (const fp in enviadas) {
        if (agora - enviadas[fp] > 24 * 60 * 60 * 1000) delete enviadas[fp];
    }
    localStorage.setItem('pecasWebhookEnviados', JSON.stringify(enviadas));
    return !!enviadas[fingerprint];
}

function marcarVendaEnviada(venda) {
    const fingerprint = gerarFingerprint(venda);
    const enviadas = JSON.parse(localStorage.getItem('pecasWebhookEnviados') || '{}');
    enviadas[fingerprint] = Date.now();
    localStorage.setItem('pecasWebhookEnviados', JSON.stringify(enviadas));
}

// ========================================
// MODAL DE RESUMO
// ========================================

function mostrarResumoModal(venda) {
    const formaLabel = {
        'dinheiro': 'Dinheiro', 'pix': 'PIX', 'debito': 'Débito',
        'credito': 'Crédito', 'boleto': 'Boleto', 'link': 'Link de Pagamento',
        'transferencia': 'Transferência'
    };
    const transpLabel = {
        'correios': 'Correios', 'rodonaves': 'Rodonaves',
        'em_maos': 'Em Mãos', 'loja': 'Loja', 'outro': 'Outro'
    };

    let texto = `*ATENDIMENTO SAC - PEÇAS*\n`;
    texto += `━━━━━━━━━━━━━━━━\n`;
    texto += `*Tipo:* ${venda.tipoAtendimento}\n`;
    if (venda.origemSac) texto += `*Origem:* ${venda.origemSac}\n`;
    if (venda.protocoloSac) texto += `*Protocolo:* ${venda.protocoloSac}\n`;
    texto += `*Data:* ${formatarData(venda.dataVenda)}\n`;
    texto += `*Vendedor:* ${venda.vendedor}\n`;
    if (venda.prevEmbarque) texto += `*Prev. Embarque:* ${formatarData(venda.prevEmbarque)}\n`;
    texto += `\n*CLIENTE:*\n`;
    texto += `*Nome:* ${venda.cliente.nome}\n`;
    texto += `*Telefone:* ${formatarTelefoneExibicao(venda.cliente.telefone)}\n`;
    if (venda.cliente.cpfCnpj) texto += `*${venda.cliente.tipo === 'J' ? 'CNPJ' : 'CPF'}:* ${venda.cliente.cpfCnpj}\n`;
    if (venda.cliente.ie) texto += `*IE:* ${venda.cliente.ie}\n`;
    if (venda.cliente.endereco) texto += `*Endereço:* ${venda.cliente.endereco}\n`;
    if (venda.cliente.bairro) texto += `*Bairro:* ${venda.cliente.bairro}\n`;
    if (venda.cliente.cidade) texto += `*Cidade:* ${venda.cliente.cidade}${venda.cliente.uf ? ' - ' + venda.cliente.uf : ''}\n`;
    if (venda.cliente.cep) texto += `*CEP:* ${venda.cliente.cep}\n`;
    texto += `\n*PEÇAS:*\n`;
    venda.pecas.forEach((p, i) => {
        texto += `${i + 1}. ${p.descricao} (${p.modelo})\n`;
        texto += `   ${p.quantidade}x R$ ${formatarValor(p.precoUnitario)} = R$ ${formatarValor(p.total)}\n`;
    });
    texto += `\n*Total Peças: R$ ${formatarValor(venda.totalPecas)}*\n`;
    if (venda.frete.valor > 0) {
        texto += `*Frete (${transpLabel[venda.frete.transportadora] || venda.frete.transportadora}): R$ ${formatarValor(venda.frete.valor)}*\n`;
    }
    texto += `*TOTAL GERAL: R$ ${formatarValor(venda.totalGeral)}*\n`;
    texto += `*Pagamento:* ${formaLabel[venda.pagamento.forma] || venda.pagamento.forma}`;
    if (venda.pagamento.forma === 'credito' || venda.pagamento.forma === 'link') texto += ` (${venda.pagamento.parcelas}x)`;
    texto += '\n';
    if (venda.observacoes) texto += `*Obs:* ${venda.observacoes}\n`;

    ultimoResumo = texto;
    ultimaVendaPDF = venda;
    document.getElementById('textoResumoModal').value = texto;
    document.getElementById('resumoModal').style.display = 'flex';
}

function atualizarChecklist(elementId, sucesso) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const icon = el.querySelector('.checklist-icon');
    const label = el.querySelector('span:last-child');

    if (sucesso) {
        icon.textContent = '✅';
        el.classList.add('done');
        label.textContent = elementId === 'checkPlanilha'
            ? 'Enviado para planilha!'
            : 'Enviado para Bling!';
    } else {
        icon.textContent = '❌';
        label.textContent = elementId === 'checkPlanilha'
            ? 'Erro ao enviar para planilha'
            : 'Erro ao enviar para Bling';
    }
}

function copiarResumo() {
    navigator.clipboard.writeText(ultimoResumo).then(() => {
        mostrarFeedback('Resumo copiado!', 'sucesso');
    }).catch(() => {
        const textarea = document.getElementById('textoResumoModal');
        textarea.select();
        document.execCommand('copy');
        mostrarFeedback('Resumo copiado!', 'sucesso');
    });
}

function novaVenda() {
    document.getElementById('resumoModal').style.display = 'none';
    document.getElementById('vendaPecaForm').reset();
    pecasAdicionadas = [];
    renderizarPecas();
    atualizarTotal();
    configurarDataHoje();
    document.getElementById('parcelasContainer').style.display = 'none';
    document.getElementById('subtotalPeca').textContent = 'R$ 0,00';
    document.querySelectorAll('.campo-invalido, .campo-valido').forEach(el => {
        el.classList.remove('campo-invalido', 'campo-valido');
    });
    document.querySelectorAll('.campo-aviso').forEach(el => {
        el.classList.remove('visivel');
    });
}

// ========================================
// GERAR PDF DE SEPARAÇÃO (EXPEDIÇÃO)
// ========================================

let ultimaVendaPDF = null;

function gerarPDFSeparacao() {
    if (!ultimaVendaPDF) {
        mostrarFeedback('Nenhum pedido para gerar PDF', 'erro');
        return;
    }

    const venda = ultimaVendaPDF;
    const transpLabel = {
        'correios': 'Correios', 'rodonaves': 'Rodonaves',
        'em_maos': 'Em Mãos', 'loja': 'Loja', 'outro': 'Outro'
    };
    const urgenciaLabel = {
        'baixa': 'BAIXA', 'normal': 'NORMAL', 'alta': 'ALTA', 'urgente': 'URGENTE'
    };

    const urgenciaClass = venda.urgencia === 'urgente' ? 'urgente' : (venda.urgencia === 'alta' ? 'alta' : '');

    let pecasRows = '';
    venda.pecas.forEach((p, i) => {
        pecasRows += `
            <tr>
                <td style="text-align:center">${i + 1}</td>
                <td>${p.descricao}</td>
                <td style="text-align:center">${p.modelo}</td>
                <td style="text-align:center">${p.categoria}</td>
                <td style="text-align:center">${p.quantidade}</td>
                <td class="check-col"></td>
            </tr>`;
    });

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Separação - ${venda.id}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #222; }

        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 10px; margin-bottom: 12px; }
        .header-left h1 { font-size: 18px; color: #1a1a2e; margin-bottom: 2px; }
        .header-left p { font-size: 11px; color: #666; }
        .header-right { text-align: right; }
        .pedido-id { font-size: 16px; font-weight: bold; color: #1a1a2e; }
        .pedido-data { font-size: 11px; color: #666; margin-top: 2px; }

        .urgencia-badge { display: inline-block; padding: 3px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; color: white; background: #999; margin-top: 4px; }
        .urgencia-badge.urgente { background: #dc3545; }
        .urgencia-badge.alta { background: #ff9800; }

        .section { margin-bottom: 12px; }
        .section-title { font-size: 13px; font-weight: bold; background: #1a1a2e; color: #c6ff00; padding: 5px 10px; border-radius: 4px 4px 0 0; }

        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #ddd; border-top: none; }
        .info-item { padding: 5px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
        .info-item:nth-child(odd) { border-right: 1px solid #eee; }
        .info-label { font-weight: bold; color: #555; display: block; font-size: 9px; text-transform: uppercase; margin-bottom: 1px; }

        table { width: 100%; border-collapse: collapse; border: 1px solid #ddd; }
        th { background: #f5f5f5; font-size: 11px; padding: 6px 8px; border: 1px solid #ddd; text-align: left; }
        td { padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; }
        .check-col { width: 50px; min-height: 20px; }

        .footer-section { margin-top: 15px; }
        .obs-box { border: 1px solid #ddd; border-radius: 4px; padding: 8px 10px; min-height: 40px; font-size: 11px; background: #fafafa; }

        .assinatura-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
        .assinatura-item { text-align: center; }
        .assinatura-linha { border-top: 1px solid #333; padding-top: 4px; font-size: 10px; color: #666; margin-top: 40px; }

        .watermark { text-align: center; font-size: 9px; color: #bbb; margin-top: 15px; }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <h1>NXT MOTOS</h1>
            <p>PEDIDO DE SEPARAÇÃO - EXPEDIÇÃO</p>
        </div>
        <div class="header-right">
            <div class="pedido-id">${venda.id}</div>
            <div class="pedido-data">Data: ${formatarData(venda.dataVenda)}</div>
            ${venda.prevEmbarque ? `<div class="pedido-data">Prev. Embarque: ${formatarData(venda.prevEmbarque)}</div>` : ''}
            ${venda.urgencia ? `<div class="urgencia-badge ${urgenciaClass}">${urgenciaLabel[venda.urgencia] || venda.urgencia}</div>` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">CLIENTE</div>
        <div class="info-grid">
            <div class="info-item"><span class="info-label">Nome</span>${venda.cliente.nome}</div>
            <div class="info-item"><span class="info-label">Telefone</span>${venda.cliente.telefone ? formatarTelefoneExibicao(venda.cliente.telefone) : '-'}</div>
            <div class="info-item"><span class="info-label">Endereço</span>${venda.cliente.endereco || '-'}</div>
            <div class="info-item"><span class="info-label">Bairro</span>${venda.cliente.bairro || '-'}</div>
            <div class="info-item"><span class="info-label">Cidade/UF</span>${venda.cliente.cidade || '-'}${venda.cliente.uf ? '/' + venda.cliente.uf : ''}</div>
            <div class="info-item"><span class="info-label">CEP</span>${venda.cliente.cep || '-'}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">PEÇAS PARA SEPARAÇÃO</div>
        <table>
            <thead>
                <tr>
                    <th style="width:35px;text-align:center">#</th>
                    <th>Descrição da Peça</th>
                    <th style="width:90px;text-align:center">Modelo</th>
                    <th style="width:120px;text-align:center">Categoria</th>
                    <th style="width:45px;text-align:center">Qtd</th>
                    <th style="width:50px;text-align:center">OK</th>
                </tr>
            </thead>
            <tbody>
                ${pecasRows}
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">ENVIO</div>
        <div class="info-grid">
            <div class="info-item"><span class="info-label">Transportadora</span>${transpLabel[venda.frete.transportadora] || venda.frete.transportadora || '-'}</div>
            <div class="info-item"><span class="info-label">Peso / Volume</span>${venda.pesoVolume || '-'}</div>
            <div class="info-item"><span class="info-label">Vendedor (SAC)</span>${venda.vendedor}</div>
            <div class="info-item"><span class="info-label">Tipo</span>${venda.tipoAtendimento}</div>
        </div>
    </div>

    ${venda.observacoes ? `
    <div class="section">
        <div class="section-title">OBSERVAÇÕES</div>
        <div class="obs-box">${venda.observacoes}</div>
    </div>` : ''}

    <div class="assinatura-grid">
        <div class="assinatura-item">
            <div class="assinatura-linha">Separado por / Data</div>
        </div>
        <div class="assinatura-item">
            <div class="assinatura-linha">Conferido por / Data</div>
        </div>
    </div>

    <div class="watermark">NXT Peças V1.0 - Documento gerado em ${new Date().toLocaleString('pt-BR')}</div>

    <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const janela = window.open('', '_blank');
    janela.document.write(html);
    janela.document.close();
}

// ========================================
// FEEDBACK (TOAST)
// ========================================

function mostrarFeedback(mensagem, tipo) {
    const toast = document.getElementById('feedbackToast');
    toast.textContent = mensagem;
    toast.className = `feedback-toast ${tipo} visivel`;
    setTimeout(() => {
        toast.classList.remove('visivel');
    }, 4000);
}
