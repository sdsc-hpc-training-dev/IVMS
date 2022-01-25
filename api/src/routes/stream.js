const fs = require('fs');
const path = require('path');
const STREAM_PATH = path.resolve(__dirname, '..', '..', '..', 'data', 'video');

fs.mkdirSync(STREAM_PATH, { recursive: true });

/** @type {APIEndpoint} */
const streamer = {
    method: 'get',
    path: '/stream/:video',
    defaultResType: 'video/mp4',
    handle: function (proxy, req) {
        const vid = path.resolve(STREAM_PATH, req.getParameter(0));
        if (!vid.startsWith(STREAM_PATH)) return proxy.status('400 Bad Request');

        // console.log('headers:');
        // req.forEach((k, v) => console.log(`${k}: ${v}`));
        const range = req.getHeader('range') || req.getHeader('content-range');
        const match = /^bytes=(\d+)-(\d+)?$/.exec(range);

        fs.stat(vid, (err, stats) => {
            if (err || !stats) return proxy.status('404 Not Found');

            if (!match) {
                // proxy.status('416 Range Not Satisfiable');
                proxy.streamFrom(vid, 0, stats.size, stats.size);
            } else {
                const [_, start, end] = match;
                proxy.streamFrom(
                    vid,
                    ~~start,
                    ~~end || ~~start + 16 * 1024 * 1024,
                    stats.size,
                );
            }
        });
    },
};

module.exports = streamer;
