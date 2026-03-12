// ========================================
// NXT PEÇAS V1.0 - Script Principal
// ========================================

// URL do Google Apps Script (Web App) para gravar na planilha
// Após implantar o Apps Script, cole a URL aqui:
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytZgFvvhTvYRgufyvFTGbMb27sxHnIQp256XQ6r7VZuX2B0RTdO3MIpbf4EcF8KgnYlw/exec';

// Tudo é enviado ao Google Apps Script (planilha + Bling em um só lugar)

// ========================================
// DADOS: LOJAS E VENDEDORES
// ========================================

const LOJAS = [
    "Araraquara",
    "Balneário Camboriú - Carrefour",
    "Balneário Camboriú - Frente Mar",
    "Blumenau - Neumarkt",
    "Blumenau - Norte",
    "Bragança Pta. - Centro",
    "Campinas - Norte Sul",
    "Fábrica Jaraguá",
    "Florianópolis Lagoa",
    "Galpão Sumaré",
    "Holambra - Centro",
    "Hortolândia - Shopping",
    "Indaiatuba - Polo",
    "Jaguariúna - Centro",
    "Jaraguá - Loja da Fábrica",
    "Joinville - Garten",
    "Joinville - Loja",
    "Limeira Shopping",
    "Mogi Guaçu - Buriti",
    "Mogi-Guaçu - Boulevard",
    "Patio Limeira Shopping",
    "Piracicaba",
    "Poços de Caldas",
    "Pouso Alegre",
    "Ribeirão Preto",
    "Rio Claro",
    "Santo André - ABC",
    "Santo André - Grand Plaza",
    "Santos",
    "São Bernardo - Golden",
    "São José - Continente",
    "São Paulo - Butantã",
    "São Paulo - Nações Unidas",
    "São Paulo - Santana Shopping",
    "Sorocaba - Iguatemi",
    "Sumaré Shopping",
    "Tivoli - Shopping",
    "Valinhos - Shopping"
];

