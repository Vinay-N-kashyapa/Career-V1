"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// Initialize client with fallback placeholder to ensure zero compile crashes if variables are unset
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl || 'https://placeholder-project.supabase.co', supabaseAnonKey || 'placeholder-anon-key');
