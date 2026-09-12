import {
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from 'lucide-react'

function extensionOf(filename: string): string {
  const parts = filename.split('.')
  if (parts.length < 2) return ''
  return parts[parts.length - 1].toLowerCase()
}

export function FileTypeIcon({ filename, className = 'h-6 w-6' }: { filename: string; className?: string }) {
  const ext = extensionOf(filename)
  let Icon: LucideIcon = File

  if (['pdf'].includes(ext)) Icon = FileText
  else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) Icon = FileImage
  else if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) Icon = FileText
  else if (['xls', 'xlsx', 'csv'].includes(ext)) Icon = FileSpreadsheet
  else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) Icon = FileArchive

  return <Icon className={className} aria-hidden="true" />
}
