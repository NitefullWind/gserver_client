var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    if(req.session.username) {
        res.render('index');
    } else {
        res.redirect('/users/login')
    }
});

module.exports = router;
