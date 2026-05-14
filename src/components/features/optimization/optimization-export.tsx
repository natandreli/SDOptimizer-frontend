import { IconFileText, IconFileTypePdf } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { OptimizationResult } from '@/services/api/models/types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

type OptimizationExportProps = {
  result: OptimizationResult
  modelName: string
}

type AutoTableDoc = jsPDF & { lastAutoTable: { finalY: number } }

export const OptimizationExport = ({ result, modelName }: OptimizationExportProps) => {
  const cleanModelName = modelName.replace(/\.mdl$/i, '')

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
      },
      performanceSummary: {
        improvementPercentage: Number(result.improvement_percentage.toFixed(4)),
        baselineScore: Number(result.initial_score.toFixed(6)),
        bestScore: Number(result.best_score.toFixed(6)),
        totalIterations: result.history.rewards.length,
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
    link.download = `optimization-${cleanModelName.replace(/\s+/g, '-')}-${Date.now()}.json`
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
    doc.text('Optimization Report', 14, 22)

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

    const chartNodes = [
      { id: 'reward-history-chart', title: 'Reward History' },
      { id: 'parameter-evolution-chart', title: 'Parameter Evolution' },
    ]

    for (const { id, title } of chartNodes) {
      const node = document.getElementById(id)
      if (node) {
        try {
          const canvas = await html2canvas(node, {
            scale: 2,
            backgroundColor: '#ffffff',
          })
          const imgData = canvas.toDataURL('image/png')
          const imgProps = doc.getImageProperties(imgData)

          const margin = 14
          const pdfWidth =
            doc.internal.pageSize.getHeight() > doc.internal.pageSize.getWidth()
              ? doc.internal.pageSize.getWidth() - margin * 2
              : doc.internal.pageSize.getWidth() - margin * 2

          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
          let currentY = (doc as AutoTableDoc).lastAutoTable.finalY + 15

          if (currentY + pdfHeight + 10 > doc.internal.pageSize.getHeight()) {
            doc.addPage()
            currentY = 20
          }

          doc.setFontSize(14)
          doc.setTextColor(31, 41, 55)
          doc.setFont('helvetica', 'bold')
          doc.text(title, margin, currentY)

          doc.addImage(imgData, 'PNG', margin, currentY + 5, pdfWidth, pdfHeight)
          ;(doc as AutoTableDoc).lastAutoTable.finalY = currentY + 5 + pdfHeight
        } catch (err) {
          console.error(`Failed to capture chart ${id}`, err)
        }
      }
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

    doc.save(`optimization-${cleanModelName.replace(/\s+/g, '-')}-${Date.now()}.pdf`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportToJson} className="gap-2">
        <IconFileText size={16} />
        Export JSON
      </Button>
      <Button variant="primary" size="sm" onClick={exportToPdf} className="gap-2">
        <IconFileTypePdf size={16} />
        Export PDF
      </Button>
    </div>
  )
}
