import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'ui', 'dist')));

app.get('/healthz', (_, res) => res.send({ status: 'ok' }));

app.listen(8080, () => console.log('VersaTiles Choro server running on http://localhost:8080'));
