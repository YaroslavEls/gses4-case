require('dotenv').config();
const build = require('./index.js');

(async () => {
    const app = await build();
    try {
        app.listen({ 
            port: process.env.APP_PORT,
            host: process.env.APP_HOST 
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
})();
