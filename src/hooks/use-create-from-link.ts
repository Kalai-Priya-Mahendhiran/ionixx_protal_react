import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CREATE_PARAM } from '@/lib/quick-actions';

/*
 * Opens a page's "create" form when the page is opened from Quick Add / Quick Actions (?new=1),
 * then removes the flag so a refresh or Back doesn't open it again.
 *
 *   useCreateFromLink(() => setUploading(true));
 */
export function useCreateFromLink(open: () => void, enabled = true) {
  const [params, setParams] = useSearchParams();
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!enabled || params.get(CREATE_PARAM) !== '1') return;
    openRef.current();
    setParams(
      (current) => {
        current.delete(CREATE_PARAM);
        return current;
      },
      { replace: true },
    );
  }, [params, setParams, enabled]);
}
