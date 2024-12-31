import swaggerAutogen from 'swagger-autogen';
const doc = {
    swagger: '2.0',
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
      { name: 'Category', description: 'Endpoints for categories' },
      { name: 'Upload', description: 'Endpoints for image uploads' },
      { name: 'Mail', description: 'Endpoints for mail sending' },
      { name: 'Order', description: 'Endpoints for orders' },
      { name: 'Cart', description: 'Endpoints for cart' },
      { name: 'Shipment', description: 'Endpoints for shipment' },
      { name: 'Payment', description: 'Endpoints for payment' },
      { name: 'Option', description: 'Endpoints for product options' },
      { name: 'OptionValue', description: 'Endpoints for option values' },
      { name: 'Variant', description: 'Endpoints for variants' },
      { name: 'Coupon', description: 'Endpoints for coupons' },
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
  },
  outputFile = '../../docs/swagger-output.json',
  endpointsFiles = ['./src/index.ts'],
  generateSwaggerDoc = async () => {
    swaggerAutogen(outputFile, endpointsFiles, doc);
  };

generateSwaggerDoc();
