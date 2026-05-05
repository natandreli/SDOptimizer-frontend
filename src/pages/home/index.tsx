import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  IconUpload,
  IconDatabase,
  IconSparkles,
  IconChartLine,
  IconBrain,
  IconArrowRight,
  IconPlayerPlay,
} from '@tabler/icons-react'

export const HomePage = () => {
  return (
    <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center">
      <section className="w-full space-y-8 text-center">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-50/50 px-4 py-1.5 text-sm font-medium text-amber-800 shadow-sm backdrop-blur-sm">
            <IconSparkles className="h-5 w-5 text-amber-600" />
            Hybrid Learnheuristics: DRL + Greedy Algorithm
          </div>
        </div>

        <h1
          className="text-primary-950 animate-fade-in-up text-4xl font-extrabold tracking-tight lg:text-6xl"
          style={{ animationDelay: '100ms' }}
        >
          SD<span className="text-primary-600">Optimizer</span>
        </h1>

        <p
          className="text-primary-900/70 animate-fade-in-up mx-auto max-w-2xl text-base leading-relaxed lg:text-lg"
          style={{ animationDelay: '200ms' }}
        >
          A powerful platform to simulate and optimize System Dynamics models using deep
          reinforcement learning and greedy strategies.
        </p>

        <div
          className="animate-fade-in-up flex flex-wrap items-center justify-center gap-4 pt-6"
          style={{ animationDelay: '300ms' }}
        >
          <Link to="/models?tab=upload">
            <Button className="px-6 shadow-md" icon={<IconUpload className="h-5 w-5" />}>
              Upload Model
            </Button>
          </Link>
          <Link
            to="/optimization"
            className="focus-visible:ring-primary-500/50 rounded-lg focus:outline-none focus-visible:ring-2"
          >
            <Button
              className="border-primary-200 text-primary-800 hover:bg-primary-50 hover:text-primary-900 border bg-transparent px-6 shadow-sm"
              icon={<IconPlayerPlay className="h-5 w-5" />}
            >
              Run Optimization
            </Button>
          </Link>
        </div>
      </section>

      <section
        className="animate-fade-in-up mx-auto mt-16 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3"
        style={{ animationDelay: '500ms' }}
      >
        <Link to="/models" className="group block h-full rounded-2xl outline-none">
          <div className="border-primary-200/90 bg-primary-50/60 flex h-full flex-col rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-rose-300 hover:shadow-md">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <IconDatabase className="h-5 w-5" />
            </div>
            <h3 className="text-primary-950 mb-2 text-base font-bold">Model Management</h3>
            <p className="text-primary-900/70 mb-6 text-sm leading-relaxed">
              Upload, parse, and organize your Vensim (.mdl) System Dynamics models in a centralized
              workspace.
            </p>
            <div className="mt-auto flex items-center gap-1 text-sm font-semibold text-rose-600 transition-all group-hover:gap-2">
              Manage Models <IconArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>

        <Link to="/simulation" className="group block h-full rounded-2xl outline-none">
          <div className="border-primary-200/90 bg-primary-50/60 flex h-full flex-col rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <IconChartLine className="h-5 w-5" />
            </div>
            <h3 className="text-primary-950 mb-2 text-base font-bold">Simulation Engine</h3>
            <p className="text-primary-900/70 mb-6 text-sm leading-relaxed">
              Run precise temporal simulations with Euler integration. Tweak variables and compare
              multi-line graphical results instantly.
            </p>
            <div className="mt-auto flex items-center gap-1 text-sm font-semibold text-emerald-600 transition-all group-hover:gap-2">
              Run Simulations <IconArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>

        <Link to="/optimize" className="group block h-full rounded-2xl outline-none">
          <div className="border-primary-200/90 bg-primary-50/60 flex h-full flex-col rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-orange-300 hover:shadow-md">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <IconBrain className="h-5 w-5" />
            </div>
            <h3 className="text-primary-950 mb-2 text-base font-bold">AI Optimization</h3>
            <p className="text-primary-900/70 mb-6 text-sm leading-relaxed">
              Find the perfect parameter policies maximizing model targets using Deep Reinforcement
              Learning agents.
            </p>
            <div className="mt-auto flex items-center gap-1 text-sm font-semibold text-orange-600 transition-all group-hover:gap-2">
              Optimize Models <IconArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  )
}
