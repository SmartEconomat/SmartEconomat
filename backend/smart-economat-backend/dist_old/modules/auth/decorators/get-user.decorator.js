"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "GetUser", {
    enumerable: true,
    get: function() {
        return GetUser;
    }
});
const _common = require("@nestjs/common");
const GetUser = (0, _common.createParamDecorator)((data, ctx)=>{
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
});

//# sourceMappingURL=get-user.decorator.js.map