'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'AppDataSource', {
  enumerable: true,
  get: function () {
    return AppDataSource;
  },
});
const _typeorm = require('typeorm');
const _databaseconfig = require('./database.config');
const AppDataSource = new _typeorm.DataSource(_databaseconfig.dbConfig);
