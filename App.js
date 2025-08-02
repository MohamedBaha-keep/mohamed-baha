
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Modal,
  RefreshControl,
  Button,
  Platform,
} from 'react-native';

import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';

import { ref, uploadBytes,getDownloadURL } from 'firebase/storage';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { storage, db} from './firebaseConfig';
import { serverTimestamp } from 'firebase/firestore';


import DropDownPicker from 'react-native-dropdown-picker';

import MapView, { Marker } from 'react-native-maps';

import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';


import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import messaging from '@react-native-firebase/messaging';


import * as Device from 'expo-device';


// notification 

// Request permission & get token

export async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}




const TAB_GREEN = '#25D366';
const TAB_BLUE = '#007bff';




const states = [
  "نواكشوط", "نواذيبو", "أطار", "تجكجة", "سيلبابي",
  "كيفة", "اكجوجت", "روصو", "النعمة", "الزويرات"
];

function HomeScreen({ navigation }) {

  // hoks for nkc home screen
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const [query, setQuery] = useState('نواكشوط'); // default value
  const [filteredStates, setFilteredStates] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const typingAnim = useRef(new Animated.Value(0)).current;
  const [showFullDescription, setShowFullDescription] = useState(false);
  const typingText = "مرحبا بك في بيتي";


//   for map view
const [mapListings, setMapListings] = useState([]);
const [selectedListing, setSelectedListing] = useState(null);

const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);



useEffect(() => {
  const fetchListings = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'houses'));
      const data = snapshot.docs
     .map(doc => ({ id: doc.id, ...doc.data() }))
     .filter(item => item.latitude && item.longitude);
      setMapListings(data);
    } catch (error) {
      console.error("Error fetching map listings:", error);
    }
  };

  fetchListings();
}, []);



// refrech  
const onRefresh = async () => {
  setRefreshing(true);
  try {
    const snapshot = await getDocs(collection(db, 'houses'));
    const data = snapshot.docs
      .map(doc => doc.data())
      .filter(item => item.latitude && item.longitude);
    setMapListings(data);
    
    
    // Reset selection on refresh
    setSelectedListing(null);
  } catch (error) {
    console.error("Error refreshing listings:", error);
  }
  setRefreshing(false);
};



  useEffect(() => {
    Animated.timing(typingAnim, {
      toValue: typingText.length,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, []);

  const typedText = typingText;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      fetch('https://script.google.com/macros/s/AKfycbwpKcqTHCqtkgzse_jd8xio_E-kb9tX79iHtOHOmyy5OyepQ4nyBShMW8zSf7CpzfRA/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      }).catch(err => console.error('❌ Error sending location:', err));
    })();
  }, []);

  useEffect(() => {
    handleSearch("نواكشوط");
  }, []);

  const handleSearch = (text) => {
    setQuery(text);
    const filtered = states.filter(state =>
      state.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredStates(filtered);
    setShowSuggestions(true);
  };

  const handleSelectState = (state) => {
    setQuery(state);
    setShowSuggestions(false);

    if (state === "نواكشوط") {
      navigation.navigate('Nouakchott');
    } else {
      Alert.alert("غير متوفر", "حاليًا تطبيق بيتي يغطي منطقة نواكشوط فقط!");
    }
  };

  const renderSuggestion = ({ item }) => (
    <Text
      style={{
        padding: 10,
        fontSize: 16,
        color: '#000',
        textAlign: 'right',
        
      }}
      onPress={() => handleSelectState(item)}
    >
      {item}
    </Text>
  );

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setShowSuggestions(false);
    }}>
      <ScrollView

style={{ flex: 1, backgroundColor: '#06214e' }}
contentContainerStyle={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 }}
keyboardShouldPersistTaps="handled"
refreshControl={
  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
}
>
      
<Text style={{ fontSize: 22, color: 'cyan', marginTop: 20, marginBottom: 40, textAlign: 'center' }}>
         {typedText}
         </Text> 

<View style={{ position: 'relative' }}>
  <TextInput
    placeholder="ابحث عن الولاية..."
    placeholderTextColor="#ccc"
    value={query}
    onChangeText={handleSearch}
    onFocus={() => setShowSuggestions(true)}
    style={{
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 12,
      paddingRight: 15,
      fontSize: 16,
      textAlign: 'right',
      marginBottom: 10,
    }}
  />
  {/* Search Icon on Left */}
  <Text style={{
    position: 'absolute',
    left: 10,
    top: 12,
    fontSize: 18,
    color: '#999'
  }}>
    🔍
  </Text>
</View>

