<sup>Esse é um feedback gerado por IA, ele pode conter erros.</sup>

Você tem 6 créditos restantes para usar o sistema de feedback AI.

# Feedback para VitorChagas-mcl:

Nota final: **27.5/100**

Olá, VitorChagas-mcl! 🚀 Que jornada intensa você teve até aqui! Antes de mais nada, parabéns pelos acertos que você fez, especialmente na parte da autenticação básica, criação de usuários, login com JWT, logout e exclusão de usuários — você conseguiu passar testes importantes que envolvem esses fluxos essenciais! 🎉 Isso mostra que você já tem uma boa base para trabalhar com segurança em APIs.

Além disso, você aplicou o middleware de autenticação nas rotas de agentes e casos corretamente, garantindo que usuários não autenticados não consigam acessar esses recursos. Muito bom! 👏 Também notei que você estruturou seu projeto de forma próxima da arquitetura MVC, com controllers, routes, repositories e middlewares organizados em pastas — isso é fundamental para projetos profissionais.

---

### 🚨 Agora vamos falar dos pontos que travaram sua nota, especialmente os testes que falharam e que indicam áreas críticas para melhorar:

---

## 1. Falhas no Validador de Usuário no Endpoint de Registro (POST /auth/register)

**Testes que falharam:**

- Receber erro 400 ao tentar criar usuário com nome vazio ou nulo;
- Receber erro 400 ao tentar criar usuário com email vazio ou nulo;
- Receber erro 400 ao tentar criar usuário com senha inválida (curta, sem números, sem caractere especial, sem letra maiúscula, sem letras);
- Receber erro 400 ao tentar criar usuário com campo extra ou faltante;
- Receber erro 400 ao tentar criar usuário com e-mail já em uso.

**Análise da causa raiz:**

No seu `authController.js`, a função `create` está tentando validar os dados do usuário, mas o retorno e as mensagens não estão exatamente no formato esperado pelos testes.

Veja este trecho do seu código:

```javascript
if (Object.keys(extras).length > 0) {
  return res.status(400).json({ mensagem: "Campos extras não permitidos" });
}

if (!nome || typeof nome !== 'string' || nome.trim() === '') {
  return res.status(400).json({ mensagem: "Nome é obrigatório" });
}
if (!email || typeof email !== 'string' || email.trim() === '') {
  return res.status(400).json({ mensagem: "Email é obrigatório" });
}
if (!senha || !validarSenha(senha)) {
  return res.status(400).json({ mensagem: "Senha inválida" });
}

const usuarioExistente = await usuariosRepository.findByEmail(email);
if (usuarioExistente) {
  return res.status(400).json({ status: 400, message: "Email já está em uso" });
}
```

O problema aqui é que os testes esperam que o retorno de erros contenha **status 400** e um campo `message` (ou `mensagem`?), mas principalmente que as mensagens de erro sejam **mais detalhadas e específicas**, por exemplo:

- Para senha inválida, o teste espera uma mensagem que informe os critérios da senha (mínimo 8 caracteres, letras maiúsculas, minúsculas, números e caractere especial).
- Para campos extras, o teste espera erro 400 com uma mensagem clara.
- Para campos vazios ou nulos, o teste espera erro 400 com mensagens específicas para cada campo.

Além disso, a função `create` retorna o novo usuário diretamente, mas não está retornando o status code 201 com o formato esperado pelo teste (que pode ser um objeto JSON com o usuário criado, sem expor a senha).

**Sugestões para corrigir:**

- Padronize as mensagens de erro para que sejam claras e sigam o padrão esperado.
- Em vez de retornar a primeira validação que falha, acumule os erros em um array e retorne todos juntos (como você fez para agentes e casos). Isso ajuda o cliente a entender todos os problemas de uma vez.
- Não retorne a senha do usuário criado no JSON de resposta.
- Use o campo `message` (em português ou inglês, mas consistente) para as mensagens de erro.

Exemplo de validação mais robusta:

