"use client";
import { useState, type ComponentProps } from "react";

export function PasswordInput(props: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return <div className="password-field">
    <input {...props} type={visible ? "text" : "password"} />
    <button type="button" className="password-toggle" aria-controls={props.id} aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "숨기기" : "보기"}</button>
  </div>;
}
