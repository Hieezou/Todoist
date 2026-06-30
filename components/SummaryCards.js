import React, { memo, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { impact } from '../utils/haptics';

const SummaryCards = memo(({ views, viewCounts, activeView, onViewChange }) => {
  const handleViewPress = useCallback(async (view) => {
    await impact();
    onViewChange(view);
  }, [onViewChange]);

  return (
    <View style={styles.summaryRow}>
      {views.map((view, index) => (
        <TouchableOpacity
          key={view}
          onPress={() => handleViewPress(view)}
          style={[
            styles.summaryCard,
            activeView === view && styles.summaryCardActive,
            index < views.length - 1 && styles.summaryCardSpacing,
          ]}
        >
          <Text style={[styles.summaryValue, activeView === view && styles.summaryValueActive]}>
            {viewCounts[view]}
          </Text>
          <Text style={[styles.summaryLabel, activeView === view && styles.summaryLabelActive]}>
            {view}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCardSpacing: {
    marginRight: 10,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  summaryCardActive: {
    backgroundColor: '#ff8c00',
    borderColor: '#ffb347',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  summaryValueActive: {
    color: '#101010',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c0c0c0',
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  summaryLabelActive: {
    color: '#101010',
  },
});

export default SummaryCards;
