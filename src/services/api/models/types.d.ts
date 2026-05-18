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

export interface SimulationParameterOption {
  name: string
  initial_value: number
}

export interface SimulationOptions {
  parameters: SimulationParameterOption[]
  defaults: {
    dt: number
    total_time: number
  }
}

export interface SimulationOptionsResponse {
  options: SimulationOptions
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
  dt?: number
  total_time?: number
  final_time?: number
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
  dt?: number
  total_time?: number
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

export interface ParameterChange {
  initial_value: number
  optimized_value: number
  change_percentage: number
}

export interface OptimizationConfigSummary {
  target_variable: string
  statistic: string
  direction: string
  max_runs: number
  epsilon: number
}

export interface OptimizationResult {
  best_parameters: Record<string, number>
  best_score: number
  history: OptimizationHistory
  initial_parameters: Record<string, number>
  initial_score: number
  improvement_percentage: number
  parameter_changes: Record<string, ParameterChange>
  config_summary: OptimizationConfigSummary
  steps_per_simulation?: number
  total_mathematical_steps?: number
}

export interface OptimizationResponse {
  result: OptimizationResult | null
}

export interface OptimizationOptionsResponse {
  options: OptimizationOptions
}

export interface SimulationParameterOption {
  name: string
  initial_value: number
}

export interface SimulationDefaults {
  dt: number
  total_time: number
}

export interface SimulationOptions {
  parameters: SimulationParameterOption[]
  defaults: SimulationDefaults
}

export interface SimulationOptionsResponse {
  options: SimulationOptions
}