{showSuggestions && filteredStates.length > 0 && (
  <ScrollView
    style={{
      backgroundColor: '#fff',
      borderRadius: 10,
      borderColor: '#ccc',
      borderWidth: 1,
      marginBottom: 10,
      maxHeight: 150,
    }}
    keyboardShouldPersistTaps="handled"
  >
    {filteredStates.map((item, index) => (
      <Text
        key={index}
        style={{
          padding: 10,
          fontSize: 16,
          color: '#000',
          textAlign: 'right',
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
        }}
        onPress={() => handleSelectState(item)}
      >
        {item}
      </Text>
    ))}
  </ScrollView>
)}







 {/* //   for map test  */}
 
 {imageViewerVisible && (
  <Modal visible={imageViewerVisible} transparent={true}>
    <View style={{
      flex: 1,
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{
          x: currentImageIndex * Dimensions.get('window').width,
          y: 0
        }}
      >
        {selectedImages.map((img, index) => (
          <Image
            key={index}
            source={{ uri: img }}
            style={{ width: Dimensions.get('window').width, height: 600, marginTop: 120 }}
            resizeMode="contain"
          />
        ))}
      </ScrollView>


      <TouchableOpacity
        onPress={() => setImageViewerVisible(false)}
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          backgroundColor: '#fff',
          padding: 10,
          borderRadius: 20,
        }}
      >
        <Text style={{ fontSize: 24, color: '#000' }}>✖️</Text>
      </TouchableOpacity>
    </View>
  </Modal>
)}

 <MapView
  style={{ height: 300, borderRadius: 10, marginBottom: 20 }}
  initialRegion={{
    latitude: 18.079,
    longitude: -15.965,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
>
  {mapListings.map((item, index) => (
    <Marker
      key={index}
      coordinate={{
        latitude: item.latitude,
        longitude: item.longitude,
      }}
      title={item.name || "عقار"}
      description={`📍 ${item.area} | 💰 ${item.price}`}
      onPress={() => setSelectedListing(item)} 
    />
  ))}
</MapView>

{selectedListing && (
  <View style={{
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 20,
    overflow: 'hidden',
    elevation: 3,
  }}>
    {/* Scrollable Images with Arrows */}
    <View style={{ position: 'relative' }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: '100%', height: 200 }}
      >
        {Array.isArray(selectedListing.images) && selectedListing.images.map((img, index) => (
          <TouchableOpacity
            key={`${img}_${index}`}
            onPress={() => {
              setSelectedImages(selectedListing.images);
              setCurrentImageIndex(index);
              setImageViewerVisible(true);
            }}
          >
            <Image
              source={{ uri: img }}
              style={{ width: Dimensions.get('window').width - 40, height: 200 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Left Arrow */}
      <TouchableOpacity
        onPress={() => {
          if (currentImageIndex > 0) setCurrentImageIndex(prev => prev - 1);
        }}
        style={{
          position: 'absolute', left: 10, top: '45%',
          backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 20
        }}
      >
        <Text style={{ color: '#fff', fontSize: 20 }}>{'<'}</Text>
      </TouchableOpacity>

      {/* Right Arrow */}
      <TouchableOpacity
        onPress={() => {
          if (
            Array.isArray(selectedListing.images) &&
            currentImageIndex < selectedListing.images.length - 1
          ) {
            setCurrentImageIndex(prev => prev + 1);
          }
        }}
        style={{
          position: 'absolute', right: 10, top: '45%',
          backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 20
        }}
      >

        <Text style={{ color: '#fff', fontSize: 20 }}>{'>'}</Text>
      </TouchableOpacity>
    </View>

    {/* Card Info */}
    <View style={{ padding: 12 }}>
      <Text style={{ fontSize: 16, color: '#007bff', marginBottom: 4 ,textAlign:"right"}}>
        📍 {selectedListing.area}
      </Text>

      {selectedListing.availability === 'sold' && (
        <Text style={{ color: 'green', fontWeight: 'bold', marginBottom: 6,textAlign:"right" }}>
           تم البيع
        </Text>
      )}

      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4, textAlign:"right" }}>
        💰 {selectedListing.price}
      </Text>
     

      <Text style={{ fontSize: 14, color: '#333', marginBottom: 6 ,textAlign:"right"}}>
        🛏 {selectedListing.rooms} غرف | 🛁 {selectedListing.bathrooms} حمام | 📐 {selectedListing.areaSize || '—'} م²
      </Text>

      
    <Text
    numberOfLines={showFullDescription ? undefined : 3}
    style={{ fontSize: 14, color: '#555', marginTop: 6, textAlign: 'right' }}
  >
    {selectedListing.description}
  </Text>

  {selectedListing.description?.length > 100 && (
    <TouchableOpacity onPress={() => setShowFullDescription(prev => !prev)}>
      <Text style={{ color: '#007bff', textAlign: 'right', marginTop: 4, textAlign:"left" }}>
        { showFullDescription? 'عرض أقل ▲' : 'عرض المزيد ▼'}
      </Text>
    </TouchableOpacity>
  )}


      {/* Call & WhatsApp Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:+22241872600`)}
          style={{
            flex: 1,
            backgroundColor: '#28a745',
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>📞 اتصال</Text>
        </TouchableOpacity>

        <TouchableOpacity
  onPress={() => {
    const message = `مرحباً، أنا مهتم بهذا الإعلان: ${selectedListing?.id || 'غير محدد'}`;
    const phoneNumber = '22241872600';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    Alert.alert(
      'فتح واتساب',
      'هل ترغب في فتح واتساب للتواصل؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'فتح',
          onPress: () => Linking.openURL(url),
        },
      ]
    );
  }}
  style={{
    flex: 1,
    backgroundColor: '#25D366',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  }}
>
  <Text style={{ color: '#fff', fontWeight: 'bold' }}>💬 واتساب</Text>
</TouchableOpacity>
      </View>
    </View>
  </View>
)}

{/* //end of map   */}


 {/* 🚗 Cars List Button */}


     <TouchableOpacity
      style={styles.carButton}
      onPress={() => navigation.navigate('CarsScreen')}
>
     <Text style={styles.carButtonText}> قائمة السيارات</Text>
   </TouchableOpacity>


        {!isConnected && (
          <View style={{ padding: 20 }}>
            <Text style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>
              📡 لا يوجد اتصال بالإنترنت
            </Text>
          </View>
        )}

       
      </ScrollView>
      </TouchableWithoutFeedback>
  );
}

export { HomeScreen };





//     for nkc list 


function NouakchottScreen() {
  
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [areaQuery, setAreaQuery] = useState('');
  const [typeQuery, setTypeQuery] = useState('');
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const [houses, setHouses] = useState([]);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const [selectedImages, setSelectedImages] = useState([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);



// for refrech page 


const onRefresh = async () => {
  setRefreshing(true);

  // Clear filters and queries to show all
  setSelectedArea(null);
  setAreaQuery('');
  setSelectedType(null);
  setTypeQuery('');

  try {
    const snapshot = await getDocs(collection(db, 'houses'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setHouses(data);
  } catch (error) {
    console.error('Refresh error:', error);
  }
  
  setRefreshing(false);
};




  const neighborhoods = [
    "تفرغ زينة", "لكصر", "السبخة", "عرفات", "الرياض",
    "دار النعيم", "تيارت", "توجنين", "الميناء", "الدار البيضاء","عين الطلح"
  ];

  const types = ["للبيع", "للإيجار", "أراضٍ"];


  // fetchHouses 

  useEffect(() => {



    
  const fetchHouses = async () => {
    setRefreshing(true); // Force spinner
    try {
      const snapshot = await getDocs(collection(db, 'houses'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHouses(data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setRefreshing(false); // Hide spinner
  };

  fetchHouses();
}, []);







  const filteredNeighborhoods = neighborhoods.filter(area =>
    area.includes(areaQuery.trim())
  );

  const filteredTypes = types.filter(type =>
    type.includes(typeQuery.trim())
  );

  const filteredHouses = houses.filter(house => {
    return (!selectedArea || house.area === selectedArea) &&
           (!selectedType || house.type === selectedType);
  });




// store favorites by item ID as keys

const [favoritesMap, setFavoritesMap] = useState({});

// Load favorites once on mount
useEffect(() => {
  (async () => {
    const json = await AsyncStorage.getItem('favorites');
    try {
      const saved = JSON.parse(json) || [];
      setFavoritesMap(saved.reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {}));
    } catch (e) {
      console.warn('Favorites parsing error:', e);
    }
  })();
}, []);

const toggleFavorite = async (item) => {
  try {
    const json = await AsyncStorage.getItem('favorites');
    let saved = [];

    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) saved = parsed;
    } catch { }

    const exists = saved.find(fav => fav.id === item.id);

    let updated;
    if (exists) {
      updated = saved.filter(fav => fav.id !== item.id);
    } else {
      updated = [...saved, item];
    }

    await AsyncStorage.setItem('favorites', JSON.stringify(updated));
    setFavoritesMap(updated.reduce((acc, it) => ({ ...acc, [it.id]: true }), {}));
  } catch (e) {
    console.error('Error toggling favorite:', e);
  }
};



  return (
    <FlatList
      style={{ flex: 1, backgroundColor: '#06214e', padding: 20 }}
      data={filteredHouses}
      keyExtractor={(item, index) => index.toString()}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={
      

    <>



{/* image card visibility*/}


{imageViewerVisible && (
  <Modal visible={imageViewerVisible} transparent={true}>
    <View style={{
      flex: 1,
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: currentImageIndex * Dimensions.get('window').width, y: 0 }}
      >
        {selectedImages.map((img, index) => (
          <Image
            key={index}
            source={{ uri: img }}
            style={{ width: Dimensions.get('window').width, height: 600 , marginTop:120}}
            resizeMode="contain"
          />
        ))}
      </ScrollView>

      {/* Close Button */}
      <TouchableOpacity
        onPress={() => setImageViewerVisible(false)}
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          backgroundColor: '#ffff',
          padding: 10,
          borderRadius: 20,
        }}
      >
        <Text style={{ fontSize: 24, color: '#fff' }}>✖️</Text>
      </TouchableOpacity>
    </View>
  </Modal>
)}
{/*  */}

    
       {/* Back Button */}

<TouchableOpacity
  style={{
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  }}
  onPress={() => navigation.goBack()}
>
  <Text style={{ fontSize: 24, color: 'black' }}>←</Text>
</TouchableOpacity>


      {/* Spinner for refrech  */}
       {refreshing && (
          <ActivityIndicator size="large" color="cyan" style={{ marginBottom: 20 }} />
        )}

          <Text style={{ fontSize: 22, color: 'cyan', textAlign: 'center', marginBottom: 30 , marginTop:40,}}>
            اختر المنطقة ونوع العقار
          </Text>
       
  
        
  
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>



  {/* حي Input with Arrow */}
  
  <TouchableWithoutFeedback onPress={() => setShowAreaSuggestions(false)}>
  <View style={{ flex: 1 }}>
    <View style={{ position: 'relative', zIndex: 10 }}>
      <TextInput
        value={areaQuery}
        onChangeText={(text) => {
          setAreaQuery(text);
          setShowAreaSuggestions(true);
        }}
        placeholder="المنطقة"
        placeholderTextColor="#999"
        style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          paddingVertical: 12,
          paddingHorizontal: 14,
          fontSize: 16,
          textAlign: 'right',
          color: '#000',
          borderWidth: 1,
          borderColor: '#ccc',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
          elevation: 2,
        }}
        onFocus={() => setShowAreaSuggestions(true)}
      />

      <TouchableOpacity
        style={{ position: 'absolute', left: 14, top: 16 }}
        onPress={() => setShowAreaSuggestions(!showAreaSuggestions)}
      >
        <Text style={{ fontSize: 16, color: '#999' }}>
          {showAreaSuggestions ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {showAreaSuggestions && filteredNeighborhoods.length > 0 && (
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 10,
            maxHeight: 160,
            marginTop: 8,
            borderWidth: 1,
            borderColor: '#eee',
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <ScrollView
            style={{ maxHeight: 160 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filteredNeighborhoods.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedArea(item);
                  setAreaQuery(item);
                  setShowAreaSuggestions(false);
                  Keyboard.dismiss();
                }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f0f0f0',
                }}
              >
                <Text style={{ fontSize: 15, color: '#333', textAlign: 'right' }}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  </View>
</TouchableWithoutFeedback>



  {/* نوع العقار Input with Arrow */}
   <View style={{ flex: 1, position: 'relative' }}>
    <TextInput
      value={typeQuery}
      onChangeText={(text) => {
        setTypeQuery(text);
        setShowTypeSuggestions(true);
      }}
      placeholder="النوع"
      placeholderTextColor="#999"
      style={{
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        fontSize: 16,
        textAlign: 'right',
        color: '#000',
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
      }}
      onFocus={() => setShowTypeSuggestions(true)}
    />
    <TouchableOpacity
      style={{ position: 'absolute', left: 10, top: 12 }}
      onPress={() => setShowTypeSuggestions(!showTypeSuggestions)}
    >
      <Text style={{ fontSize: 16 ,color: '#999' }}>
        
        {showTypeSuggestions ? '▲' : '▼'}
      </Text>
    </TouchableOpacity>

    {showTypeSuggestions && filteredTypes.length > 0 && (
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 8,
        maxHeight: 120,
        marginTop: 5,
        overflow:"scroll"
      }}>
        <FlatList
          data={filteredTypes}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedType(item);
                setTypeQuery(item);
                setShowTypeSuggestions(false);
              }}
            >
              <Text style={{
                padding: 10,
                fontSize: 14,
                textAlign: 'right',
                backgroundColor: '#fff',
                borderBottomColor: '#ccc',
                borderBottomWidth: 1,
              }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    )}
  </View>
</View>  


  

   
</>
  

       }
    
   
renderItem={({ item }) => (
  <View style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 20, overflow: 'hidden' }}>
    {/* Scrollable Images with Arrows */}
    <View style={{ position: 'relative' }}>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: '100%', height: 200 }}
      >
        {Array.isArray(item.images) && item.images.map((img, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setSelectedImages(item.images);
              setCurrentImageIndex(index);
              setImageViewerVisible(true);
            }}
          >
            <Image
              source={{ uri: img }}
              style={{ width: Dimensions.get('window').width -40, height: 200 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Left Arrow */}
      <TouchableOpacity
        onPress={() => {
          if (currentImageIndex > 0) setCurrentImageIndex(prev => prev - 1);
        }}
        style={{
          position: 'absolute', left: 10, top: '45%',
          backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 20
        }}
      >
        <Text style={{ color: '#fff', fontSize: 20 }}>{'<'}</Text>
      </TouchableOpacity>

      {/* Right Arrow */}
      <TouchableOpacity
        onPress={() => {
          if (Array.isArray(item.images) && currentImageIndex < item.images.length - 1)
            setCurrentImageIndex(prev => prev + 1);
        }}
        style={{
          position: 'absolute', right: 10, top: '45%',
          backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 20
        }}
      >
        <Text style={{ color: '#fff', fontSize: 20 }}>{'>'}</Text>
      </TouchableOpacity>

       {/* for favorite */}
       <TouchableOpacity
  onPress={() => toggleFavorite(item)}
  style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}
>
  <Ionicons
    name={favoritesMap[item.id] ? 'heart' : 'heart-outline'}
    size={26}
    color={favoritesMap[item.id] ? 'red' : 'gray'}
  />
</TouchableOpacity>

    </View>


  



     {/* Card Content */}
     <View style={{ padding: 12,}}>
      <Text style={{ fontSize: 16, color: '#007bff', marginBottom: 4 ,textAlign:"right"}}>
        📍 {item.area}
      </Text>
     {/* Availability Tag */}
        {item.availability === 'sold' && (
       <Text style={{ color: 'red', fontWeight: 'bold', marginBottom: 6,textAlign:"right" }}>🔴 تم البيع</Text>
       )}

      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4,textAlign:"right" }}>
        💰 {item.price}
      </Text>
      <Text style={{ fontSize: 14, color: '#333', marginBottom: 6 ,textAlign:"right"}}>
        🛏 {item.rooms} غرف | 🛁 {item.bathrooms} حمام | 📐 {item.areaSize || '—'} م²
      </Text>


      <Text numberOfLines={3} style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
        {item.description}
      </Text>  
       {/* Expandable Description */}
  <ExpandableDescription text={item.description} />


 

     
{/* Buttons */}
<View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
  <TouchableOpacity
    onPress={() => Linking.openURL(`tel:+22241872600`)}
    style={{
      flex: 1,
      backgroundColor: '#28a745',
      padding: 10,
      borderRadius: 8,
      alignItems: 'center'
    }}
  >
    <Text style={{ color: '#fff', fontWeight: 'bold' }}>📞 اتصال</Text>
  </TouchableOpacity>

  
  <TouchableOpacity
      onPress={() => {
        const message = `مرحباً، أنا مهتم بهذا الإعلان: ${item.id}`;
        const phoneNumber = '22241872600';
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    Alert.alert(
      'فتح واتساب',
      'هل ترغب في فتح واتساب للتواصل؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'فتح',
          onPress: () => Linking.openURL(url),
        },
      ]
    );
  }}
       style={{
         flex: 1,
            backgroundColor: '#25D366',
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
         }}
