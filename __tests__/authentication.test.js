const request = require('supertest');
const fs = require('fs');
const server = 'http://localhost:8680';
const configuration = require('../devops/configuration.json');

describe('Configuration file', () => {
  it('should have 600 permissions code', async () => {
    changePermissions('./devops/configuration.json', 0o644);
    const action = 'create-text-txt'
    const randomString = Math.random().toString(36).substring(7);
    const content = {
      randomString
    }
    const response = await request(server)
    .post('/execute')
    .send({ action, content })
    .set('Authorization', configuration[action].token)
    .set('Accept', 'application/json');
    try {
      fs.readFileSync('./__tests__/test_support/text.txt', 'utf-8');
      changePermissions('./devops/configuration.json', 0o600);
      throw new Error('Configuration file test failed')
    } catch (error) {
      changePermissions('./devops/configuration.json', 0o600);
      expect(response.statusCode).toEqual(401);
      expect(response.body.error).toEqual('Configuration file does not have 600 permissions code in filesystem');
    }
  });
});

const changePermissions = (path, permissions) => {
  fs.chmodSync(path, permissions);
}