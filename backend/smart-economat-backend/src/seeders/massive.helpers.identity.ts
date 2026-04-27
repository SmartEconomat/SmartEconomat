import { SeedContext } from './seed-context';
import { collectStateFromResponse } from './massive.helpers.state-collection';
import {
  isRecord,
  normalizeIdentityValue,
  toEntityArray,
} from './massive.helpers.common';

export function findUserIdInResponseByIdentity(
  response: unknown,
  identity: { email?: string; username?: string }
): string | null {
  const expectedEmail = normalizeIdentityValue(identity.email);
  const expectedUsername = normalizeIdentityValue(identity.username);

  for (const entity of toEntityArray(response)) {
    const nestedUser = isRecord(entity.user) ? entity.user : null;

    const emailCandidates = [
      normalizeIdentityValue(entity.email),
      normalizeIdentityValue(entity.userEmail),
      normalizeIdentityValue(nestedUser?.email),
    ];

    const usernameCandidates = [
      normalizeIdentityValue(entity.username),
      normalizeIdentityValue(entity.userUsername),
      normalizeIdentityValue(nestedUser?.username),
    ];

    const emailMatches =
      expectedEmail.length > 0 && emailCandidates.includes(expectedEmail);
    const usernameMatches =
      expectedUsername.length > 0 &&
      usernameCandidates.includes(expectedUsername);

    if (!emailMatches && !usernameMatches) {
      continue;
    }

    const candidateIds = [entity.id, entity.userId, nestedUser?.id];
    for (const id of candidateIds) {
      if (typeof id === 'string' && id.trim().length > 0) {
        return id;
      }
    }
  }

  return null;
}

export function findProfesorIdByUserId(
  response: unknown,
  userId: string
): string | null {
  for (const entity of toEntityArray(response)) {
    if (typeof entity.id !== 'string' || entity.id.trim().length === 0) {
      continue;
    }

    if (entity.userId === userId) {
      return entity.id;
    }

    const nestedUser = isRecord(entity.user) ? entity.user : null;
    if (nestedUser?.id === userId) {
      return entity.id;
    }
  }

  return null;
}

export function extractClassCodeFromResponse(response: unknown): string | null {
  for (const entity of toEntityArray(response)) {
    const classCode = entity.codigoClase || entity.codigoSlot;
    if (typeof classCode === 'string' && classCode.trim().length > 0) {
      return classCode;
    }
  }

  return null;
}

export async function activateUserByIdentity(
  context: SeedContext,
  adminToken: string,
  identity: { email?: string; username?: string }
): Promise<string> {
  for (let page = 1; page <= 8; page++) {
    const usersResponse = await context.requestJson<unknown>(
      `/usuarios?limit=50&page=${page}&sortBy=createdAt&order=DESC`,
      {
        method: 'GET',
        tokenOverride: adminToken,
      }
    );

    collectStateFromResponse(context, '/usuarios', usersResponse);

    const userId = findUserIdInResponseByIdentity(usersResponse, identity);
    if (!userId) {
      continue;
    }

    await context.requestJson<unknown>(`/admin/users/${userId}/activate`, {
      method: 'PATCH',
      body: {
        active: true,
      },
      tokenOverride: adminToken,
    });

    return userId;
  }

  const identityLabel = identity.email || identity.username || 'desconocido';
  throw new Error(
    `[seed-massive] Could not localizar usuario para activar (${identityLabel})`
  );
}

export async function setUserRoleForSeed(
  context: SeedContext,
  adminToken: string,
  userId: string,
  role: string
): Promise<void> {
  context.setAccessToken(adminToken);

  await context.requestJson<unknown>(`/usuarios/${userId}/rol`, {
    method: 'PATCH',
    body: {
      rol: role,
    },
  });
}
