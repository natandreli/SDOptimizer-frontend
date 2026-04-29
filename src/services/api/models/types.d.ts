export interface ModelVariable {
  name: string
  type: string
  equation: string
  unit: string
  initial_value?: number | null
  description: string
  inflows: string[]
  outflows: string[]
}

export interface ModelSchema {
  file_name: string
  uploaded_at: string
  parsed_with: string
  format: string
  stocks: ModelVariable[]
  flows: ModelVariable[]
  parameters: ModelVariable[]
  auxiliaries: ModelVariable[]
}

export interface GetModelResponse {
  model_id: string
  model?: ModelSchema | null
}

export interface UploadModelResponse {
  model_id: string
  model?: ModelSchema | null
}

export interface SimulationConfig {
  dt?: number
  total_time?: number
  parameter_overrides?: Record<string, number>
}

export interface VariableSummaryStats {
  mean: number
  min: number
  max: number
  initial: number
  final: number
  [key: string]: number
}

export interface SimulationResult {
  time_series: Record<string, number[]>
  summary_stats: Record<string, VariableSummaryStats>
  steps_executed: number
  config: SimulationConfig
}

export interface SimulationResponse {
  result: SimulationResult
}

export interface OptimizationConfig {
  parameter_names: string[]
  initial_values: number[]
  bounds: Array<[number, number]>
  rho_factors: number[]
  epsilon: number
  max_runs: number
  target_variable: string
  statistic: 'final' | 'mean' | 'max' | 'min'
  direction: 'maximize' | 'minimize'
}

export interface OptimizationParameterOption {
  name: string
  initial_value: number
  suggested_bounds: [number, number]
  suggested_rho_factor: number
}

export interface OptimizationDefaults {
  epsilon: number
  max_runs: number
  statistic: 'final' | 'mean' | 'max' | 'min'
  direction: 'maximize' | 'minimize'
}

export interface OptimizationOptions {
  parameters: OptimizationParameterOption[]
  target_variables: string[]
  statistics: Array<'final' | 'mean' | 'max' | 'min'>
  directions: Array<'maximize' | 'minimize'>
  defaults: OptimizationDefaults
}

export interface OptimizationHistory {
  rewards: number[]
  best_rewards: number[]
  parameters: number[][]
  actions: number[][]
}

export interface OptimizationResult {
  best_parameters: Record<string, number>
  best_score: number
  history: OptimizationHistory
}

export interface OptimizationResponse {
  result: OptimizationResult | null
}

export interface OptimizationOptionsResponse {
  options: OptimizationOptions
}