>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>💬 واتساب</Text>
      </TouchableOpacity>
     </View>
    </View>
  </View>

      

      

      )}
      ListEmptyComponent={
        <Text style={{ color: 'cyan', textAlign: 'center', marginTop: 40 }}>
          لا توجد عروض مطابقة حتى الآن.
        </Text>
      }
    />
  );

}





// main tab

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Main bottom tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="الرئيسية"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'الرئيسية':
              iconName = 'home';
              break;
            case 'نشر':
              iconName = 'add-circle';
              break;
            case 'معلومات':
              iconName = 'information-circle';
              break;
            case 'التواصل':
              iconName = 'chatbubbles';
              break;
            case 'المفضلة':   // Add this case
              iconName = 'heart';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'blue',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          // paddingBottom: 5,
          // height: 50,
          // marginBottom:25,
         
        },
        tabBarLabelStyle: {
          fontSize: 12,
          
        },
        
      })}
    >
      <Tab.Screen name="الرئيسية" component={HomeScreen} />
      <Tab.Screen name="معلومات" component={InfoScreen} />
      <Tab.Screen name="التواصل" component={ContactScreen} />
      <Tab.Screen name="المفضلة" component={FavoritesScreen} />
      <Tab.Screen name="نشر" component={PostScreen} />
    </Tab.Navigator>
  );
}



