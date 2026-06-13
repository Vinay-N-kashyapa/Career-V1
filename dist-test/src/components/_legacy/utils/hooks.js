"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLocalStorage = exports.useIsMobile = void 0;
const useIsMobile = () => false;
exports.useIsMobile = useIsMobile;
const useLocalStorage = () => [null, () => { }];
exports.useLocalStorage = useLocalStorage;
