require('dotenv').config();
const fp = require('fastify-plugin');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Function for fetching rate

async function getRate() {
    const today = new Date();
    const date = 'ymd'
        .replace('y', today.getFullYear())
        .replace('m', String(today.getMonth()+1).padStart(2, '0'))
        .replace('d', String(today.getDate()).padStart(2, '0'));
    const url = process.env.RATE_URL
        .replace('{}', date)
        .replace('{}', date);

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Error on rate fetching');
    }
    const data = await res.json();
    return data[0].rate;
}

// Plugins for database, mailer and cron
 
const dbPlugin = fp((app, opts, done) => {
    const db = new sqlite3.Database(__dirname + process.env.DB_FILE_REL);

    db.migrate = function (refresh=false) {
        this.serialize(() => {
            if (refresh) {
                this.run('DROP TABLE IF EXISTS emails');
            }
            this.run(
                'CREATE TABLE IF NOT EXISTS emails '
                + '(id INTEGER PRIMARY KEY, email TEXT UNIQUE)'
            );
        });
    };

    db.postEmail = async function(email) {
        query = 'INSERT INTO emails (email) VALUES (?)';
        const answer = await new Promise((resolve, reject) => {
            this.run(query, [email], (err) => {
                if (err) resolve(false);
                resolve(true);
            });
        });
        return answer;
    };

    db.getEmails = async function () {
        const query = 'SELECT email FROM emails';
        const data = await new Promise((resolve, reject) => {
            this.all(query, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        return data.map(obj => obj.email);
    };

    app.decorate('db', db);
    done();
});

const mailerPlugin = fp((app, opts, done) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAILER_HOST,
        port: process.env.MAILER_PORT,
        secure: false,
        auth: {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_PASS
        }
    });

    transporter.sendExchangeEmails = async function (emails) {
        try {
            await this.sendMail({
                from: `<${process.env.MAILER_USER}>`,
                to: emails.join(', '),
                subject: 'USD to UAH exchange rate',
                text: String(await getRate())
            });
        } catch (err) {
            app.log.error(err);
        }
    };

    app.decorate('mailer', transporter);
    done();
});

const cronPlugin = fp((app, opts, done) => {
    cron.scheduleEmails = function () {
        this.schedule('0 8 * * *', async function () {
            const emails = await app.db.getEmails();
            await app.mailer.sendExchangeEmails(emails);
        }, { timezone: 'Europe/Kiev' });
    };

    app.decorate('cron', cron);
    done();
});

// Handlers for /rate and /subscribe requests

async function rateHandler(req, reply) {
    const data = await getRate();
    return reply.send(data);
}

async function subscribeHandler(req, reply) {
    const { email } = req.body;
    const answer = await req.server.db.postEmail(email);

    if (answer) return reply.send('Subscribed successfully');
    return reply.code(409).send('Already subscribed');
}

// Validation schemas

const subscribeSchema = {
    schema: {
        body: {
            type: 'object',
            required: ['email'],
            properties: {
                email: { type: 'string', format: 'email' }
            }
        },
        response: {
            200: { type: 'string' },
            409: { type: 'string' }
        }
    }
}

// App building function

// mode = 0 --- for running tests
// mode = 1 --- for running app
module.exports = async (mode=1) => {
    const fastify = require('fastify')({ logger: Boolean(mode) });

    fastify.register(require('@fastify/formbody'));
    await fastify.register(dbPlugin);
    await fastify.register(mailerPlugin);
    await fastify.register(cronPlugin);

    fastify.get('/rate', rateHandler);
    fastify.post('/subscribe', subscribeSchema, subscribeHandler);

    fastify.db.migrate(!mode);
    if (mode) fastify.cron.scheduleEmails();

    fastify.addHook('onClose', async app => {
        app.db.close();
        if (mode) app.cron.getTasks().entries().next().value[1].stop();
    });

    return fastify;
};
