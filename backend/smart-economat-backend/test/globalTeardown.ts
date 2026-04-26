/**
 * Documentación en español.
 */

module.exports = async (): Promise<void> => {
  // Nota: Los workers ya limpiaron sus propios recursos
  // Este teardown se ejecuta en el proceso principal de Jest
  // y no tiene acceso a la memoria de los workers
};
