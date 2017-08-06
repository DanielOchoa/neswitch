module.exports = {
  "extends": [
    "eslint:recommended",
    "airbnb"
  ],
  "rules": {
    "no-console": "off"
  },
  "env": {
    "es6": true
  },
  "settings": {
    "import/resolver": {
      "node": {
        "paths": ["./src"]
      }
    }
  }
};