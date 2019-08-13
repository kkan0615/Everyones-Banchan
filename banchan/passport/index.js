const local = require('./localStrategy');
const { User, Store, Order, Address, StoreComment, ProductComment, CommentImage } = require('../models');

module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findOne({
            include: [{
                model: Store,
                include: [{
                    model: User,
                    as: 'StoreLiker',
                }]
            }, {
                model: StoreComment,
                include: {
                    model: CommentImage,
                }
            }, {
                model: ProductComment,
                include: {
                    model: CommentImage,
                },
            }],
            where: { id: id },
        })
        .then(user => done(null, user))
        .catch(err => done(err));
    });

    local(passport);
};