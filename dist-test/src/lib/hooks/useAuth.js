"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = void 0;
// apps/web/src/lib/hooks/useAuth.ts
// Re-export from AuthContext for components that import from hooks/
var AuthContext_1 = require("@/lib/context/AuthContext");
Object.defineProperty(exports, "useAuth", { enumerable: true, get: function () { return AuthContext_1.useAuth; } });
