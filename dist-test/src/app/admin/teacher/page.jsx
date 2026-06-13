'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TeacherPage;
const dynamic_1 = __importDefault(require("next/dynamic"));
const AuthContext_1 = require("@/lib/context/AuthContext");
const TeacherDashboard = (0, dynamic_1.default)(() => Promise.resolve().then(() => __importStar(require('@/components/_legacy/dsai/TeacherPages'))).then(m => ({ default: m.TeacherDashboard })), { ssr: false, loading: () => <div style={{ padding: 40, color: 'var(--t3)', textAlign: 'center' }}>Loading...</div> });
function TeacherPage() {
    const { user } = (0, AuthContext_1.useAuth)();
    if (!user || !['teacher', 'admin'].includes(user.role))
        return <div style={{ padding: 40, color: 'var(--coral)' }}>Access denied</div>;
    return (<div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>Teacher Panel</h1>
        <p style={{ color: 'var(--t2)', fontSize: 13 }}>Create coding questions, manage exam schedules, view student results</p>
      </div>
      <TeacherDashboard teacher={user} onLogout={() => window.location.href = '/login'}/>
    </div>);
}