```javascript
async function create(req, res, next) {
  try {
    const { nome, email, senha, ...extras } = req.body;
    const errors = [];

    if (Object.keys(extras).length > 0) {
      errors.push({ field: "extras", message: "Campos extras não permitidos" });
    }
    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
      errors.push({ field: "nome", message: "Nome é obrigatório" });
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
      errors.push({ field: "email", message: "Email é obrigatório" });
    }
    if (!senha) {
      errors.push({ field: "senha", message: "Senha é obrigatória" });
    } else if (!validarSenha(senha)) {
      errors.push({ field: "senha", message: "Senha deve ter no mínimo 8 caracteres, incluir letra maiúscula, minúscula, número e caractere especial" });
    }

    if (errors.length > 0) {
      return res.status(400).json({ status: 400, message: "Parâmetros inválidos", errors });
    }

    const usuarioExistente = await usuariosRepository.findByEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ status: 400, message: "Email já está em uso" });
    }

    const senhaHasheada = await bcrypt.hash(senha, 10);
    const novoUsuario = await usuariosRepository.create({ nome, email, senha: senhaHasheada });

    // Não retorne a senha no corpo da resposta
    const { senha: _, ...usuarioSemSenha } = novoUsuario;

    return res.status(201).json(usuarioSemSenha);

  } catch (error) {
    next(error);
  }
}
```

Dessa forma, você atende vários testes de validação simultaneamente.

---

## 2. Formato da Resposta no Login

O teste espera que o endpoint de login retorne um objeto com a propriedade `access_token` contendo o token JWT, e não um campo `token` ou outros.

Veja seu trecho atual:

```javascript
return res.status(200).json({
    status: 200,
    mensagem: "Login realizado com sucesso",
    user: { id: usuario.id, email: usuario.email },
    token
});
```

Aqui, o teste espera algo assim:

```json
{
  "access_token": "token aqui"
}
```

**Como corrigir:**

Altere seu retorno para:

```javascript
return res.status(200).json({ access_token: token });
```

Assim seu endpoint estará alinhado com o esperado e os testes passarão.

---

## 3. Middleware de Autenticação — Falha ao Usar `process.env.JWT_SECRET`

Seu middleware `authMiddleware.js` faz:

```javascript
jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
  if (err) {
    return res.status(401).json({ mensagem: "Token inválido" });
  }
  req.user = user;
  next();
});
```

Mas, no seu `authController.js`, você usa:

```javascript
process.env.JWT_SECRET || "chave_secreta"
```

Ou seja, no middleware, se a variável `JWT_SECRET` não estiver definida, o valor será `undefined`, o que pode causar falha na verificação do token.

**Recomendo** que você padronize o uso da variável de ambiente em todo o projeto, garantindo que o `JWT_SECRET` esteja sempre definido (e que o arquivo `.env` esteja carregado corretamente).

No middleware, faça:

```javascript
const secret = process.env.JWT_SECRET || "chave_secreta";

jwt.verify(token, secret, (err, user) => {
  if (err) {
    return res.status(401).json({ mensagem: "Token inválido" });
  }
  req.user = user;
  next();
});
```

E garanta que você está usando o pacote `dotenv` para carregar as variáveis de ambiente no início da aplicação (geralmente no `server.js`):

```javascript
require('dotenv').config();
```

---

## 4. Rotas de Autenticação com Middleware Indevido

No arquivo `routes/authRoutes.js`, você colocou o middleware de autenticação em rotas que deveriam ser públicas, como `POST /auth/register` e `POST /auth/login`:

```javascript
router.post('/login', authMiddleware, authController.login);
router.post('/register', authMiddleware, authController.create);
```

Isso bloqueia o acesso para usuários não autenticados, o que não faz sentido para registro e login.

**Correção:**

Remova o `authMiddleware` dessas rotas:

```javascript
router.post('/login', authController.login);
router.post('/register', authController.create);
```

Assim, usuários poderão se registrar e logar sem token.

---

## 5. Ausência da Migration para a Tabela `usuarios`

No seu arquivo de migration (`20250802190416_solution_migrations.js`), você criou as tabelas `agentes` e `casos`, mas não criou a tabela `usuarios`, que é essencial para o desafio da autenticação.

Sem essa tabela, a persistência dos usuários não funciona, e o sistema não consegue salvar ou buscar usuários.

**Você precisa criar uma migration para a tabela `usuarios` com os campos:**

- `id` (auto increment, chave primária),
- `nome` (string, obrigatório),
- `email` (string único, obrigatório),
- `senha` (string, obrigatório).

Exemplo básico:

```javascript
await knex.schema.createTable('usuarios', table => {
  table.increments('id').primary();
  table.string('nome').notNullable();
  table.string('email').notNullable().unique();
  table.string('senha').notNullable();
});
```

Sem essa tabela, os testes relacionados a usuários vão falhar.

---

## 6. Endpoint `/usuarios/me` Não Está Implementado nas Rotas

Você implementou o método `me` no `authController.js` e protegeu a rota em `authRoutes.js`:

```javascript
router.get('/me', authMiddleware, authController.me);
```

Mas o teste bônus que falhou indica que talvez a rota não esteja funcionando corretamente, possivelmente por problemas no middleware ou no controller.

