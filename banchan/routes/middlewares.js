const { Store, Product } = require('../models');

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).send('Login is required');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/');
    }
};

exports.isAdmain = (req, res, next) => {
    if(req.isAuthenticated() && req.user.isAdmin == true) {
        next();
    } else {
        console.log(req.user);
        res.status(402).send('You are not allowed to access, Admin only');
    }
};

exports.isSaler = (req, res, next) => {
    if(req.isAuthenticated() && req.user.isSaler == true) {
        next();
    } else {
        console.log(req.user);
        res.status(402).send('You are not saler.');
    }
};

exports.isValidate = (req, res, next) => {
    if(req.user && req.user.isValidate == true) {
        next();
    } else {
        console.log(req.user);
        res.status(402).send('You are not validated yet.');
    }
};

/* Check store can be found */
exports.exStore = async(req, res, next) => {
    try {
        const store = await Store.findOne({
            where: { url_key: req.params.url_key }
        });

        if(!store) {
            res.status(404).send('Store is not found');
            return res.redirect('/');
        }
        next();
    } catch (error) {
        console.error(error);
        next(error);
    }
};

/* Check product can be found */
exports.exProduct = async(req, res, next) => {
    try {
        const product = await Product.findOne({
            where: { id: req.params.id }
        });

        if(!product) {
            res.status(404).send('Product is not found');
            return res.redirect('/');
        }
        next();
    } catch (error) {
        console.error(error);
        next(error);
    }
};
