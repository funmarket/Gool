import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { impact } from '../lib/telegram';
import { get, post } from '../shared/api/http-client';
import type { Community, CommunityListResponse } from '../types/domain';

type Value = {
  communities: Community[];
  active: Community | null;
  isLoading: boolean;
  switchCommunity: (id: string) => Promise<void>;
};

const CommunityContext = createContext<Value | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['communities'],
    queryFn: () => get<CommunityListResponse>('/api/v1/communities'),
  });
  const mutation = useMutation({
    mutationFn: (id: string) => post(`/api/v1/communities/${id}/switch`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communities'] }),
  });

  const communities = useMemo(() => query.data?.communities ?? [], [query.data?.communities]);
  const active = useMemo(
    () =>
      communities.find((item) => item.id === query.data?.activeCommunityId) ??
      communities[0] ??
      null,
    [communities, query.data?.activeCommunityId],
  );
  const value = useMemo<Value>(
    () => ({
      communities,
      active,
      isLoading: query.isLoading,
      switchCommunity: async (id) => {
        impact('light');
        await mutation.mutateAsync(id);
      },
    }),
    [communities, active, query.isLoading, mutation],
  );

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const value = useContext(CommunityContext);
  if (!value) throw new Error('useCommunity must be used within CommunityProvider');
  return value;
}
