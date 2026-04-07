// Configuração Firebase - NXT Plus
// Sistema com níveis de acesso: admin, gerente, funcionario

const firebaseConfig = {
    apiKey: "AIzaSyDxMhLvzLkYMD9TIEjqUUt7R09p_qBQUnQ",
    authDomain: "nxt-plus.firebaseapp.com",
    projectId: "nxt-plus",
    storageBucket: "nxt-plus.firebasestorage.app",
    messagingSenderId: "649742928491",
    appId: "1:649742928491:web:05257dee6782c298f0ff2e"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências globais
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();

// Estado do usuário
let currentUser = null;
let currentUserData = null;
let lojasDisponiveis = []; // lojas que o usuário pode acessar
let lojaAtual = null; // loja selecionada atualmente

// ========================================
// AUTENTICAÇÃO E CONTROLE DE ACESSO
// ========================================

// Listener de autenticação
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        try {
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            if (userDoc.exists) {
                currentUserData = userDoc.data();
                console.log('Usuário logado:', user.email, 'Role:', currentUserData.role);

                // Carregar lojas disponíveis baseado no nível de acesso
                await carregarLojasDisponiveis();

                mostrarAppPrincipal();
                configurarInterfacePorRole();
            } else {
                console.error('Usuário não cadastrado no sistema');
                mostrarErro('Usuário não cadastrado. Contate o administrador.');
                auth.signOut();
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            mostrarErro('Erro ao carregar dados. Tente novamente.');
            auth.signOut();
        }
    } else {
        currentUser = null;
        currentUserData = null;
        lojasDisponiveis = [];
        lojaAtual = null;
        mostrarTelaLogin();
    }
});

// Carregar lojas disponíveis baseado no role
async function carregarLojasDisponiveis() {
    lojasDisponiveis = [];

    if (!currentUserData) return;

    try {
        if (currentUserData.role === 'admin') {
            // Admin vê todas as lojas
            const snapshot = await db.collection('lojas').where('ativo', '==', true).get();
            snapshot.forEach(doc => {
                lojasDisponiveis.push({ id: doc.id, ...doc.data() });
            });
        } else if (currentUserData.role === 'gerente') {
            // Gerente vê lojas atribuídas
            if (currentUserData.lojas && currentUserData.lojas.length > 0) {
                for (const lojaId of currentUserData.lojas) {
                    const lojaDoc = await db.collection('lojas').doc(lojaId).get();
                    if (lojaDoc.exists) {
                        lojasDisponiveis.push({ id: lojaDoc.id, ...lojaDoc.data() });
                    }
                }
            }
        } else {
            // Funcionário vê apenas sua loja
            if (currentUserData.loja) {
                const lojaDoc = await db.collection('lojas').doc(currentUserData.loja).get();
                if (lojaDoc.exists) {
                    lojasDisponiveis.push({ id: lojaDoc.id, ...lojaDoc.data() });
                }
            }
        }

        // Selecionar primeira loja por padrão
        if (lojasDisponiveis.length > 0) {
            lojaAtual = lojasDisponiveis[0].id;
        }

        console.log('Lojas disponíveis:', lojasDisponiveis);
    } catch (error) {
        console.error('Erro ao carregar lojas:', error);
    }
}

// Verificar se é admin
function isAdmin() {
    return currentUserData && currentUserData.role === 'admin';
}

// Verificar se é gerente
function isGerente() {
    return currentUserData && currentUserData.role === 'gerente';
}

// Verificar se tem acesso a uma loja específica
function temAcessoLoja(lojaId) {
    if (!currentUserData) return false;
    if (currentUserData.role === 'admin') return true;
    if (currentUserData.role === 'gerente') {
        return currentUserData.lojas && currentUserData.lojas.includes(lojaId);
    }
    return currentUserData.loja === lojaId;
}

// Trocar loja atual
function trocarLoja(lojaId) {
    if (temAcessoLoja(lojaId)) {
        lojaAtual = lojaId;
        carregarDadosLoja();
        atualizarSeletorLoja();
    }
}

