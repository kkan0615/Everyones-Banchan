const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const { isLoggedIn, isValidate, isSaler } = require('./middlewares');
const { User, Store, Product, Food, StoreComment, ProductComment, CommentImage, ProductImage, Order } = require('../models');

router.get('/orders', isLoggedIn, async(req, res, next) => {
    try {
        const orders = await Order.findAll({
            include: [{
                model: Product,
            }, {
                model: Store,
            }],
            where: { userId: req.user.id }
        });

        return res.render('profileOrders', {
            title: '주문내역',
            user: req.user,
            orders: orders,
            ordersError: req.flash('ordersError'),
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/validation', isLoggedIn, async(req, res, next) => {
    try {
        const decoded = jwt.verify(req.query.jwtToken, process.env.JWT_SECRET);
        const userinfo = await User.findOne({
            where: { id: decoded.id }
        });
        if(!userinfo) {
            req.flash('error', 'User is not found');
            res.redirect('/');
        }
        if(userinfo.id != req.user.id) {
            req.flash('error', 'You are not allowed to access');
            res.redirect('/');
        }

        await User.update({
            isValidate: true,
        }, {
            where: { id: userinfo.id }
        });

        return res.redirect('/profile/'+userinfo.id);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/edit', isLoggedIn, async(req, res, next) => {
    try {

        return res.render('profileEdit', {
            title: req.user.nickname,
            user: req.user,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/sendEmail/validation', isLoggedIn, async(req, res, next) => {
    try {
        const jwtToken = jwt.sign({
            id: req.user.id,
            email: req.user.email
        } ,process.env.JWT_SECRET, {
            expiresIn:'5m',
            issuer:'EveryonesBanchan'
        });

        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.gmailId,
                pass: process.env.gmailPass,
            }
        });

        let mailOptions = {
            from: process.env.gmailId,
            to: req.user.email,
            subject: '모두의 반찬가게 이메일 인증',
            html: '<p>링크를 클릭해주세요</p>' +
                "<a href='http://127.0.0.1:8001/profile/validation?jwtToken=" + jwtToken + "'>링크</a>"
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
        });

        return res.json({ result: '성공적으로 이메일을 보냈습니다.' });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* Index Page for user */
router.get('/:id', async(req, res, next) => {
    try {
        const userinfo = await User.findOne({
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
            where: { id: req.params.id }
        });
        if(!userinfo) {
            req.flash('error', 'User is not found');
            res.redirect('/');
        }

        return res.render('profileMain', {
            title: userinfo.nickname,
            user: req.user,
            userInfo: userinfo,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;