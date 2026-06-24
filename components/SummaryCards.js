import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Animated, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { impact } from '../utils/haptics';

const SummaryCards = memo(({ views, viewCounts, activeView, onViewChange }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [activeView, fadeAnim]);

  const handleViewPress = useCallback(async (view) => {
    try {
      await impact();
    } catch (e) {
      // ignore haptics errors
    }
    if (typeof onViewChange === 'function') onViewChange(view);
  }, [onViewChange]);

  return (
    <Animated.View
      style={[
        styles.summaryRow,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
            },
          ],
        },
      ]}
    >
      {views.map((view, index) => (
        <TouchableOpacity
          key={view}
          onPress={() => handleViewPress(view)}
          activeOpacity={0.85}
          style={[
            styles.summaryCard,
            activeView === view && styles.summaryCardActive,
            index < views.length - 1 && styles.summaryCardSpacing,
          ]}
        >
          <Text style={[styles.summaryValue, activeView === view && styles.summaryValueActive]}>
            {viewCounts[view]}
          </Text>
          <Text
            style={[styles.summaryLabel, activeView === view && styles.summaryLabelActive]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {view}
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryCardSpacing: {
    marginRight: 6,
    marginBottom: 6,
  },
  summaryCard: {
    width: 72,
    height: 72,
    minWidth: 72,
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#0b0b0b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardActive: {
    backgroundColor: '#ff8c00',
    borderColor: '#ffb347',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  summaryValueActive: {
    color: '#101010',
  },
  summaryLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryLabelActive: {
    color: '#101010',
  },
});

export default SummaryCards;