Verifique se o middleware está funcionando e se o controller está retornando os dados corretos, sem expor a senha.

---

## 7. Pequenos Detalhes no Código dos Controllers (Exemplo: `agentesController.js`)

No seu método `findById` de `agentesController.js`, você tem:

```javascript
async findById(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(404).json({ message: "ID inválido" });
  }
  agente.dataDeIncorporacao = formatDate(agente.dataDeIncorporacao);
  res.json(agente);
},
```

Aqui você está usando a variável `agente` que não foi definida no escopo — provavelmente esqueceu de buscar o agente no banco.

**Correção:**

Busque o agente antes de formatar a data:

```javascript
const agente = await agentesRepository.findById(id);
if (!agente) {
  return res.status(404).json({ message: "Agente não encontrado" });
}
agente.dataDeIncorporacao = formatDate(agente.dataDeIncorporacao);
res.json(agente);
```

---

## 8. Documentação INSTRUCTIONS.md Incompleta

Seu arquivo `INSTRUCTIONS.md` está incompleto, começando com `## 📌 Registro de Usuário` mas sem o conteúdo.

Para entregar um projeto profissional, é fundamental documentar:

- Como registrar e logar usuários,
- Como enviar o token JWT no header `Authorization`,
- Fluxo de autenticação esperado.

Isso ajuda outros desenvolvedores e usuários da API a entenderem como usar seu sistema.

---

# Recursos que Recomendo para Você Estudar e Melhorar

- Para autenticação com JWT e bcrypt, recomendo fortemente este vídeo, feito pelos meus criadores, que fala muito bem sobre os conceitos básicos e fundamentais da cibersegurança:  
  https://www.youtube.com/watch?v=Q4LQOfYwujk

- Para entender melhor o uso prático de JWT, veja este vídeo:  
  https://www.youtube.com/watch?v=keS0JWOypIU

- Para aprofundar no uso de bcrypt e JWT juntos, veja este tutorial:  
  https://www.youtube.com/watch?v=L04Ln97AwoY

- Para aprender a organizar seu projeto com MVC e boas práticas:  
  https://www.youtube.com/watch?v=bGN_xNc4A1k&t=3s

- Para entender como configurar seu banco PostgreSQL com Docker e Knex, essencial para rodar migrations e seeds corretamente:  
  https://www.youtube.com/watch?v=uEABDBQV-Ek&t=1s  
  e também:  
  https://www.youtube.com/watch?v=dXWy_aGCW1E

- Para dominar Knex e manipular o banco de dados com queries corretas:  
  https://www.youtube.com/watch?v=GLwHSs7t3Ns&t=4s

---

# Resumo dos Principais Pontos para Focar e Melhorar

- [ ] Corrigir a validação no registro de usuários para acumular e retornar erros claros e detalhados, conforme esperado pelos testes, e evitar retornar senha no JSON de resposta.
- [ ] Ajustar o formato da resposta do login para retornar `{ access_token: "token" }` e status 200.
- [ ] Remover o middleware de autenticação das rotas públicas (`/auth/register` e `/auth/login`).
- [ ] Garantir que a variável de ambiente `JWT_SECRET` esteja sempre definida e usada consistentemente no middleware e no controller.
- [ ] Criar a migration para a tabela `usuarios` no banco de dados.
- [ ] Corrigir erros no controller de agentes, como buscar o agente antes de usar seus dados.
- [ ] Completar a documentação do arquivo `INSTRUCTIONS.md` com instruções claras para registro, login, uso do token e fluxo de autenticação.
- [ ] Testar a rota `/usuarios/me` para garantir que retorna os dados do usuário autenticado corretamente.
- [ ] Verificar se o `.env` está carregado corretamente no `server.js` com `require('dotenv').config();`.

---

Vitor, você já está no caminho certo! Essas correções vão destravar a maioria dos testes que falharam e deixar sua aplicação muito mais robusta e profissional. Continue firme, revise com calma cada ponto, e aproveite os vídeos que recomendei para consolidar seu aprendizado. 🚀

Se precisar, volte aqui para tirar dúvidas — estou aqui para ajudar no seu crescimento! 💪✨

Boa sorte e bons códigos! 👊😄

> Caso queira tirar uma dúvida específica, entre em contato com o Chapter no nosso [discord](https://discord.gg/DryuHVnz).



---
<sup>Made By the Autograder Team.</sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Carvalho](https://github.com/ArthurCRodrigues)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Drumond](https://github.com/drumondpucminas)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Gabriel Resende](https://github.com/gnvr29)</sup></sup>