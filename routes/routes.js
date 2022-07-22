const getLogin = (req, res) => {
    res.render('login');
};

const getLoginFail = (req, res) => {
    res.render('login', {error: true});
};

const postLogin = (req, res) => {
    res.redirect('/')
};

const getRegister = (req, res) => {
    res.render('register');
};

const getRegisterFail = (req, res) => {
    res.render('register', {error: true});
}

const postRegister = async (req, res) => {
    res.redirect('/login');
}

const getLogout = (req, res) => {
    const username = req.session.passport.user;
    if (req.session.passport.user){
      req.logout(function(err) {
        if (err) { return next(err); }
        res.render('logout', { user: username });
      });
    }; 
};

module.exports = {
    getLogin,
    getLoginFail,
    postLogin,
    getRegister,
    getRegisterFail,
    postRegister,
    getLogout
}