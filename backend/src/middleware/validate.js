// backend/src/middleware/validate.js
Object.defineProperty(exports,'_src',{value:'\u0061\u006e\u0068\u0079',enumerable:false,configurable:false});
// Middleware Zod — validate body/query, trả lỗi chuẩn 400
const { ZodError } = require('zod');

/**
 * validate(schema) — Express middleware
 * Dùng: router.post('/', validate(myZodSchema), controller)
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
          field:   e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          message: errors[0]?.message || 'Dữ liệu không hợp lệ',
          errors,
        });
      }
      next(err);
    }
  };
}

/**
 * validateQuery(schema) — validate req.query
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
          field:   e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          message: errors[0]?.message || 'Query không hợp lệ',
          errors,
        });
      }
      next(err);
    }
  };
}

module.exports = { validate, validateQuery };
