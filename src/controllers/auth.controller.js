const AuthService = require('../services/auth.service');
const UserService = require('../services/user.service');

const authService = new AuthService();
const userService = new UserService();

class AuthController {
  async login(req, res, next) {
    try {
      const { user, token } = await authService.signToken(req.user);
      res.json({ user, token });
    } catch (error) {
      next(error);
    }
  }

  async loginView(req, res, next) {
    try {
      const { user, token } = await authService.signToken(req.user);
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.redirect('/dashboard');
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await userService.create({ email, password, role: 'employee' });
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async renderLogin(req, res) {
    res.render('auth/login', { title: 'Iniciar Sesión', error: null });
  }

  async logout(req, res) {
    res.clearCookie('token');
    res.redirect('/auth/login');
  }
}

module.exports = AuthController;
