import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../api/client';

export interface MealPlanEntry {
  id: string;
  plan_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meals: {
    id: string;
    title: string;
    meal_ingredients: {
      amount: number;
      unit: string;
      ingredients: { name: string; };
    }[];
  } | null;
}

export function useMealPlan(startDate: string, endDate: string) {
  return useQuery<MealPlanEntry[]>({
    queryKey: ['mealPlan', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_plan')
        .select(`
          id,
          plan_date,
          meal_type,
          meals ( id, title, meal_ingredients ( amount, unit, ingredients ( name ) ) )
        `)
        .gte('plan_date', startDate)
        .lte('plan_date', endDate);

      if (error) throw error;
      return data as unknown as MealPlanEntry[];
    },
  });
}

export function useUpdateMealPlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { planDate: string; mealType: string; mealId: string | null }) => {
      const { data, error } = await supabase
        .from('meal_plan')
        .upsert({
          plan_date: variables.planDate,
          meal_type: variables.mealType,
          meal_id: variables.mealId,
        }, { onConflict: 'plan_date,meal_type' })
        .select();

      if (error) throw error;
      return data;
    },
    onMutate: async (newEntry) => {
      await qc.cancelQueries({ queryKey: ['mealPlan'] });
      const previousPlan = qc.getQueryData(['mealPlan']);

      qc.setQueryData(['mealPlan'], (old: any) => {
        if (!old) return [];
        const index = old.findIndex((item: any) => item.plan_date === newEntry.planDate && item.meal_type === newEntry.mealType);
        if (index > -1) {
          const updated = [...old];
          updated[index] = { ...updated[index], meal_id: newEntry.mealId, meals: newEntry.mealId ? { id: newEntry.mealId, title: 'Wird synchronisiert...', meal_ingredients: [] } : null };
          return updated;
        }
        return [...old, { plan_date: newEntry.planDate, meal_type: newEntry.mealType, meal_id: newEntry.mealId, meals: newEntry.mealId ? { id: newEntry.mealId, title: 'Wird synchronisiert...', meal_ingredients: [] } : null }];
      });

      return { previousPlan };
    },
    onError: (_err, _newEntry, context) => {
      if (context?.previousPlan) qc.setQueryData(['mealPlan'], context.previousPlan);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['mealPlan'] });
    },
  });
}

export function useRealtimeSync(startDate: string, endDate: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('meal_plan_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plan' }, (payload) => {
        qc.invalidateQueries({ queryKey: ['mealPlan', startDate, endDate] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, startDate, endDate]);
}
