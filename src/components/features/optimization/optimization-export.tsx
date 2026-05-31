import { IconFileText, IconFileTypePdf } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { OptimizationResult } from '@/services/api/models/types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type OptimizationExportProps = {
  result: OptimizationResult
  modelName: string
  optimizationNumber?: number
  compact?: boolean
}

type AutoTableDoc = jsPDF & { lastAutoTable: { finalY: number } }
type PdfColor = [number, number, number]
type PdfLineSeries = {
  label: string
  values: number[]
  color: PdfColor
}

const PARAMETER_COLORS: PdfColor[] = [
  [99, 102, 241],
  [245, 158, 11],
  [16, 185, 129],
  [239, 68, 68],
  [139, 92, 246],
  [6, 182, 212],
  [249, 115, 22],
  [236, 72, 153],
  [20, 184, 166],
  [132, 204, 22],
]

const getFiniteBounds = (values: number[]) => {
  const finiteValues = values.filter(Number.isFinite)
  if (finiteValues.length === 0) {
    return { min: 0, max: 1 }
  }

  const min = Math.min(...finiteValues)
  const max = Math.max(...finiteValues)
  if (Math.abs(max - min) < 1e-12) {
    const padding = Math.abs(max) > 1e-12 ? Math.abs(max) * 0.1 : 1
    return { min: min - padding, max: max + padding }
  }

  const padding = (max - min) * 0.08
  return { min: min - padding, max: max + padding }
}

