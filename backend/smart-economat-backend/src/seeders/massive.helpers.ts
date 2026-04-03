export {
  consumeRequiredStateValue,
  consumeStateValue,
  getRequiredStateString,
  getStateArray,
  pickRequiredStateValue,
  pickStateValue,
  pushStateValue,
  removeStateValue,
  setStateArray,
} from './massive.state';

export {
  normalizePath,
  normalizeIdentityValue,
  pickByCursor,
  createEnumCoverage,
  markEnum,
  ensureEnumCoverageComplete,
  extractActiveEntityIds,
  isRecord,
  isSoftDeletedEntity,
  listFromResponse,
  toEntityArray,
  extractResourceId,
  extractFilename,
} from './massive.helpers.common';

export {
  findUserIdInResponseByIdentity,
  findProfesorIdByUserId,
  extractClassCodeFromResponse,
  activateUserByIdentity,
  setUserRoleForSeed,
} from './massive.helpers.identity';

export { collectStateFromResponse } from './massive.helpers.state-collection';

export {
  isPublicPath,
  supportsPagination,
  getTargetSuccessForEndpoint,
  isAdminFocusEndpoint,
  chooseTokenForPath,
} from './massive.helpers.routing.tokens';

export {
  resolvePermissionPath,
  resolveAlergenoDeletePath,
} from './massive.helpers.routing.permissions';

export { pickIdForRoute } from './massive.helpers.routing.pick-id';
export { resolvePathParams } from './massive.helpers.routing.path';
export { buildGetPath } from './massive.helpers.get-path';
export { buildBody } from './massive.helpers.body';
