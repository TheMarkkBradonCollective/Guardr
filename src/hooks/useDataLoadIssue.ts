import { useEffect, useState } from 'react';
import { getDataLoadIssue, subscribeDataLoadIssue } from '../lib/dataLoadStatus';

export function useDataLoadIssue(): string | null {
  const [issue, setIssue] = useState<string | null>(() => getDataLoadIssue());
  useEffect(() => subscribeDataLoadIssue(setIssue), []);
  return issue;
}
