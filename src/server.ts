import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from public directory
app.use(express.static(join(__dirname, '..', 'public')));

app.use('/', routes);

export { app };

if (process.argv[1] === new URL(import.meta.url).pathname) {
  app.listen(PORT, () => {
    logger.info('Server started', { port: PORT });
  });
}