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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertCurrencyDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class ConvertCurrencyDto {
    sourceCurrency;
    targetCurrency;
    amount;
}
exports.ConvertCurrencyDto = ConvertCurrencyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Source currency to convert from',
        enum: ['NGN', 'USD', 'EUR', 'GBP'],
        example: 'USD',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['NGN', 'USD', 'EUR', 'GBP'], {
        message: 'Source currency must be one of NGN, USD, EUR, GBP',
    }),
    __metadata("design:type", String)
], ConvertCurrencyDto.prototype, "sourceCurrency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Target currency to convert to',
        enum: ['NGN', 'USD', 'EUR', 'GBP'],
        example: 'EUR',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['NGN', 'USD', 'EUR', 'GBP'], {
        message: 'Target currency must be one of NGN, USD, EUR, GBP',
    }),
    __metadata("design:type", String)
], ConvertCurrencyDto.prototype, "targetCurrency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Amount to convert from source currency',
        minimum: 0.01,
        example: 100.0,
    }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 8 }, { message: 'Amount must be a number with at most 8 decimal places' }),
    (0, class_validator_1.Min)(0.01, { message: 'Amount must be at least 0.01' }),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    __metadata("design:type", Number)
], ConvertCurrencyDto.prototype, "amount", void 0);
//# sourceMappingURL=convert-currency.dto.js.map