import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export interface FinvuEvent {
  eventName: string;
  eventCategory: string;
  timestamp: number;
  params: Record<string, any>;
}

interface EventsDisplayProps {
  events: FinvuEvent[];
  onClear: () => void;
}

export const EventsDisplay: React.FC<EventsDisplayProps> = ({ events, onClear }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Tracking ({events.length})</Text>
        {events.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView style={styles.scrollView} nestedScrollEnabled>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>No events yet. SDK events will appear here.</Text>
        ) : (
          events.map((event, index) => (
            <View key={index} style={styles.eventCard}>
              <Text style={styles.eventName}>{event.eventName}</Text>
              <Text style={styles.eventCategory}>{event.eventCategory}</Text>
              <Text style={styles.eventTime}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </Text>
              {Object.keys(event.params).length > 0 && (
                <Text style={styles.eventParams}>
                  {JSON.stringify(event.params, null, 2)}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 12,
  },
  scrollView: {
    maxHeight: 250,
  },
  eventCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginVertical: 5,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  eventCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  eventTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  eventParams: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});

