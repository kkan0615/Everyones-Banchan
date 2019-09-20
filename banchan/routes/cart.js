const express = require('express');
const sequelize = require('sequelize');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { isLoggedIn, isValidate, isSaler } = require('./middlewares');
const { User, Store, Product, Food, StoreComment, ProductComment, CommentImage, ProductImage } = require('../models');

router.get('/', async(req, res, next) => {
    try {

        // cart 변경하기
        let cart;
        if(req.session.cart) {
            cart = req.session.cart;
        } else {
            cart = null;
        }

        return res.render('profileCart', {
            title: '장바구니()',
            user: req.user,
            cart: cart,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.put('/',  async(req, res, next) => {
    try {

        if(!req.session.cart) {
            req.flash('error', 'session is not found');
            res.redirect('/');
        }

        const product = req.session.cart.productList.find( (product) =>{
            return product.product.id == req.body.productId
        });

        if(!product) {
            req.flash('error', 'product is not in cart');
            res.redirect('/');
        } else {
            req.session.cart.totalPrice = req.session.cart.totalPrice - product.price;
            product.quantity = req.body.quantity;
            product.price = product.product.orginalPrice * product.quantity;
            req.session.cart.totalPrice += product.price;
        }
        return res.json({result: 'Item quantity has been changed'});

    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.delete('/', async(req, res, next) => {
    try {
        let user;
        if(req.query.id) {
            user = await User.findOne({
                include: [{
                    model: Store,
                }, {
                    model: StoreComment,
                    include: {
                        model: CommentImage,
                    }
                }, {
                    model: ProductComment,
                    include: {
                        model: CommentImage,
                    },
                }],
                where: { id: req.query.id }
            });

            if(!user) {
                req.flash('error', 'User is not found');
                res.redirect('/');
            }

            if(user.id != req.user.id) {
                req.flash('error', 'You are not allowed to see this page');
                res.redirect('/');
            }
        }

        if(!req.session.cart) {
            req.flash('error', 'session is not found');
            res.redirect('/');
        }

        //Find index() = find() + indexOf()
        const productIndex = req.session.cart.productList.findIndex( (product) => {
            return product.product.id == req.body.productId
        });

        /*
        const exSame = req.session.cart.productList.filter( (product) =>{
            return product.product.storeId ==  req.session.cart.productList[productIndex].storeId
        });
        if(exSame.length > 1) {
            req.session.cart.totalPrice -= req.session.cart.productList[productIndex].orginalPrice;
        } else {
            req.session.cart.totalPrice = req.session.cart.totalPrice - req.session.cart.productList[productIndex].orginalPrice
                                    - req.body.deliveryFee;
        }
        */

        if(productIndex > -1) {
            req.session.cart.totalPrice -= req.session.cart.productList[productIndex].price;
            req.session.cart.productList.splice(productIndex, 1);

            return res.json({result: 'Item has been removed'});
        } else {
            return res.json({result: 'Item is not found'});
        }

    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 최종값 변경 */
router.post('/changeTotalPrice', async(req, res, next) => {
    try {
        const {  } = req.body;

    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;