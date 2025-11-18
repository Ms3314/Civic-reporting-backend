import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read and parse the OpenAPI YAML file
const openApiPath = join(__dirname, '../openapi.yaml');
const openApiFile = readFileSync(openApiPath, 'utf8');
const swaggerSpec = yaml.load(openApiFile);

export default swaggerSpec;

