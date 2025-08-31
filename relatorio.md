<sup>Esse é um feedback gerado por IA, ele pode conter erros.</sup>

Você tem 9 créditos restantes para usar o sistema de feedback AI.

# Feedback para VitorChagas-mcl:

Nota final: **55.5/100**

Olá, VitorChagas-mcl! 🚀

Primeiro, parabéns pelo esforço e pela entrega até aqui! 🎉 Você conseguiu implementar várias funcionalidades importantes, como o cadastro e login de usuários, criação e manipulação de agentes e casos, além de conseguir passar diversos testes base e até alguns bônus — isso mostra que você está no caminho certo!

---

## 🎯 O que você já fez muito bem

- **Cadastro de usuários funcionando com status 201 e dados corretos.**
- **Login de usuários com retorno de JWT válido e status 200.**
- **Logout e exclusão de usuários funcionando corretamente.**
- **Endpoints de agentes e casos funcionando para listagem, busca, criação, atualização e exclusão.**
- **Implementação básica de filtros para casos e agentes (embora ainda precise de ajustes para filtros mais complexos).**
- **JWT com expiração configurada e uso do `.env` para segredos, o que é excelente para segurança.**

Além disso, você passou alguns testes bônus importantes, como o filtro simples por status e agente nos casos, o que é um diferencial bacana. 👏

---

## 🚩 Pontos que precisam de atenção para avançar e melhorar

### 1. Falta da tabela e validação completa para usuários (usuáriosRepository e migration)

- Você não enviou a migration para criar a tabela **usuarios** no banco de dados. No seu arquivo `db/migrations/20250802190416_solution_migrations.js` só há a criação das tabelas `agentes` e `casos`.  
- Isso é fundamental para o funcionamento correto do cadastro de usuários, pois a tabela `usuarios` é onde os dados serão armazenados.

**Por que isso impacta seus testes?**  
Os testes que falharam relacionados a usuários (ex: erro 400 para nome vazio, senha inválida, email duplicado etc.) dependem da existência da tabela e da validação adequada no controller para impedir dados inválidos.

**O que fazer?**  
Crie uma migration que crie a tabela `usuarios` com as colunas necessárias, por exemplo:

```js
exports.up = async function(knex) {
  await knex.schema.createTable('usuarios', table => {
    table.increments('id').primary();
    table.string('nome').notNullable();
    table.string('email').notNullable().unique();
    table.string('senha').notNullable();
  });
};
```

E não esqueça de criar validações no seu `authController.js` para garantir que:

- O nome, email e senha sejam obrigatórios e válidos.
- A senha atenda aos critérios de segurança (mínimo 8 caracteres, pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial).
- Não permita campos extras no payload.

Assim você evitará erros 400 por dados inválidos.

---

### 2. Falta das rotas e controllers para registro, logout e exclusão de usuários

- Seu arquivo `routes/authRoutes.js` tem apenas o endpoint de login (`POST /auth/login`), mas não tem as rotas para registro (`POST /auth/register`), logout (`POST /auth/logout`) e exclusão de usuários (`DELETE /users/:id`), que são requisitos obrigatórios.

- Também não vimos o `authController.js` implementando essas funções além do login.

**Por que isso impacta?**  
Os testes que falharam mostram erros 400 ao criar usuários com dados inválidos, e também testes que esperam o registro funcionando. Sem essas rotas e controllers, sua API não está completa.

**Como corrigir?**  
Implemente as rotas em `authRoutes.js` assim:

```js
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.delete('/users/:id', authController.deleteUser);
```

E implemente os métodos correspondentes no `authController.js`, cuidando da validação, hashing da senha com bcrypt e manipulação do token JWT no logout.

---

### 3. Middleware de autenticação com erros de digitação e uso incorreto do token

No seu arquivo `middlewares/authMiddleware.js`:

```js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next){
    const authHeader = req.hearders["authorization"];
    const token = authHeader && authHeader.split()[1];

    if(!token){
        return res.status(401).json("Tokek necessario")
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err) => {
        if(err){
            return res.status(403).json({mensagem: "token invalido"})
        }
        next();
    });
}

module.exports = authMiddleware;
```

**Problemas identificados:**

- `req.hearders` está escrito errado, o correto é `req.headers`.
- `authHeader.split()[1]` está incorreto, o método `split` precisa receber o separador `" "` para dividir o valor do header no formato `"Bearer <token>"`.
- Você está usando `process.env.ACCESS_TOKEN_SECRET`, mas no `.env` e no controller você usa `JWT_SECRET`. Isso pode causar token inválido.
- A mensagem de erro tem um erro de digitação: `"Tokek necessario"`.

**Correção sugerida:**

