const bodyParser = (app, expressJS) => {
  app.use(expressJS.urlencoded({ extended: true }));
  app.use(expressJS.json());
};

module.exports = bodyParser;
