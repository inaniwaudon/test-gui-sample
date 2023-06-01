const path = require("path");

module.exports = (config) => {
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.alias,
      // エイリアスにするパスをココに書く
      "@": path.resolve(__dirname, "./src/"),
    },
  };

  return config;
};
