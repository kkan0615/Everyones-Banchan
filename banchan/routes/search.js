const express = require('express');
const router = express.Router();
const sequelize = require("sequelize");
const Op = sequelize.Op;

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User, Food, Store, Address } = require('../models');

//Main page
router.get('/', async(req, res, next) => {
    try {
        const search = req.query.search;
        const order = req.query.order;
        const word = req.query.word;

        if(!search || !word) {
            res.redirect('/');
        }

        let shows;
        if(search == 'food') {
            shows = await Store.findAndCountAll({
                include: [{
                    model: Food,
                    where:{ name: { [Op.like]: "%" + word + "%" } }
                }, {
                    model: User,
                    as: 'manager',
                },{
                    model: Address,
                }],
            });
        } else if(search == 'store') {
            shows = await Store.findAndCountAll({
                include: [{
                    model: Food,
                }, {
                    model: User,
                    as: 'manager',
                },{
                    model: Address,
                }],
                where:{ name: { [Op.like]: "%" + word + "%" } }
            });
        } else {
            res.redirect('/');
        }

        return res.render('searchIndex', {
            title: search,
            user: req.user,
            shows: shows,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;