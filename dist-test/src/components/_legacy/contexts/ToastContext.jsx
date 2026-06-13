"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useToast = void 0;
const react_1 = require("react");
const ToastContext = (0, react_1.createContext)({});
const useToast = () => (0, react_1.useContext)(ToastContext);
exports.useToast = useToast;
exports.default = ToastContext;
