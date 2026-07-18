exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'pong',
      path: event.path,
      method: event.httpMethod,
    }),
  };
};
