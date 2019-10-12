var express = require('express');
var router = express.Router();
var redis = require('../project/redis')
var logger = require('../project/logger').getLogger('user')

/* GET login page. */
router.get('/login', function(req, res, next) {
    res.render('login', {title: 'Login'});
});

/* POST login page. */
router.post('/login', function(req, res, next) {
    let username = req.body.username;
    let password = req.body.password;
    if(username && password) {
        redis.hget("user_"+username, "password", (err, pwd) => {
            if(err) {
                logger.error(err)
            }
            if(pwd == password) {
                req.session.username = req.body.username
                res.redirect('/')
            } else {
                res.render('login', {title: 'Login', alerts: [{msg: '用户名或密码错误'}]})
            }
        });
        //不返回任何数据，客户端将阻塞
    } else {
        res.render('login', {title: 'Login', alerts: [{msg: '用户名或密码错误'}]})
    }
});

module.exports = router;
