"use strict";
// apps/web/src/app/layout.tsx
// Self-hosted fonts via next/font/google — zero external DNS, no FOUT.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewport = exports.metadata = void 0;
exports.default = RootLayout;
require("../styles/globals.css");
const google_1 = require("next/font/google");
const script_1 = __importDefault(require("next/script"));
const AuthContext_1 = require("@/lib/context/AuthContext");
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const AppShell_1 = __importDefault(require("@/components/ui/AppShell"));
const ToastManager_1 = __importDefault(require("@/components/ui/ToastManager"));
const client_1 = require("@/lib/query/client");
const FetchInterceptorInstaller_1 = __importDefault(require("@/components/ui/FetchInterceptorInstaller"));
// ✅ Fix
const bricolage = (0, google_1.Bricolage_Grotesque)({
    subsets: ['latin'],
    weight: ['500', '700', '800'],
    variable: '--font-display',
    display: 'swap',
    preload: true,
});
const inter = (0, google_1.Inter)({
    subsets: ['latin'], weight: ['400', '500', '600', '700'],
    variable: '--font-body', display: 'swap', preload: true,
});
const jetbrainsMono = (0, google_1.JetBrains_Mono)({
    subsets: ['latin'], weight: ['400', '500', '600'],
    variable: '--font-mono', display: 'swap', preload: false,
});
exports.metadata = {
    title: { default: 'PinIT Career OS', template: '%s · PinIT' },
    description: 'AI-powered career intelligence. Build your Career DNA, ace ATS, complete missions, and get hired faster.',
    keywords: ['career', 'AI resume', 'ATS score', 'career DNA', 'job matching', 'interview prep'],
    openGraph: { type: 'website', siteName: 'PinIT Career OS', title: 'PinIT — The AI Career Operating System' },
    twitter: { card: 'summary_large_image', title: 'PinIT — The AI Career Operating System' },
};
exports.viewport = { width: 'device-width', initialScale: 1, themeColor: '#4f46e5' };
function RootLayout({ children }) {
    return (<html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%234f46e5'/><text y='.9em' font-size='60' x='15' fill='white' font-family='sans-serif' font-weight='800'>Pi</text></svg>"/>
      </head>
      <body>
        <script_1.default src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload"/>
        <FetchInterceptorInstaller_1.default />
        <client_1.QueryProvider>
          <AuthContext_1.AuthProvider>
            <CareerOSContext_1.CareerOSProvider>
              <AppShell_1.default>{children}</AppShell_1.default>
              <ToastManager_1.default />
            </CareerOSContext_1.CareerOSProvider>
          </AuthContext_1.AuthProvider>
        </client_1.QueryProvider>
      </body>
    </html>);
}
