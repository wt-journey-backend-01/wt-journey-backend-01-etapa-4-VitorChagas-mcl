const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/me', authMiddleware, authController.me);
router.get('/', authMiddleware, authController.findAll);
router.get('/:id', authMiddleware, authController.findById);
router.post('/', authMiddleware, authController.findByEmail);

router.post('/login', authMiddleware, authController.login);
router.post('/register', authMiddleware, authController.create);
router.post('/logout', authMiddleware, authController.logout);
router.get('/logout', authMiddleware, authController.logout);

module.exports = router;