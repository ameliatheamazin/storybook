import fs from 'fs';
import fse from 'fs-extra';

import * as helpers from './helpers';
import { SupportedLanguage, SupportedRenderers } from './project_types';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));
jest.mock('./dirs', () => ({
  getBaseDir: () => '',
}));

jest.mock('fs-extra', () => ({
  copySync: jest.fn(() => ({})),
  copy: jest.fn(() => ({})),
  ensureDir: jest.fn(() => {}),
  existsSync: jest.fn(),
  pathExists: jest.fn(),
}));

jest.mock('path', () => {
  const path = jest.requireActual('path');
  return {
    // make it return just the second path, for easier testing
    resolve: jest.fn((_, p) => p),
    dirname: path.dirname,
    join: path.join,
  };
});

describe('Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('copyTemplate', () => {
    it(`should copy template files when directory is present`, () => {
      const csfDirectory = `template-csf/`;
      (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
        return true;
      });
      helpers.copyTemplate('');

      const copySyncSpy = jest.spyOn(fse, 'copySync');
      expect(copySyncSpy).toHaveBeenCalledWith(csfDirectory, expect.anything(), expect.anything());
    });

    it(`should throw an error if template directory cannot be found`, () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
        return false;
      });

      expect(() => {
        helpers.copyTemplate('');
      }).toThrowError("Couldn't find template dir");
    });
  });

  it.each`
    language        | exists          | expected
    ${'javascript'} | ${['js', 'ts']} | ${'/js'}
    ${'typescript'} | ${['js', 'ts']} | ${'/ts'}
    ${'typescript'} | ${['js']}       | ${'/js'}
    ${'javascript'} | ${[]}           | ${''}
    ${'typescript'} | ${[]}           | ${''}
  `(
    `should copy $expected when folder $exists exists for language $language`,
    async ({ language, exists, expected }) => {
      const componentsDirectory = exists.map((folder: string) => `frameworks/react/${folder}`);
      const expectedDirectory = `frameworks/react${expected}`;
      (fse.pathExists as jest.Mock).mockImplementation((filePath) => {
        return componentsDirectory.includes(filePath) || filePath === 'frameworks/react';
      });
      await helpers.copyComponents('react', language);

      const copySpy = jest.spyOn(fse, 'copy');
      expect(copySpy).toHaveBeenNthCalledWith(1, expectedDirectory, './stories', expect.anything());
      expect(copySpy).toHaveBeenNthCalledWith(
        2,
        'frameworks/common',
        './stories',
        expect.anything()
      );
    }
  );

  it(`should copy to src folder when exists`, async () => {
    (fse.pathExists as jest.Mock).mockImplementation((filePath) => {
      return filePath === 'frameworks/react' || filePath === './src';
    });
    await helpers.copyComponents('react', SupportedLanguage.JAVASCRIPT);
    expect(fse.copy).toHaveBeenCalledWith(expect.anything(), './src/stories', expect.anything());
  });

  it(`should copy to root folder when src doesn't exist`, async () => {
    (fse.pathExists as jest.Mock).mockImplementation((filePath) => {
      return filePath === 'frameworks/react';
    });
    await helpers.copyComponents('react', SupportedLanguage.JAVASCRIPT);
    expect(fse.copy).toHaveBeenCalledWith(expect.anything(), './stories', expect.anything());
  });

  it(`should throw an error for unsupported framework`, async () => {
    const framework = 'unknown framework' as SupportedRenderers;
    const expectedMessage = `Unsupported framework: ${framework}`;
    await expect(
      helpers.copyComponents(framework, SupportedLanguage.JAVASCRIPT)
    ).rejects.toThrowError(expectedMessage);
  });

  describe('getStorybookVersionSpecifier', () => {
    it(`should return the specifier if storybook lib exists in package.json`, () => {
      expect(
        helpers.getStorybookVersionSpecifier({
          dependencies: {},
          devDependencies: {
            '@storybook/react': '^x.x.x',
          },
        })
      ).toEqual('^x.x.x');
    });

    it(`should throw an error if no package is found`, () => {
      expect(() => {
        helpers.getStorybookVersionSpecifier({
          dependencies: {},
          devDependencies: {
            'something-else': '^x.x.x',
          },
        });
      }).toThrowError("Couldn't find any official storybook packages in package.json");
    });
  });
});
