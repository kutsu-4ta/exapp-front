import { redirect } from 'next/navigation'
import { todayString } from '@/types/workspace'

export default function WorkspacePage() {
  redirect(`/workspace/${todayString()}`)
}
