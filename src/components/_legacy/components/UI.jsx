export function Btn({children,onClick,className,disabled,type}){return(<button type={type||'button'} onClick={onClick} className={className} disabled={disabled}>{children}</button>)}
export function Card({children,className}){return <div className={className}>{children}</div>}
export function Input({value,onChange,placeholder,type,className}){return <input value={value} onChange={onChange} placeholder={placeholder} type={type||'text'} className={className}/>}
export function Select({value,onChange,children,className}){return <select value={value} onChange={onChange} className={className}>{children}</select>}
export function Modal({children,show}){return show?<div>{children}</div>:null}
export function Spinner(){return <div>Loading...</div>}
export function EmptyState({title,desc}){return <div><div>{title}</div><div>{desc}</div></div>}
export function Badge({children}){return <span>{children}</span>}
export function ConfirmModal({show,onConfirm,onCancel,message}){return show?<div><p>{message}</p><button onClick={onConfirm}>Yes</button><button onClick={onCancel}>No</button></div>:null}
export function Textarea({value,onChange,placeholder,className}){return <textarea value={value} onChange={onChange} placeholder={placeholder} className={className}/>}
