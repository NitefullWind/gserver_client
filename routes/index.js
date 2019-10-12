var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    if(req.session.username) {
        res.render('index');
    } else {
        res.redirect('/login')
    }
});

/* GET login page. */
router.get('/login', function(req, res, next) {
    res.render('login', {title: 'Login'});
});

/* POST login page. */
router.post('/login', function(req, res, next) {
    req.session.username = req.body.username
    res.redirect('/')
});

module.exports = router;
