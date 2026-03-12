"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get NormalizeArray () {
        return NormalizeArray;
    },
    get NormalizeBoolean () {
        return NormalizeBoolean;
    },
    get NormalizeDate () {
        return NormalizeDate;
    },
    get NormalizeNumber () {
        return NormalizeNumber;
    },
    get NormalizeString () {
        return NormalizeString;
    },
    get ToLowercase () {
        return ToLowercase;
    },
    get ToUppercase () {
        return ToUppercase;
    },
    get Trim () {
        return Trim;
    }
});
const _classtransformer = require("class-transformer");
const _trimstringtransformer = require("../transformers/trim-string.transformer");
const _uppercasestringtransformer = require("../transformers/uppercase-string.transformer");
const _lowercasestringtransformer = require("../transformers/lowercase-string.transformer");
const _stringtonumbertransformer = require("../transformers/string-to-number.transformer");
const _stringtobooleantransformer = require("../transformers/string-to-boolean.transformer");
const _stringtodatetransformer = require("../transformers/string-to-date.transformer");
const _normalizearraytransformer = require("../transformers/normalize-array.transformer");
function NormalizeString(options) {
    return (0, _classtransformer.Transform)((params)=>{
        const { trim = true, uppercase = false, lowercase = false } = options || {};
        let value = params.value;
        if (value == null) return value;
        if (typeof value !== 'string') return value;
        if (trim) {
            value = value.trim();
        }
        if (uppercase) {
            value = value.toUpperCase();
        }
        if (lowercase) {
            value = value.toLowerCase();
        }
        return value;
    });
}
function Trim() {
    return (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform);
}
function ToUppercase() {
    return (0, _classtransformer.Transform)(_uppercasestringtransformer.UppercaseStringTransformer.transform);
}
function ToLowercase() {
    return (0, _classtransformer.Transform)(_lowercasestringtransformer.LowercaseStringTransformer.transform);
}
function NormalizeNumber() {
    return (0, _classtransformer.Transform)(_stringtonumbertransformer.StringToNumberTransformer.transform);
}
function NormalizeBoolean() {
    return (0, _classtransformer.Transform)(_stringtobooleantransformer.StringToBooleanTransformer.transform);
}
function NormalizeDate() {
    return (0, _classtransformer.Transform)(_stringtodatetransformer.StringToDateTransformer.transform);
}
function NormalizeArray() {
    return (0, _classtransformer.Transform)(_normalizearraytransformer.NormalizeArrayTransformer.transform);
}

//# sourceMappingURL=normalize.decorator.js.map