// Função de login
async function fazerLogin(email, senha) {
    try {
        mostrarLoading('Entrando...');
        await auth.signInWithEmailAndPassword(email, senha);
    } catch (error) {
        console.error('Erro no login:', error);
        let mensagem = 'Erro ao fazer login';
        if (error.code === 'auth/user-not-found') {
            mensagem = 'Usuário não encontrado';
        } else if (error.code === 'auth/wrong-password') {
            mensagem = 'Senha incorreta';
        } else if (error.code === 'auth/invalid-email') {
            mensagem = 'Email inválido';
        }
        esconderLoading();
        mostrarErro(mensagem);
    }
}

// Função de logout
async function fazerLogout() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

// ========================================
// GESTÃO DE LOJAS (ADMIN)
// ========================================

// Listar todas as lojas (admin)
async function listarTodasLojas() {
    if (!isAdmin()) return [];

    try {
        const snapshot = await db.collection('lojas').get();
        const lojas = [];
        snapshot.forEach(doc => {
            lojas.push({ id: doc.id, ...doc.data() });
        });
        return lojas;
    } catch (error) {
        console.error('Erro ao listar lojas:', error);
        return [];
    }
}

// Criar nova loja (admin)
async function criarLoja(dados) {
    if (!isAdmin()) {
        alert('Sem permissão para criar lojas');
        return false;
    }

    try {
        const lojaId = dados.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await db.collection('lojas').doc(lojaId).set({
            nome: dados.nome,
            endereco: dados.endereco || '',
            telefone: dados.telefone || '',
            ativo: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.email
        });
        console.log('Loja criada:', lojaId);
        return lojaId;
    } catch (error) {
        console.error('Erro ao criar loja:', error);
        return false;
    }
}

// Atualizar loja (admin)
async function atualizarLoja(lojaId, dados) {
    if (!isAdmin()) return false;

    try {
        await db.collection('lojas').doc(lojaId).update({
            ...dados,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.email
        });
        return true;
    } catch (error) {
        console.error('Erro ao atualizar loja:', error);
        return false;
    }
}

// ========================================
// GESTÃO DE USUÁRIOS (ADMIN)
// ========================================

// Listar todos os usuários (admin)
async function listarUsuarios() {
    if (!isAdmin()) return [];

    try {
        const snapshot = await db.collection('usuarios').get();
        const usuarios = [];
        snapshot.forEach(doc => {
            usuarios.push({ id: doc.id, ...doc.data() });
        });
        return usuarios;
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        return [];
    }
}

// Criar usuário no Firestore (após criar no Auth)
async function criarUsuarioFirestore(uid, dados) {
    if (!isAdmin()) return false;

    try {
        await db.collection('usuarios').doc(uid).set({
            email: dados.email,
            nome: dados.nome,
            role: dados.role, // 'admin', 'gerente', 'funcionario'
            loja: dados.role === 'funcionario' ? dados.loja : null,
            lojas: dados.role === 'gerente' ? dados.lojas : [],
            ativo: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.email
        });
        return true;
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return false;
    }
}

// Atualizar usuário (admin)
async function atualizarUsuario(uid, dados) {
    if (!isAdmin()) return false;

    try {
        await db.collection('usuarios').doc(uid).update({
            ...dados,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.email
        });
        return true;
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return false;
    }
}

// ========================================
// GESTÃO DE ESTOQUE
// ========================================

// Carregar estoque da loja atual
async function carregarEstoqueLoja() {
    if (!lojaAtual) return;

    try {
        const estoqueRef = db.collection('estoques').doc(lojaAtual).collection('produtos');

        // Listener em tempo real
        estoqueRef.orderBy('modelo').onSnapshot((snapshot) => {
            const produtos = [];
            snapshot.forEach((doc) => {
                produtos.push({ id: doc.id, ...doc.data() });
            });
            if (typeof atualizarListaEstoque === 'function') {
                atualizarListaEstoque(produtos);
            }
        });
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
    }
}

