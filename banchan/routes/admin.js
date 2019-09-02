const express = require('express');
const router = express.Router();

const { isLoggedIn, isAdmin } = require('./middlewares');
const {  } = require('../models');

router.get('/', isLoggedIn, isAdmin, async(req, res, next) => {
    try {

    } catch (error) {

    }
});

module.exports = router;