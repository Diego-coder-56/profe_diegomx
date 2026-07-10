'use client'
// components/ui/Latex.tsx — renderiza matemáticas con KaTeX
import katex from 'katex'

export default function Latex({ tex, display = false, className = '' }: { tex: string; display?: boolean; className?: string }) {
  let html = ''
  try {
    html = katex.renderToString(tex ?? '', { throwOnError: false, displayMode: display })
  } catch {
    html = (tex ?? '').replace(/[<>&]/g, '')
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
