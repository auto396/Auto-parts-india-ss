import React, { useState } from 'react';
import { View, ScrollView, Image, StyleSheet, Alert, TouchableOpacity, Modal } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, Chip, Divider, IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import { db, collection, addDoc } from '../services/firebase';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { getCurrentLocation, reverseGeocodeOSM } from '../services/location';

export default function SellPartScreen({ navigation, user }: any) {
  const [title, setTitle] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [category, setCategory] = useState('Engine Components');
  const [condition, setCondition] = useState('Brand New');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('Mumbai');
  const [contactName, setContactName] = useState(user?.displayName || user?.email?.split('@')[0] || '');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const categories = [
    'Engine Components', 'Body Parts', 'Electrical & Lights', 
    'Brakes & Suspension', 'Transmission', 'Interior Accessories', 'Wheels & Tyres'
  ];

  const popularBrands = [
    'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda', 'Kia', 'Ford'
  ];

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
      console.warn('Image picker error:', err);
    }
  };

  const handleDetectLocation = async () => {
    setLocLoading(true);
    try {
      const coords = await getCurrentLocation();
      if (coords) {
        const geo = await reverseGeocodeOSM(coords.latitude, coords.longitude);
        if (geo?.city) {
          setLocation(`${geo.city}, ${geo.state}`);
        }
      }
    } catch (err) {
      console.warn('GPS location error:', err);
    } finally {
      setLocLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !carBrand || !carModel || !price) {
      Alert.alert('Required Fields', 'Please fill in Part Title, Car Brand, Car Model, and Price.');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        finalImageUrl = await uploadImageToCloudinary(imageUrl, 'spare_parts');
      }

      await addDoc(collection(db, 'spareParts'), {
        title,
        carBrand,
        carModel,
        category,
        condition,
        price: Number(price),
        location,
        contactName,
        contactPhone,
        description,
        imageUrl: finalImageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400',
        sellerId: user?.uid || 'guest',
        sellerEmail: user?.email || '',
        createdAt: Date.now(),
        approved: true,
        verified: true,
      });

      Alert.alert('Success', 'Your spare part listing has been published!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text variant="headlineSmall" style={styles.title}>List Spare Part</Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Reach thousands of buyers & mechanics across India
      </Text>

      {/* Image Upload Banner */}
      <TouchableOpacity style={styles.imageBox} onPress={handlePickImage}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.previewImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <IconButton icon="camera-plus" size={32} iconColor="#1565FF" />
            <Text variant="bodyMedium" style={{ color: '#1565FF', fontWeight: 'bold' }}>
              Upload Part Photo
            </Text>
            <Text variant="bodySmall" style={{ color: '#94A3B8' }}>Tap to select from gallery</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        label="Part Title *"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        placeholder="e.g. Maruti Swift Front Brake Pads"
        style={styles.input}
      />

      <Text variant="titleSmall" style={styles.label}>Select Car Brand *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {popularBrands.map((brand) => (
          <Chip
            key={brand}
            selected={carBrand === brand}
            onPress={() => setCarBrand(brand)}
            style={styles.brandChip}
          >
            {brand}
          </Chip>
        ))}
      </ScrollView>

      <TextInput
        label="Car Model *"
        value={carModel}
        onChangeText={setCarModel}
        mode="outlined"
        placeholder="e.g. Swift, Creta, i20, Scorpio"
        style={styles.input}
      />

      <TouchableOpacity onPress={() => setShowCategoryModal(true)} style={styles.categorySelectBtn}>
        <Text style={{ color: '#0F172A', fontWeight: '500' }}>Category: {category}</Text>
        <Text style={{ color: '#1565FF' }}>Change ▾</Text>
      </TouchableOpacity>

      <TextInput
        label="Price (₹) *"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        mode="outlined"
        placeholder="e.g. 2500"
        style={styles.input}
      />

      <Text variant="titleSmall" style={styles.label}>Condition</Text>
      <SegmentedButtons
        value={condition}
        onValueChange={setCondition}
        buttons={[
          { value: 'Brand New', label: 'New' },
          { value: 'Like New', label: 'Like New' },
          { value: 'Used (Good)', label: 'Used' },
        ]}
        style={styles.segmented}
      />

      <View style={styles.locationContainer}>
        <TextInput
          label="City / Location"
          value={location}
          onChangeText={setLocation}
          mode="outlined"
          placeholder="e.g. Mumbai, Maharashtra"
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
        />
        <TouchableOpacity 
          style={styles.gpsBtn} 
          onPress={handleDetectLocation}
          disabled={locLoading}
        >
          {locLoading ? (
            <ActivityIndicator size={18} color="#1565FF" />
          ) : (
            <IconButton icon="crosshairs-gps" size={20} iconColor="#1565FF" style={{ margin: 0 }} />
          )}
        </TouchableOpacity>
      </View>

      <TextInput
        label="Contact Name"
        value={contactName}
        onChangeText={setContactName}
        mode="outlined"
        style={[styles.input, { marginTop: 12 }]}
      />

      <TextInput
        label="Contact Phone Number"
        value={contactPhone}
        onChangeText={setContactPhone}
        keyboardType="phone-pad"
        mode="outlined"
        placeholder="+91 9876543210"
        style={styles.input}
      />

      <TextInput
        label="Description & Fitment Notes"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        mode="outlined"
        placeholder="Mention part OEM number, condition details, or fitment compatibility"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        buttonColor="#1565FF"
        style={styles.submitButton}
      >
        Publish Listing
      </Button>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>Select Category</Text>
            <Divider style={{ marginVertical: 12 }} />
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.catItem}
                onPress={() => {
                  setCategory(cat);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={[styles.catText, category === cat && { color: '#1565FF', fontWeight: 'bold' }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
            <Button mode="contained" buttonColor="#0F172A" onPress={() => setShowCategoryModal(false)} style={{ marginTop: 16 }}>
              Close
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontWeight: 'bold',
    color: '#0B1220',
  },
  subtitle: {
    color: '#64748B',
    marginBottom: 16,
  },
  imageBox: {
    height: 140,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  input: {
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsBtn: {
    height: 50,
    width: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: '#0B1220',
    marginTop: 4,
    marginBottom: 8,
  },
  brandChip: {
    marginRight: 6,
    backgroundColor: '#F1F5F9',
  },
  categorySelectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
  },
  segmented: {
    marginBottom: 16,
  },
  submitButton: {
    marginVertical: 16,
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  catItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  catText: {
    fontSize: 15,
    color: '#0F172A',
  },
});
