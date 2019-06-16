var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const User = require('../model/user');
const keys = require('../config/keys');

/* GET /users 返回json数据
* public */
router.get('/', function (req, res, next) {
    res.json({msg: "啊哈哈"});
});

/* POST /users 返回json数据
* 安装 npm install body-parser 以支持post请求
* public */
router.post('/', function (req, res, next) {
    console.log(req.body);
    // 查询数据库是否存在
    User.findOne({email: req.body.email})
        .then((user) => {
            if (user) {
                return res.status(400).json("邮箱已备注册")
            } else {
                const avatar = gravatar.url(req.body.email, {s: '200', r: 'pg', d: 'mm'})

                const newUser = new User({
                    name: req.body.name
                    , email: req.body.email
                    , avatar: avatar
                    , identity: req.body.identity
                    , password: req.body.password
                })

                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        // 给密码进行加密
                        if (err) throw err;
                        newUser.password = hash;
                        newUser.save()
                            .then(user => res.json(user))
                            .catch(err => console.log(err))
                    })
                })
            }
        })
});

// 登录成功 获得token
router.get('/login', function (req, res, next) {
    const email = req.query.email;
    const password = req.query.password;
    // console.log(email)
    // console.log("password" + password)
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                return res.status(404).json("用户不存在")
            }
            // 密码匹配
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (isMatch) {
                        // jwt 返回token
                        const rule = {
                            id: user.id
                            , name: user.name
                            , avatar: user.avatar
                            , identity: user.identity
                        };
                        jwt.sign(rule, keys.secretOrKey, {expiresIn: 3600}, (err, token) => {
                            if (err) throw res;
                            res.json({
                                success: true
                                // 一定要写 "Bearer "
                                , token: "Bearer " + token
                            })
                        });
                        // res.json({msg: "success"})
                    } else {
                        return res.status(400).json({password: "密码错误!"})
                    }
                })
        })
});

router.get('/current', passport.authenticate('jwt', {session: false}), (req, res) => {
    res.json({
        id: req.user.id
        , name: req.user.name
        , email: req.user.email
        , identity: req.user.identity
    });
});
module.exports = router;
