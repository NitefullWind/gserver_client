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
                req.flash("登录成功", "success")
                res.redirect('/')
            } else {
                req.flash("用户名或密码错误", "danger")
                res.render('login', {title: 'Login'})
            }
        });
        //不返回任何数据，客户端将阻塞
    } else {
        req.flash("用户名或密码不能为空", "danger")
        res.render('login', {title: 'Login'})
    }
});

router.get('/userinfo', function(req, res, next) {
    if(req.session.username) {
        res.json({
            username: req.session.username,
            message: '',
            retcode: 200
        })
    } else {
        res.json({
            message: '用户未登陆',
            retcode: 0
        })
    }
});

module.exports = router;
