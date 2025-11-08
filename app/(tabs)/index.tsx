import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World</Text>

      <Text style={styles.section}>Style Guide</Text>

      <View style={styles.row}>
        <View style={[styles.swatch, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5E5' }]} />
        <Text style={styles.swatchLabel}>Dominant #FFFFFF</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.swatch, { backgroundColor: '#2C3D50' }]} />
        <Text style={styles.swatchLabel}>Secondary #2C3D50</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.swatch, { backgroundColor: '#FF6B35' }]} />
        <Text style={styles.swatchLabel}>Accent #FF6B35</Text>
      </View>

      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 18, color: '#2C3D50', marginTop: 8 }}>
        Poppins 18 (Regular)
      </Text>
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 32, color: '#2C3D50' }}>
        Poppins 32 (Bold)
      </Text>

      <View style={styles.iconRow}>
        <MaterialIcons name="search" size={36} color="#2C3D50" />
        <MaterialIcons name="upload" size={36} color="#2C3D50" />
        <MaterialIcons name="person" size={36} color="#2C3D50" />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 50,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3D50',
    marginBottom: 40,
  },
  section: { 
    fontSize: 50, 
    fontFamily: 'Poppins_700Bold',
    color: '#2C3D50', 
    marginTop: 16, 
    marginBottom: 8 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  swatch: { 
    width: 36, 
    height: 24, 
    borderRadius: 4, 
    marginRight: 18,
  },
  swatchLabel: {
    fontFamily: 'Poppins_400Regular', 
    fontSize: 14,
    color: '#2C3D50',
  },
  iconRow: { 
    flexDirection: 'row', 
    marginTop: 40, 
    gap: 12 },
});
