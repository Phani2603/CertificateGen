export interface CertificateField {
  id: string
  name: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fontWeight: number
  color: string
  alignment: "left" | "center" | "right"
  maxWidth?: number
}

export type EmailProvider = "resend" | "gmail"
export type SendingMode = "sequential" | "pooled"
