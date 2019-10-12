/**
 * Expose `flash()` function on requests.
 *
 * @return {Function}
 * @api public
 */
function flash() {
    return function(req, res, next) {
        req.flash = _flash;
        var render = res.render;
        res.render = function () {
            // attach flash messages to res.locals.messages
            var flash_msgs = [];
            if(req.session) {
                flash_msgs = req.session.flash_massages || [];
                req.session.flash_massages = []
            }
            res.locals.flash_massages = flash_msgs;
            render.apply(res, arguments);
        }
        next();
    }
}

/*
 * @param {String} msg
 * @param {String} type
 * @return Array
 * @api public
 */
function _flash(msg, catalogy) {
    var flash_msg = {
        "msg": msg,
        "catalogy": catalogy || "info"
    }
    if (this.session === undefined) throw Error('flash() requires sessions');
    var msgs = this.session.flash_massages = this.session.flash_massages || [];
    msgs.push(flash_msg)
    return msgs;
}

module.exports = flash;