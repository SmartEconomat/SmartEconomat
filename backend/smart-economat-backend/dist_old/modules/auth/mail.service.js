"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MailService", {
    enumerable: true,
    get: function() {
        return MailService;
    }
});
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let MailService = class MailService {
    async sendPasswordResetEmail(email, resetToken) {
        const recoveryLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        this.logger.log(`\n================= EMAIL SIMULATION =================`);
        this.logger.log(`To: ${email}`);
        this.logger.log(`Subject: Password Reset Request`);
        this.logger.log(`Body: You requested a password reset. Click here to reset your password: ${recoveryLink}`);
        this.logger.log(`If you did not request this, please ignore this email.`);
        this.logger.log(`====================================================\n`);
        return Promise.resolve();
    }
    constructor(){
        this.logger = new _common.Logger(MailService.name);
    }
};
MailService = _ts_decorate([
    (0, _common.Injectable)()
], MailService);

//# sourceMappingURL=mail.service.js.map