// Adicionar/Atualizar produto no estoque
async function salvarProdutoEstoque(produto) {
    if (!lojaAtual) return false;

    try {
        const produtoId = `${produto.modelo}-${produto.cor}`.toLowerCase().replace(/\s+/g, '-');
        const produtoRef = db.collection('estoques').doc(lojaAtual).collection('produtos').doc(produtoId);

        const docAtual = await produtoRef.get();
        const quantidadeAtual = docAtual.exists ? docAtual.data().quantidade || 0 : 0;

        await produtoRef.set({
            modelo: produto.modelo,
            cor: produto.cor,
            quantidade: produto.quantidade !== undefined ? produto.quantidade : quantidadeAtual + 1,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.email
        }, { merge: true });

        return true;
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        return false;
    }
}

// Dar baixa no estoque (quando vende)
async function baixaEstoque(modelo, cor, quantidade = 1) {
    if (!lojaAtual) return false;

    try {
        const produtoId = `${modelo}-${cor}`.toLowerCase().replace(/\s+/g, '-');
        const produtoRef = db.collection('estoques').doc(lojaAtual).collection('produtos').doc(produtoId);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(produtoRef);
            if (!doc.exists) {
                throw new Error('Produto não encontrado no estoque');
            }

            const novaQuantidade = (doc.data().quantidade || 0) - quantidade;
            if (novaQuantidade < 0) {
                throw new Error('Estoque insuficiente');
            }

            transaction.update(produtoRef, {
                quantidade: novaQuantidade,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentUser.email
            });
        });

        // Registrar movimentação
        await registrarMovimentacao('saida', { modelo, cor }, quantidade, 'Baixa por venda');

        console.log(`Baixa de ${quantidade}x ${modelo} ${cor} realizada`);
        return true;
    } catch (error) {
        console.error('Erro na baixa de estoque:', error);
        return false;
    }
}

// Entrada no estoque
async function entradaEstoque(modelo, cor, quantidade = 1, observacao = '') {
    if (!lojaAtual) return false;

    try {
        const produtoId = `${modelo}-${cor}`.toLowerCase().replace(/\s+/g, '-');
        const produtoRef = db.collection('estoques').doc(lojaAtual).collection('produtos').doc(produtoId);

        const docAtual = await produtoRef.get();
        const quantidadeAtual = docAtual.exists ? docAtual.data().quantidade || 0 : 0;

        await produtoRef.set({
            modelo: modelo,
            cor: cor,
            quantidade: quantidadeAtual + quantidade,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.email
        }, { merge: true });

        // Registrar movimentação
        await registrarMovimentacao('entrada', { modelo, cor }, quantidade, observacao);

        console.log(`Entrada de ${quantidade}x ${modelo} ${cor} realizada`);
        return true;
    } catch (error) {
        console.error('Erro na entrada de estoque:', error);
        return false;
    }
}

