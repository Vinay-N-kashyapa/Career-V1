'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FetchInterceptorInstaller;
const react_1 = require("react");
const fetchInterceptor_1 = require("@/lib/fetchInterceptor");
function FetchInterceptorInstaller() {
    (0, react_1.useEffect)(() => { (0, fetchInterceptor_1.installFetchInterceptor)(); }, []);
    return null;
}
