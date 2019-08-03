const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const multer = require('multer');

const { isLoggedIn, isValidate, isSaler } = require('./middlewares');
const { User, Store, Product, Food, Address } = require('../models');

/**
 * Food 리스트는 두가지 경우로 나뉘어진다
 * 1. 특정 음식만을 찾을 때,
 * 2. 여러 음식을 찾을 때, -> name 순으로 나열.
 */
router.get('/list', async(req, res, next) => {
    try {
        const foodList = await Food.findAll({
            include: [{
                model: Product,
                include: {
                    model: Store,
                },
            }],
            order: [['name', 'ASC']]
        });

        return res.render( 'foodList', {
            title: 'Food List',
            user: req.user,
            foodList: foodList,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

const upload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/');
      },
      filename: function (req, file, cb) {
        cb(null, new Date().valueOf() + path.extname(file.originalname));
      }
    }),
});

router.get('/makeFood', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {

        let store;
        //For edit
        if(req.query.store) {
            store = await Store.findOne({
                where: {id: req.query.store},
            });
        } else {
            store = null;
        }

        return res.render('makeFood', {
            title: 'Open new store',
            user: req.user,
            store: store,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/makeFood', isLoggedIn, isValidate, isSaler, upload.single('img'), async(req, res, next) => {
    try {

        if(!req.body.name || !req.body.url_key) {
            req.flash('error', 'name or url key should be typed!');
            res.locals.message = req.flash();
            return res.redirect('/food/makeFood');
        }

        const regType = /^[A-Za-z0-9+]*$/;
        if(!regType.test(req.body.url_key)) {
            return res.redirect('/store/openstore');
        }

        let file;
        if(req.file) {
            file = req.file.filename;
        } else {
            file = null;
        }

        const food = await Food.create({
            name: req.body.name,
            introduction: req.body.introduction,
            img: file,
            kinds: req.body.kinds,
            url_key: req.body.url_key
        });

        res.redirect('/food/'+food.url_key);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/:url_key', async(req, res, next) => {
    try {
        const food = await Food.findOne({
            include:[{
                model: Product,
                include: [{
                    model: Store,
                }],
            }],
            where: { url_key: req.params.url_key }
        });

        if(!food) {
            return res.redirect('/');
        }

        return res.render('foodDetail', {
            title: food.name,
            user: req.user,
            food: food
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/:url_key/storeList', async(req, res, next) => {
    try {
        const stores = await Store.findAndCountAll({
            include: [{
                model: Food,
                where: { url_key: req.params.url_key }
            }, {
                model: User,
                as: 'manager',
            },{
                model: Address,
            }],
        });

        return res.render('foodStoreList', {
            title: '가게 리스트',
            user: req.user,
            stores: stores,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;