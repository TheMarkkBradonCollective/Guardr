import React, { useMemo } from 'react';

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-brand-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function MarkdownDoc({ source }: { source: string }) {
  const blocks = useMemo(() => {
    const lines = source.replace(/\r\n/g, '\n').split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={key++} className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-text">
            {line.slice(2)}
          </h1>
        );
        i += 1;
        continue;
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-lg font-semibold text-brand-text mt-10 first:mt-0">
            {line.slice(3)}
          </h2>
        );
        i += 1;
        continue;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-base font-semibold text-brand-text mt-6">
            {line.slice(4)}
          </h3>
        );
        i += 1;
        continue;
      }

      if (line.startsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('|')) {
          tableLines.push(lines[i]);
          i += 1;
        }
        if (tableLines.length >= 2) {
          const headers = tableLines[0]
            .split('|')
            .map((c) => c.trim())
            .filter(Boolean);
          const bodyRows = tableLines.slice(2).map((row) =>
            row
              .split('|')
              .map((c) => c.trim())
              .filter(Boolean)
          );
          elements.push(
            <div key={key++} className="overflow-x-auto mt-4 border border-brand-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-bg-sec border-b border-brand-border">
                    {headers.map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-brand-text">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} className="border-b border-brand-border last:border-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-brand-text-muted align-top">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        continue;
      }

      if (line.startsWith('```')) {
        const codeLines: string[] = [];
        i += 1;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i += 1;
        }
        i += 1;
        elements.push(
          <pre
            key={key++}
            className="mt-4 p-4 text-xs sm:text-sm leading-relaxed overflow-x-auto bg-brand-bg-sec border border-brand-border text-brand-text-muted font-mono whitespace-pre-wrap"
          >
            {codeLines.join('\n')}
          </pre>
        );
        continue;
      }

      if (line === '---') {
        elements.push(<hr key={key++} className="my-8 border-brand-border" />);
        i += 1;
        continue;
      }

      if (/^\d+\.\s/.test(line) || line.startsWith('- ')) {
        const ordered = /^\d+\.\s/.test(line);
        const items: string[] = [];
        while (i < lines.length && (/^\d+\.\s/.test(lines[i]) || lines[i].startsWith('- '))) {
          items.push(lines[i].replace(/^\d+\.\s/, '').replace(/^- /, ''));
          i += 1;
        }
        const ListTag = ordered ? 'ol' : 'ul';
        elements.push(
          <ListTag
            key={key++}
            className={`mt-3 space-y-2 text-sm leading-relaxed text-brand-text-muted ${
              ordered ? 'list-decimal pl-5' : 'list-disc pl-5'
            }`}
          >
            {items.map((item) => (
              <li key={item}>{renderInline(item)}</li>
            ))}
          </ListTag>
        );
        continue;
      }

      if (line.trim() === '') {
        i += 1;
        continue;
      }

      if (line.startsWith('_') && line.endsWith('_')) {
        elements.push(
          <p key={key++} className="text-xs text-brand-text-muted mt-2">
            {line.slice(1, -1)}
          </p>
        );
        i += 1;
        continue;
      }

      const paraLines: string[] = [line];
      i += 1;
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('|') && !lines[i].startsWith('```') && lines[i] !== '---' && !/^\d+\.\s/.test(lines[i]) && !lines[i].startsWith('- ')) {
        paraLines.push(lines[i]);
        i += 1;
      }
      elements.push(
        <p key={key++} className="mt-3 text-sm leading-relaxed text-brand-text-muted">
          {renderInline(paraLines.join(' '))}
        </p>
      );
    }

    return elements;
  }, [source]);

  return <article className="workflow-doc">{blocks}</article>;
}

export { MarkdownDoc };
