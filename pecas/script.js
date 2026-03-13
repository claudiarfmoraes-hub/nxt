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
    configurarPreviewImagens();
    console.log('NXT Peças V1.2 inicializado');
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

function configurarPreviewImagens() {
    document.getElementById('imagemPeca').addEventListener('change', function() {
        const preview = document.getElementById('previewImagens');
        preview.innerHTML = '';
        for (const file of this.files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
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
    const cor = document.getElementById('corBike').value;
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

    // Capturar imagens anexadas
    const imagensBase64 = [];
    const fileInput = document.getElementById('imagemPeca');
    const promises = [];
    if (fileInput.files.length > 0) {
        for (const file of fileInput.files) {
            promises.push(new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagensBase64.push(e.target.result);
                    resolve();
                };
                reader.readAsDataURL(file);
            }));
        }
    }

    const finalizarAdicao = () => {
        const peca = {
            id: Date.now(),
            categoria,
            descricao,
            modelo,
            cor,
            tipoPreco,
            quantidade: qtd,
            precoUnitario: preco,
            total: preco * qtd,
            imagens: imagensBase64
        };

        pecasAdicionadas.push(peca);
        renderizarPecas();
        atualizarTotal();

        // Limpar campos de peça
        document.getElementById('descricaoPeca').value = '';
        document.getElementById('qtdPeca').value = '1';
        document.getElementById('precoPeca').value = '';
        document.getElementById('corBike').value = '';
        document.getElementById('subtotalPeca').textContent = 'R$ 0,00';
        fileInput.value = '';
        document.getElementById('previewImagens').innerHTML = '';
    };

    if (promises.length > 0) {
        Promise.all(promises).then(finalizarAdicao);
    } else {
        finalizarAdicao();
    }
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
                <div class="peca-detalhe">${p.modelo}${p.cor ? ' | Cor: ' + p.cor : ''} | ${p.categoria} | ${p.quantidade}x R$ ${formatarValor(p.precoUnitario)} (${p.tipoPreco})${p.imagens && p.imagens.length > 0 ? ' | 📷 ' + p.imagens.length + ' img' : ''}</div>
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
            cor: p.cor,
            tipoPreco: p.tipoPreco,
            quantidade: p.quantidade,
            precoUnitario: p.precoUnitario,
            total: p.total,
            imagens: p.imagens || []
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
        'correios': 'Correios', 'rodonaves': 'Rodonaves', 'atual_cargas': 'Atual Cargas',
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
        texto += `${i + 1}. ${p.descricao} (${p.modelo})${p.cor ? ' - Cor: ' + p.cor : ''}\n`;
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
    document.getElementById('previewImagens').innerHTML = '';
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
const LOGO_BASE64 = 'data:image/png;base64,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';

function gerarPDFSeparacao() {
    if (!ultimaVendaPDF) {
        mostrarFeedback('Nenhum pedido para gerar PDF', 'erro');
        return;
    }

    const venda = ultimaVendaPDF;
    const transpLabel = {
        'correios': 'Correios', 'rodonaves': 'Rodonaves', 'atual_cargas': 'Atual Cargas',
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
                <td style="text-align:center">${p.cor || '-'}</td>
                <td style="text-align:center">${p.categoria}</td>
                <td style="text-align:center">${p.quantidade}</td>
                <td class="check-col"></td>
            </tr>`;
    });

    // Montar seção de imagens para o PDF
    let imagensHTML = '';
    const pecasComImagem = venda.pecas.filter(p => p.imagens && p.imagens.length > 0);
    if (pecasComImagem.length > 0) {
        imagensHTML = `
        <div class="section" style="page-break-before: auto;">
            <div class="section-title">IMAGENS DE REFERÊNCIA</div>
            <div style="padding: 10px; border: 1px solid #ddd; border-top: none;">
                ${pecasComImagem.map(p => `
                    <div style="margin-bottom: 12px;">
                        <p style="font-weight:bold; font-size:12px; margin-bottom:6px;">${p.descricao} (${p.modelo})${p.cor ? ' - Cor: ' + p.cor : ''}</p>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            ${p.imagens.map(img => `<img src="${img}" style="max-width:200px; max-height:200px; border:1px solid #ddd; border-radius:4px; object-fit:contain;">`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Separação - ${venda.id}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #222; }

        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1a1a2e; padding: 10px 14px; margin-bottom: 12px; background: #1a1a2e; border-radius: 6px; }
        .header-left p { font-size: 11px; color: #c6ff00; font-weight: bold; letter-spacing: 1px; }
        .header-right { text-align: right; }
        .pedido-id { font-size: 16px; font-weight: bold; color: #c6ff00; }
        .pedido-data { font-size: 11px; color: #e0e0e0; margin-top: 2px; }

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
            <img src="${LOGO_BASE64}" style="height:32px; margin-bottom:4px;">
            <p>PEDIDO DE SEPARAÇÃO - EXPEDIÇÃO</p>
        </div>
        <div class="header-right">
            <div class="pedido-id">${venda.id}</div>
            ${venda.protocoloSac ? `<div class="pedido-data" style="font-weight:bold; font-size:13px;">Protocolo: ${venda.protocoloSac}</div>` : ''}
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
                    <th style="width:30px;text-align:center">#</th>
                    <th>Descrição da Peça</th>
                    <th style="width:80px;text-align:center">Modelo</th>
                    <th style="width:70px;text-align:center">Cor</th>
                    <th style="width:100px;text-align:center">Categoria</th>
                    <th style="width:35px;text-align:center">Qtd</th>
                    <th style="width:40px;text-align:center">OK</th>
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

    ${imagensHTML}

    <div class="assinatura-grid">
        <div class="assinatura-item">
            <div class="assinatura-linha">Separado por / Data</div>
        </div>
        <div class="assinatura-item">
            <div class="assinatura-linha">Conferido por / Data</div>
        </div>
    </div>

    <div class="watermark">NXT Peças V1.2 - Documento gerado em ${new Date().toLocaleString('pt-BR')}</div>

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
