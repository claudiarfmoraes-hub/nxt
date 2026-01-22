// Funções de UI para Login - NXT Plus

// Handler do formulário de login
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    fazerLogin(email, senha);
}

// Mostrar tela de login
function mostrarTelaLogin() {
    document.getElementById('telaLogin').style.display = 'flex';
    document.getElementById('appPrincipal').style.display = 'none';
    document.getElementById('footerUserInfo').style.display = 'none';
    esconderLoading();
    esconderErro();
}

// Mostrar app principal
function mostrarAppPrincipal() {
    document.getElementById('telaLogin').style.display = 'none';
    document.getElementById('appPrincipal').style.display = 'block';
    document.getElementById('footerUserInfo').style.display = 'flex';

    // Atualizar info do usuário no footer
    if (currentUser && currentUserData) {
        document.getElementById('footerUserEmail').textContent = currentUser.email;
        document.getElementById('footerUserLoja').textContent = currentUserData.lojaNome || currentLoja;
    }

    // Pré-selecionar a loja do usuário no formulário
    if (currentLoja) {
        const selectLoja = document.getElementById('loja');
        if (selectLoja) {
            selectLoja.value = currentLoja;
            selectLoja.disabled = true; // Não deixa mudar a loja
        }

        const selectLojaInventario = document.getElementById('lojaInventario');
        if (selectLojaInventario) {
            selectLojaInventario.value = currentLoja;
            selectLojaInventario.disabled = true;
        }
    }

    esconderLoading();
}

// Mostrar loading
function mostrarLoading(mensagem = 'Carregando...') {
    const loading = document.getElementById('loginLoading');
    if (loading) {
        loading.querySelector('span').textContent = mensagem;
        loading.style.display = 'flex';
    }
    document.getElementById('loginError').style.display = 'none';
}

// Esconder loading
function esconderLoading() {
    const loading = document.getElementById('loginLoading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Mostrar erro
function mostrarErro(mensagem) {
    const error = document.getElementById('loginError');
    if (error) {
        error.textContent = mensagem;
        error.style.display = 'block';
    }
}

// Esconder erro
function esconderErro() {
    const error = document.getElementById('loginError');
    if (error) {
        error.style.display = 'none';
    }
}

// Atualizar lista de estoque na UI
function atualizarListaEstoque(produtos) {
    console.log('Estoque atualizado:', produtos);

    // Atualizar contador
    const contador = document.getElementById('contadorInventario');
    if (contador) {
        contador.textContent = produtos.length;
    }

    // Atualizar lista de inventário
    const lista = document.getElementById('listaInventarioAtual');
    if (lista && produtos.length > 0) {
        lista.innerHTML = produtos.map(p => `
            <div class="item-inventario" data-id="${p.id}">
                <div class="item-info">
                    <strong>${p.modelo} - ${p.cor}</strong>
                    <span class="item-quantidade">${p.quantidade} unidade(s)</span>
                </div>
                <div class="item-actions">
                    <button class="btn-entrada" onclick="registrarMovimentacaoUI('entrada', '${p.modelo}', '${p.cor}')">+ Entrada</button>
                    <button class="btn-saida" onclick="registrarMovimentacaoUI('saida', '${p.modelo}', '${p.cor}')">- Saída</button>
                </div>
            </div>
        `).join('');
    } else if (lista) {
        lista.innerHTML = `
            <div class="empty-state-novo">
                <span class="empty-icon">📭</span>
                <p>Nenhum produto no estoque</p>
                <p class="empty-hint">Adicione produtos usando o formulário acima</p>
            </div>
        `;
    }
}

// UI para registrar movimentação
async function registrarMovimentacaoUI(tipo, modelo, cor) {
    const quantidade = prompt(`Quantidade para ${tipo === 'entrada' ? 'entrada' : 'saída'}:`, '1');
    if (!quantidade || isNaN(quantidade) || parseInt(quantidade) <= 0) {
        return;
    }

    const observacao = prompt('Observação (opcional):', '');

    const sucesso = await registrarMovimentacao(tipo, { modelo, cor }, parseInt(quantidade), observacao);
    if (sucesso) {
        alert(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
    } else {
        alert('Erro ao registrar movimentação.');
    }
}

// Integração com vendas - dar baixa automática
// Esta função será chamada quando uma venda for registrada
async function baixaEstoqueVenda(produtos) {
    if (!currentLoja) {
        console.error('Usuário não está logado em uma loja');
        return false;
    }

    for (const produto of produtos) {
        const sucesso = await baixaEstoque(produto.modelo, produto.cor, 1);
        if (!sucesso) {
            console.error(`Falha na baixa do produto ${produto.modelo} ${produto.cor}`);
        }
    }

    return true;
}

// Verificar se está logado antes de permitir venda
function verificarLoginParaVenda() {
    if (!currentUser || !currentLoja) {
        alert('Você precisa estar logado para registrar vendas.');
        mostrarTelaLogin();
        return false;
    }
    return true;
}

console.log('NXT Plus - Funções de login carregadas');
