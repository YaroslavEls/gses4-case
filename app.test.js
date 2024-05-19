const tap = require('tap');
const build = require('./index.js');

tap.test('Endpoints tests', async t => {
    let app;
    
    t.plan(5);

    t.before(async () => {
        app = await build(mode=0);
    });

    t.teardown(async () => {
        await app.close();
    });

    t.test('GET /rate, test successs', async t => {
        const res = await app.inject({
            method: 'GET',
            url: '/rate'
        });
    
        t.equal(res.statusCode, 200);
        t.type(res.json(), Number);
    });

    t.test('POST /subscribe, test error 400, case 1', async t => {
        const res = await app.inject({
            method: 'POST',
            url: '/subscribe'
        });
    
        t.equal(res.statusCode, 400);
    });

    t.test('POST /subscribe, test error 400, case 2', async t => {
        const res = await app.inject({
            method: 'POST',
            url: '/subscribe',
            payload: {
                email: 'example'
            }
        });
    
        t.equal(res.statusCode, 400);
    });

    t.test('POST /subscribe, test success', async t => {
        const res = await app.inject({
            method: 'POST',
            url: '/subscribe',
            payload: {
                email: 'example@example.com'
            }
        });
    
        t.equal(res.statusCode, 200);
        t.type(res.payload, String);
    });

    t.test('POST /subscribe, test error 409', async t => {
        const res = await app.inject({
            method: 'POST',
            url: '/subscribe',
            payload: {
                email: 'example@example.com'
            }
        });
    
        t.equal(res.statusCode, 409);
        t.type(res.payload, String);
    });
});
