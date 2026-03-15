"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "APP_VERSION", {
    enumerable: true,
    get: function() {
        return APP_VERSION;
    }
});
const _fs = require("fs");
const _path = require("path");
let version = '1.0.0';
try {
    const packageJsonPath = (0, _path.join)(process.cwd(), 'package.json');
    const packageJson = JSON.parse((0, _fs.readFileSync)(packageJsonPath, 'utf8'));
    version = packageJson.version || '1.0.0';
} catch  {
    version = '1.0.0';
}
const APP_VERSION = process.env.npm_package_version || version;

//# sourceMappingURL=app-version.helper.js.map