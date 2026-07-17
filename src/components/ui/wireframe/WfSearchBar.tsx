import React from 'react';
import { Filter, Search } from 'lucide-react';
import { Input } from '../../baseui/baseuiShims';
import { inputOverrides } from '../../baseui/primitives/fieldStyles';
import { GuardrButton } from '../../baseui/GuardrButton';

interface WfSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  className?: string;
}

export function WfSearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  onFilterClick,
  className = '',
}: WfSearchBarProps) {
  return (
    <div className={`app-search-bar ${className}`.trim()}>
      <Input
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        type="search"
        startEnhancer={<Search className="w-4 h-4" strokeWidth={1.5} />}
        endEnhancer={
          onFilterClick ? (
            <GuardrButton
              kind="tertiary"
              size="mini"
              onClick={onFilterClick}
              aria-label="Filter"
              overrides={{ BaseButton: { style: { minHeight: '32px', padding: '6px' } } }}
            >
              <Filter className="w-4 h-4" strokeWidth={1.5} />
            </GuardrButton>
          ) : undefined
        }
        overrides={inputOverrides('app-search-bar-input')}
      />
    </div>
  );
}
