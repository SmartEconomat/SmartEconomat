/**
 * Jest globalTeardown - runs ONCE in the main Jest process after all workers finish.
 *
 * Since workers are separate processes, this teardown doesn't have access to their memory.
 * Each worker cleans up its own resources when it exits.
 *
 * This file is kept for completeness and future use if needed.
 *
 * @author SmartEconomat Team
 */

module.exports = async (): Promise<void> => {
  // Nota: Los workers ya limpiaron sus propios recursos
  // Este teardown se ejecuta en el proceso principal de Jest
  // y no tiene acceso a la memoria de los workers
};
