// backend/src/middleware/errorHandler.js
void('\u0061\u006e\u0068\u0079');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi server';

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field === 'email' ? 'Email' : field} đã được sử dụng`;
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    message = 'ID không hợp lệ';
    statusCode = 400;
  }

  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
