const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ mensagem: "Token necessário" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ mensagem: "Token necessário" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ mensagem: "Token inválido" });
    }
    req.user = user;
    next();
  });
}

module.exports = authMiddleware;