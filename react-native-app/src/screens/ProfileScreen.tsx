import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { 
  Text, 
  List, 
  Button, 
  Divider, 
  IconButton, 
  Surface,
  Badge,
  useTheme 
} from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import { 
  auth, 
  db, 
  doc, 
  setDoc, 
  onSnapshot, 
  signOut, 
  updateProfile, 
  serverTimestamp 
} from '../services/firebase';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { UserProfile } from '../types';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250';

export default function ProfileScreen({ navigation, user: initialUser }: any) {
  const theme = useTheme();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  const currentAuthUser = auth.currentUser || initialUser;

  // 1. Real-time Profile Sync via Firestore onSnapshot
  useEffect(() => {
    if (!currentAuthUser?.uid) {
      setProfileData(null);
      return;
    }

    const userDocRef = doc(db, 'users', currentAuthUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            id: docSnap.id,
            email: data.email || currentAuthUser.email || '',
            name: data.name || data.displayName || currentAuthUser.displayName || '',
            displayName: data.displayName || data.name || currentAuthUser.displayName || '',
            photoURL: data.photoURL || currentAuthUser.photoURL || '',
            phone: data.phone || '',
            role: data.role || 'buyer',
            createdAt: data.createdAt,
          });
          setCacheBuster(Date.now());
        } else {
          // Initialize user profile fallback if document doesn't exist yet
          setProfileData({
            id: currentAuthUser.uid,
            email: currentAuthUser.email || '',
            name: currentAuthUser.displayName || '',
            displayName: currentAuthUser.displayName || '',
            photoURL: currentAuthUser.photoURL || '',
            role: 'buyer',
          });
        }
      },
      (error) => {
        console.warn('[ProfileScreen] Firestore onSnapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentAuthUser?.uid]);

  // 2. Photo Upload & Sync to Auth + Firestore
  const handleUpdateProfilePhoto = async () => {
    if (!currentAuthUser?.uid) {
      Alert.alert('Sign In Required', 'Please sign in to update your profile photo.');
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.85,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to select image from gallery.');
        return;
      }

      const selectedAsset = result.assets?.[0];
      if (!selectedAsset?.uri) {
        return;
      }

      setUploadingPhoto(true);

      // Upload image to Cloudinary (or fallback storage)
      const uploadedUrl = await uploadImageToCloudinary(selectedAsset.uri, 'avatars');

      // Update Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: uploadedUrl,
        });
      }

      // Update Firestore user document
      const userDocRef = doc(db, 'users', currentAuthUser.uid);
      await setDoc(
        userDocRef,
        {
          photoURL: uploadedUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Force immediate cache bust
      setCacheBuster(Date.now());
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (err: any) {
      console.error('[ProfileScreen] Photo upload error:', err);
      Alert.alert('Upload Failed', err.message || 'Could not update profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.navigate('Home');
    } catch (err: any) {
      console.warn('Sign out error:', err);
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  // Determine active photo URL with cache buster
  const rawPhoto = profileData?.photoURL || currentAuthUser?.photoURL;
  const displayPhotoUrl = rawPhoto
    ? `${rawPhoto}${rawPhoto.includes('?') ? '&' : '?'}t=${cacheBuster}`
    : DEFAULT_AVATAR;

  const displayName =
    profileData?.displayName ||
    profileData?.name ||
    currentAuthUser?.displayName ||
    currentAuthUser?.email?.split('@')[0] ||
    'Auto Parts Member';

  const userEmail = profileData?.email || currentAuthUser?.email || 'Not logged in';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Profile Section */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            onPress={handleUpdateProfilePhoto} 
            activeOpacity={0.8}
            style={styles.avatarTouch}
            disabled={uploadingPhoto}
          >
            <Image
              key={`avatar-${cacheBuster}`}
              source={{ uri: displayPhotoUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
            {uploadingPhoto ? (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.cameraIconBadge}>
                <IconButton icon="camera" size={16} iconColor="#FFFFFF" style={styles.cameraIcon} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text variant="headlineSmall" style={styles.name}>
          {displayName}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {userEmail}
        </Text>

        {profileData?.role && (
          <Badge style={styles.roleBadge}>
            {profileData.role.toUpperCase()}
          </Badge>
        )}
      </Surface>

      <Divider style={styles.divider} />

      {currentAuthUser ? (
        <View style={styles.content}>
          <List.Section>
            <List.Subheader style={styles.sectionHeader}>Account & Listings</List.Subheader>
            
            <List.Item
              title="My Listings"
              description="Manage, edit, or delete your posted spare parts"
              left={(props) => <List.Icon {...props} icon="car-cog" color="#1565FF" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Home')}
              style={styles.listItem}
            />

            <List.Item
              title="Post a Spare Part"
              description="Sell new, used, or OEM auto components"
              left={(props) => <List.Icon {...props} icon="plus-circle" color="#10B981" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Sell')}
              style={styles.listItem}
            />

            <List.Item
              title="Buyer & Seller Messages"
              description="Chat and deal directly with buyers across India"
              left={(props) => <List.Icon {...props} icon="chat-processing" color="#8B5CF6" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Chats')}
              style={styles.listItem}
            />

            <Divider style={{ marginVertical: 8 }} />
            <List.Subheader style={styles.sectionHeader}>Administration & Settings</List.Subheader>

            <List.Item
              title="Admin Moderation"
              description="Verify listings, manage banners, and view stats"
              left={(props) => <List.Icon {...props} icon="shield-account" color="#F59E0B" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Admin')}
              style={styles.listItem}
            />

            <List.Item
              title="Update Profile Photo"
              description="Choose a new profile picture from gallery"
              left={(props) => <List.Icon {...props} icon="camera-account" color="#64748B" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleUpdateProfilePhoto}
              style={styles.listItem}
            />
          </List.Section>

          <Button 
            mode="outlined" 
            onPress={handleSignOut} 
            textColor="#EF4444"
            icon="logout"
            style={styles.signOutButton}
          >
            Sign Out
          </Button>
        </View>
      ) : (
        <View style={styles.guestContainer}>
          <IconButton icon="account-lock-outline" size={54} iconColor="#64748B" />
          <Text variant="titleMedium" style={styles.guestTitle}>
            Guest Session
          </Text>
          <Text variant="bodyMedium" style={styles.guestText}>
            Sign in to manage your auto part listings, update your verified profile photo, and message buyers securely.
          </Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Auth')} 
            buttonColor="#1565FF"
            icon="login"
            style={styles.loginBtn}
          >
            Sign In / Register
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#0B1220',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarTouch: {
    position: 'relative',
    borderRadius: 50,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#1565FF',
    backgroundColor: '#1E293B',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1565FF',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B1220',
  },
  cameraIcon: {
    margin: 0,
  },
  name: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 4,
  },
  email: {
    color: '#94A3B8',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#1E293B',
    color: '#38BDF8',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  signOutButton: {
    borderColor: '#EF4444',
    marginTop: 20,
    borderRadius: 8,
  },
  guestContainer: {
    padding: 32,
    alignItems: 'center',
  },
  guestTitle: {
    color: '#0F172A',
    fontWeight: 'bold',
    marginTop: 8,
  },
  guestText: {
    textAlign: 'center',
    color: '#64748B',
    marginVertical: 14,
    lineHeight: 20,
  },
  loginBtn: {
    width: '100%',
    borderRadius: 8,
  },
});
