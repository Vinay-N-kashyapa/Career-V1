'use client';
import { useEffect } from 'react';
import { installFetchInterceptor } from '@/lib/fetchInterceptor';

export default function FetchInterceptorInstaller() {
  useEffect(() => { installFetchInterceptor(); }, []);
  return null;
}
