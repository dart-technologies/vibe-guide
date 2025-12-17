import { useState } from 'react';
import { Alert, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { YelpEntity, getReservationUrl, hasReservation } from '../services/yelp';
import { calculateDistance } from '../utils/distance';

type Props = {
  entity: YelpEntity;
  userCoords?: { latitude: number; longitude: number } | null;
};

export function EntityCard({ entity, userCoords }: Props) {
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);
  const canReserve = hasReservation(entity);
  const reserveUrl = getReservationUrl(entity);
  const yelpUrl = entity.url && entity.url.trim().length > 0 ? entity.url : null;
  const title = entity.name || entity.id || 'Recommended spot';
  const summary = (entity as any).summary as string | undefined;

  // Extract address (shortened, no city)
  const location = (entity as any).location;
  const address = location?.address1 || location?.city;

  // Simple distance formatter if distance is provided in meters
  let distMeters = (entity as any).distance as number | undefined;

  if (!distMeters && userCoords && entity.coordinates?.latitude && entity.coordinates?.longitude) {
    const calculated = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      entity.coordinates.latitude,
      entity.coordinates.longitude
    );
    if (calculated !== null) distMeters = calculated;
  }

  const distMiles = distMeters ? (distMeters / 1609.34).toFixed(1) + ' mi' : null;

  const categories = Array.isArray((entity as any).categories)
    ? ((entity as any).categories as { title?: string }[]).map((c) => c.title).filter(Boolean)
    : [];

  const openUrl = (url: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch((e) => console.warn('openURL failed', e));
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formattedPhone = formatPhone(entity.phone);

  const openAddress = () => {
    if (!address) return;
    // Construct a query using name + address for better accuracy
    const query = encodeURIComponent(`${title}, ${address}`);
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${query}`,
      android: `https://www.google.com/maps/search/?api=1&query=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`
    });
    Linking.openURL(url as string).catch(err => console.warn('Error opening maps', err));
  };

  const handleBookSlot = (slot: string) => {
    if (bookedSlot) return;

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    }

    setBookedSlot(slot);

    // Alert.alert('Booked!', `Your table for 2 at ${title} for ${slot} has been confirmed.`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{title}</Text>
        {typeof entity.rating === 'number' && <Text style={styles.rating}>{entity.rating.toFixed(1)}★</Text>}
      </View>

      {/* Sub-header: Categories + Price */}
      <Text style={styles.meta}>
        {[
          categories.slice(0, 2).join(', '),
          entity.price,
        ].filter(Boolean).join(' • ')}
      </Text>

      {summary && <Text style={styles.summary}>{summary}</Text>}

      {/* Address & Distance */}
      <View style={styles.infoBlock}>
        <TouchableOpacity onPress={openAddress}>
          <Text style={styles.address}>
            {[address, distMiles].filter(Boolean).join(' • ')} ↗
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mock Booking Slots */}
      {canReserve && entity.mockSlots && entity.mockSlots.length > 0 && (
        <View style={styles.availabilityContainer}>
          <Text style={styles.availabilityTitle}>
            {bookedSlot ? 'Booking Confirmed' : 'Instant Booking'}
          </Text>
          <View style={styles.slotsRow}>
            {entity.mockSlots.map((slot, index) => {
              const isFirst = index === 0;
              const isSelected = bookedSlot === slot;
              const isDisabled = bookedSlot !== null && !isSelected;

              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => handleBookSlot(slot)}
                  style={[
                    styles.slotChip,
                    isFirst && !bookedSlot && styles.nextAvailableSlot,
                    isSelected && styles.selectedSlot,
                    isDisabled && styles.disabledSlot,
                  ]}
                  activeOpacity={0.7}
                  disabled={bookedSlot !== null}
                >
                  <Text style={[
                    styles.slotText,
                    isFirst && !bookedSlot && styles.nextAvailableText,
                    isSelected && styles.selectedSlotText
                  ]}>
                    {isSelected ? `✓ ${slot}` : slot}
                  </Text>
                  {isFirst && !bookedSlot && (
                    <View style={styles.nextBadge}>
                      <Text style={styles.nextBadgeText}>NEXT</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Footer Actions */}
      {/* Reserve CTA (Primary) */}
      {canReserve && reserveUrl && (
        <TouchableOpacity style={[styles.cta, styles.reserve]} onPress={() => openUrl(reserveUrl)}>
          <Text style={styles.ctaText}>Reserve Table</Text>
        </TouchableOpacity>
      )}

      {/* Footer Actions: Phone + Yelp */}
      <View style={styles.footer}>
        {formattedPhone ? (
          <TouchableOpacity onPress={() => openUrl(`tel:${formattedPhone}`)} style={styles.phoneButton}>
            <Text style={styles.phoneText}>📞 {formattedPhone}</Text>
          </TouchableOpacity>
        ) : <View />}

        {yelpUrl && (
          <TouchableOpacity onPress={() => openUrl(yelpUrl)} style={styles.yelpLink}>
            <Text style={styles.yelpText}>View on Yelp <Text style={{ color: '#ff1a1a', fontWeight: '900' }}>→</Text></Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(20, 24, 33, 0.95)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  name: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
    lineHeight: 22,
  },
  rating: {
    color: '#ffd166',
    fontWeight: '800',
    fontSize: 14,
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  meta: {
    color: '#9aa0ad',
    fontSize: 13,
    fontWeight: '500',
    marginTop: -4,
  },
  infoBlock: {
    marginVertical: 4,
  },
  address: {
    color: '#8da4ef',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  summary: {
    color: '#e4e7ee',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'normal',
    opacity: 0.95,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  cta: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 4,
  },
  reserve: {
    backgroundColor: '#fff',
  },
  ctaText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  phoneText: {
    color: '#9aa0ad',
    fontSize: 12,
    fontWeight: '600',
  },
  yelpLink: {
    padding: 4,
  },
  yelpText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
    opacity: 0.7,
  },
  availabilityContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  availabilityTitle: {
    color: '#9aa0ad',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  nextAvailableSlot: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  nextAvailableText: {
    color: '#818cf8',
  },
  selectedSlot: {
    backgroundColor: '#34d399',
    borderColor: '#34d399',
  },
  selectedSlotText: {
    color: '#064e3b',
    fontWeight: '700',
  },
  disabledSlot: {
    opacity: 0.4,
  },
  nextBadge: {
    backgroundColor: '#818cf8',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nextBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
