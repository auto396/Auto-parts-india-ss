import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { doc, updateDoc, db } from '../services/firebase';
import { uploadImageToCloudinary } from '../services/cloudinary';

export interface EditListingModalProps {
  visible: boolean;
  onClose: () => void;
  listing: any;
  onSuccess?: () => void;
}

export const EditListingModal: React.FC<EditListingModalProps> = ({
  visible,
  onClose,
  listing,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('Used');
  const [location, setLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title || '');
      setPrice(listing.price ? String(listing.price) : '');
      setCarBrand(listing.carBrand || '');
      setCarModel(listing.carModel || '');
      setCategory(listing.category || 'Engine Components');
      setCondition(listing.condition || 'Used');
      setLocation(listing.location || '');
      setContactPhone(listing.contactPhone || '');
      setDescription(listing.description || '');
      setImageUrl(listing.imageUrl || '');
    }
  }, [listing]);

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      if (result.assets && result.assets[0]?.uri) {
        setImageUrl(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[EditListingModal] Image pick error:', err);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !price.trim() || !carBrand.trim()) {
      Alert.alert('Validation Error', 'Title, Price, and Brand are required fields.');
      return;
    }

    if (!listing?.id) {
      Alert.alert('Error', 'Listing ID not found.');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        finalImageUrl = await uploadImageToCloudinary(imageUrl, 'spare_parts');
      }

      const listingRef = doc(db, 'spareParts', listing.id);
      await updateDoc(listingRef, {
        title: title.trim(),
        price: Number(price) || 0,
        carBrand: carBrand.trim(),
        carModel: carModel.trim(),
        category,
        condition,
        location: location.trim(),
        contactPhone: contactPhone.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
        updatedAt: Date.now(),
      });

      Alert.alert('Success', 'Listing updated successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('[EditListingModal] Update error:', err);
      Alert.alert('Update Failed', err.message || 'Failed to update listing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Part Listing</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Image Preview & Picker */}
            <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.previewImg} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="#1565FF" />
                  <Text style={styles.imagePlaceholderText}>Change Part Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.label}>Listing Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Maruti Swift Brake Caliper"
              placeholderTextColor="#94A3B8"
            />

            {/* Price */}
            <Text style={styles.label}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="e.g. 3500"
              placeholderTextColor="#94A3B8"
            />

            {/* Car Brand & Model */}
            <View style={styles.row}>
              <View style={styles.flexHalf}>
                <Text style={styles.label}>Brand *</Text>
                <TextInput
                  style={styles.input}
                  value={carBrand}
                  onChangeText={setCarBrand}
                  placeholder="e.g. Maruti"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={[styles.flexHalf, { marginLeft: 12 }]}>
                <Text style={styles.label}>Model</Text>
                <TextInput
                  style={styles.input}
                  value={carModel}
                  onChangeText={setCarModel}
                  placeholder="e.g. Swift"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Location */}
            <Text style={styles.label}>Location / City</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Mumbai, MH"
              placeholderTextColor="#94A3B8"
            />

            {/* Phone */}
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              placeholder="+91 9876543210"
              placeholderTextColor="#94A3B8"
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholder="Item condition, fitment notes, OEM part number"
              placeholderTextColor="#94A3B8"
            />

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default EditListingModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 32, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  imagePicker: {
    height: 130,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#1565FF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexHalf: {
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1565FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
