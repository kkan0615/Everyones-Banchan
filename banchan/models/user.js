module.exports = (sequelize, DataTypes) => (
    sequelize.define('user', {
        uuid: {
            type: DataTypes.STRING(200),
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING(40),
            allowNull: false,
            unique: true,
        },
        nickname: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        provider: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'local',
        },
        snsId: {
            type: DataTypes.STRING(50),
        },
        img: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        phoneNumber: {
            type: DataTypes.INTEGER(),
            allowNull: true,
        },
        isSaler: {
            type: DataTypes.BOOLEAN(),
            allowNull: false,
            defaultValue: false,
        },
        isAdmin: {
            type: DataTypes.BOOLEAN(),
            allowNull: false,
            defaultValue: false,
        },
        isValidate: {
            type: DataTypes.BOOLEAN(),
            allowNull: false,
            defaultValue: true, //나중에 바꿔주세요 FALSE로 !!!!
        },
    }, {
        timestamps: true,
        paranoid: true,
        charset:'utf8',
        collate:'utf8_general_ci',
    })
);