export const OptimizationExport = ({
  result,
  modelName,
  optimizationNumber,
  compact = false,
}: OptimizationExportProps) => {
  const cleanModelName = modelName.replace(/\.mdl$/i, '')
  const runNumber = optimizationNumber ?? result.optimization_number
  const runSuffix = runNumber ? `-run-${runNumber}` : ''
  const fileBase = `optimization-${cleanModelName.replace(/\s+/g, '-')}${runSuffix}`

  const getFormattedDate = () => {
    const now = new Date()
    const date = now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const time = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${date} ${time}`
  }

  const exportToJson = () => {
    const exportData = {
      metadata: {
        generatedAt: getFormattedDate(),
        modelName: cleanModelName,
        generator: 'SDOptimizer',
        optimizationNumber: runNumber,
      },
      performanceSummary: {
        improvementPercentage: Number(result.improvement_percentage.toFixed(4)),
        baselineScore: Number(result.initial_score.toFixed(6)),
        bestScore: Number(result.best_score.toFixed(6)),
        totalIterations: result.history.rewards.length,
        executionTimeMs: result.execution_time_ms ?? 0,
      },
      configuration: {
        targetVariable: result.config_summary.target_variable,
        statistic: result.config_summary.statistic,
        direction: result.config_summary.direction,
        maxRuns: result.config_summary.max_runs,
      },
      optimizedParameters: result.best_parameters,
      parameterChanges: Object.fromEntries(
        Object.entries(result.parameter_changes).map(([key, change]) => [
          key,
          {
            initialValue: change.initial_value,
            optimizedValue: change.optimized_value,
            changePercentage: change.change_percentage,
          },
        ])
      ),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileBase}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportToPdf = async () => {
    const doc = new jsPDF()
    const dateStr = getFormattedDate()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height

    // Title (Left)
    doc.setFontSize(24)
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.text(runNumber ? `Optimization Report #${runNumber}` : 'Optimization Report', 14, 22)

    // App Name (Right)
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.setFont('helvetica', 'bold')
    doc.text('SDOptimizer', pageWidth - 14, 22, { align: 'right' })

    // Logo Icon
    const textWidth = doc.getTextWidth('SDOptimizer')
    const lx = pageWidth - 14 - textWidth - 8
    const ly = 20.5

    doc.setDrawColor(31, 41, 55)
    doc.setFillColor(31, 41, 55)
    doc.setLineWidth(0.6)

    doc.line(lx, ly, lx + 4, ly - 2.5)
    doc.line(lx, ly, lx + 4, ly + 2.5)

    doc.circle(lx, ly, 1.2, 'FD')
    doc.circle(lx + 4, ly - 2.5, 1.2, 'FD')
    doc.circle(lx + 4, ly + 2.5, 1.2, 'FD')

    // Divider Line
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.5)
    doc.line(14, 28, pageWidth - 14, 28)

    // Subtitle info
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    doc.text(`Model: ${cleanModelName}`, 14, 36)
    doc.text(`Generated: ${dateStr}`, pageWidth - 14, 36, { align: 'right' })

    // Reset font for body
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.setFont('helvetica', 'bold')

    // Results Summary
    doc.text('Performance Summary', 14, 55)

    autoTable(doc, {
      startY: 59,
      head: [['Metric', 'Value']],
      body: [
        ['Total Improvement', `${result.improvement_percentage.toFixed(2)}%`],
        ['Baseline Score', result.initial_score.toFixed(4)],
        ['Best Score', result.best_score.toFixed(4)],
        ['Iterations', result.history.rewards.length.toString()],
        ['Execution Time', `${((result.execution_time_ms ?? 0) / 1000).toFixed(2)} s`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10, cellPadding: 5 },
    })

    // Config Table
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.setFont('helvetica', 'bold')
    doc.text('Configuration', 14, (doc as AutoTableDoc).lastAutoTable.finalY + 15)

    autoTable(doc, {
      startY: (doc as AutoTableDoc).lastAutoTable.finalY + 20,
      head: [['Target Variable', 'Statistic', 'Direction']],
      body: [
        [
          result.config_summary.target_variable,
          result.config_summary.statistic,
          result.config_summary.direction,
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10, cellPadding: 5 },
    })

    // Parameters Table
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.setFont('helvetica', 'bold')
    doc.text('Optimized Parameters', 14, (doc as AutoTableDoc).lastAutoTable.finalY + 15)

    const paramsBody = Object.entries(result.parameter_changes).map(([name, change]) => [
      name,
      change.initial_value.toFixed(6),
      change.optimized_value.toFixed(6),
      `${change.change_percentage > 0 ? '+' : ''}${change.change_percentage.toFixed(2)}%`,
    ])

    autoTable(doc, {
      startY: (doc as AutoTableDoc).lastAutoTable.finalY + 20,
      head: [['Parameter', 'Initial Value', 'Optimized Value', 'Change']],
      body: paramsBody,
      theme: 'striped',
      headStyles: { fillColor: [31, 41, 55] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10, cellPadding: 5 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const cellText = String(data.cell.raw)
          const value = parseFloat(cellText.replace('%', '').replace('+', ''))

          if (value > 0.001) {
            data.cell.styles.textColor = [16, 185, 129]
            data.cell.styles.fontStyle = 'bold'
          } else if (value < -0.001) {
            data.cell.styles.textColor = [239, 68, 68]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      },
    })

    const drawPdfLineChart = (title: string, series: PdfLineSeries[], xLabel: string) => {
      if (series.length === 0 || series.every((item) => item.values.length === 0)) {
        return
      }

      const margin = 14
      const chartWidth = pageWidth - margin * 2
      const chartHeight = 78
      const chartPadding = { top: 12, right: 10, bottom: 16, left: 22 }
      const legendLineHeight = 8
      const legendColumns = Math.min(series.length, 2)
      const legendRows = Math.max(1, Math.ceil(series.length / Math.max(legendColumns, 1)))
      const reservedHeight = chartHeight + 22 + legendRows * legendLineHeight
      let currentY = (doc as AutoTableDoc).lastAutoTable.finalY + 16

      if (currentY + reservedHeight > pageHeight - 8) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(31, 41, 55)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin, currentY)

      const x = margin
      const y = currentY + 8
      const plotX = x + chartPadding.left
      const plotY = y + chartPadding.top
      const plotWidth = chartWidth - chartPadding.left - chartPadding.right
      const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom
      const values = series.flatMap((item) => item.values)
      const bounds = getFiniteBounds(values)
      const maxIndex = Math.max(...series.map((item) => item.values.length - 1), 1)
      const mapX = (index: number) => plotX + (index / maxIndex) * plotWidth
      const mapY = (value: number) =>
        plotY + plotHeight - ((value - bounds.min) / (bounds.max - bounds.min)) * plotHeight

      doc.setDrawColor(229, 231, 235)
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(x, y, chartWidth, chartHeight, 2, 2, 'FD')

      doc.setDrawColor(209, 213, 219)
      doc.setLineWidth(0.3)
      for (let tick = 0; tick <= 4; tick += 1) {
        const gridY = plotY + (plotHeight / 4) * tick
        doc.line(plotX, gridY, plotX + plotWidth, gridY)
      }

      doc.setDrawColor(107, 114, 128)
      doc.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight)
      doc.line(plotX, plotY, plotX, plotY + plotHeight)

      series.forEach((item) => {
        doc.setDrawColor(...item.color)
        doc.setLineWidth(0.9)
        for (let index = 1; index < item.values.length; index += 1) {
          const previous = item.values[index - 1]
          const current = item.values[index]
          if (!Number.isFinite(previous) || !Number.isFinite(current)) {
            continue
          }
          doc.line(mapX(index - 1), mapY(previous), mapX(index), mapY(current))
        }
      })

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      doc.text(bounds.max.toFixed(2), x + 3, plotY + 2)
      doc.text(bounds.min.toFixed(2), x + 3, plotY + plotHeight)
      doc.text(xLabel, plotX + plotWidth / 2, y + chartHeight - 4, { align: 'center' })

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const legendStartY = y + chartHeight + 9
      const legendColumnWidth = plotWidth / Math.max(legendColumns, 1)
      series.forEach((item, index) => {
        const column = legendColumns === 1 ? 0 : index % legendColumns
        const row = legendColumns === 1 ? index : Math.floor(index / legendColumns)
        const legendX = plotX + column * legendColumnWidth
        const legendY = legendStartY + row * legendLineHeight
        const label = item.label.length > 22 ? `${item.label.slice(0, 19)}...` : item.label

        doc.setDrawColor(...item.color)
        doc.setLineWidth(0.8)
        doc.line(legendX, legendY - 1.5, legendX + 7, legendY - 1.5)
        doc.setTextColor(...item.color)
        doc.text(label, legendX + 10, legendY)
      })
      ;(doc as AutoTableDoc).lastAutoTable.finalY = legendStartY + legendRows * legendLineHeight + 2
    }

    drawPdfLineChart(
      'Reward History',
      [
        {
          label: 'Reward',
          values: result.history.rewards,
          color: [14, 165, 233],
        },
        {
          label: 'Best Reward',
          values: result.history.best_rewards,
          color: [5, 150, 105],
        },
      ],
      'Iteration'
    )

    const parameterNames = Object.keys(result.best_parameters)
    const parameterSeries = parameterNames.map((name, index) => ({
      label: name,
      values: result.history.parameters.map((params) => params[index] ?? 0),
      color: PARAMETER_COLORS[index % PARAMETER_COLORS.length],
    }))

    if (parameterSeries.length > 0) {
      drawPdfLineChart('Parameter Evolution', parameterSeries, 'Iteration')
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(9)
      doc.setTextColor(156, 163, 175)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated by SDOptimizer - Page ${i} of ${pageCount}`, 14, pageHeight - 10)
    }

    doc.save(`${fileBase}-${Date.now()}.pdf`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToJson}
        className={compact ? 'bg-primary-50 gap-2' : 'gap-2'}
      >
        <IconFileText size={16} />
        {compact ? 'JSON' : 'Export JSON'}
      </Button>
      <Button variant="primary" size="sm" onClick={exportToPdf} className="gap-2">
        <IconFileTypePdf size={16} />
        {compact ? 'PDF' : 'Export PDF'}
      </Button>
    </div>
  )
}
