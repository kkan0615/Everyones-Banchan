const express = require('express');
const router = express.Router();
const sequelize = require("sequelize");
const Op = sequelize.Op;

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User, Food, Store, Product } = require('../models');

/* Main page(index page) */
router.get('/', async(req, res, next) => {
    try {
        let recentStores;
        if(req.session.recentStores) {
            recentStores = req.session.recentStores;
        } else {
            recentStores = null;
        }

        const newLists = await Product.findAll({
            include:[{
                model: Store,
            }],
            limit: 10,
            order: [
                ['updatedAt', 'ASC'],
                ['name', 'ASC'],
            ],
        });

        return res.render('main', {
            title: 'Hello!',
            user: req.user,
            recentStores: recentStores,
            newLists: newLists,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* Register main page */
router.get('/join', isNotLoggedIn, (req, res, next) => {
    res.render('auth/join', {
        title: 'Registeration page',
        user: req.user,
        joinError: req.flash('joinError')
    });
});

/* 일반 유저로 입장 */
router.get('/join/userJoin', isNotLoggedIn, (req, res, next) => {
    res.render('auth/userJoin', {
        title: '일반 회원가입',
        user: req.user,
        joinError: req.flash('joinError')
    });
});

/* saler로 입장 */
router.get('/join/saler', isNotLoggedIn, (req, res, next) => {
    res.render('auth/saler', {
        title: '판매자 회원가입',
        user: req.user,
        joinError: req.flash('joinError')
    });
});

/* Login page */
router.get('/login', isNotLoggedIn, (req, res, next) => {
    const email = req.cookies.email;

    res.render('login', {
        title: 'Login Page',
        user: req.user,
        email: email,
        loginError: req.flash('loginError')
    });
});

/* Top nave search bar */
router.post('/autocomplete', async(req, res, next) => {
    try {
        const { stand, word } = req.body;

        let result
        if(stand === 'food') {
            result = await Food.findAll({
                where:{ name: { [Op.like]: "%" + req.body.word + "%" } }
            });
        } else if(stand === 'store') {
            result = await Store.findAll({
                where: { name: { [Op.like]: "%" + word + "%" } }
            });
        } else {

        }

        console.log('**************************************/'+result+'/********************************');

        res.json({result: result});
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 완성해주세요 salelist */
router.post('/scroll/saleList', async(req, res, next) => {
    try {
        const saleList = await Product.findAll({
            include: {
                model: Store,
            },
            where: { salePrice: { [Op.ne]: null } },
            order: [
                ['stars', 'ASC'],
                ['name', 'ASC'],
            ]
        });

        res.json({saleList: saleList});
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;