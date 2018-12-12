const Parse = require("../util/parse.js");
const config = require("../config.json");
const request = require("request");
const rp = require("request-promise");

class Reddit extends Parse {

    constructor(message) {
        super(message);
    }

    async link() {
        try {
            let content = this.message.content;
            if (!content || !/(?:^|\b)\/?r\/(\w{2,21})(?:^|\b)/gi.test(content)) throw "";
            let arr = await Reddit.stringToLinks(content);
            this.Output.generic(arr.join("\n"));
            return arr;
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    static async stringToLinks(str) {
        try {
            return str.match(/(?:^|\b)\/?r\/(\w{2,21})(?:^|\b)/gi)
                .map(n => n.match(/(?:^|\b)\/?r\/(\w{2,21})(?:^|\b)/i)[1])
                .filter(async (name) => {
                    try {
                        let uri = config.urls.reddit.api.replace("|", name);
                        let body = JSON.parse(await rp({uri,
                            "json": true,
                            "timeout": 2000
                        }).toString());
                        console.log(body);
                        if (!body) return false;
                        if (body.error) return false;
                        if (body.message === "Not Found") return false;
                        if (!body.after) return false;
                        return true;
                    } catch (e) {
                        return false;
                    }
                })
                .map(n => `[${config.urls.reddit.name.replace("|", n)}](${config.urls.reddit.link.replace("|", n)})`)
        } catch (e) {
            if (e) throw e;
        }
    }

}

module.exports = Reddit;