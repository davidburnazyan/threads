const { Sequelize } = require('sequelize');
const db = require('../config/database');

const Urls = db.define('urls', {
    url: {
        type: Sequelize.STRING
    },
    message: {
        type: Sequelize.STRING
    },
    firstDate: {
        type: Sequelize.STRING
    },
    secondDate: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING
    }
})

module.exports = Urls;