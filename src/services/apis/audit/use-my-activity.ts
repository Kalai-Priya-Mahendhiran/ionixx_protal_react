import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { auditService } from './audit-service';

export const MY_ACTIVITY_KEY = ['audit', 'mine'] as const;

// The signed-in person's own recorded actions (task changes, settings…), newest first
export function useMyActivity() {
  const { user } = useAuth();
  return useQuery({ queryKey: [...MY_ACTIVITY_KEY, user?.id], queryFn: () => auditService.listMine(user!), enabled: !!user });
}
