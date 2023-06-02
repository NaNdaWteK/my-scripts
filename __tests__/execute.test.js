const request = require('supertest');
const fs = require('fs');
const server = 'http://localhost:8680';
const configuration = require('../devops/configuration.json');

describe('My script', () => {
  it('has POST /execute', async () => {
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

      let data
      const allFileContents = fs.readFileSync('./__tests__/test_support/text.txt', 'utf-8');
      allFileContents.split(/\r?\n/).forEach((line, index) =>  {
        if (index === 0) data = line
      });
    expect(data).toEqual(randomString);
    expect(response.statusCode).toEqual(200);
    expect(response.body.action).toEqual(action);
    await fs.unlinkSync('./__tests__/test_support/text.txt');
  });
  it('has not other endpoints', async () => {
    const action = 'deploy-billar-app'

    const response = await request(server)
      .post('/executed')
      .send({ action })
      .set('Accept', 'application/json');

    expect(response.statusCode).toEqual(404);
  });
  it('action not exists', async () => {
    const action = 'deploy-billar-api'

    const response = await request(server)
      .post('/execute')
      .send({ action })
      .set('Accept', 'application/json')
      .set('Authorization', 'secret-token')
    
    expect(response.statusCode).toEqual(404);
    expect(response.body.error).toEqual('Action not found');
  })
  it('action has not script in configuration file', async () => {
    const action = 'action-without-script'
    const response = await request(server)
      .post('/execute')
      .send({ action })
      .set('Authorization', 'secret-token')
      .set('Accept', 'application/json');

    expect(response.statusCode).toEqual(404);
    expect(response.body.error).toEqual('Action script property not found');
  });
  it('action script not found', async () => {
    const action = 'action-script-not-found'
    const response = await request(server)
      .post('/execute')
      .send({ action })
      .set('Authorization', 'secret-token')
      .set('Accept', 'application/json');

    expect(response.statusCode).toEqual(404);
    expect(response.body.error).toEqual('Action script not found');
  });
  it('no content passed when execute action', async () => {
    const action = 'create-text-txt'
    const response = await request(server)
      .post('/execute')
      .send({ action })
      .set('Authorization', configuration[action].token)
      .set('Accept', 'application/json');
      
      let data
      const allFileContents = fs.readFileSync('./__tests__/test_support/text.txt', 'utf-8');
      allFileContents.split(/\r?\n/).forEach((line, index) =>  {
        if (index === 0) data = line
      });

    expect(response.statusCode).toEqual(200);
    expect(data).toEqual('');
    await fs.unlinkSync('./__tests__/test_support/text.txt');
  });
});
