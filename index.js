const http = require('http');
const https = require('https');
const ExecuteScriptAction = require('./actions/ExecuteScriptAction');
const configuration = require('./devops/configuration.json');
// const options = {
//   key: fs.readFileSync('key.pem'),
//   cert: fs.readFileSync('cert.pem')
// };
const Status = {
  'Not_found': 404,
  'Unauthorized': 401,
  'Success': 200 
}
const ports = {
  Http: 8680,
  Https: 8443
  
}
const httpServer = http.createServer((req, res) => {
  execute(req, res)
});

const httpsServer = https.createServer(options = {}, (req, res) => {
  execute(req, res)
});

httpServer.listen(ports.Http, () => {
  console.log(`Servidor HTTP escuchando en el puerto ${ports.Http}`);
});

httpsServer.listen(ports.Https, () => {
  console.log(`Servidor HTTPS escuchando en el puerto ${ports.Https}`);
});

const execute = (request, response) => {
  if (request.method === 'POST' && request.url === '/execute') {
    let body = '';
    request.on('data', chunk => {
      body += chunk.toString();
    });
    request.on('end', async () => {
      run(body, response);
    });
  } else {
    responseEndpointNotFound(response);
  }
}

function prepareForSuccessResponse(response) {
  writeHeadResponse(response, Status.Success);
}

async function run(body, response) {
  if (body) {
    const { action, content } = JSON.parse(body);
    try {
      await ExecuteScriptAction.run(action, content);
      prepareForSuccessResponse(response);
      writeEndResponse(response, { message: 'Action executed', action })
    } catch (error) {
      const { status, message } = resolveError(action, error);
      writeHeadResponse(response, status);
      writeEndResponse(response, { error: message })
    }
  } else {
    writeEndResponse(response, { error: 'No body passed' });
  }
}

function writeEndResponse(response, result) {
  response.end(JSON.stringify(result));
}
function writeHeadResponse(response, status) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
}
function responseEndpointNotFound(response) {
  writeHeadResponse(response, Status.Not_found)
  writeEndResponse(response, { error: 'Endpoint not found' });
}

function resolveError(action, error) {
  let status = Status.Not_found;
  let message = error.message;
  if (error.message.includes('does not have 600 permissions')) {
    status = Status.Unauthorized;
  } else if (
    scriptNotFoundError(action, error)
  ) {
    message = 'Action script not found'
  }

  return { status, message }
}
function scriptNotFoundError(action, error) {
  return configuration[action] && configuration[action].script &&
    error.message.includes(`spawn ${configuration[action].script} ENOENT`);
}


module.exports = {
  httpServer,
  httpsServer
}