"use client"

import { ComponentProps } from "react"

import ReactDOM from "react-dom"
const useFormStatus = (
    ReactDOM as any as {
        experimental_useFormStatus: () => {
            pending: boolean;
            data: FormData | null;
            method: 'get' | 'post' | null;
            action: ((formData: FormData) => Promise<void>) | null;
        }
    }
).experimental_useFormStatus;

type FormSubmitButtonProps = {
    children: React.ReactNode,
    className?: string,
} & ComponentProps<"button">

export default function FormSubmitButton(
    { children, className, ...props }: FormSubmitButtonProps
) {
    const { pending } = useFormStatus()

    return (
        <button
            {...props}
            className={`btn btn-primary ${className}`}
            type="submit"
            disabled={pending}
        >
            {pending && <span className="loading loading-spinner" />}
            {children}
        </button>
    )
}