// App with stack navigator
export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Response:', response);
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;
    if (!Device.isDevice) {
      Alert.alert('يجب استخدام جهاز حقيقي للحصول على إشعارات الدفع.');
      return;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('فشل الحصول على إذن الإشعارات!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

    const tokenId = token.replace(/[^a-zA-Z0-9]/g, '');
    await setDoc(doc(db, 'tokens', tokenId), {
      token,
      platform: Platform.OS,
      createdAt: new Date(),
    });

    return token;
  }

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="MainTabs" component={MainTabs} />
//         <Stack.Screen name="Nouakchott" component={NouakchottScreen} />
//         <Stack.Screen name="CarsScreen" component={CarsScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }




  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Nouakchott" component={NouakchottScreen} />
        <Stack.Screen name="CarsScreen" component={CarsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}



// favorite -------------



function FavoritesScreen() {
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const loadFavorites = async () => {
    try {
      const json = await AsyncStorage.getItem('favorites');
      const saved = JSON.parse(json) || [];
      setFavorites(saved);
    } catch (e) {
      console.error('Load favorites error:', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, []);

  const removeFavorite = (id) => {
    Alert.alert('حذف', 'هل تريد إزالة هذا العنصر؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        onPress: async () => {
          const updated = favorites.filter(f => f.id !== id);
          await AsyncStorage.setItem('favorites', JSON.stringify(updated));
          setFavorites(updated);
        },
      },
    ]);
  };
  const renderItem = ({ item }) => (
   
 
    <View style={{ backgroundColor: '#fff', marginBottom: 20, borderRadius: 12, overflow: 'hidden', elevation: 3,marginTop:60}}>
      {/* Image Scroll */}
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {item.images?.map((uri, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setSelectedImages(item.images);
              setCurrentImageIndex(index);
              setImageViewerVisible(true);
            }}
          >
            <Image
              source={{ uri }}
              style={{ width: Dimensions.get('window').width - 40, height: 200 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Card Content */}
      <View style={{ padding: 12 }}>
        {/* Render differently based on whether it’s a car (has make) or house */}
        {item.make ? (
          <>
            {/* Car item */}
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'right' }}>
              {item.year} {item.make} - {item.model}
            </Text>

            <Text style={{ fontSize: 16, color: '#666', textAlign: 'right', marginTop: 4 }}>
              {item.kilometers} كم - {item.transmission}⚙️
            </Text>

            <Text style={{ fontSize: 16, color: '#008000', textAlign: 'right', marginTop: 4 }}>
              {item.price} أوقية
            </Text>

            {item.availability === 'sold' ? (
              <Text style={{ color: '#c00', textAlign: 'right', marginTop: 4, fontWeight: 'bold' }}>
                تم البيع
              </Text>
            ) : null}

            <Text
              numberOfLines={showFullDescription ? undefined : 3}
              style={{ fontSize: 14, color: '#555', marginTop: 6, textAlign: 'right' }}
            >
              {item.description}
            </Text>

            {item.description?.length > 100 && (
              <TouchableOpacity onPress={() => setShowFullDescription(prev => !prev)}>
                <Text style={{ color: '#007bff', textAlign: 'right', marginTop: 4 }}>
                  {showFullDescription ? 'عرض أقل ▲' : 'عرض المزيد ▼'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            {/* House item */}
            <Text style={{ fontSize: 16, color: '#007bff', marginBottom: 4, textAlign: 'right' }}>
              📍 {item.area}
            </Text>

            {item.availability === 'sold' && (
              <Text style={{ color: 'red', fontWeight: 'bold', marginBottom: 6, textAlign: 'right' }}>🔴 تم البيع</Text>
            )}

            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4, textAlign: 'right' }}>
              💰 {item.price}
            </Text>

            <Text style={{ fontSize: 14, color: '#333', marginBottom: 6, textAlign: 'right' }}>
              🛏 {item.rooms} غرف | 🛁 {item.bathrooms} حمام | 📐 {item.areaSize || '—'} م²
            </Text>

            <Text numberOfLines={3} style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
              {item.description}
            </Text>
          </>
        )}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 12 }}>
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:+22241872600`)}
            style={{
              flex: 1,
              backgroundColor: '#28a745',
              padding: 10,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>📞 اتصال</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const message = `مرحباً، أنا مهتم بهذا الإعلان: ${item.id}`;
              const phoneNumber = '22241872600';
              const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

              Alert.alert('فتح واتساب', 'هل ترغب في فتح واتساب للتواصل؟', [
                { text: 'إلغاء', style: 'cancel' },
                {
                  text: 'فتح',
                  onPress: () => Linking.openURL(url),
                },
              ]);
            }}
            style={{
              flex: 1,
              backgroundColor: '#25D366',
              padding: 10,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>💬 واتساب</Text>
          </TouchableOpacity>
        </View>

        {/* Remove Favorite Button */}
        <TouchableOpacity
          onPress={() => removeFavorite(item.id)}
          style={{ marginTop: 10, padding: 10, backgroundColor: '#f44', borderRadius: 6 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>🗑️ حذف من المفضلة</Text>
        </TouchableOpacity>
      </View>
    </View>
  
  );

  if (favorites.length === 0) {
    return (
      <View style={{padding: 20 }}>
        <Text style={{ textAlign: 'center', color: '#999',marginTop:100,fontSize:20 }}>لا توجد عناصر في المفضلة.</Text>
      </View>
    );
  }

  return (
    <>
    <FlatList
     style={{backgroundColor: '#06214e', }}
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={<View style={{ height: 60 }} />}
      />

      {/* Fullscreen image viewer */}
      {imageViewerVisible && (
        <Modal visible={imageViewerVisible} transparent={true}>
          <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: currentImageIndex * Dimensions.get('window').width, y: 0 }}
            >
              {selectedImages.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={{ width: Dimensions.get('window').width, height: 600, marginTop: 120 }}
                  resizeMode="contain"
                />
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setImageViewerVisible(false)}
              style={{ position: 'absolute', top: 50, right: 20, backgroundColor: '#fff', padding: 10, borderRadius: 20 }}
            >
              <Text style={{ fontSize: 24, color: '#000' }}>✖️</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
     
    </>
  ); 
}

// tsts



// contact secreen 

function ContactScreen() {
  return (
    <View style={styles.centered}>
      <TouchableOpacity style={[styles.btn, { backgroundColor: TAB_GREEN }]} onPress={() => Linking.openURL('https://wa.me/22241872600')}>
        <Text style={styles.btnText}>💬 WhatsApp</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: TAB_BLUE }]} onPress={() => Linking.openURL('tel:+22241872600')}>
        <Text style={styles.btnText}>📞 Call Us</Text>
      </TouchableOpacity>
    </View>
  );
}


// links permission 

const handleOpenLink = (url) => {
  Alert.alert(
    'فتح رابط خارجي',
    'هل تريد فتح هذا الرابط في المتصفح؟',
    [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'نعم', onPress: () => Linking.openURL(url) },
    ]
  );
};


function InfoScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#06214e', padding: 20, }}>
      <Text style={styles.footerHeader}>معلومات الشركة</Text>
      <Text style={styles.footerText}>العنوان: نواكشوط، موريتانيا</Text>
      <Text style={styles.footerText}>الهاتف: 41872600 222+</Text>
      <Text style={styles.footerText}>البريد: beytee.realestate@gmail.com</Text>

      <Text style={styles.footerHeader}>روابط</Text>

    

      <TouchableOpacity onPress={() => handleOpenLink('https://mohamedbaha-keep.github.io/forbeyteeprivacy/')}>
        <Text style={styles.footerText}>سياسة الخصوصية</Text>
     </TouchableOpacity>

      
      <TouchableOpacity onPress={() => handleOpenLink('https://mohamedbaha-keep.github.io/forbeytee-/')}>
        <Text style={styles.footerText}>شروط النشر</Text>
      </TouchableOpacity>

      <Text style={styles.footerHeader}>تابعنا</Text>

      <View style={styles.socialRow}>
        <Image source={require('./assets/facebook_icon.png')} style={styles.icon} />
        <Text style={styles.footerLink}>beytee.realestate</Text>
      </View>

      <View style={styles.socialRow}>
        <Image source={require('./assets/instagram_icon.png')} style={styles.icon} />
        <Text style={styles.footerLink}>beytee.realestate</Text>
      </View>

      <View style={styles.socialRow}>
        <Image source={require('./assets/twitter_icon.png')} style={styles.icon} />
        <Text style={styles.footerLink}>beytee.realestate</Text>
      </View>

      <View style={styles.socialRow}>
        <Image source={require('./assets/tiktok_icon.png')} style={styles.icon} />
        <Text style={styles.footerLink}>beytee.realestate</Text>
      </View>
    </ScrollView>
  );
}



// for shoe more and less in the description <<<hooks

const ExpandableDescription = ({ text }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  return (
    <>
      <Text
        numberOfLines={expanded ? undefined : 3}
        style={{ fontSize: 14, color: '#666' }}
      >
        {text}
      </Text>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={{ fontSize: 13, color: '#007bff', marginTop: 4 }}>
          {expanded ? 'عرض أقل ▲' : 'عرض المزيد ▼'}
        </Text>
      </TouchableOpacity>
    </>
  );
};








// function PostScreen() {
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [email, setEmail] = useState('');
//   const [location, setLocation] = useState('');
//   const [images, setImages] = useState([]);
//   const [sending, setSending] = useState(false);

//   const pickImages = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsMultipleSelection: true,
//       base64: true,
//       quality: 0.5,
//     });

//     if (!result.canceled) {
//       const selected = result.assets.map((asset) => ({
//         uri: asset.uri,
//         base64: asset.base64,
//       }));
//       setImages((prev) => [...prev, ...selected]);
//     }
//   };

//   const resetForm = () => {
//     setName('');
//     setPhone('');
//     setEmail('');
//     setLocation('');
//     setImages([]);
//   };

//   const sendEmail = async () => {
//     if (!name || !phone || !location || images.length === 0) {
//       Alert.alert('يرجى تعبئة جميع الحقول المطلوبة (باستثناء البريد الإلكتروني) واختيار صور.');
//       return;
//     }

//     setSending(true);

//     try {
//       const res = await fetch('https://beytee-backend-85c6ebd2be6a.herokuapp.com/send-email', {
        
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           name,
//           phone,
//           email,
//           location,
//           images: images.map((img) => `data:image/jpeg;base64,${img.base64}`),
//         }),
//       });

//       if (res.ok) {
//         Alert.alert('✅ تم الإرسال بنجاح!');
//         resetForm();
//       } else {
//         const errorText = await res.text();
//         console.error('Backend error:', errorText);
//         Alert.alert('حدث خطأ أثناء الإرسال. حاول مرة أخرى.');
//       }
//     } catch (err) {
//       console.error('Fetch error:', err);
//       Alert.alert('حدث خطأ أثناء الإرسال. تأكد من الاتصال بالإنترنت.');
//     }

//     setSending(false);
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.label}>الاسم الكامل *</Text>
//       <TextInput
//         style={styles.input}
//         value={name}
//         onChangeText={setName}
//         placeholder="مثال: محمد"
//       />

//       <Text style={styles.label}>رقم الهاتف *</Text>
//       <TextInput
//         style={styles.input}
//         value={phone}
//         onChangeText={setPhone}
//         placeholder="مثال: 22222222"
//         keyboardType="phone-pad"
//       />

//       <Text style={styles.label}>البريد الإلكتروني (اختياري)</Text>
//       <TextInput
//         style={styles.input}
//         value={email}
//         onChangeText={setEmail}
//         placeholder="you@example.com"
//         keyboardType="email-address"
//       />

//       <Text style={styles.label}>الموقع *</Text>
//       <TextInput
//         style={styles.input}
//         value={location}
//         onChangeText={setLocation}
//         placeholder="مثال: نواكشوط - تفرغ زينه"
//       />

//       <TouchableOpacity style={styles.imagePicker} onPress={pickImages}>
//         <Text style={styles.imagePickerText}>📷 اختيار الصور</Text>
//       </TouchableOpacity>

//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
//         {images.map((img, index) => (
//           <Image
//             key={index}
//             source={{ uri: img.uri }}
//             style={{ width: 100, height: 100, marginRight: 10, borderRadius: 8 }}
//           />
//         ))}
//       </ScrollView>

//       {sending ? (
//         <ActivityIndicator size="large" color="#007AFF" />
//       ) : (
//         <Button title="إرسال الإعلان" onPress={sendEmail} />
//       )}
//     </ScrollView>
//   );
// }


// tstst

function PostScreen() {
  const [type, setType] = useState('house');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [miles, setMiles] = useState('');
  const [images, setImages] = useState([]);
  const [sending, setSending] = useState(false);



 

  const pickImages = async () => {


const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('يرجى السماح للتطبيق بالوصول إلى الصور');
      return;
    }


    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      base64: true,
      quality: 0.6,
    });

   

    if (!result.canceled) {
      const selected = result.assets.map((asset) => ({
        uri: asset.uri,
        base64: asset.base64,
      }));
      setImages((prev) => [...prev, ...selected]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setLocation('');
    setMake('');
    setModel('');
    setMiles('');
    setImages([]);
  };

  const sendEmail = async () => {
    if (!name || !phone || !location || images.length === 0 || (type === 'car' && (!make || !model))) {
      Alert.alert('يرجى تعبئة جميع الحقول المطلوبة واختيار صور.');
      return;
    }

    setSending(true);

    try {
      const res = await fetch('https://beytee-backend-85c6ebd2be6a.herokuapp.com/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name,
          phone,
          email,
          location,
          make,
          model,
          miles,
          images: images.map((img) => `data:image/jpeg;base64,${img.base64}`),
        }),
      });

      if (res.ok) {
        Alert.alert('✅ تم الإرسال بنجاح!', 'سيتم التواصل معك قريباً من قبل أحد الوكلاء.');
        resetForm();
      } else {
        const errorText = await res.text();
        console.error('Backend error:', errorText);
        Alert.alert('حدث خطأ أثناء الإرسال.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      Alert.alert('تحقق من اتصال الإنترنت.');
    }

    setSending(false);
  };





return (
  <ScrollView contentContainerStyle={styles.container}>
    {/* Toggle bar */}
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[styles.toggleButton, type === 'house' && styles.activeToggle]}
        onPress={() => setType('house')}
      >
        <Text style={styles.toggleText}>عرض منزل</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, type === 'car' && styles.activeToggle]}
        onPress={() => setType('car')}
      >
        <Text style={styles.toggleText}>عرض سيارة</Text>
      </TouchableOpacity>
    </View>

    {/* Common Fields */}
    <Text style={styles.label}>* الاسم الكامل</Text>
    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="إلزامي" textAlign="right" />

    <Text style={styles.label}>* رقم الهاتف</Text>
    <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+222" keyboardType="phone-pad" textAlign="right" />

    <Text style={styles.label}>البريد الإلكتروني (اختياري)</Text>
    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" textAlign="right" />

    <Text style={styles.label}>* الموقع</Text>
    <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="- تفرغ زينه" textAlign="right" />

    {/* Car-specific */}
    {type === 'car' && (
      <>
        <Text style={styles.label}>* الماركة</Text>
        <TextInput style={styles.input} value={make} onChangeText={setMake} placeholder="Toyota" textAlign="right" />
        <Text style={styles.label}>* الموديل</Text>
        <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder=" Corolla 2020" textAlign="right" />
        <Text style={styles.label}>عدد الكيلومترات</Text>
        <TextInput style={styles.input} value={miles} onChangeText={setMiles} placeholder= "120000km" keyboardType="numeric" textAlign="right" />
      </>
    )}

    {/* Image Picker */}
    <TouchableOpacity style={styles.imagePicker} onPress={pickImages}>
      <Text style={styles.imagePickerText}>📷 اختيار الصور</Text>
    </TouchableOpacity>

    {/* Images Preview */}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
      {images.map((img, index) => (
        <View key={index} style={styles.imageWrapper}>
          <Image source={{ uri: img.uri }} style={styles.imageThumb} />
          <TouchableOpacity style={styles.deleteIcon} onPress={() => removeImage(index)}>
            <Text style={{ color: 'white', fontWeight: 'bold',marginTop:9, }}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>

    {/* Submit
    {sending ? (
      <ActivityIndicator size="large" color="#007AFF" />
    ) : (
      <Button title="إرسال الإعلان" onPress={sendEmail} />
    )} */}

{sending ? (
  <ActivityIndicator size="large" color="#007AFF" />
) : (
  <TouchableOpacity
    onPress={sendEmail}
    style={{
      backgroundColor: '#007AFF',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
    }}
  >
    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
      إرسال الإعلان
    </Text>
  </TouchableOpacity>
)}




<View style={styles.whatsappContainer}>
  <Text style={styles.whatsappText}>أو تواصل معنا مباشرة على واتساب للنشر</Text>
  <TouchableOpacity
    style={styles.whatsappButton}
    onPress={() => {
      Alert.alert('سيتم الآن فتح واتساب');
      Linking.openURL('https://wa.me/22241872600').catch(() =>
        Alert.alert('تعذر فتح واتساب')
      );
    }}
  >
    <Text style={styles.whatsappButtonText}>واتساب</Text>
  </TouchableOpacity>
</View>
  </ScrollView>
);
}

// ------------------------  for carsssss -----------------------------?



function CarsScreen({ navigation }) {
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [makeQuery, setMakeQuery] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [cars, setCars] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

 

  

  const carData = {
    "الكل": ["الكل"],
    "تويوتا": ["الكل", "كورولا", "لاندكروزر", "كامري"],
    "هيونداي": ["الكل", "سوناتا", "أكسنت", "توسان"],
    "نيسان": ["الكل", "باترول", "صني", "التيما"],
  };

  const makes = Object.keys(carData).sort((a, b) => a.localeCompare(b, 'ar'));
  const models = (carData[selectedMake] || []).sort((a, b) => a.localeCompare(b, 'ar'));
  const filteredCars = cars.filter(car => {
    return (selectedMake === "الكل" || car.make === selectedMake) &&
           (selectedModel === "الكل" || car.model === selectedModel);
  });

  const fetchCars = async () => {
    setRefreshing(true);
    try {
      const snapshot = await getDocs(collection(db, 'cars'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCars(data);
    } catch (error) {
      console.error('Error loading cars:', error);
    }
    setRefreshing(false);
  };

  const onRefresh = () => {
    setSelectedMake("الكل");
    setSelectedModel("الكل");
    setMakeQuery("الكل");
    setModelQuery("الكل");
    fetchCars();
  };

  useEffect(() => {
    onRefresh();
  }, []);

// tdtdtt   


 // store favorites by item ID as keys

 const [favoritesMap, setFavoritesMap] = useState({});

 // Load favorites once on mount
 useEffect(() => {
   (async () => {
     const json = await AsyncStorage.getItem('favorites');
     try {
       const saved = JSON.parse(json) || [];
       setFavoritesMap(saved.reduce((acc, item) => {
         acc[item.id] = true;
         return acc;
       }, {}));
     } catch (e) {
       console.warn('Favorites parsing error:', e);
     }
   })();
 }, []);
 
 const toggleFavorite = async (item) => {
   try {
     const json = await AsyncStorage.getItem('favorites');
     let saved = [];
 
     try {
       const parsed = JSON.parse(json);
       if (Array.isArray(parsed)) saved = parsed;
     } catch { }
 
     const exists = saved.find(fav => fav.id === item.id);
 
     let updated;
     if (exists) {
       updated = saved.filter(fav => fav.id !== item.id);
     } else {
       updated = [...saved, item];
     }
 
     await AsyncStorage.setItem('favorites', JSON.stringify(updated));
     setFavoritesMap(updated.reduce((acc, it) => ({ ...acc, [it.id]: true }), {}));
   } catch (e) {
     console.error('Error toggling favorite:', e);
   }
 };


  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: '#06214e', padding: 20 }}
        data={filteredCars}
        keyExtractor={(item, index) => index.toString()}
        refreshing={refreshing}
        onRefresh={fetchCars}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginTop: 40 }}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ fontSize: 24, color: 'black' }}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 22, color: 'cyan', textAlign: 'center', marginBottom: 30, marginTop: 40 }}>
              اختر نوع وموديل السيارة
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <TouchableWithoutFeedback onPress={() => setShowMakeSuggestions(false)}>
                <View style={{ flex: 1 }}>
                  <View style={{ position: 'relative', zIndex: 10 }}>
                    <TextInput
                      value={makeQuery}
                      editable={false}
                      placeholder="الماركة"
                      placeholderTextColor="#999"
                      onFocus={() => setShowMakeSuggestions(true)}
                      style={{ backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 16, textAlign: 'right', color: '#000', borderWidth: 1, borderColor: '#ccc' }}
                    />
                    <TouchableOpacity
                      style={{ position: 'absolute', left: 14, top: 16 }}
                      onPress={() => setShowMakeSuggestions(!showMakeSuggestions)}
                    >
                      <Text style={{ fontSize: 16, color: '#999' }}>{showMakeSuggestions ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {showMakeSuggestions && (
                      <View style={{ backgroundColor: '#fff', borderRadius: 10, maxHeight: 160, marginTop: 8, borderWidth: 1, borderColor: '#eee' }}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                          {makes.map((item, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => {
                                setSelectedMake(item);
                                setMakeQuery(item);
                                setSelectedModel("الكل");
                                setModelQuery("الكل");
                                setShowMakeSuggestions(false);
                                Keyboard.dismiss();
                              }}
                              style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
                            >
                              <Text style={{ fontSize: 15, color: '#333', textAlign: 'right' }}>{item}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableWithoutFeedback>

              <View style={{ flex: 1, position: 'relative' }}>
                <TextInput
                  value={modelQuery}
                  editable={false}
                  placeholder="الموديل"
                  placeholderTextColor="#999"
                  onFocus={() => setShowModelSuggestions(true)}
                  style={{ backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 16, textAlign: 'right', color: '#000', borderWidth: 1, borderColor: '#ccc' }}
                />
                <TouchableOpacity
                  style={{ position: 'absolute', left: 10, top: 12 }}
                  onPress={() => setShowModelSuggestions(!showModelSuggestions)}
                >
                  <Text style={{ fontSize: 16, color: '#999' }}>{showModelSuggestions ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showModelSuggestions && (
                  <View style={{ backgroundColor: '#fff', borderRadius: 8, maxHeight: 120, marginTop: 5 }}>
                    <FlatList
                      data={models}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedModel(item);
                            setModelQuery(item);
                            setShowModelSuggestions(false);
                            Keyboard.dismiss();
                          }}
                        >
                          <Text style={{ padding: 10, fontSize: 14, textAlign: 'right', backgroundColor: '#fff', borderBottomColor: '#ccc', borderBottomWidth: 1 }}>{item}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>
            </View>
          </>
        }

        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#fff', marginBottom: 20, borderRadius: 12, overflow: 'hidden', elevation: 3 }}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {item.images?.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedImages(item.images);
                    setCurrentImageIndex(index);
                    setImageViewerVisible(true);
                  }}

                >
                  <Image
                    source={{ uri }}
                    style={{ width: Dimensions.get('window').width - 40, height: 200 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>

              ))}


            

            </ScrollView>


          {/* for favorite */}
   <TouchableOpacity
  onPress={() => toggleFavorite(item)}
  style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}
>
  <Ionicons
    name={favoritesMap[item.id] ? 'heart' : 'heart-outline'}
    size={26}
    color={favoritesMap[item.id] ? 'red' : 'gray'}
  />
</TouchableOpacity>   




<View style={{ padding: 12 }}>






  {/* Title */}
  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'right' }}>
    {item.year} {item.make} - {item.model}
  </Text>

  {/* Kilometers & Transmission */}
  <Text style={{ fontSize: 16, color: '#666', textAlign: 'right', marginTop: 4 }}>
    {item.kilometers} كم - {item.transmission}⚙️
  </Text>

  {/* Price */}
  <Text style={{ fontSize: 16, color: '#008000', textAlign: 'right', marginTop: 4 }}>
    {item.price} أوقية
  </Text>

  {/* Availability */}
  {item.availability === 'sold' ? (
    <Text style={{ color: '#c00', textAlign: 'right', marginTop: 4, fontWeight: 'bold' }}>
      تم البيع
    </Text>
  ) : (
    <Text style={{ color: '#28a745', textAlign: 'right', marginTop: 4, fontWeight: 'bold' }}>
      
    </Text>
  )}

  {/* Expandable Description */}
  <Text
    numberOfLines={showFullDescription ? undefined : 3}
    style={{ fontSize: 14, color: '#555', marginTop: 6, textAlign: 'right' }}
  >
    {item.description}
  </Text>

  {item.description?.length > 100 && (
    <TouchableOpacity onPress={() => setShowFullDescription(prev => !prev)}>
      <Text style={{ color: '#007bff', textAlign: 'right', marginTop: 4, textAlign:"left" }}>
        { showFullDescription? 'عرض أقل ▲' : 'عرض المزيد ▼'}
      </Text>
    </TouchableOpacity>
  )}

  {/* Buttons */}
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 12 }}>
    <TouchableOpacity
      onPress={() => Linking.openURL(`tel:+22241872600`)}
      style={{
        flex: 1,
        backgroundColor: '#28a745',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>📞 اتصال</Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => {
        const message = `مرحباً، أنا مهتم بهذا الإعلان: ${item.id}`;
        const phoneNumber = '22241872600';
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

        Alert.alert(
          'فتح واتساب',
          'هل ترغب في فتح واتساب للتواصل؟',
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'فتح',
              onPress: () => Linking.openURL(url),
            },
          ]
        );
      }}
      style={{
        flex: 1,
        backgroundColor: '#25D366',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>💬 واتساب</Text>
    </TouchableOpacity>
  </View>
</View>


          </View>
        )}
        ListFooterComponent={<View style={{ height: 60 }} />}
      />


      {imageViewerVisible && (
        <Modal visible={imageViewerVisible} transparent={true}>
          <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: currentImageIndex * Dimensions.get('window').width, y: 0 }}
            >
              {selectedImages.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={{ width: Dimensions.get('window').width, height: 600, marginTop: 120 }}
                  resizeMode="contain"
                />
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setImageViewerVisible(false)}
              style={{ position: 'absolute', top: 50, right: 20, backgroundColor: '#fff', padding: 10, borderRadius: 20 }}
            >
              <Text style={{ fontSize: 24, color: '#000' }}>✖️</Text>
            </TouchableOpacity>


          </View>
        </Modal>
      )}
    </>
  );
}



// styles 


const styles = StyleSheet.create({
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -18,
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  btn: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    width: '80%',
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
  },
  noConnection: {
    backgroundColor: '#fff',
    padding: 10,
    alignItems: 'center',
  },
  footerHeader: {
    marginTop:50,
    color: 'cyan',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  footerText: {
    color: 'cyan',
    fontSize: 14,
    marginVertical: 2,
  },
  footerHeader: {
    marginTop:60,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'cyan',
    marginBottom:10,
    textAlign: 'center',
  },
  footerText: {
    
    fontSize: 14,
    color: 'cyan',
    textAlign: 'center',
    marginVertical: 2,
  },
  footerLink: {
    fontSize: 14,
    color: 'cyan',
    textAlign: 'center',
    marginVertical: 2,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 6,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },

// for post screen 
    container: {
      flex: 1,
      backgroundColor: '#06214e',
      justifyContent: 'center', // vertical centering
      alignItems: 'center',     // horizontal centering
      // paddingHorizontal: 20,
    },
    title: {
      fontSize: 24,
      color: 'cyan',
      marginTop:8,
      marginBottom: 100,
      textAlign: 'center',
    },
    button: {
     
     
      backgroundColor: '#2563eb',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 14,
      marginVertical: 10,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,

    },
    buttonText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: '600',
      textAlign: 'center',
    },
    // app strt style 



    splashContainer: {
      flex: 1,
      backgroundColor: '#06214e',
      justifyContent: 'center',
      alignItems: 'center',
    },
    logo: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
      marginBottom: 20,
    },


// styl for home secree view 

  
container: {
  flex: 1,
  backgroundColor: '#06214e',
  padding: 20,
  paddingTop: 60,
},
input: {
  backgroundColor: '#fff',
  padding: 12,
  borderRadius: 10,
  fontSize: 18,
  textAlign: 'right',
  marginBottom: 10,
},
suggestionsBox: {
  backgroundColor: '#fff',
  borderRadius: 8,
  maxHeight: 200,
},
suggestionItem: {
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderBottomColor: '#eee',
  borderBottomWidth: 1,
 
},
suggestionText: {
  fontSize: 16,
  textAlign: 'right',
  color: '#333',
},
typedText: {
  color: 'cyan',
  fontSize: 22,
  marginBottom: 20,
  textAlign: 'center',
},



// cars style
carButton: {
  position: 'relative',
  bottom: 20,
  alignSelf: 'center',
  marginTop:40,
  backgroundColor: '#007bff',
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 8,
  elevation: 3,
},
carButtonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: '600',
},




// tstss
container: {
  padding: 20,
  backgroundColor: '#fff',
},
label: {
  marginTop: 10,
  fontWeight: 'bold',
  textAlign: 'right',
},
input: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  padding: 10,
  marginTop: 5,
  textAlign: 'right',
},
imagePicker: {
  backgroundColor: '#f0f0f0',
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
  marginTop: 15,
},
imagePickerText: {
  color: '#007AFF',
  fontWeight: '600',
},


// for post scree

container: {
  padding: 20,
  backgroundColor: '#fff',
},
toggleContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginBottom: 20,
},
toggleButton: {
 
  borderWidth: 1,
  borderRadius: 8,
  borderColor: '#ccc',
  marginTop:40,
  marginLeft:7,
  flex: 1,
  backgroundColor: '#eee',
  paddingVertical: 10,
  alignItems: 'center',
},
activeToggle: {
  backgroundColor: '#007AFF',
  borderColor: '#007AFF',
},
toggleText: {
  color: '#000',
},
label: {
  textAlign: 'right',
  fontWeight: 'bold',
  marginTop: 10,
},
input: {
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
},
imagePicker: {
  backgroundColor: '#f0f0f0',
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
  marginVertical: 10,
},
imagePickerText: {
  color: '#333',
  fontWeight: 'bold',
},
imageWrapper: {
  position: 'relative',
  marginRight: 10,
},
imageThumb: {
  width: 100,
  height: 100,
  borderRadius: 8,
},
deleteIcon: {
  position: 'absolute',
  top: -8,
  right: -8,
  backgroundColor: 'red',
  borderRadius: 12,
  paddingHorizontal: 5,
  paddingVertical: 1,
  zIndex: 10,
},
whatsappContainer: {
  marginTop: 30,
  alignItems: 'center',
},
whatsappText: {
  textAlign: 'center',
  marginBottom: 10,
  color: '#444',
},
whatsappButton: {
  backgroundColor: '#25D366',
  paddingVertical: 10,
  paddingHorizontal: 25,
  borderRadius: 8,
},
whatsappButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},

});
