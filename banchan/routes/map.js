const express = require('express');
const router = express.Router();
const Op = require('sequelize').Op;

const { } = require('./middlewares');
const { Store, Address } = require('../models');

/* Map category index */
router.get('/', (req, res, next) => {

    return res.render('map/index', {
        title: 'Stores - Map',
        user: req.user,
    });
});

/* Send stores data based on GPS */
router.post('/', async(req, res, next) => {
    try {
        const { pLng, pLat } = req.body;
        //findAndCountAll
        const stores = await Store.findAll({
            include: {
                model: Address,
            }
        });
        //console.log(stores);
        //console.log(stores[1].address);

        return res.json({
            stores,
        })
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;