'use client'
// components/ui/WhatsAppButton.tsx
import { MessageCircle } from 'lucide-react'

const PHONE = '525574818256'
const MESSAGE = '¡Hola Profe Diego! Me interesa saber más sobre los cursos de admisión.'

export default function WhatsAppButton() {
  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5b] rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
    >
      {/* Pulso verde */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
      <MessageCircle size={26} fill="white" stroke="white" />
    </a>
  )
}
