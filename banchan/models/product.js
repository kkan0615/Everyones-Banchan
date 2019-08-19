module.exports = (sequelize, DataTypes) => (
    sequelize.define('product', {
        name: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        orginalPrice: {
            type: DataTypes.INTEGER(),
            allowNull: false,
        },
        salePrice: {
            type: DataTypes.INTEGER(),
            allowNull: true,
            defaultValue: null,
        },
        startSale: {
            type: DataTypes.DATE(),
            allowNull: true,
            defaultValue: null,
        },
        endSale: {
            type: DataTypes.INTEGER(),
            allowNull: true,
            defaultValue: null,
        },
        option: {
            type: DataTypes.STRING(150),
            allowNull: true,
            defaultValue: null,
        },
        introduction: {
            type: DataTypes.STRING(150),
            allowNull: true,
            defaultValue: null,
        },
        content: {
            type: DataTypes.STRING(150),
            allowNull: true,
            defaultValue: null,
        },
        stars: {
            type: DataTypes.INTEGER(),
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        timestamps: true,
        paranoid: true,
        charset:'utf8',
        collate:'utf8_general_ci',
    })
);