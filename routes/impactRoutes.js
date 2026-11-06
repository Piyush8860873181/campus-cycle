const express = require('express');
const router = express.Router();
const { getImpactMetrics } = require('../controllers/impactController');

router.get('/', getImpactMetrics);

module.exports = router;
