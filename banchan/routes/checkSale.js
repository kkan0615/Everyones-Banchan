const sequelize = require('sequelize');
const Op = sequelize.Op;

const { User, Store, Product, Food } = require('../models');

module.exports = async() => {
    try {
        const products = await Product.findAll({
            where: { id: { [Op.ne]: null } },
        });

        //Check for products over sale time
        products.forEach(async (product) => {
            const end = new Date(product.startSale);
            end.setMinutes(end.getMinutes() + product.endSale);
            //console.log(end);
            if(new Date() >  end) {
                await Product.update({
                    salePrice: null,
                    startSale: null,
                    endSale: null,
                }, {
                    where: { id: product.id }
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}