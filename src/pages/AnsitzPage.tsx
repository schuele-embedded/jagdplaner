import { useAnsitz } from '@/hooks/useAnsitz'
import { AnsitzStarten } from '@/components/ansitz/AnsitzStarten'
import { AnsitzTimer } from '@/components/ansitz/AnsitzTimer'

export function AnsitzPage() {
  const { isActive } = useAnsitz()
  return isActive ? <AnsitzTimer /> : <AnsitzStarten />
}
