const express = require('express');
const router = express.Router();
const sequelize = require('sequelize');
const Op = sequelize.Op;

const { User, Store, Product, Food } = require('../models');

/**
 * Food 리스트는 두가지 경우로 나뉘어진다
 * 1. 특정 음식만을 찾을 때,
 * 2. 여러 음식을 찾을 때, -> name 순으로 나열.
 */
router.get('/list', async(req, res, next) => {
    try {
        const saleList = await Product.findAll({
            include: {
                model: Store,
            },
            where: { salePrice: { [Op.ne]: null } },
            order: [['name', 'ASC']]
        });

        return res.render( 'saleList', {
            title: 'Food List',
            user: req.user,
            saleList: saleList,
            error: req.flash('error')
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;