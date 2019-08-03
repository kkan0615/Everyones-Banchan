module.exports = (sequelize, DataTypes) => (
    sequelize.define('commentImage', {
        img: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
    }, {
        timestamps: true,
        paranoid: true,
        charset:'utf8',
        collate:'utf8_general_ci',
    })
);