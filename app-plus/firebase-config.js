// Configuração Firebase - NXT Plus
// IMPORTANTE: Substitua pelos seus valores do Firebase Console

const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências globais
const auth = firebase.auth();
const db = firebase.firestore();

// Usuário atual e loja
let currentUser = null;
let currentLoja = null;
let currentUserData = null;

// Listener de autenticação
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        // Buscar dados do usuário (incluindo loja)
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        if (userDoc.exists) {
            currentUserData = userDoc.data();
            currentLoja = currentUserData.loja;
            console.log('Usuário logado:', user.email, 'Loja:', currentLoja);
            mostrarAppPrincipal();
            carregarEstoqueLoja();
        } else {
            console.error('Usuário não tem loja configurada');
            mostrarErro('Usuário não configurado. Contate o administrador.');
            auth.signOut();
        }
    } else {
        currentUser = null;
        currentLoja = null;
        currentUserData = null;
        mostrarTelaLogin();
    }
});

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

// Carregar estoque da loja atual
async function carregarEstoqueLoja() {
    if (!currentLoja) return;

    try {
        const estoqueRef = db.collection('estoques').doc(currentLoja).collection('produtos');

        // Listener em tempo real
        estoqueRef.onSnapshot((snapshot) => {
            const produtos = [];
            snapshot.forEach((doc) => {
                produtos.push({ id: doc.id, ...doc.data() });
            });
            atualizarListaEstoque(produtos);
        });
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
    }
}

// Adicionar/Atualizar produto no estoque
async function salvarProdutoEstoque(produto) {
    if (!currentLoja) return;

    try {
        const produtoId = `${produto.modelo}-${produto.cor}`.toLowerCase().replace(/\s+/g, '-');
        const produtoRef = db.collection('estoques').doc(currentLoja).collection('produtos').doc(produtoId);

        await produtoRef.set({
            modelo: produto.modelo,
            cor: produto.cor,
            quantidade: produto.quantidade,
            chassi: produto.chassi || '',
            motor: produto.motor || '',
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
    if (!currentLoja) return false;

    try {
        const produtoId = `${modelo}-${cor}`.toLowerCase().replace(/\s+/g, '-');
        const produtoRef = db.collection('estoques').doc(currentLoja).collection('produtos').doc(produtoId);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(produtoRef);
            if (!doc.exists) {
                throw new Error('Produto não encontrado no estoque');
            }

            const novaQuantidade = doc.data().quantidade - quantidade;
            if (novaQuantidade < 0) {
                throw new Error('Estoque insuficiente');
            }

            transaction.update(produtoRef, {
                quantidade: novaQuantidade,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentUser.email
            });
        });

        console.log(`Baixa de ${quantidade}x ${modelo} ${cor} realizada`);
        return true;
    } catch (error) {
        console.error('Erro na baixa de estoque:', error);
        return false;
    }
}

// Registrar movimentação (entrada/saída)
async function registrarMovimentacao(tipo, produto, quantidade, observacao = '') {
    if (!currentLoja) return;

    try {
        await db.collection('movimentacoes').add({
            loja: currentLoja,
            tipo: tipo, // 'entrada' ou 'saida'
            modelo: produto.modelo,
            cor: produto.cor,
            quantidade: quantidade,
            observacao: observacao,
            usuario: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Atualizar quantidade no estoque
        const produtoId = `${produto.modelo}-${produto.cor}`.toLowerCase().replace(/\s+/g, '-');
        const produtoRef = db.collection('estoques').doc(currentLoja).collection('produtos').doc(produtoId);

        const incremento = tipo === 'entrada' ? quantidade : -quantidade;
        await produtoRef.update({
            quantidade: firebase.firestore.FieldValue.increment(incremento),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Erro ao registrar movimentação:', error);
        return false;
    }
}
