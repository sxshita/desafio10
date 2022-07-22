const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const connectMongo = require('./mongoInit');

passport.use('register', new LocalStrategy (
    async (username, password, done) => {
        //buscar si el usuario ya existe
        const {users} = await connectMongo();
        const user = await users.findUser(username);
        if (user) return done(null, false, {message: 'Ya existe un usuario con ese nombre'});
        // si no existe todavia, hashear password y pushear
        const passwordHashed = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
        const userCreated = { username, password: passwordHashed };
        await users.save(userCreated);
        done(null, userCreated);
    }
));

passport.use('auth', new LocalStrategy (
    async (username, password, done) => {
        const {users} = await connectMongo();
        //validar usuario y contraseña
        const user = await users.findUser(username)
        if (!user || !bcrypt.compareSync(password, user.password)) return done(null, false, {message: 'Usuario o contraseña incorrectos'});
        done(null, user);
    }
));

passport.serializeUser((usuario, callback) => {
    callback(null, usuario.username)
});

passport.deserializeUser(async (username, callback) => {
    const {users} = await connectMongo();
    const user = await users.findUser(username);
    callback(null, user);
});

module.exports = passport;