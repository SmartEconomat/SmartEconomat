import express from 'express';
import { languageDetector } from './middlewares/languageDetector';
import { loginController } from './controllers/authController';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

const app = express();

app.use(express.json());
app.use(languageDetector);

app.post('/api/login', loginController);

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});
