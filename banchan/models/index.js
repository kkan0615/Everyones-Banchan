const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.User = require('./user')(sequelize, Sequelize);
db.Store = require('./store')(sequelize, Sequelize);
db.Product = require('./product')(sequelize, Sequelize);
db.Food = require('./food')(sequelize, Sequelize);
db.StoreComment = require('./storeComment')(sequelize, Sequelize);
db.ProductComment = require('./productComment')(sequelize, Sequelize);
db.StoreImage = require('./storeImage')(sequelize, Sequelize);
db.ProductImage = require('./productImage')(sequelize, Sequelize);
db.CommentImage = require('./commentImage')(sequelize, Sequelize);
db.Address = require('./address')(sequelize, Sequelize);
db.Order = require('./order')(sequelize, Sequelize);

//1:N(User:Store) User can have many stores as manager
db.User.hasMany(db.Store);
db.Store.belongsTo(db.User, { as: 'manager' });
//1:N(Store:Product) Product can have many products
db.Store.hasMany(db.Product);
db.Product.belongsTo(db.Store);
//N:1(Product:Food) Product has food tag
db.Food.hasMany(db.Product);
db.Product.belongsTo(db.Food);
//LIKE MANY TO MANY
db.User.belongsToMany(db.Store, { through: 'StoreLike' });
db.Store.belongsToMany(db.User, { through: 'StoreLike', as: 'StoreLiker' });

db.User.hasMany(db.StoreComment);
db.StoreComment.belongsTo(db.User, {as: 'author'});

db.User.hasMany(db.ProductComment);
db.ProductComment.belongsTo(db.User, {as: 'author'});

db.Store.hasMany(db.StoreComment);
db.StoreComment.belongsTo(db.Store);

db.Product.hasMany(db.ProductComment);
db.ProductComment.belongsTo(db.Product);

// IMAGE!
db.Store.hasMany(db.StoreImage);
db.StoreImage.belongsTo(db.Store);
db.Product.hasMany(db.ProductImage);
db.ProductImage.belongsTo(db.Product);

//Comment Image
db.StoreComment.hasMany(db.CommentImage);
db.CommentImage.belongsTo(db.StoreComment);
db.ProductComment.hasMany(db.CommentImage);
db.CommentImage.belongsTo(db.ProductComment);

//ADDRESS
db.User.belongsTo(db.Address);
db.Store.belongsTo(db.Address);

//order
db.User.hasMany(db.Order);
db.Order.belongsTo(db.User);
db.Store.hasMany(db.Order);
db.Order.belongsTo(db.Store);
db.Address.hasMany(db.Order);
db.Order.belongsTo(db.Address);
db.Product.hasMany(db.Order);
db.Order.belongsTo(db.Product);

//Food : Store Many to Many
db.Food.belongsToMany(db.Store, { through: 'foodStore'});
db.Store.belongsToMany(db.Food, { through: 'foodStore'});

module.exports = db;