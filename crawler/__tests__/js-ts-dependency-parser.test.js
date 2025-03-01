import { parseVersionText, parseDependenciesFromPackageJson, processTSJSDependencies } from '../app/js-ts-dependency-parser.js';
import { RepoDependencyList } from '../app/repo-dependency-list.js';
import githubClient from '../app/github-client.js';
import {jest} from '@jest/globals'

jest.mock('../app/github-client.js', () => ({
  default: {
    getPackageJson: jest.fn().mockResolvedValue([])
  }
}));

describe('js-ts-dependency-parser', () => {
  describe('parseVersionText', () => {
    test('should handle null or undefined version', () => {
      expect(parseVersionText(null)).toEqual({ 
        version: undefined, 
        minVersion: undefined, 
        maxVersion: undefined 
      });
      expect(parseVersionText(undefined)).toEqual({ 
        version: undefined, 
        minVersion: undefined, 
        maxVersion: undefined 
      });
    });

    test('should handle URLs and file paths', () => {
      const url = 'http://example.com/package.tgz';
      expect(parseVersionText(url)).toEqual({ 
        version: url,
        minVersion: url,
        maxVersion: url
      });
      
      const filePath = 'file:../local-package';
      expect(parseVersionText(filePath)).toEqual({ 
        version: filePath,
        minVersion: filePath,
        maxVersion: filePath
      });
    });

    test('should parse caret versions', () => {
      expect(parseVersionText('^1.2.3')).toEqual({ 
        version: '1.2.3',
        minVersion: '1.2.3',
        maxVersion: '2.0.0'
      });
    });

    test('should parse tilde versions', () => {
      expect(parseVersionText('~2.0.0')).toEqual({ 
        version: '2.0.0',
        minVersion: '2.0.0',
        maxVersion: '2.1.0'
      });
    });

    test('should parse exact versions', () => {
      expect(parseVersionText('1.2.3')).toEqual({ 
        version: '1.2.3',
        minVersion: '1.2.3',
        maxVersion: '1.2.3'
      });
    });

    test('should parse range versions', () => {
      expect(parseVersionText('>=1.0.0 <2.0.0')).toEqual({ 
        version: '1.0.0',
        minVersion: '1.0.0',
        maxVersion: '2.0.0'
      });
    });

    test('should parse or versions', () => {
      expect(parseVersionText("<1.0.0 || >=2.3.1 <2.4.5 || >=2.5.2 <3.0.0")).toEqual({ 
        version: '1.0.0',
        minVersion: '1.0.0',
        maxVersion: '1.0.0'
      });
    });
  });

  describe('parseDependenciesFromPackageJson', () => {
    test('should parse dependencies from package.json', () => {
      const packageJson = {
        dependencies: {
          'react': '^17.0.2',
          'lodash': '~4.17.21',
          'local-pkg': 'file:../local',
          'hosted-pkg': 'http://example.com/pkg.tgz'
        }
      };

      const dependencies = parseDependenciesFromPackageJson(packageJson);
      
      expect(dependencies).toHaveLength(4);
      expect(dependencies[0]).toMatchObject({
        name: 'react',
        provider: 'npm',
        version: '17.0.2',
        minVersion: '17.0.2',
        maxVersion: '18.0.0',
        versionText: '^17.0.2'
      });
      expect(dependencies[1]).toMatchObject({
        name: 'lodash',
        provider: 'npm',
        version: '4.17.21',
        minVersion: '4.17.21',
        maxVersion: '4.18.0',
        versionText: '~4.17.21'
      });
      expect(dependencies[2]).toMatchObject({
        name: 'local-pkg',
        provider: 'npm',
        version: 'file:../local',
        minVersion: 'file:../local',
        maxVersion: 'file:../local',
        versionText: 'file:../local'
      });
    });

    test('should handle empty dependencies', () => {
      const packageJson = {};
      const dependencies = parseDependenciesFromPackageJson(packageJson);
      expect(dependencies).toHaveLength(0);
    });
  });

  describe('processTSJSDependencies', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should process repository dependencies', async () => {
      const mockRepo = {
        id: 1,
        owner: 'testowner',
        name: 'testrepo'
      };

      const mockPackageJsons = [{
        path: 'package.json',
        content: {
          dependencies: {
            'react': '^17.0.2',
            'lodash': '~4.17.21'
          }
        }
      }];

      githubClient.getPackageJson.mockResolvedValue(mockPackageJsons);

      const result = await processTSJSDependencies(mockRepo);

      expect(result).toBeInstanceOf(RepoDependencyList);
      expect(result.id).toBe(mockRepo.id);
      expect(githubClient.getPackageJson).toHaveBeenCalledWith(mockRepo.owner, mockRepo.name);
    });

    test('should skip package.json files in test/sample/example directories', async () => {
      const mockRepo = {
        id: 1,
        owner: 'testowner',
        name: 'testrepo'
      };

      const mockPackageJsons = [{
        path: 'test/package.json',
        content: {
          dependencies: {
            'jest': '^27.0.0'
          }
        }
      }];

      githubClient.getPackageJson.mockResolvedValue(mockPackageJsons);

      const result = await processTSJSDependencies(mockRepo);
      
      expect(result.projects).toHaveLength(0);
    });

    test('should return undefined when no package.json files found', async () => {
      const mockRepo = {
        id: 1,
        owner: 'testowner',
        name: 'testrepo'
      };

      githubClient.getPackageJson.mockResolvedValue([]);

      const result = await processTSJSDependencies(mockRepo);
      
      expect(result).toBeUndefined();
    });
  });
});