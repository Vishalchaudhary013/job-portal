import { useToast } from "../hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"

import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          
          <div className="flex items-start gap-3">

            {/* ICONS */}
            {variant === "success" && (
              <CheckCircle className="text-green-600 mt-1" size={18} />
            )}
            {variant === "destructive" && (
              <XCircle className="text-red-600 mt-1" size={18} />
            )}
            {variant === "warning" && (
              <AlertTriangle className="text-yellow-600 mt-1" size={18} />
            )}

            {/* TEXT */}
            <div className="grid gap-1">
              {title && (
                <ToastTitle className="text-sm font-semibold">
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-xs opacity-80">
                  {description}
                </ToastDescription>
              )}
            </div>
          </div>

          {action}
          <ToastClose />
        </Toast>
      ))}

      {/* 🔥 POSITION + Z INDEX FIX */}
      <ToastViewport className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-[350px] max-w-full" />
    </ToastProvider>
  )
}