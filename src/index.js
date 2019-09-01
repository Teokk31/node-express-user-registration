require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { pool } = require('../config.js');
const bcrypt = require('bcrypt');
const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');

const app = express();

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(cors());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1', router);

async function isUserExists(email) {
    return new Promise(resolve => {
        pool.query('SELECT * FROM "Users" WHERE "Email" = $1', [email], (error, results) => {
            if (error) {
                throw error;
            }

            return resolve(results.rowCount > 0);
        });
    });
}

async function getUser(email) {
    return new Promise(resolve => {
        pool.query('SELECT * FROM "Users" WHERE "Email" = $1', [email], (error, results) => {
            if (error) {
                throw error;
            }

            return resolve(results.rows[0]);
        });
    });
}

const getUsers = (request, response) => {
    pool.query('SELECT * FROM "Users"', (error, results) => {
        if (error) {
            throw error;
        }

        const users = results.rows.map(user => {
            return {
                id: user.id,
                name: user.name,
                email: user.email
            };
        });

        response.status(200).json(users);
    });
};

const createUser = (request, response) => {
    const saltRounds = 10;
    const { name, email, password } = request.body;

    isUserExists(email).then(isExists => {
        if (isExists) {
            return response.status(400).json({ status: 'failed', message: 'Email is taken.' });
        }

        bcrypt.hash(password, saltRounds, (error, encryptedPassword) => {
            if (error) {
                throw error;
            }

            pool.query('INSERT INTO "Users" ("Name", "Email", "Password") VALUES ($1, $2, $3)', [name, email, encryptedPassword], error => {
                if (error) {
                    throw error;
                }

                getUser(email).then(user => response.status(201).json(user));
            });
        });
    }, error => {
        response.status(400).json({ status: 'failed', message: 'Error while checking is user exists.' });
    });
};

const login = (request, response) => {
    const { email, password } = request.body;

    isUserExists(email).then(isExists => {
        if (!isExists) {
            return response.status(401).json({ status: 'failed', message: 'Invalid email or password!' });
        }

        getUser(email).then(user => {
            bcrypt.compare(password, user.password, (error, isValid) => {
                if (error) {
                    throw error;
                }

                if (!isValid) {
                    return response.status(401).json({ status: 'failed', message: 'Invalid email or password!' });
                }

                response.status(200).json({ status: 'success', message: 'Login successfully!' });
            });
        });
    }, error => {
        response.status(400).json({ status: 'failed', message: 'Error while login.' });
    });
};

app.route('/users').get(getUsers).post(createUser);
app.route('/login').post(login);

app.get('/', (request, response) => {
    response.json('Simple User Registration API using Node Express with PostgreSQL');
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`App running on port ${process.env.PORT || 3000}.`);
});