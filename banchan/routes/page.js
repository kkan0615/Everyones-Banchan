const express = require('express');
const router = express.Router();
const sequelize = require("sequelize");
const Op = sequelize.Op;

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User, Food } = require('../models');

//Main page
router.get('/', (req, res, next) => {
    let recentStores;
    if(req.session.recentStores) {
        recentStores = req.session.recentStores;
    } else {
        recentStores = null;
    }
    res.render('main', {
        title: 'Hello!',
        user: req.user,
        recentStores: recentStores,
    });
});

router.get('/join', isNotLoggedIn, (req, res, next) => {
    res.render('join', {
        title: 'Registeration page',
        user: req.user,
        joinError: req.flash('joinError')
    });
});

router.get('/login', isNotLoggedIn, (req, res, next) => {
    res.render('login', {
        title: 'Login Page',
        user: req.user,
        loginError: req.flash('loginError')
    });
});

router.post('/autocomplete', async(req, res, next) => {
    try {
        const food = await Food.findAll({
            where:{ name: { [Op.like]: "%" + req.body.word + "%" } }
        });
        console.log('**************************************/'+food+'/********************************');

        res.json({food: food});
    } catch (error) {
        console.error(error);
        next(error);
    }
})

module.exports = router;