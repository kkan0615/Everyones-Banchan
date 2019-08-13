require('dotenv').config();

module.exports = {
    development: {
      username: 'root',
      password: process.env.SEQUELIZE_PASSWORD,
      database: 'banchan',
      host: '127.0.0.1',
      dialect: 'mysql',
      operatorsAliases: 'false'
    },
    test: {
      username: 'root',
      password: process.env.SEQUELIZE_PASSWORD,
      database: 'banchan',
      host: '127.0.0.1',
      dialect: 'mysql'
    },
    production: {
      username: 'root',
      password: process.env.SEQUELIZE_PASSWORD,
      database: 'banchan',
      host: '127.0.0.1',
      dialect: 'mysql',
      operatorsAliases: 'false',
      logging: false,
    }
}
