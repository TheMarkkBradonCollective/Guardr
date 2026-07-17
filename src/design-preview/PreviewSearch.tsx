import { useContext, useEffect, useMemo } from 'react';
import { Select, TYPE, SIZE } from 'baseui/select';
import type { ControlRef } from 'baseui/select';
import { PreviewContext } from './PreviewContext';

export function PreviewSearch() {
  const controlRef = useMemo<ControlRef>(() => ({ current: null }), []);
  const { siteMap, activePageId, scrollToPage } = useContext(PreviewContext);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/') return;
      const tag = (event.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      event.preventDefault();
      controlRef.current?.setInputFocus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const options = useMemo(() => {
    const grouped: Record<string, { id: string; name: string; self: string }[]> = {};
    siteMap.forEach((section) => {
      grouped[section.name] = section.children.map((page) => ({
        id: page.id,
        name: page.title,
        self: `${section.name} → ${page.title}`,
      }));
    });
    return grouped;
  }, [siteMap]);

  const activeLabel = useMemo(() => {
    for (const section of siteMap) {
      const page = section.children.find((p) => p.id === activePageId);
      if (page) return page.title;
    }
    return undefined;
  }, [siteMap, activePageId]);

  return (
    <Select
      searchable
      openOnClick
      valueKey="id"
      labelKey="self"
      clearable={false}
      options={options}
      type={TYPE.search}
      size={SIZE.compact}
      controlRef={controlRef}
      id="preview-search"
      placeholder={activeLabel ? `Search pages… (${activeLabel})` : 'Search pages…'}
      maxDropdownHeight="300px"
      getOptionLabel={({ option }) => option.name}
      onFocus={() => {
        controlRef.current?.setDropdownOpen(true);
      }}
      onChange={({ value }) => {
        if (value[0]) scrollToPage(String(value[0].id));
      }}
    />
  );
}
