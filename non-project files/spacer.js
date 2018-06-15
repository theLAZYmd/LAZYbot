const fs = require('fs');

class PrintBoi {
    static start() {
        fs.readFile('message.json', (err, data) => {
            if(err) throw err;
            let db = [{
                Seed: 'Seed',
                Username: 'Username',
                Rating: 'Rating'
            }, {
                Seed: '',
                Username: '',
                Rating: ''
            }].concat(JSON.parse(data));
            let seedLength = StringFitter.getLength(db, 'Seed');
            let nameLength = StringFitter.getLength(db, 'Username');
            let rtgLength = StringFitter.getLength(db, 'Rating');
            let ret = '';
            for (let i = 0; i < db.length; i++) {
                let seedStr = StringFitter.setLength(db[i].Seed + '', '-', seedLength);
                let nameStr = StringFitter.setLength(db[i].Username, '-', nameLength);
                let rtgStr = StringFitter.setLength(db[i].Rating + '', '-', rtgLength);
                ret += '`| ' + seedStr + ' | ' + nameStr + ' | ' + rtgStr + ' |`\n'
            }

            fs.writeFile('dbfull.txt', ret, (err) => {
                if (err) throw err;
                console.log('Written up, boi');
            });
            //console.log(ret);

        })
    }
}

class StringFitter {

    static getLength(db, key) {
        let maxLen = 0;
        for (var i = 0; i < db.length; i++) {
            let str = '' + db[i][key];
            if (str.length > maxLen) maxLen = str.length;
        }
        return maxLen;
    }

    static setLength(str, filler, length) {
        let r = str.substring(0, length);
        for (var i = r.length; i < length; i++) {
            r += filler.charAt((i - r.length) % filler.length);
        }
        return r;
    }

}

PrintBoi.start();
