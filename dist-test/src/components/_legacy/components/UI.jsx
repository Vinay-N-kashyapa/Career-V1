"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Btn = Btn;
exports.Card = Card;
exports.Input = Input;
exports.Select = Select;
exports.Modal = Modal;
exports.Spinner = Spinner;
exports.EmptyState = EmptyState;
exports.Badge = Badge;
exports.ConfirmModal = ConfirmModal;
exports.Textarea = Textarea;
function Btn({ children, onClick, className, disabled, type }) { return (<button type={type || 'button'} onClick={onClick} className={className} disabled={disabled}>{children}</button>); }
function Card({ children, className }) { return <div className={className}>{children}</div>; }
function Input({ value, onChange, placeholder, type, className }) { return <input value={value} onChange={onChange} placeholder={placeholder} type={type || 'text'} className={className}/>; }
function Select({ value, onChange, children, className }) { return <select value={value} onChange={onChange} className={className}>{children}</select>; }
function Modal({ children, show }) { return show ? <div>{children}</div> : null; }
function Spinner() { return <div>Loading...</div>; }
function EmptyState({ title, desc }) { return <div><div>{title}</div><div>{desc}</div></div>; }
function Badge({ children }) { return <span>{children}</span>; }
function ConfirmModal({ show, onConfirm, onCancel, message }) { return show ? <div><p>{message}</p><button onClick={onConfirm}>Yes</button><button onClick={onCancel}>No</button></div> : null; }
function Textarea({ value, onChange, placeholder, className }) { return <textarea value={value} onChange={onChange} placeholder={placeholder} className={className}/>; }
