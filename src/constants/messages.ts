export const messagesError = Object.freeze({
  //! Common HTTP status
  //!* 4xx: Client error
  //* 400: Bad request
  BAD_REQUEST: 'Bad request!',
  //* 401: Unauthorized
  UNAUTHORIZED: 'Unauthorized!',
  //* 402: Payment required
  PAYMENT_REQUIRED: 'Payment required!',
  //* 403: Forbidden
  FORBIDDEN: 'Forbidden!',
  //* 404: Not found
  NOT_FOUND: 'Not found!',
  //* 405: Method not allowed
  METHOD_NOT_ALLOWED: 'Method not allowed',
  //* 408: Request timeout
  REQUEST_TIMEOUT: 'Request timeout',
  //* 422: Unprocessable content
  UNPROCESSABLE_CONTENT: 'Unprocessable content',

  //!* 5xx: Server error
  //* 500: Internal server error
  ERROR_SERVER: 'Server error!',
  //* 502: Bad gateway
  BAD_GATEWAY: 'Bad gateway!',
  //* Gateway timeout
  GATEWAY_TIMEOUT: 'Gateway timeout',
  //!Status Custom
  //!* Common
  INVALID_BODY_REQUEST: 'Invalid body request!',
  //!* Auth
  INVALID_EMAIL: 'Invalid email',
  TOKEN_INVALID: 'Token invalid',
  INVALID_PASSWORD: 'Invalid password',
  EMAIL_EXIST: 'Email already exists',
  EMAIL_NOT_FOUND: 'Email not found',
  PASSWORD_NOT_MATCH: 'Password not match',
  PERMISSION_DENIED: 'Permission denied !',
  //!* Profile
  //!* Product
  DELETE_PRODUCT_FAILED: 'Delete product failed!',
  //!* Category
  DELETE_CATEGORY_FAILED: 'Delete category failed!',
  //!* Images
  UPLOAD_IMAGES_FAIL: 'Update images failed!',
  DELETE_IMAGES_FAILED: 'Delete images failed!',
  //!* Cart
  DELETE_CART_FAILED: 'Delete cart failed!',
  //!* Order
  ORDER_FAILED: 'Order failed!',
  ORDER_CANCELED: 'Order cancelled',
});