const VENDEDORES_DATA = {
    "7882": { nome: "RAPHAEL TADEU DO NASCIMENTO", loja: "NI HAO HOLAMBRA" },
    "5812": { nome: "LUAN LUCAS SPROVIERI IODETTTE", loja: "NI HAO HOLAMBRA" },
    "3851": { nome: "RAFAELA CRISTINA ABRAHAO", loja: "NI HAO BRAGANCA" },
    "8923": { nome: "JAQUELINE TAIOKI MOREIRA MONTENEGRO", loja: "NI HAO BALNEARIO(ATLANTICA)" },
    "9785": { nome: "IGOR RANGEL GONCALVES", loja: "NI HAO JOINVILLE" },
    "1811": { nome: "LUCIANO MARCON DE CARVALHO", loja: "NI HAO BALNEARIO(ATLANTICA)" },
    "2805": { nome: "MICHEL FRANK DE OLIVEIRA", loja: "NI HAO CAMPINAS (SHOPP LIMEIRA)" },
    "3805": { nome: "DIEGO AMERICO DE SOUZA", loja: "NI HAO CAMPINAS (SHOPP INDAIATUBA)" },
    "7847": { nome: "BIANCA IASMIN BARROS MARANHAO", loja: "NI HAO CAMPINAS (SHOPP SANTANA)" },
    "0620": { nome: "MATHEUS SANTOS DA SILVA", loja: "NI HAO MINAS GERAIS(POÇOS DE CALDAS)" },
    "2664": { nome: "FELIPE ASSUNCAO CARDOSO", loja: "NI HAO MINAS GERAIS(POÇOS DE CALDAS)" },
    "8816": { nome: "GABRIELE BIANCHI DANTAS", loja: "NI HAO CAMPINAS (SHOPP GRAND PLAZA)" },
    "8896": { nome: "VANESSA CRISTINA BUENO PITELI", loja: "NI HAO CAMPINAS (SUMARE PARK CITY)" },
    "1810": { nome: "JOYCE FORESTE FERREIRA", loja: "NI HAO CAMPINAS (SUMARE PARK CITY)" },
    "1846": { nome: "BRUNO CARDOSO GOMES", loja: "NI HAO CAMPINAS (SHOPP SANTANA)" },
    "3803": { nome: "VINICIUS GONCALVES FRANCO", loja: "NI HAO CAMPINAS (SHOPP TIVOLLI)" },
    "4800": { nome: "DANIEL FELIPE COSTA DE OLIVEIRA", loja: "NI HAO CAMPINAS (SHOPP GOLDEN)" },
    "5810": { nome: "KATHLLEEN PEREIRA LIMA", loja: "NI HAO BALNEARIO(CARREFOUR)" },
    "3821": { nome: "VITORIA GABRIELI GUIMARAES SILVA", loja: "NI HAO (SANTOS)" },
    "2936": { nome: "JONAS HONORATO GONÇALVES DOS SANTOS", loja: "NI HAO BLUMENAU(SHOPP NORTE)" },
    "3974": { nome: "CELSO VITORIA WEBER JUNIOR", loja: "NI HAO FLORIPA" },
    "0808": { nome: "BRYAN KELVIN LOPES CARDOSO", loja: "NI HAO CAMPINAS (SHOPP VALINHOS)" },
    "2895": { nome: "RAISSA EMY OGAWA SAKAMOTO", loja: "NI HAO CAMPINAS (SHOPP ARARAQUARA)" },
    "1889": { nome: "VANESSA DO CARMO SANTOS", loja: "NI HAO CAMPINAS (SHOPP ABC)" },
    "6894": { nome: "HELIOMAR ARAUJO JUNIOR", loja: "NI HAO MATRIZ" },
    "1821": { nome: "CLAUDIA APARECIDA DA SILVA", loja: "NI HAO MATRIZ (SHOPP HORTOLANDIA)" },
    "7873": { nome: "DIEGO HENRIQUE DOS SANTOS", loja: "NI HAO CAMPINAS (LOJA NORTE/SUL CAMPINAS)" },
    "5808": { nome: "EDSON OLIVEIRA CAMPOS", loja: "NI HAO MATRIZ (SHOPPING BUTANTA)" },
    "0801": { nome: "FLAVIA ALESSANDRA CAZALINI", loja: "NI HAO MATRIZ (SHOPP BUTANTA)" },
    "6879": { nome: "GABRIELA CRISTINA ANTONIO", loja: "NI HAO MATRIZ (SHOPPING BOULEVARD)" },
    "8870": { nome: "HELOISA GOMES DE OLIVEIRA", loja: "NI HAO MATRIZ (SHOPP HORTOLANDIA)" },
    "4847": { nome: "INGRID KAYANE VIEIRA DE MORAES", loja: "NI HAO MATRIZ (SHOPP HORTOLANDIA)" },
    "3832": { nome: "JESSICA DE SOUZA PEREIRA", loja: "NI HAO MATRIZ (SHOPP HORTOLANDIA)" },
    "1219": { nome: "JOAO ROBERTO CARDIAS FERREIRA", loja: "NI HAO BLUMENAU(SHOPP NORTE)" },
    "6697": { nome: "JULIA BEATRIZ SANTANA PIERINI", loja: "NI HAO MATRIZ (SHOPP BURITI)" },
    "9071": { nome: "LUANA BIASI LEITE", loja: "NI HAO SAO JOSE(SHOPP CONTINENTE)" },
    "5040": { nome: "LUCAS MACHADO WITZOREKE", loja: "NI HAO FLORIPA (FLORIPA SHOPP/CONT)" },
    "2814": { nome: "PAOLA PONTEL", loja: "NI HAO MATRIZ (SHOPP VALINHOS)" },
    "1840": { nome: "PAULO DANILO COSTA FERREIRA", loja: "NI HAO MATRIZ (SHOPP GRAND PLAZA)" },
    "8898": { nome: "WILLIANS SACRAMENTO SOARES", loja: "NI HAO MATRIZ (SHOPP ABC)" },
    "5803": { nome: "EDGAR MELARATO SILVA", loja: "NI HAO CAMPINAS (LOJA NORTE/SUL CAMPINAS)" },
    "6880": { nome: "JESSICA VICTORIA POSSOLINO", loja: "NI HAO MATRIZ (SHOPP BURITI)" },
    "7861": { nome: "TAYNA JULIA DE ALVARENGA SOUSA", loja: "NI HAO MATRIZ (SHOPP BOULEVARD)" },
    "6800": { nome: "RYAN VIGORITO OLIVEIRA", loja: "NI HAO MATRIZ (SHOPP DAS NAÇÕES)" },
    "8235": { nome: "GIOVANNI MENDES FRANCO", loja: "NI HAO MATRIZ (SHOPP INDAIATUBA)" },
    "8809": { nome: "FERNANDO VERONEZ FERREIRA", loja: "NI HAO MATRIZ( GALPAO(MOTORISTA/ESTOQ)" },
    "1899": { nome: "FERNANDO MARQUES BRAZ FLORÊNCIO", loja: "NI HAO INDAIATUBA POLO" },
    "4827": { nome: "LEONARDO NASCIMENTO CRISPIM", loja: "NI HAO MATRIZ (SHOPP BUTANTA)" },
    "8888": { nome: "PATRICIA HELOISA DE MOURA OLIVEIRA LOPES", loja: "NI HAO MATRIZ (SHOPP GOLDEN)" },
    "4605": { nome: "JOAO GABRIEL DA SILVA RODRIGUES", loja: "NI HAO JOINVILLE" },
    "8957": { nome: "ALERSON GEAN DE MELO FAGUNDES", loja: "NI HAO BALNEARIO(ATLANTICA)" },
    "7821": { nome: "GUILHERME MITSUYUKI", loja: "NI HAO CAMPINAS (SHOPP ARARAQUARA)" },
    "6866": { nome: "RODRIGO VINICIUS CORREA", loja: "NI HAO JAGUARIUNA" },
    "6804": { nome: "JHULYA CAUANE MACHADO DA SILVA", loja: "NI HAO MATRIZ (SHOPP BURITI)" },
    "4878": { nome: "FELIPE SIMOES LOURENÇO", loja: "NI HAO CAMPINAS (SHOPP SOROCABA)" },
    "5958": { nome: "SAMARA NOGUEIRA", loja: "NI HAO JOINVILLE (SHOPP GARTEN)" },
    "9941": { nome: "RODRIGO HAHNEMANN", loja: "NI HAO BLUMENAU (SHOPP NEUMARKT)" },
    "4874": { nome: "BRENO DAMACENA DE OLIVEIRA", loja: "NI HAO CAMPINAS (SHOPP PATIO LIMEIRA)" },
    "4587": { nome: "RENE GOMES CARDOSO", loja: "NI HAO BALNEARIO(CARREFOUR)" },
    "6978": { nome: "ARIANE NATALIA PEREIRA", loja: "NI HAO SAO JOSE(SHOPP CONTINENTE)" },
    "7893": { nome: "ROBSON DONIZETE RIBEIRO", loja: "NI HAO MATRIZ (SHOPP BUTANTA)" },
    "2660": { nome: "LEONARDO DIAS DE SOUZA", loja: "NI HAO CAMPINAS (LOJA NORTE/SUL CAMPINAS)" },
    "1510": { nome: "LUIZ VITOR PORTO SANTOS", loja: "NI HAO JOINVILLE (SHOPP GARTEN)" },
    "0877": { nome: "GABRIEL BATISTA MACEDO", loja: "NI HAO (SANTOS)" },
    "1898": { nome: "ELLEN CRISTINA GOMES", loja: "NI HAO CAMPINAS (SHOPP SÃO CARLOS)" },
    "0802": { nome: "MELYSSA ALVES DA SILVA", loja: "NI HAO CAMPINAS (SHOPP RIO CLARO)" },
    "4820": { nome: "JOAO CANDIDO PEREIRA DA SILVA", loja: "NI HAO CAMPINAS (SHOPP RIO CLARO)" },
    "6253": { nome: "WALLAKCE DA SILVA E SILVA", loja: "NI HAO BLUMENAU (SHOPP NEUMARKT)" },
    "1836": { nome: "ANA LARA LIMA SILVA", loja: "" },
    "7899": { nome: "SAMIRES DA SILVA FERNANDES VIDAL", loja: "" },
    "2830": { nome: "ROSELAINE APARECIDA MENEGASSO", loja: "" },
    "2889": { nome: "SERGIO PEREIRA DE GODOY", loja: "" }
};

