module.exports = (sequelize, DataTypes) => (
    sequelize.define('store', {
        name: {
            type: DataTypes.STRING(40),
            allowNull: true,
            unique: true,
        },
        img: {
            type: DataTypes.STRING(200),
            allowNull: true,
            defaultValue: null,
        },
        url_key: {
            type: DataTypes.STRING(14),
            allowNull: true,
            unique: true,
        },
        introduction: {
            type: DataTypes.STRING(150),
            allowNull: true,
            defaultValue: null,
        },
        deliveryFee: {
            type: DataTypes.INTEGER(),
            allowNull: false,
            defaultValue: 0,
        },
        quickDeliveryFee: {
            type: DataTypes.INTEGER(),
            allowNull: false,
            defaultValue: 0,
        }
    }, {
        timestamps: true,
        paranoid: true,
        charset:'utf8',
        collate:'utf8_general_ci',
    })
);