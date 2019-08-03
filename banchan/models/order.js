module.exports = (sequelize, DataTypes) => (
    sequelize.define('order', {
        code: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        deliveryOption: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: null,
        },
        deliveryCode: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        quantity: {
            type: DataTypes.INTEGER(),
            allowNull: false,
        },
        content: {
            type: DataTypes.STRING(150),
            allowNull: true,
            defaultValue: null,
        },
    }, {
        timestamps: true,
        paranoid: true,
        charset:'utf8',
        collate:'utf8_general_ci',
    })
);