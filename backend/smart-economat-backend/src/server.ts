import express from 'express';
import { languageDetector } from './middlewares/languageDetector';
import { loginController } from './controllers/authController';

/**
 * @module server
 * Servidor Express independiente que expone los endpoints de autenticación
 * con soporte i18n.
 *
 * El idioma se detecta automáticamente mediante `languageDetector`:
 * prioridad `?lang=` → `Accept-Language` → `es`.
 */

const app = express();

app.use(express.json());
app.use(languageDetector);

app.post('/api/login', loginController);

/**
 * Inicia el servidor en el puerto 3000.
 *
 * @returns {void}
 */
app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});
