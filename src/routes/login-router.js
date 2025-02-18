import express from 'express';
import { login, signup, logout, getUser } from '../services/LoginService.js';
import { search } from '../services/SearchService.js';

const router = express.Router();

const showLogin = (req, res) => {
    const data = {
        css: `
            <link rel="stylesheet" href="/static/css/auth.css">
        `,
        js: `
            <script src="/static/js/login.js" defer></script>
        `,
    };
    res.render('login', data)
}

const showSignup = (req, res) => {
    const data = {
        css: `
            <link rel="stylesheet" href="/static/css/auth.css">
        `,
        js: `
            <script src="/static/js/signup.js" defer></script>
        `,
    };
    res.render('signup', data)
}

router.post('/login', login);
router.post('/signup', signup);
router.get('/login', showLogin);
router.get('/signup', showSignup);
router.get('/logout', logout);
router.get('/user/:username', getUser);
router.get('/search', search);

export default router;