const LISTA_VENDEDORES = Object.values(VENDEDORES_DATA).map(v => v.nome).sort();

// ========================================
// ESTADO DA APLICAÇÃO
// ========================================

let pecasAdicionadas = [];
let vendedorSelecionado = null;
let matriculaSelecionada = null;
let ultimoResumo = '';
let envioEmAndamento = false;

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    carregarLojas();
    configurarDataHoje();
    configurarMascaras();
    configurarAutoCompleteVendedor();
    configurarFormaPagamento();
    document.getElementById('vendaPecaForm').addEventListener('submit', registrarVenda);

    console.log('NXT Peças V1.0 inicializado');
});

function carregarLojas() {
    const select = document.getElementById('lojaVenda');
    LOJAS.forEach(loja => {
        const opt = document.createElement('option');
        opt.value = loja;
        opt.textContent = loja;
        select.appendChild(opt);
    });
}

function configurarDataHoje() {
    const dataInput = document.getElementById('dataVenda');
    const hoje = new Date().toISOString().split('T')[0];
    dataInput.value = hoje;
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

    // Máscara de CPF
    const cpfInput = document.getElementById('cpfCliente');
    cpfInput.addEventListener('input', () => {
        let v = cpfInput.value.replace(/\D/g, '');
        if (v.length > 11) v = v.substring(0, 11);
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        cpfInput.value = v;
        validarCampoCpf();
    });

    // Máscara de moeda
    const precoInput = document.getElementById('precoPeca');
    precoInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v) {
            v = (parseInt(v) / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            e.target.value = v;
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

function validarCampoCpf() {
    const input = document.getElementById('cpfCliente');
    const aviso = document.getElementById('avisoCpf');
    const digitos = input.value.replace(/\D/g, '');
    if (digitos.length === 11) {
        if (validarCPF(digitos)) {
            input.classList.remove('campo-invalido');
            input.classList.add('campo-valido');
            aviso.classList.remove('visivel');
        } else {
            input.classList.add('campo-invalido');
            input.classList.remove('campo-valido');
            aviso.classList.add('visivel');
        }
    } else if (digitos.length > 0) {
        input.classList.remove('campo-valido');
        aviso.classList.remove('visivel');
    } else {
        input.classList.remove('campo-invalido', 'campo-valido');
        aviso.classList.remove('visivel');
    }
}

// ========================================
// AUTOCOMPLETE VENDEDOR
// ========================================

function configurarAutoCompleteVendedor() {
    const input = document.getElementById('vendedor');
    const sugBox = document.getElementById('vendedorSuggestions');

    input.addEventListener('input', () => {
        const termo = input.value.toUpperCase().trim();
        sugBox.innerHTML = '';
        vendedorSelecionado = null;
        matriculaSelecionada = null;

        if (termo.length < 2) {
            sugBox.classList.remove('show');
            return;
        }

        const matches = LISTA_VENDEDORES.filter(v => v.includes(termo));

        if (matches.length === 0) {
            sugBox.classList.remove('show');
            return;
        }

        matches.slice(0, 8).forEach(nome => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = nome;
            div.addEventListener('click', () => {
                input.value = nome;
                vendedorSelecionado = nome;
                // Buscar matrícula
                for (const [mat, dados] of Object.entries(VENDEDORES_DATA)) {
                    if (dados.nome === nome) {
                        matriculaSelecionada = mat;
                        break;
                    }
                }
                sugBox.classList.remove('show');
            });
            sugBox.appendChild(div);
        });

        sugBox.classList.add('show');
    });

    // Fechar suggestions ao clicar fora
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !sugBox.contains(e.target)) {
            sugBox.classList.remove('show');
        }
    });
}

