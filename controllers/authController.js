const usuariosRepository = require('../repositories/usuariosRepository');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

async function login(req, res, next) {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                mensagem: "Email e senha são obrigatórios"
            });
        }

        const usuario = await usuariosRepository.findByEmail(email);

        if (!usuario) {
            return res.status(404).json({ mensagem: "Usuário não encontrado" });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ mensagem: "Senha inválida" });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            process.env.JWT_SECRET || "chave_secreta",
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            status: 200,
            mensagem: "Login realizado com sucesso",
            user: { id: usuario.id, email: usuario.email },
            token
        });

    } catch (error) {
        next(error);
    }
}

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

async function logout(req, res){
  let token = req.headers['authorization'];
  if(!token){
    return res.status(401).json("Token necessario");
  }
  token = token.split(" ")[1];
  res.status(200).json("logout realizado com sucesso");
}

async function heshSenha(senha) {
  const tentativas = 10;
  return await bcrypt.hash(senha, tentativas);
}

async function veryToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || "chave_secreta");
}

module.exports = { 
    login,
    register,
    logout,
    heshSenha,
    veryToken,
 };
