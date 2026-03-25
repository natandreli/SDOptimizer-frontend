import { IconInfoCircle, IconInfoSmall } from '@tabler/icons-react'
import type { ModelSchema } from '@/services/api/models/types'

type ModelDetailsModalProps = {
  modelId: string
  model: ModelSchema
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

const trimVariables = (variables: ModelSchema['stocks']) =>
  variables.map(({ name, equation, unit, initial_value, description }) => ({
    name,
    equation,
    unit,
    initial_value,
    description,
  }))

const JSON_TOKEN_REGEX =
  /"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?=\s*:)|"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b/g

const getJsonTokenClass = (token: string, json: string, matchEnd: number): string => {
  if (token === 'true' || token === 'false') return 'text-emerald-700'
  if (token === 'null') return 'text-primary-500'
  if (!Number.isNaN(Number(token))) return 'text-violet-700'

  if (token.startsWith('"')) {
    let pointer = matchEnd
    while (pointer < json.length && /\s/.test(json[pointer])) {
      pointer += 1
    }

    if (json[pointer] === ':') return 'text-sky-700'
    return 'text-amber-700'
  }

  return 'text-primary-900'
}

const renderHighlightedJson = (json: string) => {
  const chunks: Array<{ value: string; className: string; key: string }> = []
  let lastIndex = 0
  let tokenIndex = 0

  for (const match of json.matchAll(JSON_TOKEN_REGEX)) {
    if (match.index === undefined) continue

    if (match.index > lastIndex) {
      chunks.push({
        value: json.slice(lastIndex, match.index),
        className: 'text-primary-900',
        key: `plain-${tokenIndex}`,
      })
    }

    const token = match[0]
    const matchEnd = match.index + token.length
    chunks.push({
      value: token,
      className: getJsonTokenClass(token, json, matchEnd),
      key: `token-${tokenIndex}`,
    })

    lastIndex = matchEnd
    tokenIndex += 1
  }

  if (lastIndex < json.length) {
    chunks.push({
      value: json.slice(lastIndex),
      className: 'text-primary-900',
      key: `plain-tail-${tokenIndex}`,
    })
  }

  return chunks.map((chunk) => (
    <span key={chunk.key} className={chunk.className}>
      {chunk.value}
    </span>
  ))
}

export const ModelDetailsModal = ({ modelId, model }: ModelDetailsModalProps) => {
  const sections = [
    {
      key: 'stocks',
      title: 'Stocks',
      count: model.stocks.length,
      helpText: 'Accumulated quantities that represent system state over time.',
    },
    {
      key: 'flows',
      title: 'Flows',
      count: model.flows.length,
      helpText: 'Rates that increase or decrease stocks.',
    },
    {
      key: 'parameters',
      title: 'Parameters',
      count: model.parameters.length,
      helpText: 'Fixed inputs or constants used by equations.',
    },
    {
      key: 'auxiliaries',
      title: 'Auxiliaries',
      count: model.auxiliaries.length,
      helpText: 'Intermediate calculated variables supporting model logic.',
    },
  ]

  const modelData = {
    stocks: trimVariables(model.stocks),
    flows: trimVariables(model.flows),
    parameters: trimVariables(model.parameters),
    auxiliaries: trimVariables(model.auxiliaries),
  }

  const highlightedJson = renderHighlightedJson(JSON.stringify(modelData, null, 2))

  return (
    <div className="w-[760px] max-w-[90vw] space-y-4">
      <div className="flex items-center gap-3">
        <IconInfoCircle className="text-primary-700 h-6 w-6" />
        <span className="text-primary-950 text-lg font-semibold">Model Data</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-primary-800/80 text-xs font-medium tracking-wide uppercase">
            File Name
          </p>
          <p className="text-primary-950 text-sm font-medium">{model.file_name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-violet-700/80 uppercase">ID</p>
          <p className="font-mono text-xs text-violet-800/90">{modelId}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-sky-700/80 uppercase">Format</p>
          <p className="text-sm font-semibold text-sky-800">{model.format}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-rose-700/80 uppercase">
            Uploaded At
          </p>
          <p className="text-sm leading-relaxed text-rose-900/80">
            {formatDate(model.uploaded_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {sections.map((section) => (
          <div
            key={section.key}
            className="border-primary-200 bg-primary-50/80 relative rounded-lg border px-3 py-2"
          >
            <div className="group/tooltip absolute top-2 right-2">
              <button
                type="button"
                className="border-primary-300 text-primary-700 hover:bg-primary-100 focus-visible:ring-primary-300 flex h-4 w-4 items-center justify-center rounded-full border text-[10px] leading-none font-semibold transition-colors focus:outline-none focus-visible:ring-2"
                aria-label={`${section.title} info`}
              >
                <IconInfoSmall className="h-5 w-5" />
              </button>
              <div className="border-primary-200 bg-primary-50 text-primary-800 pointer-events-none absolute top-full right-0 z-10 mt-2 w-52 rounded-md border p-2 text-[11px] leading-snug opacity-0 shadow-lg transition-opacity duration-150 group-focus-within/tooltip:opacity-100 group-hover/tooltip:opacity-100">
                {section.helpText}
              </div>
            </div>
            <p className="text-primary-800/80 text-xs font-medium">{section.title}</p>
            <p className="text-primary-950 mt-1 text-lg font-bold">{section.count}</p>
          </div>
        ))}
      </div>

      <pre className="border-primary-200 bg-primary-50 text-primary-900 max-h-[52vh] overflow-auto rounded-lg border p-3 text-xs whitespace-pre">
        {highlightedJson}
      </pre>
    </div>
  )
}
