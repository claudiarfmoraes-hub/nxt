const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Criar usuário (apenas admin pode chamar)
exports.criarUsuario = functions.https.onCall(async (data, context) => {
    // Verificar se está autenticado
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    // Verificar se é admin
    const callerUid = context.auth.uid;
    const callerDoc = await admin.firestore().collection('usuarios').doc(callerUid).get();

    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem criar usuários');
    }

    // Validar dados
    const { email, senha, nome, role, loja, lojas } = data;

    if (!email || !senha || !nome || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Dados incompletos');
    }

    if (!['admin', 'gerente', 'funcionario'].includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', 'Role inválido');
    }

    try {
        // Criar usuário no Authentication
        const userRecord = await admin.auth().createUser({
            email: email,
            password: senha,
            displayName: nome
        });

        // Criar documento no Firestore
        await admin.firestore().collection('usuarios').doc(userRecord.uid).set({
            email: email,
            nome: nome,
            role: role,
            loja: role === 'funcionario' ? loja : null,
            lojas: role === 'gerente' ? (lojas || []) : [],
            ativo: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: context.auth.token.email || callerUid
        });

        return {
            success: true,
            uid: userRecord.uid,
            message: `Usuário ${email} criado com sucesso`
        };

    } catch (error) {
        console.error('Erro ao criar usuário:', error);

        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'Este email já está cadastrado');
        }
        if (error.code === 'auth/invalid-email') {
            throw new functions.https.HttpsError('invalid-argument', 'Email inválido');
        }
        if (error.code === 'auth/weak-password') {
            throw new functions.https.HttpsError('invalid-argument', 'Senha muito fraca (mínimo 6 caracteres)');
        }

        throw new functions.https.HttpsError('internal', 'Erro ao criar usuário: ' + error.message);
    }
});

// Desativar usuário
exports.desativarUsuario = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const callerDoc = await admin.firestore().collection('usuarios').doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem desativar usuários');
    }

    const { uid } = data;
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'UID do usuário não informado');
    }

    try {
        // Desativar no Auth
        await admin.auth().updateUser(uid, { disabled: true });

        // Marcar como inativo no Firestore
        await admin.firestore().collection('usuarios').doc(uid).update({
            ativo: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: context.auth.token.email
        });

        return { success: true, message: 'Usuário desativado' };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Erro ao desativar: ' + error.message);
    }
});

// Reativar usuário
exports.reativarUsuario = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const callerDoc = await admin.firestore().collection('usuarios').doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem reativar usuários');
    }

    const { uid } = data;
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'UID do usuário não informado');
    }

    try {
        await admin.auth().updateUser(uid, { disabled: false });
        await admin.firestore().collection('usuarios').doc(uid).update({
            ativo: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: context.auth.token.email
        });

        return { success: true, message: 'Usuário reativado' };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Erro ao reativar: ' + error.message);
    }
});

// Resetar senha do usuário
exports.resetarSenha = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const callerDoc = await admin.firestore().collection('usuarios').doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem resetar senhas');
    }

    const { uid, novaSenha } = data;
    if (!uid || !novaSenha) {
        throw new functions.https.HttpsError('invalid-argument', 'UID e nova senha são obrigatórios');
    }

    try {
        await admin.auth().updateUser(uid, { password: novaSenha });
        return { success: true, message: 'Senha alterada com sucesso' };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Erro ao resetar senha: ' + error.message);
    }
});
