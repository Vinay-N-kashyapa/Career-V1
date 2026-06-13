import { createContext, useContext, useState } from 'react';
const ToastContext = createContext({});
export const useToast = () => useContext(ToastContext);
export default ToastContext;
