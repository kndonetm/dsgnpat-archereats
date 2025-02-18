import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserGateway from '../model/UserGateway.js'

const maxAge = 3 * 7 * 24 * 60 * 60;
const createToken = (_id) => jwt.sign({ _id }, "secret", { expiresIn: maxAge });

export const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) throw Error('Missing credentials');
        const user = await UserGateway.getByUsername({ username });
        if (!user) throw Error('Incorrect username');
        const auth = await bcrypt.compare(password, user.password);
        if (!auth) throw Error('Incorrect password');
        const token = createToken(user._id);
        res.cookie('jwt', token, { maxAge });
        res.status(200).json({ user: user._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const signup = async (req, res) => {
    const { username, password, description, profilePicture } = req.body;
    try {
        if (!username || !password) throw Error('Missing credentials');
        let user = await UserGateway.getByUsername({ username });
        if (user) throw Error('Username already in use');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        user = await UserGateway.insertOne({ username, password: hash, description, profilePicture });
        const token = createToken(user.insertedId);
        res.cookie('jwt', token, { httpOnly: true, maxAge });
        res.status(200).json({ user: user.insertedId });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const logout = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
};

export const getUser = async (req, res) => {
    const username = req.params.username;
    try {
        const user = await UserGateway.getByUsername({ username });
        if (!user) throw Error('User not found');
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};