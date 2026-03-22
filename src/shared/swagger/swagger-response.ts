export function buildSuccessResponseSchema<T>(dataExample: T, msg = 'success') {
  return {
    schema: {
      example: {
        code: 200,
        msg,
        data: dataExample
      }
    }
  };
}
