import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  IconUpload,
  IconDatabase,
  IconPlayerTrackNext,
  IconSparkles,
  IconFlask2,
} from '@tabler/icons-react'

export const HomePage = () => {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center pb-12">
      <section className="w-full space-y-6 text-center">
        <div className="border-primary-300 bg-primary-100 text-primary-900 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
          <IconSparkles className="h-5 w-5 text-amber-600" />
          Hybrid Learnheuristics: DRL + Greedy Algorithm
        </div>

        <p className="text-primary-950 text-5xl font-bold tracking-tight lg:text-5xl">
          SDOptimizer
        </p>

        <p className="text-primary-900/80 mx-auto max-w-3xl text-lg leading-relaxed lg:text-xl">
          Optimize System Dynamics simulation models with a DRL + Greedy Algorithm strategy.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/models?tab=upload" className="inline-flex">
            <Button icon={<IconUpload className="h-4 w-4" />}>Upload Model</Button>
          </Link>
          <Link to="/models?tab=list" className="inline-flex">
            <Button variant="alt" icon={<IconDatabase className="h-4 w-4" />}>
              Open Models
            </Button>
          </Link>
          <Link to="/simulation" className="inline-flex">
            <Button variant="grey" icon={<IconPlayerTrackNext className="h-4 w-4" />}>
              Open Simulation
            </Button>
          </Link>
          <Link to="/optimize" className="inline-flex">
            <Button variant="grey" icon={<IconFlask2 className="h-4 w-4" />}>
              Open Optimization
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
