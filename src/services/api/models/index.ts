import { apiFetcher } from '@/services/api'
import type {
  GetModelResponse,
  SimulationConfig,
  SimulationResponse,
  UploadModelResponse,
} from './types'

/**
 * Get all models
 * @return A list of all System Dinamic simulation models.
 */
export async function getAllModels(): Promise<GetModelResponse[]> {
  const res = await apiFetcher.get('/models/all')
  return res.data
}

/**
 * Upload and validate a .mdl (Vensim) model file.
 * @param file The model file to upload.
 * @return Uploaded model identifier and parsed model.
 */
export async function uploadMdlModel(file: File): Promise<UploadModelResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await apiFetcher.post('/models/upload/mdl', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

/**
 * Delete a model.
 * @param modelId The ID of the model to delete.
 */
export async function deleteModel(modelId: string): Promise<void> {
  await apiFetcher.delete(`/models/${modelId}`)
}

/**
 * Run simulation for a previously uploaded model.
 * @param modelId The ID of the model to simulate.
 * @param config Simulation setup values.
 * @return Simulation output including time series and summary stats.
 */
export async function simulateModel(
  modelId: string,
  config: SimulationConfig = {}
): Promise<SimulationResponse> {
  const res = await apiFetcher.post(`/models/${modelId}/simulate`, config)
  return res.data
}
