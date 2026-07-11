const ApiError = require("../utils/ApiError");

function validate(schema) {
  return (req, res, next) => {
    const data = {};
    const errors = [];

    for (const [key, zodSchema] of Object.entries(schema)) {
      const result = zodSchema.safeParse(req[key]);
      if (!result.success) {
        errors.push(
          ...result.error.errors.map((e) => ({
            field: `${key}.${e.path.join(".")}`,
            message: e.message,
          }))
        );
      } else {
        data[key] = result.data;
      }
    }

    if (errors.length > 0) {
      return next(new ApiError(400, "Validation failed", errors));
    }

    req.validated = data;
    next();
  };
}

module.exports = validate;
