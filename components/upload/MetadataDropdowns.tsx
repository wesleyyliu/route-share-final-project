import { ClimbMetadata } from '@/types/post';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useRef } from 'react';

interface MetadataDropdownsProps {
  metadata: ClimbMetadata;
  onMetadataChange: (metadata: ClimbMetadata) => void;
  locationDropdownOpen: boolean;
  difficultyDropdownOpen: boolean;
  colorDropdownOpen: boolean;
  onLocationDropdownToggle: () => void;
  onDifficultyDropdownToggle: () => void;
  onColorDropdownToggle: () => void;
  inModal?: boolean;
}

const locationOptions = ['Penn Campus Recreation', 'Tufas Boulder Lounge', 'Movement Callowhill', 'Main Line Boulders'];
const difficultyOptions = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'];
const colorOptions = ['Red', 'Blue', 'Green', 'Yellow', 'Black'];

export default function MetadataDropdowns({
  metadata,
  onMetadataChange,
  locationDropdownOpen,
  difficultyDropdownOpen,
  colorDropdownOpen,
  onLocationDropdownToggle,
  onDifficultyDropdownToggle,
  onColorDropdownToggle,
  inModal = false,
}: MetadataDropdownsProps) {
  const [locationSearch, setLocationSearch] = useState('');
  const inputRef = useRef<TextInput>(null);
  const dropdownOptionsStyle = inModal ? styles.dropdownOptionsModal : styles.dropdownOptions;

  // Filter location options based on search
  const filteredLocationOptions = locationOptions.filter(location =>
    location.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Display value: show search text when searching, otherwise show selected location
  const displayValue = locationSearch || metadata.location || '';

  return (
    <>
      {/* Location Search */}
      <View style={[styles.dropdownWrapper, { zIndex: 103 }]}>
        <View style={styles.metadataSection}>
          <View style={styles.metadataIcon}>
            <MaterialIcons name="place" size={24} color="#2C3D50" />
          </View>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#999"
            value={displayValue}
            onChangeText={(text) => {
              setLocationSearch(text);
              // Open dropdown when typing
              if (!locationDropdownOpen) {
                onLocationDropdownToggle();
              }
            }}
            onFocus={() => {
              setLocationSearch('');
              if (!locationDropdownOpen) {
                onLocationDropdownToggle();
              }
            }}
          />
          <TouchableOpacity onPress={onLocationDropdownToggle} style={styles.searchIconButton}>
            <MaterialIcons name="search" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        {locationDropdownOpen && filteredLocationOptions.length > 0 && (
          <View style={dropdownOptionsStyle}>
            <ScrollView
              nestedScrollEnabled
              style={styles.dropdownScroll}
              keyboardShouldPersistTaps='handled'
            >
              {filteredLocationOptions.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={styles.dropdownOption}
                  onPress={() => {
                    onMetadataChange({ ...metadata, location });
                    setLocationSearch('');
                    onLocationDropdownToggle();
                    inputRef.current?.blur(); // Blur the input to remove cursor
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{location}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Difficulty Dropdown */}
      <View style={[styles.dropdownWrapper, { zIndex: 102 }]}>
        <View style={styles.metadataSection}>
          <View style={styles.metadataIcon}>
            <MaterialIcons name="terrain" size={24} color="#2C3D50" />
          </View>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={onDifficultyDropdownToggle}
          >
            <Text style={metadata.difficulty ? styles.metadataValue : styles.metadataPlaceholder}>
              {metadata.difficulty || 'Add difficulty'}
            </Text>
            <Text style={styles.dropdownCaret}>{difficultyDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        </View>
        {difficultyDropdownOpen && (
          <View style={dropdownOptionsStyle}>
            <ScrollView
              nestedScrollEnabled
              style={styles.dropdownScroll}
              keyboardShouldPersistTaps='handled'
            >
              {difficultyOptions.map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={styles.dropdownOption}
                  onPress={() => onMetadataChange({ ...metadata, difficulty })}
                >
                  <Text style={styles.dropdownOptionText}>{difficulty}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Color Dropdown */}
      <View style={[styles.dropdownWrapper, { zIndex: 101 }]}>
        <View style={styles.metadataSection}>
          <View style={styles.metadataIcon}>
            <MaterialIcons name="palette" size={24} color="#2C3D50" />
          </View>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={onColorDropdownToggle}
          >
            <Text style={metadata.color ? styles.metadataValue : styles.metadataPlaceholder}>
              {metadata.color || 'Add color'}
            </Text>
            <Text style={styles.dropdownCaret}>{colorDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        </View>
        {colorDropdownOpen && (
          <View style={dropdownOptionsStyle}>
            <ScrollView
              nestedScrollEnabled
              style={styles.dropdownScroll}
              keyboardShouldPersistTaps='handled'
            >
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={styles.dropdownOption}
                  onPress={() => onMetadataChange({ ...metadata, color })}
                >
                  <Text style={styles.dropdownOptionText}>{color}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  metadataSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  metadataIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  searchIconButton: {
    padding: 8,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  dropdownCaret: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  dropdownOptions: {
    position: 'absolute',
    top: 60,
    left: 52,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 150,
    zIndex: 10000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  metadataPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  metadataValue: {
    fontSize: 16,
    color: '#333',
  },
  dropdownWrapper: {
    marginBottom: 16,
    zIndex: 100,
  },
  dropdownOptionsModal: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 150,
    zIndex: 10000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 150,
  },
});
