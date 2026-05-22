import { useState } from 'react'
import type { AdvisorFormState } from '../types'

type AdvisorPanelProps = {
  advisorForm: AdvisorFormState
  updAdvisor: (field: keyof AdvisorFormState, value: any) => void
  advisorSolution: any | null
  generateAdvisor: (changeDescription?: string) => void
}

export function AdvisorPanel({
  advisorForm,
  updAdvisor,
  advisorSolution,
  generateAdvisor,
}: AdvisorPanelProps) {
  return (
    <div style={{ padding: 16, color: '#e6edf3', fontSize: 12 }}>
      AdvisorPanel placeholder — props received ✓
    </div>
  )
}
