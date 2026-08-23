const path = require('path');
const YAML = require('yaml');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');

const spec = YAML.parse(fs.readFileSync(path.join(__dirname, '../openapi.yaml'), 'utf8'));

function mountDocs(app) {
  app.get('/docs/openapi.json', (req, res) => res.json(spec));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
}

module.exports = { mountDocs, spec };
