import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from './src/api/client';
import { useMealPlan, useRealtimeSync } from './src/hooks/useMealPlanner';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Frühstück' },
  { key: 'lunch', label: 'Mittagessen' },
  { key: 'dinner', label: 'Abendessen' }
];

function PlanDashboard() {
  const [currentWeekStart] = useState('2026-05-25');
  const [currentWeekEnd] = useState('2026-05-31');
  const { data: plan, isLoading, isError } = useMealPlan(currentWeekStart, currentWeekEnd);
  
  useRealtimeSync(currentWeekStart, currentWeekEnd);

  const days = ['2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31'];
  const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2B4C7E" />
        <Text style={styles.infoText}>Lade Essensplan aus dem Speicher...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Fehler beim Laden der Daten.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Essensplaner Sarah & Steffen</Text>
      <Text style={styles.subHeader}>Synchronisiert & Offline-Verfügbar</Text>
      
      {days.map((date, idx) => {
        return (
          <View key={date} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{dayNames[idx]} ({date.split('-')[2]}.{date.split('-')[1]}.)</Text>
            {MEAL_TYPES.map((type) => {
              const currentEntry = plan?.find(p => p.plan_date === date && p.meal_type === type.key);
              return (
                <View key={type.key} style={styles.mealRow}>
                  <Text style={styles.mealLabel}>{type.label}:</Text>
                  <Text style={styles.mealValue}>{currentEntry?.meals ? currentEntry.meals.title : 'Nicht geplant'}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F6F9' }}>
        <PlanDashboard />
      </SafeAreaView>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F4F6F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F9' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1A2E40', marginTop: 12 },
  subHeader: { fontSize: 13, color: '#6A7B8C', marginBottom: 20 },
  dayCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  dayTitle: { fontSize: 15, fontWeight: '600', color: '#2B4C7E', marginBottom: 8 },
  mealRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  mealLabel: { width: 100, fontWeight: '500', color: '#4A5568' },
  mealValue: { flex: 1, color: '#1A202C' },
  infoText: { marginTop: 10, fontSize: 14, color: '#4A5568' },
  errorText: { color: '#E53E3E', fontWeight: '500' }
});
