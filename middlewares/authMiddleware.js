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