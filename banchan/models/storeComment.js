module.exports = (sequelize, DataTypes) => (
    sequelize.define('storeComment', {
        content: {
            type: DataTypes.STRING(400),
            allowNull: true,
        },
        stars: {
            type: DataTypes.INTEGER(5),
            allowNull: false,
        }
    }, {
        timestamps: true,
        paranoid: true,
        charset:'utf8',
        collate:'utf8_general_ci',
    })
);