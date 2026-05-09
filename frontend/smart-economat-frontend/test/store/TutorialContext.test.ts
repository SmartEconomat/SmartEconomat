// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
  isBooleanTrue,
  isTutorialGloballyCompleted,
  TUTORIAL_COMPLETED_PREFERENCE_KEY,
} from '../../src/store/tutorial.persistence';

describe('TutorialContext helpers', () => {
  it('isBooleanTrue acepta true boolean y string true', () => {
    expect(isBooleanTrue(true)).toBe(true);
    expect(isBooleanTrue('true')).toBe(true);
    expect(isBooleanTrue(false)).toBe(false);
    expect(isBooleanTrue('false')).toBe(false);
    expect(isBooleanTrue(undefined)).toBe(false);
  });

  it('isTutorialGloballyCompleted detecta preferencia global completada', () => {
    expect(
      isTutorialGloballyCompleted({
        [TUTORIAL_COMPLETED_PREFERENCE_KEY]: true,
      })
    ).toBe(true);

    expect(
      isTutorialGloballyCompleted({
        [TUTORIAL_COMPLETED_PREFERENCE_KEY]: 'true',
      })
    ).toBe(true);

    expect(
      isTutorialGloballyCompleted({
        [TUTORIAL_COMPLETED_PREFERENCE_KEY]: false,
      })
    ).toBe(false);

    expect(isTutorialGloballyCompleted({})).toBe(false);
  });
});
