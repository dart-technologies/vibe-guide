import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../hooks/useLocation';

const RADIUS_OPTIONS = [0.5, 1, 2, 5, 25];

export function LocationHeaderButton() {
    const {
        coords,
        city,
        radius,
        setRadius,
        requestLocation,
        error,
    } = useLocation();
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <>
            <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="location-sharp" size={20} color="#fff" style={{ left: 1 }} />
                {radius !== 1 && <View style={styles.badge}><Text style={styles.badgeText}>{radius}</Text></View>}
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <BlurView intensity={40} tint="dark" style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Refine Search</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Ionicons name="close-circle" size={24} color="#888" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.section}>
                                    <TouchableOpacity
                                        style={styles.coordsRow}
                                        onPress={() => {
                                            requestLocation();
                                            setModalVisible(false);
                                        }}
                                    >
                                        <Ionicons name="navigate" size={14} color="#8ea0ff" />
                                        <Text style={styles.coordsText}>
                                            {error ? 'Tap to retry location' : (city || 'Unknown Location')}
                                            <Text style={styles.coordsSub}>
                                                {coords ? ` (${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)})` : ''}
                                            </Text>
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.section}>
                                    <Text style={styles.sectionLabel}>Distance (miles)</Text>
                                    <View style={styles.radiusRow}>
                                        {RADIUS_OPTIONS.map((opt) => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.radiusOption, radius === opt && styles.radiusOptionActive]}
                                                onPress={() => setRadius(opt)}
                                            >
                                                <Text style={[styles.radiusText, radius === opt && styles.radiusTextActive]}>
                                                    {opt}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>


                            </BlurView>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    headerButton: {
        width: 36,
        height: 36,
        backgroundColor: '#ffffff15',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        overflow: 'visible',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#8ea0ff',
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0f1115',
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#000',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        backgroundColor: '#1c1f26',
        borderColor: '#ffffff15',
        borderWidth: 1,
        gap: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    section: {
        gap: 12,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8b91a0',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    coordsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#00000030',
        padding: 12,
        borderRadius: 12,
    },
    coordsText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    coordsSub: {
        color: '#8b91a0',
        fontWeight: '400',
    },
    radiusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    radiusOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#ffffff08',
        borderWidth: 1,
        borderColor: '#ffffff10',
    },
    radiusOptionActive: {
        backgroundColor: '#8ea0ff',
        borderColor: '#8ea0ff',
    },
    radiusText: {
        color: '#8b91a0',
        fontWeight: '600',
        fontSize: 12,
    },
    radiusTextActive: {
        color: '#0f1115',
    },



});
