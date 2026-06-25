export const DEFAULT_SERVICE_TASKS = [
  {
    name: 'Oil change',
    description: 'Drain old engine oil, refill the recommended grade, and inspect for leaks.'
  },
  {
    name: 'Brake pad replacement',
    description: 'Inspect brake pad wear and replace worn pads with genuine parts when required.'
  },
  {
    name: 'Chain lubrication',
    description: 'Clean, lubricate, and adjust drive chain tension.'
  },
  {
    name: 'General inspection',
    description: 'Inspect lights, tyres, controls, fluids, and roadworthiness checkpoints.'
  }
] as const;

export const TASK_WORKFLOW_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;

export type TaskWorkflowStatus = (typeof TASK_WORKFLOW_STATUSES)[number];
