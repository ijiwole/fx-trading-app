"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FxController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const fx_service_1 = require("./fx.service");
const swagger_1 = require("@nestjs/swagger");
let FxController = class FxController {
    fxService;
    constructor(fxService) {
        this.fxService = fxService;
    }
    async getAllRates() {
        return {
            rates: await this.fxService.getAllRates(),
        };
    }
    async getRate(from, to) {
        const rate = await this.fxService.getRate(from.toUpperCase(), to.toUpperCase());
        return {
            from: from.toUpperCase(),
            to: to.toUpperCase(),
            rate,
        };
    }
};
exports.FxController = FxController;
__decorate([
    (0, common_1.Get)('rates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available FX rates' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns all available exchange rates',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FxController.prototype, "getAllRates", null);
__decorate([
    (0, common_1.Get)('rates/:from/:to'),
    (0, swagger_1.ApiOperation)({ summary: 'Get exchange rate between two currencies' }),
    (0, swagger_1.ApiParam)({
        name: 'from',
        description: 'Source currency code (e.g., USD)',
        example: 'USD',
    }),
    (0, swagger_1.ApiParam)({
        name: 'to',
        description: 'Target currency code (e.g., EUR)',
        example: 'EUR',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns the exchange rate between two currencies',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid currency codes',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
    }),
    __param(0, (0, common_1.Param)('from')),
    __param(1, (0, common_1.Param)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FxController.prototype, "getRate", null);
exports.FxController = FxController = __decorate([
    (0, swagger_1.ApiTags)('fx'),
    (0, common_1.Controller)('fx'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [fx_service_1.FxService])
], FxController);
//# sourceMappingURL=fx.controller.js.map