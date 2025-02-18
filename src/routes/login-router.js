import express from 'express';
import { login, signup, logout, getUser } from '../services/LoginService.js';
import { search } from '../services/SearchService.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/logout', logout);
router.get('/user/:username', getUser);
router.get('/search', search);

export default router;