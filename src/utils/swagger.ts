import swaggerAutogen from 'swagger-autogen';
const doc = {
  swagger: '2.0',
  openapi: '3.1.0',
  info: {
    title: 'CozyNest API',
    description: 'Simple API with Node.js, TypeScript, Express, and Swagger',
    version: '1.0.0',
  },
  host: 'localhost:8888',
  schemes: ['http'],
  tags: [
    { name: 'Authentication', description: 'Endpoints for authentication' },
    { name: 'User', description: 'User-related endpoints' },
    { name: 'Product', description: 'Product-related endpoints' },
  ],
  securityDefinitions: {
    Bearer: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Enter your Bearer token in the format: Bearer <token>',
    },
  },
  definitions: {},
  paths: {},
  apis: ['./src/routes/*.ts'],
};

const outputFile = '../../docs/swagger-output.json';
const endpointsFiles = [
  './src/routes/authentication.route.ts',
  './src/routes/cart.route.ts',
  './src/routes/categories.route.ts',
  './src/routes/coupon.route.ts',
  './src/routes/index.ts',
  './src/routes/mail.route.ts',
  './src/routes/option.router.ts',
  './src/routes/optionalValue.route.ts',
  './src/routes/order.route.ts',
  './src/routes/payment.route.ts',
  './src/routes/products.route.ts',
  './src/routes/shipment.route.ts',
  './src/routes/upload.route.ts',
  './src/routes/user.route.ts',
  './src/routes/variant.router.ts',
];

const generateSwaggerDoc = async () => {
  swaggerAutogen(outputFile, endpointsFiles, doc);
};

generateSwaggerDoc();
