import express from 'express';
import { languageDetector } from './middlewares/languageDetector';
import { loginController } from './controllers/authController';

/**
 * Documentación en español.
 */

const app = express();

app.use(express.json());
app.use(languageDetector);

app.post('/api/login', loginController);

/**
 * Documentación en español.
 */
app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});
