module.exports = (sequelize, DataTypes) => (
    sequelize.define('address', {
        //전체 도로명주소
        roadFullAddr: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        //도로명주소(참고항목 제외)
        roadAddrPart1: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        //참고주소
        roadAddrPart2: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        //도로명주소(영문)
        engAddr: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        //우편번호
        zipNo: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        //고객 입력 상세 주소
        addrDetail: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        //시도명
        siNm: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        //시군구명
        sggNm: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        //읍면동명
        emdNm: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        //도로명
        rn: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        //latitude 위도
        lat : {
            type: DataTypes.FLOAT(),
            allowNull: true,
        },
        //longitude 경도
        lng: {
            type: DataTypes.FLOAT(),
            allowNull: true,
        }
    }, {
        timestamps: true,
        paranoid: true,
        charset:'utf8',
        collate:'utf8_general_ci',
    })
);