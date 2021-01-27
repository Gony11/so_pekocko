const express = require('express');
const router = express.Router();
const sauceControllers = require('../controllers/sauce');

const multer = require('../middleware/multer-config');
const auth = require('../middleware/auth');

router.get('/', auth, sauceControllers.getAllSauce);
router.get('/:id', auth, sauceControllers.getOneSauce);
router.post('/', auth, multer, sauceControllers.createdSauce);
router.put('/:id', auth, multer, sauceControllers.modifySauce);
router.delete('/:id', auth, sauceControllers.deleteSauce);
router.post('/:id/like', auth, sauceControllers.likeDislike)

module.exports = router;