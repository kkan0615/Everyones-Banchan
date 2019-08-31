const express = require('express');
const sequelize = require('sequelize');
const op = sequelize.op;
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const schedule = require('node-schedule');

const { isLoggedIn, isValidate, isSaler } = require('./middlewares');
const { User, Store, Product, Food, StoreComment, ProductComment, CommentImage, ProductImage, Address, Order } = require('../models');

/* 업로드 파일이 없을시 생성 */
fs.readdir('uploads', (error) => {
    if(error) {
        console.error('Uploads directory is not existed');
        fs.mkdirSync('uploads');
    }
});

router.get('/:url_key/editProduct', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {
        const store = await Store.findOne({
            include: [{
                model: User,
                as: 'manager'
            }],
            where: { url_key: req.params.url_key }
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        if(store.managerId != req.user.id) {
            req.flash('error', 'You are not allowd to add any product');
            res.redirect('/');
        }

        const foodList = await Food.findAll({
            order: [['name', 'ASC']]
        });

        const product = await Product.findOne({
            include: {
                model: Food,
            },
            where: { id: req.query.product }
        });

        return res.render('editProduct', {
            title: 'edit Product',
            user: req.user,
            store: store,
            foodList: foodList,
            product: product,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 상품 추가하기 - POST */
router.post('/:url_key/addProduct', isLoggedIn, isValidate, isSaler, upload.array('img', 10), async(req, res, next) => {
    try {
        const store = await Store.findOne({
            include: [{
                model: User,
                as: 'manager'
            }],
            where: { url_key: req.params.url_key }
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        if(store.managerId != req.user.id) {
            req.flash('error', '권한이 없는 유저입니다.');
            res.redirect('/');
        }

        if(!req.body.name || !req.body.price || !req.body.introduction || !req.body.content || !req.body.food) {
            req.flash('addProductError', '모든 포멧을 완성시켜주세요');
            res.redirect('/store/'+store.url_key+'/addProduct');
        }

        const product = await Product.create({
            name: req.body.name,
            orginalPrice : req.body.price,
            option: req.body.option,
            introduction: req.body.introduction,
            content: req.body.content,
            storeId: store.id,
            foodId: req.body.food,
        });

        if(req.files) {
            if(req.files.length > 1 ) {
                req.files.forEach(file => {
                    ProductImage.create({
                        img: file.filename,
                        productId: product.id,
                    });
                });
            } else {
                ProductImage.create({
                    img: req.files[0].filename,
                    productId: product.id,
                });
            }
        }

        //add food code to store
        await store.addFood(product.foodId);

        return res.redirect('/store/'+store.url_key+'/product/'+product.id);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* Product edit - POST */
router.post('/:url_key/editProduct', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {
        const store = await Store.findOne({
            include: [{
                model: User,
                as: 'manager'
            }],
            where: { url_key: req.params.url_key }
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        if(store.managerId != req.user.id) {
            req.flash('error', 'You are not allowd to add any product');
            res.redirect('/');
        }

        const product = await Product.update({
            name: req.body.name,
            orginalPrice : req.body.price,
            option: req.body.option,
            introduction: req.body.introduction,
            content: req.body.content,
            storeId: store.id,
            foodId: req.body.food,
        }, {
            where: { id: req.query.product }
        });

        if(req.files) {
            if(req.files.length > 1 ) {
                req.files.forEach(file => {
                    ProductImage.create({
                        img: file.filename,
                        productId: product.id,
                    });
                });
            } else {
                ProductImage.create({
                    img: req.file.filename,
                    productId: product.id,
                });
            }
        }

        return res.redirect('/store/'+store.url_key);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* Product detail - GET */
router.get('/:url_key/product/:id', async(req, res, next) => {
    try {
        const store = await Store.findOne({
            include:[{
                model: User,
                as: 'manager',
            }, {
                model: Product,
                include: [{
                    model: ProductComment,
                },{
                    model: Food,
                }],
                where: { id: req.params.id },
            }, {
                model: StoreComment,
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        const product = await Product.findOne({
            include: [{
                model: ProductImage,
            }],
            where: { id: req.params.id }
        });

        return res.render('productMain', {
            title: product.name,
            user: req.user,
            store: store,
            product: product,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 제품 댓글 목록 Product Comment - GET */
router.get('/:url_key/product/:id/comment', async(req, res, next) => {
    try {
        const store = await Store.findOne({
            include:[{
                model: User,
                as: 'manager',
            }, {
                model: Product,
                include: [{
                    model: ProductComment,
                },{
                    model: Food,
                }],
                where: { id: req.params.id },
            }, {
                model: StoreComment,
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        const product = await Product.findOne({
            include: [{
                model: ProductImage,
            }],
            where: { id: req.params.id }
        });

        const comments = await ProductComment.findAndCountAll({
            include:[{
                model: User,
                as: 'author',
            }, {
                model: CommentImage
            }],
            where: { productId: product.id }
        })

        return res.render('product/comment', {
            title: product.name,
            user: req.user,
            store: store,
            product: product,
            comments:comments,
            error: req.flash('error'),
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

fs.readdir('uploads/productComments', (error) => {
    if(error) {
        console.error('Uploads directory is not existed');
        fs.mkdirSync('uploads/productComments');
    }
});

const upload2 = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/productComments');
        },
        filename: function (req, file, cb) {
            cb(null, new Date().valueOf() + path.extname(file.originalname));
        }
    }),
});

/* 제품 댓글 생성 - POST */
router.post('/:url_key/product/:id/comment',isLoggedIn, upload2.array('img'), async(req, res, next) => {
    try {
        const productId = req.params.id;
        const store = await Store.findOne({
            include:[{
                model: User,
                as: 'manager',
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        const product = await Product.findOne({
            where: { id: req.params.id }
        });

        if(!product) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        const exCommet = await ProductComment.findOne({
            where: { authorId: req.user.id }
        });

        if(exCommet) {
            req.flash('error', '한번씩만 쓰기가능합니다.');
            return res.redirect('/store/'+store.url_key+'/product/'+product.id+'/comment');
        }

        const { content, stars } = req.body;

        const productComment = await ProductComment.create({
            content: content,
            stars: stars,
            authorId: req.user.id,
            productId: productId,
        });

        if(req.files[0]) {
            if(req.files.length > 1 ) {
                req.files.forEach(async (file) => {
                    await CommentImage.create({
                        img: file.filename,
                        productCommentId: productComment.id,
                    });
                });
            } else {
                CommentImage.create({
                    img: req.files[0].filename,
                    productCommentId: productComment.id,
                });
            }
        }

        const avg = await ProductComment.findAll({
            attributes: [ [ProductComment.sequelize.fn('AVG', ProductComment.sequelize.col('stars')), 'starsComment']],
            where: { productId: productId }
        });

        await Product.update({
            stars: avg[0].dataValues.starsComment,
        }, {
            where: { id: productId }
        });

        return res.redirect('/store/'+req.params.url_key+'/product/'+product.id+'/comment');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 제품 댓글 삭제 - DELETE */
router.delete('/:url_key/product/:id/comment', exStore, isLoggedIn, async(req, res, next) => {
    try {
        const productId = req.params.id;
        const product = await Product.findOne({
            where: { id: req.params.id }
        });

        const { commentId } = req.body;

        await ProductComment.destroy({
            where: { id: commentId, productId: productId }
        });

        const commentImages = await CommentImage.findAll({
            where: { productCommentId: commentId }
        });

        if(commentImages) {
            for (let i = 0; i < commentImages.length; i++) {
                /* Delete a file in directory */
                fs.unlink('uploads/productComments/' + commentImages[i].img, function (error) {
                    if(error) {
                        console.error('File is not found');
                    } else {
                        console.log('성공적으로 파일을 삭제하였습니다.');
                    }
                  });
            }
            await CommentImage.destroy({
                where: { id: commentId }
            });
        }

        return res.json({ message: '성공적으로 삭제했습니다.' });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/*  */
router.put('/:url_key/product/:id/comment', isLoggedIn, upload2.array('img'), async(req, res, next) => {
    try {
        const store = await Store.findOne({
            include:[{
                model: User,
                as: 'manager',
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            return res.json({ message: '가게 정보가 존재하지 않습니다.' });
        }

        const product = await Product.findOne({
            where: { id: req.params.id }
        });

        if(!product) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        const { commentId, content } = req.body;
        await ProductComment.update({
            content: content,
        }, {
            where: { id: commentId }
        });

        return res.json({ message: '성공적으로 수정하였습니다.' });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;