// ========================================
// FORMA DE PAGAMENTO
// ========================================

function configurarFormaPagamento() {
    const select = document.getElementById('formaPagamento');
    const parcelasContainer = document.getElementById('parcelasContainer');

    select.addEventListener('change', () => {
        parcelasContainer.style.display = select.value === 'credito' ? 'block' : 'none';
    });
}

// ========================================
// GERENCIAMENTO DE PEÇAS
// ========================================

function adicionarPeca() {
    const descricao = document.getElementById('descricaoPeca').value.trim();
    const codigo = document.getElementById('codigoPeca').value.trim();
    const qtd = parseInt(document.getElementById('qtdPeca').value) || 1;
    const precoTexto = document.getElementById('precoPeca').value;

    if (!descricao) {
        mostrarFeedback('Informe a descrição da peça', 'erro');
        return;
    }

    if (!precoTexto) {
        mostrarFeedback('Informe o preço da peça', 'erro');
        return;
    }

    // Converter preço de formato brasileiro para número
    const preco = parseMoeda(precoTexto);
    if (preco <= 0) {
        mostrarFeedback('Preço inválido', 'erro');
        return;
    }

    const peca = {
        id: Date.now(),
        descricao,
        codigo,
        quantidade: qtd,
        precoUnitario: preco,
        total: preco * qtd
    };

    pecasAdicionadas.push(peca);
    renderizarPecas();
    atualizarTotal();

    // Limpar campos
    document.getElementById('descricaoPeca').value = '';
    document.getElementById('codigoPeca').value = '';
    document.getElementById('qtdPeca').value = '1';
    document.getElementById('precoPeca').value = '';
    document.getElementById('descricaoPeca').focus();
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
                <div class="peca-detalhe">${p.codigo ? `Cód: ${p.codigo} | ` : ''}${p.quantidade}x R$ ${formatarValor(p.precoUnitario)}</div>
            </div>
            <span class="peca-preco">R$ ${formatarValor(p.total)}</span>
            <button type="button" class="btn-remover-peca" onclick="removerPeca(${p.id})">✕</button>
        </div>
    `).join('');
}

function atualizarTotal() {
    const total = pecasAdicionadas.reduce((sum, p) => sum + p.total, 0);
    document.getElementById('totalVenda').textContent = `R$ ${formatarValor(total)}`;
}

// ========================================
// UTILITÁRIOS DE FORMATAÇÃO
// ========================================

function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function parseMoeda(texto) {
    // Remove tudo exceto dígitos, vírgula e ponto
    let limpo = texto.replace(/[R$\s]/g, '').trim();
    // Formato brasileiro: 1.234,56
    limpo = limpo.replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(limpo);
    return isNaN(valor) ? 0 : valor;
}

// ========================================
// REGISTRAR VENDA
// ========================================

async function registrarVenda(event) {
    event.preventDefault();

    if (envioEmAndamento) return;

    // Validações
    const loja = document.getElementById('lojaVenda').value;
    const vendedor = document.getElementById('vendedor').value.trim();
    const data = document.getElementById('dataVenda').value;
    const nomeCliente = document.getElementById('nomeCliente').value.trim();
    const telefone = document.getElementById('telefoneCliente').value.trim();
    const cpf = document.getElementById('cpfCliente').value.trim();
    const email = document.getElementById('emailCliente').value.trim();
    const formaPagamento = document.getElementById('formaPagamento').value;
    const parcelas = document.getElementById('parcelas').value;
    const observacoes = document.getElementById('observacoes').value.trim();

    if (!loja) { mostrarFeedback('Selecione a loja', 'erro'); return; }
    if (!vendedor) { mostrarFeedback('Informe o vendedor', 'erro'); return; }
    if (!data) { mostrarFeedback('Informe a data', 'erro'); return; }
    if (!nomeCliente) { mostrarFeedback('Informe o nome do cliente', 'erro'); return; }
    if (!telefone || !validarTelefone(telefone)) { mostrarFeedback('Telefone inválido', 'erro'); return; }
    if (cpf && !validarCPF(cpf)) { mostrarFeedback('CPF inválido', 'erro'); return; }
    if (pecasAdicionadas.length === 0) { mostrarFeedback('Adicione ao menos uma peça', 'erro'); return; }
    if (!formaPagamento) { mostrarFeedback('Selecione a forma de pagamento', 'erro'); return; }

    envioEmAndamento = true;
    const btnSubmit = document.querySelector('.btn-registrar-venda');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando...';

    const totalVenda = pecasAdicionadas.reduce((sum, p) => sum + p.total, 0);

    const venda = {
        id: `PCA-${Date.now()}`,
        loja,
        vendedor: vendedorSelecionado || vendedor,
        matriculaVendedor: matriculaSelecionada || '',
        dataVenda: data,
        cliente: {
            nome: nomeCliente,
            cpf: cpf.replace(/\D/g, ''),
            telefone: telefone.replace(/\D/g, ''),
            email
        },
        pecas: pecasAdicionadas.map(p => ({
            descricao: p.descricao,
            codigo: p.codigo,
            quantidade: p.quantidade,
            precoUnitario: p.precoUnitario,
            total: p.total
        })),
        pagamento: {
            forma: formaPagamento,
            parcelas: formaPagamento === 'credito' ? parcelas : '1'
        },
        observacoes,
        total: totalVenda
    };

    // Mostrar modal de resumo
    mostrarResumoModal(venda);

    // Enviar tudo ao Google Apps Script (planilha + Bling em um só request)
    const resultado = await enviarParaGoogle(venda);

    // Atualizar checklist do modal
    atualizarChecklist('checkPlanilha', resultado.planilha);
    atualizarChecklist('checkBling', resultado.bling);

    envioEmAndamento = false;
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<span class="btn-icon">✅</span> Registrar Venda de Peças';
}

// ========================================
// ENVIO PARA GOOGLE APPS SCRIPT
// (Planilha + Bling em um único request)
// ========================================

async function enviarParaGoogle(venda) {
    const resultado = { planilha: false, bling: false };

    if (GOOGLE_SCRIPT_URL.includes('SUBSTITUIR')) {
        console.warn('Google Apps Script não configurado');
        return resultado;
    }

    // Proteção anti-duplicidade
    if (vendaJaEnviada(venda)) {
        console.warn('Venda duplicada bloqueada');
        return { planilha: true, bling: true };
    }

    const payload = {
        id: venda.id,
        loja: venda.loja,
        vendedor: venda.vendedor,
        matriculaVendedor: venda.matriculaVendedor,
        dataVenda: venda.dataVenda,
        nomeCliente: venda.cliente.nome,
        cpfCliente: venda.cliente.cpf,
        telefoneCliente: venda.cliente.telefone,
        emailCliente: venda.cliente.email,
        pecas: venda.pecas,
        formaPagamento: venda.pagamento.forma,
        parcelas: venda.pagamento.parcelas,
        observacoes: venda.observacoes,
        total: venda.total
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s para dar tempo ao Bling

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Google Apps Script redireciona (302) e pode retornar como text
        try {
            const data = await response.json();
            resultado.planilha = data.planilha || false;
            resultado.bling = data.bling || false;

            if (data.erros && data.erros.length > 0) {
                console.warn('Erros no envio:', data.erros);
            }
            if (data.blingPedidoId) {
                console.log('Pedido Bling criado:', data.blingPedidoId);
            }
        } catch (parseError) {
            // Se não conseguiu parsear JSON, o Google pode ter retornado redirect
            // Nesse caso, assumir que foi enviado com sucesso
            console.log('Resposta não-JSON do Google (provavelmente redirect) - considerando sucesso');
            resultado.planilha = true;
            resultado.bling = true;
        }

        marcarVendaEnviada(venda);
        return resultado;

    } catch (error) {
        console.error('Erro ao enviar para Google:', error);
        if (error.name === 'AbortError') {
            // Timeout - pode ter funcionado no servidor
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
        venda.cliente.cpf || '',
        venda.dataVenda,
        String(venda.total),
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
        'credito': 'Crédito', 'boleto': 'Boleto', 'transferencia': 'Transferência'
    };

    let texto = `*VENDA DE PEÇAS*\n`;
    texto += `━━━━━━━━━━━━━━━━\n`;
    texto += `*Loja:* ${venda.loja}\n`;
    texto += `*Vendedor:* ${venda.vendedor}${venda.matriculaVendedor ? ` (${venda.matriculaVendedor})` : ''}\n`;
    texto += `*Data:* ${formatarData(venda.dataVenda)}\n\n`;
    texto += `*Cliente:* ${venda.cliente.nome}\n`;
    texto += `*Telefone:* ${formatarTelefoneExibicao(venda.cliente.telefone)}\n`;
    if (venda.cliente.cpf) texto += `*CPF:* ${formatarCpfExibicao(venda.cliente.cpf)}\n`;
    if (venda.cliente.email) texto += `*E-mail:* ${venda.cliente.email}\n`;
    texto += `\n*PEÇAS:*\n`;
    venda.pecas.forEach((p, i) => {
        texto += `${i + 1}. ${p.descricao}`;
        if (p.codigo) texto += ` (${p.codigo})`;
        texto += `\n   ${p.quantidade}x R$ ${formatarValor(p.precoUnitario)} = R$ ${formatarValor(p.total)}\n`;
    });
    texto += `\n*TOTAL: R$ ${formatarValor(venda.total)}*\n`;
    texto += `*Pagamento:* ${formaLabel[venda.pagamento.forma] || venda.pagamento.forma}`;
    if (venda.pagamento.forma === 'credito') texto += ` (${venda.pagamento.parcelas}x)`;
    texto += '\n';
    if (venda.observacoes) texto += `*Obs:* ${venda.observacoes}\n`;

    ultimoResumo = texto;
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
        // Fallback
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
    vendedorSelecionado = null;
    matriculaSelecionada = null;
    renderizarPecas();
    atualizarTotal();
    configurarDataHoje();
    document.getElementById('parcelasContainer').style.display = 'none';
    // Limpar validações visuais
    document.querySelectorAll('.campo-invalido, .campo-valido').forEach(el => {
        el.classList.remove('campo-invalido', 'campo-valido');
    });
    document.querySelectorAll('.campo-aviso').forEach(el => {
        el.classList.remove('visivel');
    });
}

// ========================================
// FORMATAÇÃO PARA EXIBIÇÃO
// ========================================

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

function formatarCpfExibicao(digitos) {
    return digitos.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
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
