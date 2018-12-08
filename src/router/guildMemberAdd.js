module.exports = async (member) => {
    let Constructor = require("../modules/shadowban.js");
    let Instance = new Constructor({ member })
    Instance.sbusername(member);
}