export const messagesSuccess = Object.freeze({
  //! Common HTTP status
  //!* 2xx: Success response
  //!* 200: OK
  OK: 'OK',
  //!* 201: Created
  CREATED: 'Created',
  //!* 202: Accepted
  ACCEPTED: 'Accepted',
  //!* 204: No Content
  NO_CONTENT: 'No content',
  //!* 3xx : Redirection
  //!* 304: Not modified
  NOT_MODIFIED: 'Not modified',
  // Auth
  REGISTER_SUCCESS: 'Register successfully!',
  LOGIN_SUCCESS: 'Login successfully!',
  RESET_PASSWORD_SUCCESS: 'Reset password successfully!',
  // User
  GET_USER_SUCCESS: 'Get user successfully!',
  CREATE_USER_SUCCESS: 'Get user successfully!',
  UPDATE_USER_SUCCESS: 'Update user successfully!',
  DELETE_USER_SUCCESS: 'Delete user successfully!',
  // Profile
  GET_PROFILE_SUCCESS: 'Get profile successfully!',
  UPDATE_PROFILE_SUCCESS: 'Update profile successfully!',
  // Product
  GET_PRODUCT_SUCCESS: 'Get product successfully!',
  CREATE_PRODUCT_SUCCESS: 'Create product successfully!',
  UPDATE_PRODUCT_SUCCESS: 'Update product successfully!',
  DELETE_PRODUCT_SUCCESS: 'Delete product successfully!',
  // Category
  GET_CATEGORY_SUCCESS: 'Get category successfully!',
  CREATE_CATEGORY_SUCCESS: 'Create category successfully!',
  UPDATE_CATEGORY_SUCCESS: 'Update category successfully!',
  DELETE_CATEGORY_SUCCESS: 'Delete category successfully!',
  // Colors
  GET_COLOR_SUCCESS: 'Get colors successfully!',
  CREATE_COLOR_SUCCESS: 'Create color successfully!',
  UPDATE_COLOR_SUCCESS: 'Update color successfully!',
  DELETE_COLOR_SUCCESS: 'Delete color successfully!',
  // Size
  GET_SIZE_SUCCESS: 'Get size successfully!',
  CREATE_SIZE_SUCCESS: 'Create size successfully!',
  UPDATE_SIZE_SUCCESS: 'Update size successfully!',
  DELETE_SIZE_SUCCESS: 'Delete size successfully!',

  // Images
  GET_IMAGES_SUCCESS: 'Get images successfully!',
  CREATE_IMAGES_SUCCESS: 'Create images successfully!',
  UPDATE_IMAGES_SUCCESS: 'Update images successfully!',
  DELETE_IMAGES_SUCCESS: 'Delete images successfully!',
  // Cart
  GET_CART_SUCCESS: 'Get cart successfully!',
  ADD_CART_SUCCESS: 'Add to cart successfully!',
  UPDATE_CART_SUCCESS: 'Update cart successfully!',
  REMOVE_CART_SUCCESS: 'Delete cart successfully!',
  REMOVE_CART_ITEMS_SUCCESS: 'Delete items in cart successfully!',
  // Order
  GET_ORDER_SUCCESS: 'Get order successfully!',
  CREATE_ORDER_SUCCESS: 'Create order successfully!',
  UPDATE_ORDER_SUCCESS: 'Update order successfully!',
  UPDATE_ORDER_STATUS_SUCCESS: 'Update order status successfully!',
  REMOVE_ORDER_SUCCESS: 'Remove order successfully!',

  ORDER_DONE: 'Order was complete',
  PENDING: 'Order is pending',
  ORDER_CREATE_SUBJECT: 'Order subject created successfully!',
  ORDER_UPDATE_SUBJECT: 'Order subject updated successfully!',
  ORDER_CREATE_MESSAGE: 'Order message created successfully!',
  ORDER_UPDATE_MESSAGE: 'Order message updated successfully!',
  ORDER_SUCCESS_MESSAGE: 'Order message success',

  // Option properties products
  GET_OPTION_SUCCESS: 'Get option successfully!',
  CREATE_OPTION_SUCCESS: 'Create option successfully!',
  UPDATE_OPTION_SUCCESS: 'Update option successfully!',
  DELETE_OPTION_SUCCESS: 'Delete option successfully!',

  // Option properties value products
  GET_OPTION_VALUE_SUCCESS: 'Get option value successfully!',
  CREATE_OPTION_VALUE_SUCCESS: 'Create option value successfully!',
  UPDATE_OPTION_VALUE_SUCCESS: 'Update option value successfully!',
  DELETE_OPTION_VALUE_SUCCESS: 'Delete option value successfully!',

  // Variants products
  GET_VARIANT_SUCCESS: 'Get variant successfully!',
  CREATE_VARIANT_SUCCESS: 'Create variant successfully!',
  UPDATE_VARIANT_SUCCESS: 'Update variant successfully!',
  DELETE_VARIANT_SUCCESS: 'Delete variant successfully!',

  //Token
  CLEAR_TOKEN_SUCCESS: 'Clear token successfully!',
  CHANGE_PASSWORD_SUCCESS: 'Change password successfully!',
  CHECK_TOKEN_SUCCESS: 'Token is valid and not expired !',

  // Review
  GET_REVIEW_SUCCESS: 'Get review successfully!',
  CREATE_REVIEW_SUCCESS: 'Create review successfully!',
  DELETE_REVIEW_SUCCESS: 'Delete review successfully!',

  // Email
  SEND_EMAIL_SUCCESS: 'Send email successfully!',

  //Article
  GET_ARTICLES_SUCCESS: 'Get articles successfully!',
  GET_ARTICLE_SUCCESS: 'Get article successfully!',
  CREATED_ARTICLE_SUCCESS: 'Created article successfully!',
  UPDATE_ARTICLE_SUCCESS: 'Update article successfully!',
  DELETE_ARTICLE_SUCCESS: 'Delete article successfully!',
});
