const { faker } = require('@faker-js/faker');
const express = require('express');
const { engine } = require("express-handlebars");
const { Server: HttpServer } = require('http');
const { Server: SocketServer } = require('socket.io');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectMongo = require('./mongoInit');
const passport = require('./passport');
const routes = require("./routes/routes");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(session({
  store: MongoStore.create({ mongoUrl: 'mongodb+srv://sasha:coder.sasha@cluster0.ezluz.mongodb.net/?retryWrites=true&w=majority' }),
  secret: 'sushi',
  resave: true,
  cookie: {
    maxAge: 60000
  },
  saveUninitialized: true,
  rolling: true
}));
app.use(passport.initialize())
app.use(passport.session())

app.set('views','./public/views');
app.set('view engine','hbs');

app.engine(
  'hbs',
  engine({
      extname: '.hbs',
      defaultLayout: 'index.hbs',
  })
);

async function cargarProductos() {
  let products = [];
  for(let i = 0; i < 6; i++) {
    let product = {
      title: faker.commerce.product(),
      price: faker.commerce.price(),
      thumbnail: faker.image.image()
    }
    products.push(product);
  }
  return products;
}

// ** [INDEX] ** //
function checkAuth(req, res, next){
  if(req.isAuthenticated()){
    next();
  } else {
    res.redirect("/login")
  }
}

app.get('/', checkAuth ,async (req, res) => {
  const {products} = await connectMongo();
  const prods = await products.getAll();
  res.render('table', { prods, user: req.session.passport.user });
});

// ** [LOGIN] ** //
app.get('/login', routes.getLogin);
app.get('/login/failure', routes.getLoginFail);
app.post('/login', passport.authenticate('auth', {failureRedirect: '/login/failure'}), routes.postLogin);

// ** [REGISTER] ** //
app.get('/register', routes.getRegister);
app.get('/register/failure', routes.getRegisterFail)
app.post('/register', passport.authenticate('register', {failureRedirect: '/register/failure', failureMessage: true} ), routes.postRegister);

// ** [LOGOUT] ** //
app.get('/logout', routes.getLogout)

// ** [FAKER PRODUCTS] ** //
app.get('/api/productos-test', async (req, res) => {
  const prods = await cargarProductos();
  res.render('table-test', { prods });
});

// ** [WEBSOCKETS] ** //
const httpServer = new HttpServer(app);
const socketServer = new SocketServer(httpServer);

socketServer.on('connection', async (socket) => {
  const {products, messages} = await connectMongo();
  const myMessages = await messages.getById(333);
 
  socket.emit('products', await products.getAll());
  if(myMessages) socket.emit('messages', myMessages.messages);

  socket.on('new_product', async (product) => {
    try {
      await products.save(product);
      let prods = await products.getAll();
      socketServer.sockets.emit('products', prods);
    }
    catch(err) {
      console.log(err);
    }
    
  });

  socket.on('new_message', async (message) => {
    try {
      const arrayMessagesId = 333;
      await messages.saveMessage(arrayMessagesId, message);
      let arrayMessages = await messages.getById(arrayMessagesId);
      socketServer.sockets.emit('messages', arrayMessages.messages);
    }
    catch(err){
      console.log(`error: ${err}`);
     }
  });

});

app.use((error, req, res, next) => {
  res.status(500).send(error.message);
})

httpServer.listen(8080, () => {
  console.log('Servidor corriendo en puerto 8080');
})