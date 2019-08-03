module.exports = (sequelize, DataTypes) => (
    sequelize.define('food', {
        name: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        kinds: {
            type: DataTypes.STRING(40),
            allowNull: true,
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
    }, {
        timestamps: true,
        paranoid: true,
        charset:'utf8',
        collate:'utf8_general_ci',
    })
);