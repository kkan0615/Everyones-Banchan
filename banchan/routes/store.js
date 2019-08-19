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

//Main list page
router.get('/list', async(req, res, next) => {
    try {

        let stores;
        let page = req.query.page;
        let offset = 0;
        let order = req.query.order;

        /* Set page */
        if(page > 1) {
            offset = 30 * (page - 1);
        }

        /* Set orders */
        let orderFirst;
        let orderSecond;
        if( order === 'date_ASC' ) {
            orderFirst = 'name';
            orderSecond = 'ASC';
        } else if( order === 'date_DESC' ) {
            orderFirst = 'createdAt';
            orderSecond = 'DESC';
        } else if( order === 'name_ASC' ) {
            orderFirst = 'name';
            orderSecond = 'ASC';
        } else if( order === 'name_DESC' ) {
            orderFirst = 'name';
            orderSecond = 'DESC';
        } else {
            orderFirst = 'name';
            orderSecond = 'ASC';
        }

        if(req.query.siNm && req.query.sggNm) {
            stores = await Store.findAndCountAll({
                include: [{
                    model: User,
                    as: 'manager',
                }, {
                    model: User,
                    as: 'StoreLiker'
                }, {
                    model: Product,
                    include: [{
                        model: ProductComment,
                    },{
                        model: Food,
                    }],
                }, {
                    model: Address,
                    where: {
                        siNm: req.query.siNm,
                        sggNm: req.query.sggNm,
                    }
                }],
                offset: offset,
                limit: 30,
                order: [
                    ['stars', 'ASC'],
                    [ orderFirst, orderSecond ]
                ]
            });
        } else if(req.query.siNm && req.query.siNm != 'basic') {
            stores = await Store.findAndCountAll({
                include: [{
                    model: User,
                    as: 'manager',
                }, {
                    model: User,
                    as: 'StoreLiker'
                }, {
                    model: Product,
                    include: [{
                        model: ProductComment,
                    },{
                        model: Food,
                    }],
                }, {
                    model: Address,
                    where: { siNm: req.query.siNm }
                }],
                offset: offset,
                limit: 30,
                order: [
                    ['stars', 'ASC'],
                    [ orderFirst, orderSecond ]
                ]
            });
        } else {
            stores = await Store.findAndCountAll({
                include: [{
                    model: User,
                    as: 'manager',
                }, {
                    model: User,
                    as: 'StoreLiker'
                }, {
                    model: Product,
                    include: [{
                        model: ProductComment,
                    },{
                        model: Food,
                    }],
                }],
                offset: offset,
                limit: 30,
                order: [
                    ['stars', 'ASC'],
                    [ orderFirst, orderSecond ]
                ]
            });
        }

        return res.render('storeList', {
            title: 'Store List',
            user: req.user,
            stores: stores,
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

router.get('/openStore', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {
        let store;
        return res.render( 'openStore', {
            title: 'Open new store',
            user: req.user,
            store: store,
            openError: req.flash('error'),
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/openStore', isLoggedIn, isValidate, isSaler, upload.single('img'), async(req, res, next) => {
    try {
        if(!req.body.name || !req.body.url_key || !req.body.deliveryFee || !req.body.quickDeliveryFee) {
            req.flash('error', '모든 칸을 채워주세요');
            return res.redirect('/store/openStore');
        }

        const exStore = await Store.findOne({
            where: { url_key: req.body.url_key }
        });

        const regType = /^[A-Za-z0-9+]*$/;
        if(!regType.test(req.body.url_key)) {
            req.flash('error', '이미 존재하는 가게입니다.');
            return res.redirect('/store/openstore');
        }

        if(exStore) {
            req.flash('error', '이미 존재하는 가게입니다.');
            return res.redirect('/store/openStore');
        }

        let file;
        if(req.file) {
            file = req.file.filename;
        } else {
            file = null;
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

        const store = await Store.create({
            name: req.body.name,
            introduction: req.body.introduction,
            img: file,
            url_key: req.body.url_key,
            deliveryFee: req.body.deliveryFee,
            quickDeliveryFee: req.body.quickDeliveryFee,
            managerId: req.user.id,
            addressId: address.id,
        });

        res.redirect('/store/'+store.url_key);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/openStore/checkUrl', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {
        if(!req.body.url_key) {
            res.json({ result: '빈칸을 채워주세요' });
        }

        const exStore = await Store.findOne({
            where: { url_key: req.body.url_key }
        });

        if( !exStore ){
            res.json({ result: '가능한 url 주소 입니다.' });
        } else {
            res.json({ result: '이미 존재하는 url 주소입니다.' });
        }

    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 사이트 - 메인화면 */
router.get('/:url_key', async(req, res, next) => {
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
                }, {
                    model: ProductImage,
                }],
            }, {
                model: StoreComment,
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        //Check session recent view stores.
        if(!req.session.recentStores) {
            req.session.recentStores = [];
        } else {
            const index = req.session.recentStores.findIndex(i => i.id == store.id);
            if(index != -1) {
                req.session.recentStores.splice(index, 1);
            }
        }

        req.session.recentStores.push(store);


        return res.render('storeMain', {
            title: store.name,
            user: req.user,
            store: store,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/:url_key/addToCart', async(req, res, next) => {
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
            }, {
                model: StoreComment,
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        let product = {};
        product.product = await Product.findOne({
            include: {
                model: Store,
            },
            where: { id: req.body.product }
        });

        if(!req.session.cart) {
            req.session.cart = {};
            req.session.cart.productList = [];
        }

        product.quantity = req.body.quantity;
        /*
        const exSame = req.session.cart.productList.filter( (product) =>{
            return product.product.storeId == store.id
        });
        if(exSame.length > 1) {
            product.price = product.quantity * product.product.orginalPrice + req.body.deliveryFee;
        } else {
            product.price = product.quantity * product.product.orginalPrice;
        }
        */
        product.price = product.quantity * product.product.orginalPrice;
        req.session.cart.productList.push(product);

        if(req.session.cart.totalPrice) {
            req.session.cart.totalPrice += product.price;
        } else {
            req.session.cart.totalPrice = product.price;
        }

        return res.redirect('/cart');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/:url_key/addProduct', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
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

        return res.render('addProduct', {
            title: 'Add Product',
            user: req.user,
            store: store,
            foodList: foodList,
            error: req.flash('addProductError')
        });
    } catch (error) {
        console.error(error);
        next(error);
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
    console.log(req.files);

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
            productId: product.id,
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
            attributes:[
                [sequelize.fn('AVG', sequelize.col('stars')), 'stars_AVG']
            ],
            group: 'stars'
        });

        await Product.update({
            stars: avg[0].dataValues.stars_AVG,
        }, {
            where: { id: req.params.id }
        });

        return res.redirect('/store/'+store.url_key+'/product/'+product.id+'/comment');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 제품 댓글 삭제 - DELETE */
router.delete('/:url_key/product/:id/comment', isLoggedIn, async(req, res, next) => {
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


        const { commentId } = req.body;

        await ProductComment.destroy({
            where: { id: commentId, productId: product.id }
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

router.get('/:url_key/comment', async(req, res, next) => {
    try {

        const order = req.query.order;
        let orderArr = [];
        if(order == 'stars_ASC') {
            orderArr['standard'] = 'stars';
            orderArr['order']= 'ASC';
        } else if(order == 'stars_DESC') {
            orderArr['standard'] = 'stars';
            orderArr['order']= 'DESC';
        } else if(order == 'date_ASC') {
            orderArr['standard'] = 'updatedAt';
            orderArr['order']= 'ASC';
        } else {
            orderArr['standard'] = 'updatedAt';
            orderArr['order']= 'DESC';
        }

        const store = await Store.findOne({
            attributes: {
                include:
                [
                    [sequelize.fn('COUNT', sequelize.col('storeComments.id')), 'storeCommentsCount']
                ]
            },
            include:[{
                model: User,
                as: 'manager',
            },{
                model: StoreComment,
            }],
            group: ['store.id', 'storeComments.id' ],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Store is not found');
            res.redirect('/');
        }

        const comments = await StoreComment.findAndCountAll({
            include:[{
                model: User,
                as: 'author',
            },{
                model: CommentImage,
                attributes: [],
            }],
            where: { storeId: store.id },
            order: [[orderArr.standard, orderArr.order]],
        });

        return res.render('storeCommentList', {
            title: store.naem + ' 후기',
            user: req.user,
            store: store,
            comments: comments,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/:url_key/comment', isLoggedIn ,async(req, res, next) => {
    try {
        const store = await Store.findOne({
            include:[{
                model: User,
                as: 'manager',
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Store is not found');
            res.redirect('/');
        }

        const storeComment = await StoreComment.create({
            content: req.body.content,
            stars: parseInt(req.body.star),
            authorId: req.user.id,
            storeId: store.id,
        });

        //return res.json({ comment : storeComment });
        return res.redirect('/store/'+store.url_key+'/comment');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/:url_key/like', isLoggedIn, async(req, res, next) => {
    try {
        const store = await Store.findOne({
            include: {
                model: User,
                as: 'manager',
            },
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            return res.redirect('/');
        }

        await store.addStoreLiker(req.user.id);

        return res.json({ result: 'success' });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.delete('/:url_key/like', isLoggedIn, async(req, res, next) => {
    try {
        const store = await Store.findOne({
            include: {
                model: User,
                as: 'manager',
            },
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            return res.redirect('/');
        }

        await store.removeStoreLiker(req.user.id);

        return res.json({ result: 'success' });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/:url_key/setting', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {
        /*
         * 각각의 크기를 구하려면 length 를 이용하면 된다!
         */
        const store = await Store.findOne({
            include:[{
                model: User,
                as: 'manager',
            }, {
                model: User,
                as: 'StoreLiker',
            }, {
                model: Product,
                include: [{
                    model: ProductComment,
                },{
                    model: Food,

                }],
            }, {
                model: StoreComment,

            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Store is not found');
            res.redirect('/');
        }

        if(store.managerId != req.user.id) {
            req.flash('error', 'Unpermitted access');
            res.redirect('/store/'+store.url_key);
        }

        res.render('storeSetting', {
            title: store.naem + ' setting',
            user: req.user,
            store: store,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/:url_key/setting/productList', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {
        const store = await Store.findOne({
            include:[{
                model: User,
                as: 'manager',
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Store is not found');
            res.redirect('/');
        }

        const proudctList = await Product.findAndCountAll({
            where: { storeId: store.id }
        });

        res.render('storeProductSetting', {
            title: store.naem + ' setting',
            user: req.user,
            store: store,
            proudctList: proudctList,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 세팅 - 제품 삭제하기 */
router.delete('/:url_key/setting/productList', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
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
            }, {
                model: StoreComment,
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        await Product.destroy({
            where: {
                id: req.body.productId
            }
        })

        return res.json({ reuslt : 'success' })
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 세팅 - 상품 세일하기 */
router.post('/:url_key/setting/productSale', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
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
            }, {
                model: StoreComment,
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        await Product.update({
            salePrice: req.body.salePrice,
            startSale: new Date(),
            endSale: req.body.saleTime,
        }, {
            where: { id: req.body.productId }
        });

        const product = await Product.findOne({
            where: { id: req.body.productId }
        })

        if( !req.body.saleTime ) {
            return res.json({ result: 'Please type a valid number' });
        }
        const end = new Date();
        end.setMinutes(end.getMinutes() + product.endSale);
        schedule.scheduleJob(end, async () => {
            const checkProduct = await Product.findOne({
                where: { id: product.id }
            });

            if(!checkProduct) {
                req.flash('error', 'Product is not found');
                res.redirect('/');
            }

            await Product.update({
                salePrice: null,
                startSale: null,
                endSale: null,
            }, {
                where: { id: checkProduct.id }
            });
        });

        return res.json({ result: 'success to sale it!' });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 세팅 - 구체적인 변경 */
router.get('/:url_key/setting/editStoreDetail', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {
        const store = await Store.findOne({
            include:[{
                model: User,
                as: 'manager',
            }, {
                model: User,
                as: 'StoreLiker',
            }, {
                model: Product,
                include: [{
                    model: ProductComment,
                },{
                    model: Food,

                }],
            }, {
                model: StoreComment,
            }, {
                model: Address,
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Store is not found');
            res.redirect('/');
        }

        if(store.managerId != req.user.id) {
            req.flash('error', 'Unpermitted access');
            res.redirect('/store/'+store.url_key);
        }

        res.render('storeEditDetail', {
            title: store.naem + ' setting',
            user: req.user,
            store: store,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 세팅 - 제품 가격 변경 */
router.post('/:url_key/setting/changePrice', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
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
            }, {
                model: StoreComment,
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        if(store.managerId != req.user.id) {
            return res.json({ result: 'You are not allowed to edit it' });
        }

        await Product.update({
            salePrice: req.body.salePrice,
            startSale: new Date(),
            endSale: req.body.saleTime,
        }, {
            where: { id: req.body.productId }
        });

        const product = await Product.findOne({
            where: { id: req.body.productId }
        })

        if( !req.body.changePrice || !product ) {
            return res.json({ result: 'Please type a valid number' });
        }

        await Product.update({
            orginalPrice: req.body.changePrice
        },{
            where: { id: product.id }
        });

        return res.json({ result: 'success to change the price' });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 세팅 - 이름 변경 */
router.post('/:url_key/setting/changeStoreName', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
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
            }, {
                model: StoreComment,
            }],
            where: { url_key: req.params.url_key },
        });

        if(!store) {
            req.flash('error', 'Stroe is not found');
            res.redirect('/');
        }

        if(store.managerId != req.user.id) {
            return res.json({ result: 'You are not allowed to edit it' });
        }

        if(!req.body.newName) {
            res.json({ result: 'You should type a correct name' });
        }

        await Store.update({
            name: req.body.newName,
        }, {
            where: { id: store.id }
        });

        return res.json({ result: 'success to change the store name' });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 세팅 주소 변경 */
router.post('/:url_key/setting/changeStoreAddress', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {
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

        if(store.managerId != req.user.id) {
            return res.json({ result: 'You are not allowed to edit it' });
        }
        await Address.update({
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
        }, {
            where: { id: store.addressId }
        });

        res.json({ result: 'success to change address' });

    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 고객 주문 보기 */
router.get('/:url_key/setting/checkOrders', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {
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

        let page = req.query.page;
        let offset = 0;

        if(page > 1) {
            offset = 30 * (page - 1);
        }

        const orders = await Order.findAll({
            include:[{
                model: User,
            }, {
                model: Store,
            }, {
                model: Product,
            }],
            limit: 30,
            offset: offset,
            where: {
                storeId: store.id,
                deliveryCode: null,
            },
        });

        res.render('storeOrderList', {
            title: 'check',
            store: store,
            user: req.user,
            orders: orders,
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/:url_key/setting/checkOrders', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {
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

    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.put('/:url_key/setting/checkOrders', isLoggedIn, isValidate, isSaler, async(req, res, next) => {
    try {
        console.log(req.body.orderUpdate);

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

            req.body.orderUpdate.forEach( async(order) => {
                await Order.update({
                    deliveryCode: order.deliveryCode,
                }, {
                    where: { id: order.id }
                });
            });

        res.json({ result: '성공적으로 적용했습니다.' })
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;