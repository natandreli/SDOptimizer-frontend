export const JSON_TOKEN_REGEX =
  /"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?=\s*:)|"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b/g

export const getJsonTokenClass = (token: string, json: string, matchEnd: number): string => {
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

export const renderHighlightedJson = (json: string) => {
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

export const formatMetricValue = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

export const formatChartValue = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

export const getVariableColor = (index: number): string => {
  const hue = (index * 137.508) % 360
  return `hsl(${hue}, 80%, 45%)`
}
