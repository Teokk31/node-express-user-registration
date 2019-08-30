import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(cors());

app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' });
});

app.listen(process.env.PORT, () => {
    console.log(`App running on port ${process.env.PORT}.`);
});