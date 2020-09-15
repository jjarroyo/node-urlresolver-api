/* gamovideo resolver
 * @lscofield
 * GNU
 */

const cheerio = require('cheerio');
const execPhp = require('exec-php');
const json5 = require('json5');
const skkchecker = require('../lib/skkchecker');

exports.index = function(req, res) {
    //Optional check, only if you need to restrict access
    // to unautorized apps, skk is signature and auth is 
    // unautorized signal
    // see the config file to more info

    const granted = "";
    if (granted != '') {
        // no autorized app block
        // return a random troll video
        // if the app is unautorized
        res.json({ status: 'ok', url: granted });
    } else {

        // autorized app block
        const source = 'source' in req.body ? req.body.source : req.query.source;
        const html = Buffer.from(source, 'base64').toString('utf8');
        var mp4 = null;

        const $ = cheerio.load(html);

        try {
            var found = '';

            for (var i = 0; i < $('script[type="text/javascript"]').get().length; i++) {
                const text = $('script[type="text/javascript"]').get(i);

                try {
                    const s = text.children[0].data;

                    if (s.includes("eval(function")) {
                        found = s;
                        break;
                    }
                } catch (rt) {}
            }

            if (found != '') {
                execPhp('../lib/unpacker.php', '/usr/bin/php', function(error, php, output) {
                    console.log("error=> " + error)
                    php.nodeunpack(found, function(error, result, output, printed) {

                        if (error) {
                            mp4 = '';
                        } else {
                            try {

                                var mp4Regex = /sources:\s*(\[.*?\])/s;
                                var json = mp4Regex.exec(result);

                                json = json5.parse(json[1]);

                                if (json && json.length == 1)
                                    mp4 = json[0].file.replace('/hls/', '/').split(',').join('').replace('.urlset/master.m3u8', '/v.mp4');
                                else if (json && json.length > 1) {
                                    for (var h = 0; h < json.length; h++)
                                        if (json[h].file.includes('master.m3u8'))
                                            mp4 = json[h].file.replace('/hls/', '/').split(',').join('').replace('.urlset/master.m3u8', '/v.mp4');
                                    console.log("error=> " + mp4)

                                    mp4 = mp4 && mp4 != '' ? mp4 : '';
                                }
                            } catch (errr) {}
                        }

                        mp4 = mp4 == null ? '' : mp4;

                        res.json({ status: mp4 == '' ? 'error' : 'ok', url: mp4 });
                    });
                });
            } else {
                res.json({ status: 'error', url: 'jaa' });
            }
        } catch (e) {
            res.json({ status: 'error', url: 'mmm' });
        }
    }
};