import type { FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconAdjustments, IconChevronDown, IconPlayerPlay } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { SimulationOptions } from '@/services/api/models/types'

type ModelOption = {
  value: string
  label: string
  subtitle?: string
}

type SimulationSetupFormProps = {
  isModelsLoading: boolean
  modelOptions: ModelOption[]
  selectedModelId: string
  onSelectedModelIdChange: (value: string) => void
  dt: string
  onDtChange: (value: string) => void
  totalTime: string
  onTotalTimeChange: (value: string) => void
  parameterOverrides: Record<string, string>
  onParameterOverridesChange: (value: Record<string, string>) => void
  simulationOptions?: SimulationOptions
  isLoadingOptions?: boolean
  isSubmitting: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export const SimulationSetupForm = ({
  isModelsLoading,
  modelOptions,
  selectedModelId,
  onSelectedModelIdChange,
  dt,
  onDtChange,
  totalTime,
  onTotalTimeChange,
  parameterOverrides,
  onParameterOverridesChange,
  simulationOptions,
  isLoadingOptions,
  isSubmitting,
  isCollapsed,
  onToggleCollapse,
  onSubmit,
}: SimulationSetupFormProps) => {
  const modelPlaceholder = isModelsLoading
    ? 'Loading models...'
    : modelOptions.length === 0
      ? 'No models uploaded yet'
      : 'Select a model...'

  return (
    <Card>
      <CardHeader className={isCollapsed ? 'mb-0' : ''}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Setup</CardTitle>
            <CardDescription>Choose a model and simulate its behavior.</CardDescription>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-primary-800/85 hover:bg-primary-100 inline-flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
            <IconChevronDown
              size={16}
              className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
            />
          </button>
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Select
                  label="Model to simulate"
                  value={selectedModelId}
                  onChange={onSelectedModelIdChange}
                  options={modelOptions}
                  placeholder={modelPlaceholder}
                  disabled={isModelsLoading || modelOptions.length === 0 || isSubmitting}
                />

                <AnimatePresence initial={false}>
                  {selectedModelId && simulationOptions && !isLoadingOptions && (
                    <motion.div
                      key="options-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Input
                              label="Time step (dt)"
                              type="number"
                              min={0.0001}
                              step={0.01}
                              value={dt}
                              setValue={onDtChange}
                              required
                              disabled={isSubmitting}
                            />
                            <p className="text-primary-800/75 text-xs">
                              Resolution of the simulation.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <Input
                              label="Simulation duration"
                              type="number"
                              min={0.0001}
                              step={1}
                              value={totalTime}
                              setValue={onTotalTimeChange}
                              required
                              disabled={isSubmitting}
                            />
                            <p className="text-primary-800/75 text-xs">
                              Total time simulated (e.g. 100 steps).
                            </p>
                          </div>
                        </div>

                        {simulationOptions.parameters.length > 0 ? (
                          <section className="space-y-2">
                            <div className="inline-flex items-center gap-2">
                              <IconAdjustments className="text-primary-800 h-4 w-4" />
                              <p className="text-primary-950 text-sm font-semibold">Parameters</p>
                            </div>

                            <div className="border-primary-200 divide-primary-200 overflow-x-auto rounded-lg border">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-primary-100/50">
                                  <tr>
                                    <th className="text-primary-700 px-4 py-3 text-xs font-semibold tracking-wider uppercase">
                                      Parameter Name
                                    </th>
                                    <th className="text-primary-700 w-32 px-4 py-3 text-xs font-semibold tracking-wider uppercase md:w-48">
                                      Value
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-primary-200 divide-y">
                                  {simulationOptions.parameters.map((parameter) => (
                                    <tr
                                      key={parameter.name}
                                      className="hover:bg-primary-50/30 transition-colors"
                                    >
                                      <td className="text-primary-900 px-4 py-3 font-mono text-sm tracking-wide">
                                        {parameter.name}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Input
                                          type="number"
                                          className="font-mono text-sm tracking-wide"
                                          step={0.0001}
                                          value={
                                            parameterOverrides[parameter.name] ??
                                            String(parameter.initial_value)
                                          }
                                          setValue={(value) =>
                                            onParameterOverridesChange({
                                              ...parameterOverrides,
                                              [parameter.name]: value,
                                            })
                                          }
                                          disabled={isSubmitting}
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </section>
                        ) : null}

                        <div className="flex items-center justify-end gap-3 pt-6">
                          <Button
                            type="submit"
                            variant="success"
                            icon={<IconPlayerPlay className="h-4 w-4" />}
                            isLoading={isSubmitting}
                            disabled={isModelsLoading || modelOptions.length === 0 || isSubmitting}
                          >
                            Run Simulation
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
