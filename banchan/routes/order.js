const express = require('express');
const router = express.Router();
const uuid = require('uuid/v4');

const { User, Store, Product, Food, Order, Address } = require('../models');

/* 주문서 작성 */
router.get('/', async(req, res, next) => {
    try {
        let cart;
        if(req.session.cart) {
            cart = req.session.cart;
        } else {
            req.flash('error', '아이템을 최소 하나라도 주문해야합니다.');
            res.redirect('/');
        }

        return res.render('WriteOrder', {
            title: '주문서작성',
            user: req.user,
            cart: cart,
            orderError: req.flash('orderError'),
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 주문서 작성 POST */
router.post('/', async(req, res, next) => {
    try {
        let cart;
        if(req.session.cart) {
            cart = req.session.cart;
        } else {
            req.flash('error', '아이템을 최소 하나라도 주문해야합니다.');
            res.redirect('/');
        }
        console.log(cart);
        console.log(cart.productList);


        if(!req.body.name) {
            req.flash('orderError', '모든 빈칸을 채워주세요');
            res.redirect('/order/');
        }

        const address = await Address.create({
            roadFullAddr: req.body.roadFullAddr,
            roadAddrPart1: req.body.roadAddrPart1,
            roadAddrPart2: req.body.roadAddrPart2,
            engAddr: req.body.engAddr,
            zipNo: req.body.zipNo,
            addrDetail: req.body.addrDetail,
            siNm: req.body.siNm,
            sggNm: req.body.sggNm,
            emdNm: req.body.emdNm,
            rn:  req.body.rn,
        });

        if(req.user && req.user.id) {
            if(req.body.saveAddress) {
                await User.update({
                    addressId: address.id,
                }, {
                    where: { id: req.user.id }
                });
            }
            cart.productList.forEach(async(product) => {
                await Order.create({
                    userId: req.user.id,
                    storeId: product.product.storeId,
                    addressId: address.id,
                    quantity: product.quantity,
                    productId: product.product.id,
                });
            });
            res.redirect('/order/done');
        } else {
            const code = uuid();
            cart.productList.forEach(async(product) => {
                await Order.create({
                    code: code,
                    userId: null,
                    storeId: product.product.storeId,
                    addressId: address.id,
                    quantity: product.quantity,
                    productId: product.product.id,
                });
            });
            res.redirect('/order/done?code='+code);
        }

    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 주문완료 */
router.get('/done', async(req, res, next) => {
    try {

        /* 주문이 로그인한 사람인지 아닌지 판별 */
        let orders
        if(req.query.code) {
            orders = await Order.findAll({
                include: [{
                    model: Store,
                }],
                where: { code: req.query.code }
            });
        } else if(req.user && req.user.id) {
            orders = await Order.findAll({
                include: [{
                    model: Store,
                }],
                where: {
                    userId: req.user.id,
                }
            });
        } else {
            req.flash('error', '잘 못된 접근입니다.');
            res.redirect('/');
        }

        console.log(orders);

        orders.forEach(order => {
            req.app.get('io').of('/store').to(order.store.url_key).emit('new', order);
        });

        return res.render('orderFinish', {
            title: '주문 완료',
            user: req.user,
            orders: orders,
            orderError: req.flash('orderError'),
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 가입하지 않은 사람 order 찾기 */
router.get('/guest', async(req, res, next) => {
    try {

        /* 주문이 로그인한 사람인지 아닌지 판별 */
        let orders
        if(req.query.code) {
            orders = await Order.findAll({
                include: [{
                    model: Store,
                }, {
                    model: Product,
                }],
                where: { code: 123 }
            });
        } else {
            req.flash('error', '잘 못된 접근입니다.');
            res.redirect('/');
        }

        console.log(orders);

        orders.forEach(order => {
            req.app.get('io').of('/store').to(order.store.url_key).emit('new', order);
        });

        return res.render('profileOrders', {
            title: '주문 확인',
            user: req.user,
            orders: orders,
            orderError: req.flash('orderError'),
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});
module.exports = router;