```js
function authMiddleware(req, res, next){
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // separa pelo espaço

    if(!token){
        return res.status(401).json({ mensagem: "Token necessário" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if(err){
            return res.status(401).json({ mensagem: "Token inválido" });
        }
        req.user = user; // adiciona dados do usuário autenticado
        next();
    });
}
```

**Por que isso impacta?**  
Sem middleware correto, suas rotas protegidas não vão validar o token JWT, e os testes que esperam status 401 (não autorizado) vão falhar.

---

### 4. Falta de proteção nas rotas de agentes e casos

- No seu `server.js`, você importa o middleware de autenticação, mas não o aplica nas rotas `/agentes` e `/casos`.

**O que fazer?**  
No `server.js`, aplique o middleware nas rotas protegidas, por exemplo:

```js
const authMiddleware = require('./middlewares/authMiddleware');

app.use('/agentes', authMiddleware, agentesRoutes);
app.use('/casos', authMiddleware, casosRoutes);
```

Assim, qualquer requisição para essas rotas precisará do token JWT válido.

---

### 5. Validação de campos no cadastro de usuários

Seu `authController.js` não implementa validações para:

- Nome vazio ou nulo.
- Email vazio ou nulo.
- Senha inválida (curta, sem número, sem caractere especial, sem letra maiúscula/minúscula).
- Campos extras no payload.

**Por que isso impacta?**  
Os testes falharam justamente porque esperavam erros 400 para esses casos, mas seu código não está validando.

**Como melhorar?**  
Implemente uma função de validação no `authController.js` antes de criar o usuário, por exemplo:

```js
function validarSenha(senha) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return regex.test(senha);
}

async function register(req, res, next) {
  try {
    const { nome, email, senha, ...extras } = req.body;

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
      return res.status(400).json({ mensagem: "Email já está em uso" });
    }

    const senhaHasheada = await bcrypt.hash(senha, 10);
    const novoUsuario = await usuariosRepository.create({ nome, email, senha: senhaHasheada });

    return res.status(201).json(novoUsuario);

  } catch (error) {
    next(error);
  }
}
```

---

### 6. Documentação no arquivo INSTRUCTIONS.md está vazia

- O enunciado pede para documentar os endpoints de autenticação e como usar o token JWT no header `Authorization`.
- Isso ajuda a entender e usar sua API corretamente.

**Recomendo que você preencha o arquivo `INSTRUCTIONS.md` com:**

- Como registrar usuário.
- Como fazer login e obter token.
- Como usar o token no header `Authorization: Bearer <token>`.
- Fluxo de autenticação esperado.

---

## 📚 Recursos recomendados para você:

- Para entender autenticação JWT e hashing com bcrypt, recomendo muito este vídeo feito pelos meus criadores, que explica de forma clara e prática: https://www.youtube.com/watch?v=L04Ln97AwoY  
- Para entender melhor o middleware de autenticação e JWT, veja também: https://www.youtube.com/watch?v=keS0JWOypIU  
- Caso queira reforçar a estrutura do projeto e boas práticas MVC em Node.js, este vídeo é excelente: https://www.youtube.com/watch?v=bGN_xNc4A1k&t=3s  
- Se tiver dúvidas sobre migrations e configuração do banco com knex, veja: https://www.youtube.com/watch?v=dXWy_aGCW1E

---

## Resumo rápido para você focar:

- [ ] Criar migration para tabela `usuarios` com os campos corretos.
- [ ] Implementar rotas e controllers para registro, logout e exclusão de usuários.
- [ ] Corrigir middleware de autenticação (`authMiddleware.js`): corrigir erros de digitação, usar o header e token corretamente, usar a variável `JWT_SECRET`.
- [ ] Proteger as rotas `/agentes` e `/casos` usando o middleware de autenticação.
- [ ] Implementar validações robustas no cadastro de usuários para evitar dados inválidos e campos extras.
- [ ] Documentar os endpoints de autenticação e o uso do JWT no arquivo `INSTRUCTIONS.md`.

---

Vitor, você está com uma base muito boa e com algumas correções e implementações importantes, sua API vai ficar profissional e segura! Continue focado, revise esses pontos e não hesite em usar os recursos que te passei. Você está quase lá! 🚀💪

Se precisar de ajuda para implementar algum desses pontos, só chamar! Estou aqui para te ajudar a brilhar! 🌟

Um abraço e sucesso! 👊✨

> Caso queira tirar uma dúvida específica, entre em contato com o Chapter no nosso [discord](https://discord.gg/DryuHVnz).



---
<sup>Made By the Autograder Team.</sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Carvalho](https://github.com/ArthurCRodrigues)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Drumond](https://github.com/drumondpucminas)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Gabriel Resende](https://github.com/gnvr29)</sup></sup>