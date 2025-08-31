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

module.exports = { login };
