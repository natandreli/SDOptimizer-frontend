import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IconDatabase,
  IconHome,
  IconMenu2,
  IconX,
  IconPlayerTrackNext,
  IconBolt,
  IconFlask2,
} from '@tabler/icons-react'

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="border-primary-200/70 bg-primary-50/85 sticky top-0 z-50 w-full border-b backdrop-blur-lg">
      <div className="container mx-auto px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <div className="bg-primary-700 flex h-8 w-8 items-center justify-center rounded">
              <IconBolt className="text-primary-50 h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <span className="text-primary-950 text-lg font-semibold md:text-2xl">
                SDOptimizer
              </span>
              <p className="text-primary-700/80 hidden text-xs md:block">DRL + Greedy Algorithm</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/"
              className="text-primary-900 hover:text-primary-700 flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <IconHome className="h-5 w-5" />
              Home
            </Link>
            <Link
              to="/models"
              className="text-primary-900 hover:text-primary-700 flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <IconDatabase className="h-5 w-5" />
              Models
            </Link>
            <Link
              to="/simulation"
              className="text-primary-900 hover:text-primary-700 flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <IconPlayerTrackNext className="h-5 w-5" />
              Simulation
            </Link>
            <Link
              to="/optimize"
              className="text-primary-900 hover:text-primary-700 flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <IconFlask2 className="h-5 w-5" />
              Optimization
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-primary-900 hover:bg-primary-100 flex items-center justify-center rounded p-2 transition-colors md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <IconX className="h-6 w-6" /> : <IconMenu2 className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="border-primary-200/70 mt-4 flex flex-col gap-3 border-t pt-4 md:hidden">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-primary-900 hover:bg-primary-100 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <IconHome className="h-5 w-5" />
              Home
            </Link>
            <Link
              to="/models"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-primary-900 hover:bg-primary-100 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <IconDatabase className="h-5 w-5" />
              Models
            </Link>
            <Link
              to="/simulation"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-primary-900 hover:bg-primary-100 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <IconPlayerTrackNext className="h-5 w-5" />
              Simulation
            </Link>
            <Link
              to="/optimize"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-primary-900 hover:bg-primary-100 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <IconFlask2 className="h-5 w-5" />
              Optimization
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
