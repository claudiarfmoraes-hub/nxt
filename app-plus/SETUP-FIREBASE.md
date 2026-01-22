# Configuração do Firebase - NXT Plus

## 1. Criar projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nome: `nxt-plus` (ou outro nome)
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

## 2. Configurar Authentication

1. No menu lateral, clique em **Authentication**
2. Clique em **Começar**
3. Na aba **Sign-in method**, habilite **Email/Senha**
4. Clique em **Salvar**

## 3. Configurar Firestore Database

1. No menu lateral, clique em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Selecione **Iniciar no modo de produção**
4. Escolha a região: `southamerica-east1` (São Paulo)
5. Clique em **Ativar**

## 4. Configurar Regras de Segurança do Firestore

Vá em **Firestore Database > Regras** e cole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só podem ler seu próprio documento
    match /usuarios/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Só admin pode criar usuários
    }

    // Estoques - usuários só acessam sua loja
    match /estoques/{lojaId}/{document=**} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.loja == lojaId;
    }

    // Movimentações - usuários só acessam sua loja
    match /movimentacoes/{docId} {
      allow read: if request.auth != null &&
        resource.data.loja == get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.loja;
      allow create: if request.auth != null &&
        request.resource.data.loja == get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.loja;
    }
  }
}
```

## 5. Obter credenciais do projeto

1. Clique na engrenagem (⚙️) > **Configurações do projeto**
2. Role até **Seus apps** e clique no ícone Web `</>`
3. Nome do app: `NXT Plus Web`
4. **NÃO** marque Firebase Hosting
5. Clique em **Registrar app**
6. Copie o objeto `firebaseConfig`

## 6. Configurar no projeto

Abra o arquivo `firebase-config.js` e substitua:

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};
```

## 7. Criar usuários (via Firebase Console)

1. Vá em **Authentication > Users**
2. Clique em **Adicionar usuário**
3. Preencha email e senha
4. Anote o **UID** gerado

## 8. Vincular usuário à loja (via Firestore)

1. Vá em **Firestore Database**
2. Crie a coleção `usuarios`
3. Adicione um documento com o UID do usuário:

```
usuarios/
  └── [UID_DO_USUARIO]/
        ├── email: "usuario@email.com"
        ├── loja: "valinhos-shopping"  (slug da loja)
        ├── lojaNome: "Valinhos Shopping"
        └── role: "vendedor"
```

## 9. Criar estoque inicial (opcional)

```
estoques/
  └── valinhos-shopping/
        └── produtos/
              ├── gataka-cinza/
              │     ├── modelo: "Gataka"
              │     ├── cor: "Cinza"
              │     └── quantidade: 5
              │
              └── aventura-preto/
                    ├── modelo: "Aventura"
                    ├── cor: "Preto"
                    └── quantidade: 3
```

## Custos (Plano Gratuito - Spark)

- **Authentication**: 10.000 usuários/mês ✅
- **Firestore**:
  - 50.000 leituras/dia ✅
  - 20.000 escritas/dia ✅
  - 1GB armazenamento ✅

Para 80 usuários com uso moderado, o plano gratuito é suficiente!

## Testar localmente

```bash
cd app-plus
python -m http.server 8080
```

Acesse: http://localhost:8080
