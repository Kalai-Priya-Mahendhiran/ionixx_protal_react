import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import type { ProfileFormData } from '@/lib/schemas';
import { profileService } from './profile-service';

export const PROFILE_KEY = ['profile'] as const;

export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({ queryKey: [...PROFILE_KEY, user?.id], queryFn: () => profileService.get(user!), enabled: !!user });
}

// Name, birthday, phone and location feed the directory, so every people screen refreshes
export function useSaveProfile() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileFormData) => profileService.save(user!, data),
    onSuccess: (data) => {
      const name = [data.firstName, data.middleName, data.lastName].map((part) => part?.trim()).filter(Boolean).join(' ');
      if (name) updateUser({ name });
      queryClient.invalidateQueries();
      toast.success('Profile saved');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not save your profile'),
  });
}
