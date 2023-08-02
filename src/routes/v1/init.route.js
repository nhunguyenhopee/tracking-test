const express = require('express');
const initController = require('../../controllers/init.controller');

const router = express.Router();

router.route('/').get(initController.getInfo);

module.exports = router;