// Registrar movimentação
async function registrarMovimentacao(tipo, produto, quantidade, observacao = '') {
    if (!lojaAtual) return;

    try {
        await db.collection('movimentacoes').doc(lojaAtual).collection('registros').add({
            tipo: tipo,
            modelo: produto.modelo,
            cor: produto.cor,
            quantidade: quantidade,
            observacao: observacao,
            usuario: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Erro ao registrar movimentação:', error);
        return false;
    }
}

// Carregar movimentações
async function carregarMovimentacoes(limite = 50) {
    if (!lojaAtual) return [];

    try {
        const snapshot = await db.collection('movimentacoes').doc(lojaAtual)
            .collection('registros')
            .orderBy('createdAt', 'desc')
            .limit(limite)
            .get();

        const movimentacoes = [];
        snapshot.forEach(doc => {
            movimentacoes.push({ id: doc.id, ...doc.data() });
        });
        return movimentacoes;
    } catch (error) {
        console.error('Erro ao carregar movimentações:', error);
        return [];
    }
}

// ========================================
// GESTÃO DE VENDAS
// ========================================

// Salvar venda no Firebase
async function salvarVenda(venda) {
    if (!lojaAtual) return false;

    try {
        const vendaRef = await db.collection('vendas').doc(lojaAtual).collection('registros').add({
            ...venda,
            loja: lojaAtual,
            usuario: currentUser.email,
            status: 'pendente',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Dar baixa no estoque para cada produto
        if (venda.produtos && venda.produtos.length > 0) {
            for (const produto of venda.produtos) {
                await baixaEstoque(produto.modelo, produto.cor, 1);
            }
        }

        console.log('Venda salva:', vendaRef.id);
        return vendaRef.id;
    } catch (error) {
        console.error('Erro ao salvar venda:', error);
        return false;
    }
}

// Carregar vendas da loja
async function carregarVendas(filtros = {}) {
    if (!lojaAtual) return [];

    try {
        let query = db.collection('vendas').doc(lojaAtual).collection('registros');

        // Aplicar filtros
        if (filtros.dataInicio) {
            query = query.where('createdAt', '>=', new Date(filtros.dataInicio));
        }
        if (filtros.dataFim) {
            query = query.where('createdAt', '<=', new Date(filtros.dataFim + 'T23:59:59'));
        }

        query = query.orderBy('createdAt', 'desc').limit(filtros.limite || 100);

        const snapshot = await query.get();
        const vendas = [];
        snapshot.forEach(doc => {
            vendas.push({ id: doc.id, ...doc.data() });
        });
        return vendas;
    } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        return [];
    }
}

// Atualizar status da venda
async function atualizarStatusVenda(vendaId, status) {
    if (!lojaAtual) return false;

    try {
        await db.collection('vendas').doc(lojaAtual).collection('registros').doc(vendaId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.email
        });
        return true;
    } catch (error) {
        console.error('Erro ao atualizar venda:', error);
        return false;
    }
}

// Carregar dados da loja atual
function carregarDadosLoja() {
    carregarEstoqueLoja();
    if (typeof atualizarInterfaceLoja === 'function') {
        atualizarInterfaceLoja();
    }
}

// ========================================
// CLOUD FUNCTIONS - GESTÃO DE USUÁRIOS
// ========================================

// Criar usuário via Cloud Function (automático)
async function criarUsuarioCompleto(dados) {
    if (!isAdmin()) {
        mostrarErro('Sem permissão para criar usuários');
        return false;
    }

    try {
        mostrarLoading('Criando usuário...');
        const criarUsuario = functions.httpsCallable('criarUsuario');
        const result = await criarUsuario(dados);
        esconderLoading();

        if (result.data.success) {
            mostrarSucesso(result.data.message);
            return result.data.uid;
        }
        return false;
    } catch (error) {
        esconderLoading();
        console.error('Erro ao criar usuário:', error);
        mostrarErro(error.message || 'Erro ao criar usuário');
        return false;
    }
}

// Desativar usuário via Cloud Function
async function desativarUsuarioCompleto(uid) {
    if (!isAdmin()) return false;

    try {
        mostrarLoading('Desativando usuário...');
        const desativarUsuario = functions.httpsCallable('desativarUsuario');
        const result = await desativarUsuario({ uid });
        esconderLoading();

        if (result.data.success) {
            mostrarSucesso('Usuário desativado');
            return true;
        }
        return false;
    } catch (error) {
        esconderLoading();
        mostrarErro(error.message || 'Erro ao desativar usuário');
        return false;
    }
}

// Reativar usuário via Cloud Function
async function reativarUsuarioCompleto(uid) {
    if (!isAdmin()) return false;

    try {
        mostrarLoading('Reativando usuário...');
        const reativarUsuario = functions.httpsCallable('reativarUsuario');
        const result = await reativarUsuario({ uid });
        esconderLoading();

        if (result.data.success) {
            mostrarSucesso('Usuário reativado');
            return true;
        }
        return false;
    } catch (error) {
        esconderLoading();
        mostrarErro(error.message || 'Erro ao reativar usuário');
        return false;
    }
}

// Resetar senha via Cloud Function
async function resetarSenhaUsuario(uid, novaSenha) {
    if (!isAdmin()) return false;

    try {
        mostrarLoading('Alterando senha...');
        const resetarSenha = functions.httpsCallable('resetarSenha');
        const result = await resetarSenha({ uid, novaSenha });
        esconderLoading();

        if (result.data.success) {
            mostrarSucesso('Senha alterada com sucesso');
            return true;
        }
        return false;
    } catch (error) {
        esconderLoading();
        mostrarErro(error.message || 'Erro ao resetar senha');
        return false;
    }
}
