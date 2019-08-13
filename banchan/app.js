const express = require('express');
const cookieParser = require('cookie-parser')
const morgan = require('morgan');
const path = require('path');
const session = require('express-session'); // npm i express-session [ https://www.npmjs.com/package/express-session ]
const flash = require('connect-flash');
const passport = require('passport'); // npm i passport, npm i passport-local(for local)
require('dotenv').config();
const { sequelize } = require('./models');
const passportConfig = require('./passport');
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const storeRouter = require('./routes/store');
const foodRouter = require('./routes/food');
const profileRouter = require('./routes/profile');
const cartRouter = require('./routes/cart');
const saleRouter = require('./routes/saleList');
const sse = require('./socket/sse');
const webSocket = require('./socket/socket');
const checkSale = require('./routes/checkSale');
const orderRouter = require('./routes/order');
const searchRouter = require('./routes/search');
const logger = require('./logger');
const helmet = require('helmet');
const hpp = require('hpp');

const app = express();
sequelize.sync();

const sessionMiddleware = session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
});

passportConfig(passport);
checkSale(); // 세일 품목 전부 확인
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 8001);

/* "start": "cross-env NODE_ENV=production PORT=80 pm2 start app.js -i 0", */
if(process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
    app.use(helmet());
    app.use(hpp());
    sessionMiddleware.proxy = true;
} else {
    app.use(morgan('dev'));
}
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use('/', pageRouter);
app.use('/uploads', express.static('uploads'));
app.use('/auth', authRouter);
app.use('/store', storeRouter);
app.use('/food', foodRouter);
app.use('/profile', profileRouter);
app.use('/cart', cartRouter);
app.use('/sale', saleRouter);
app.use('/order', orderRouter);
app.use('/search', searchRouter);

const server = app.listen(app.get('port'), () => {
    console.log(app.get('port'), 'is wating you!');
});

sse(server);
webSocket(server, app, sessionMiddleware);

