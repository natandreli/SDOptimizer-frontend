import type { FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconChevronDown, IconPlayerPlay } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCookieGuard } from '@/hooks/use-cookie-guard'

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
  parameterOverridesText: string
  onParameterOverridesTextChange: (value: string) => void
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
  parameterOverridesText,
  onParameterOverridesTextChange,
  isSubmitting,
  isCollapsed,
  onToggleCollapse,
  onSubmit,
}: SimulationSetupFormProps) => {
  const { isCookieSupported, status } = useCookieGuard()

  const modelPlaceholder = isModelsLoading
    ? 'Loading models...'
    : modelOptions.length === 0
      ? 'No models uploaded yet'
      : 'Select a model...'

  const isCookieBlocked = status !== 'checking' && !isCookieSupported

  return (
    <Card>
      <CardHeader className={isCollapsed ? 'mb-0' : ''}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Setup</CardTitle>
            <CardDescription>Choose a model and simulation settings.</CardDescription>
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
                  placeholder={modelPlaceholder}
                  value={selectedModelId}
                  options={modelOptions}
                  onChange={onSelectedModelIdChange}
                  disabled={isModelsLoading || modelOptions.length === 0}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Input
                      label="Time step"
                      type="number"
                      min={0.0001}
                      step={0.01}
                      value={dt}
                      setValue={onDtChange}
                      required
                    />
                    <p className="text-primary-800/75 text-xs">
                      Smaller values are more precise but take longer to run.
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
                    />
                    <p className="text-primary-800/75 text-xs">
                      Total time horizon to simulate (for example, 100 days/months).
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-primary-900 block text-sm font-medium">
                    Optional parameter changes
                  </label>
                  <textarea
                    value={parameterOverridesText}
                    onChange={(event) => onParameterOverridesTextChange(event.target.value)}
                    className="border-primary-300 bg-primary-50 text-primary-950 min-h-28 w-full rounded-lg border px-4 py-2.5 text-sm transition-all outline-none focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/15"
                    placeholder='{"cash revenue": 1500, "hiring rate": 0.2}'
                  />
                  <p className="text-primary-800/75 text-xs">
                    Only include values you want to change for this run. Use JSON with numeric
                    values.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="submit"
                    variant="success"
                    icon={<IconPlayerPlay className="h-4 w-4" />}
                    isLoading={isSubmitting}
                    disabled={
                      isCookieBlocked ||
                      isModelsLoading ||
                      modelOptions.length === 0 ||
                      !selectedModelId
                    }
                  >
                    Run Simulation
                  </Button>
                </div>

                {isCookieBlocked && (
                  <p className="text-xs font-medium text-rose-800">
                    Enable cookies in your browser to run simulations.
                  </p>
                )}
              </form>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
