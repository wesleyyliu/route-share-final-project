import { MaterialIcons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export type LimbType = 'left_hand' | 'right_hand' | 'left_foot' | 'right_foot';

export interface LimbAnnotation {
  id: string;
  timestamp: number; // time in seconds
  limbType: LimbType;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  comment: string;
}

interface VideoAnnotationProps {
  videoUri: string;
  annotations?: LimbAnnotation[];
  onAnnotationsChange?: (annotations: LimbAnnotation[]) => void;
  onDoneEditing?: () => void;
  readonly?: boolean;
  onEditModeChange?: (isEditMode: boolean) => void;
}

export interface VideoAnnotationHandle {
  exitEditMode: () => void;
  isInEditMode: () => boolean;
}

const LIMB_COLORS = {
  left_hand: '#FF6B6B',
  right_hand: '#4ECDC4',
  left_foot: '#FFE66D',
  right_foot: '#95E1D3',
};

const LIMB_LABELS = {
  left_hand: 'left hand',
  right_hand: 'right hand',
  left_foot: 'left foot',
  right_foot: 'right foot',
};

// Sequence of limbs to annotate
const LIMB_SEQUENCE: LimbType[] = ['left_hand', 'right_hand', 'left_foot', 'right_foot'];

const VideoAnnotation = React.forwardRef<VideoAnnotationHandle, VideoAnnotationProps>(({
  videoUri,
  annotations = [],
  onAnnotationsChange,
  onDoneEditing,
  readonly = false,
  onEditModeChange,
}, ref) => {
  const videoRef = useRef<any>(null);
  const scrubberRef = useRef<ScrollView>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [paused, setPaused] = useState(true);
  const [videoLayout, setVideoLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [videoDuration, setVideoDuration] = useState(0);
  const [thumbnails, setThumbnails] = useState<{ time: number; uri: string }[]>([]);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  
  // Sequential annotation workflow state
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [currentLimbIndex, setCurrentLimbIndex] = useState(0);
  const [sequenceAnnotations, setSequenceAnnotations] = useState<{
    [key in LimbType]?: { x: number; y: number };
  }>({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [annotationComment, setAnnotationComment] = useState('');
  const [annotationTimestamp, setAnnotationTimestamp] = useState(0); // Locked timestamp for current sequence
  
  // Scrubber drag state
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const scrubberWidthRef = useRef(0);
  const seekTimeoutRef = useRef<number | null>(null);
  const previousLimbIndexRef = useRef(currentLimbIndex);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [swipedAnnotationId, setSwipedAnnotationId] = useState<string | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<LimbAnnotation | null>(null);
  const [editComment, setEditComment] = useState('');

  const currentLimbType = LIMB_SEQUENCE[currentLimbIndex];

  const startAnnotationSequence = async () => {
    // Pause video at current frame and get exact position
    if (videoRef.current) {
      await videoRef.current.pauseAsync();
      // Get the exact current position after pausing
      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded && typeof status.positionMillis === 'number') {
        const exactTime = status.positionMillis / 1000;
        setCurrentTime(exactTime);
        setAnnotationTimestamp(exactTime); // Lock the exact timestamp for this annotation sequence
      } else {
        setAnnotationTimestamp(currentTime);
      }
    } else {
      setAnnotationTimestamp(currentTime);
    }
    setPaused(true);
    setIsAnnotating(true);
    setCurrentLimbIndex(0);
    setSequenceAnnotations({});
  };

  const handleVideoPress = (event: any) => {
    if (readonly || !isAnnotating) return;

    // Get touch coordinates relative to the video
    const { locationX, locationY } = event.nativeEvent;
    
    // Convert to percentages for storage (makes it responsive)
    const xPercent = (locationX / videoLayout.width) * 100;
    const yPercent = (locationY / videoLayout.height) * 100;

    // Ensure within bounds
    if (xPercent >= 0 && xPercent <= 100 && yPercent >= 0 && yPercent <= 100) {
      // Save this limb's position
      setSequenceAnnotations({
        ...sequenceAnnotations,
        [currentLimbType]: { x: xPercent, y: yPercent },
      });
      
      // Show comment modal for this limb
      setShowCommentModal(true);
    }
  };

  const skipCurrentLimb = () => {
    if (currentLimbIndex < LIMB_SEQUENCE.length - 1) {
      setCurrentLimbIndex(currentLimbIndex + 1);
    } else {
      // Last limb, finish annotation sequence
      finishAnnotationSequence();
    }
  };

  const goBackInModal = () => {
    // Remove the current limb's position from sequence
    const updatedSequence = { ...sequenceAnnotations };
    delete updatedSequence[currentLimbType];
    setSequenceAnnotations(updatedSequence);
    
    // Clear comment and close modal
    setAnnotationComment('');
    setShowCommentModal(false);
    // Stay on same limb index so they can reposition
  };

  const saveCurrentLimbAnnotation = () => {
    if (!onAnnotationsChange) return;

    // Require comment if not skipping
    if (annotationComment.trim() === '') {
      return;
    }

    const position = sequenceAnnotations[currentLimbType];
    if (position) {
      const newAnnotation: LimbAnnotation = {
        id: `${Date.now()}_${currentLimbType}`,
        timestamp: annotationTimestamp, // Use locked timestamp instead of currentTime
        limbType: currentLimbType,
        x: position.x,
        y: position.y,
        comment: annotationComment,
      };

      onAnnotationsChange([...annotations, newAnnotation]);

      // Keep the annotation in sequenceAnnotations so it remains visible
      // It will be cleared when the entire sequence finishes
    }

    // Clear comment and close modal
    setAnnotationComment('');
    setShowCommentModal(false);

    // Move to next limb or finish
    if (currentLimbIndex < LIMB_SEQUENCE.length - 1) {
      setCurrentLimbIndex(currentLimbIndex + 1);
    } else {
      // Last limb, finish annotation sequence
      finishAnnotationSequence();
    }
  };

  const finishAnnotationSequence = () => {
    setIsAnnotating(false);
    setCurrentLimbIndex(0);
    setSequenceAnnotations({});
    setAnnotationComment('');
    setShowCommentModal(false);
    setAnnotationTimestamp(0); // Reset locked timestamp
  };

  const goBackToPreviousLimb = () => {
    if (currentLimbIndex === 0) {
      // On first limb, cancel entire sequence
      cancelAnnotation();
    } else {
      // Go back to previous limb
      const previousLimbIndex = currentLimbIndex - 1;
      const previousLimbType = LIMB_SEQUENCE[previousLimbIndex];
      
      // Find and remove the annotation for the previous limb at this timestamp
      if (onAnnotationsChange) {
        const filteredAnnotations = annotations.filter(a => {
          // Keep annotations that are NOT the previous limb at the locked annotation timestamp
          return !(a.limbType === previousLimbType && Math.abs(a.timestamp - annotationTimestamp) < 0.15);
        });
        onAnnotationsChange(filteredAnnotations);
      }
      
      // Remove the previous limb from sequenceAnnotations
      const updatedSequence = { ...sequenceAnnotations };
      delete updatedSequence[previousLimbType];
      setSequenceAnnotations(updatedSequence);
      
      // Move back to previous limb
      setCurrentLimbIndex(previousLimbIndex);
    }
  };

  const cancelAnnotation = () => {
    setIsAnnotating(false);
    setCurrentLimbIndex(0);
    setSequenceAnnotations({});
    setAnnotationComment('');
    setShowCommentModal(false);
    setAnnotationTimestamp(0); // Reset locked timestamp
  };

  const deleteAnnotation = (id: string) => {
    if (!onAnnotationsChange) return;
    onAnnotationsChange(annotations.filter(a => a.id !== id));
  };

  const handleEditHold = () => {
    setIsEditMode(true);
    onEditModeChange?.(true);
    if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
    setPaused(true);
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    onEditModeChange?.(false);
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    exitEditMode,
    isInEditMode: () => isEditMode,
  }));

  const handleDeleteSingleAnnotation = (annotation: LimbAnnotation) => {
    Alert.alert(
      'Delete Annotation',
      `Delete ${LIMB_LABELS[annotation.limbType]} annotation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!onAnnotationsChange) return;
            const updatedAnnotations = annotations.filter(a => a.id !== annotation.id);
            onAnnotationsChange(updatedAnnotations);
            setSwipedAnnotationId(null);

            // Check if there are any annotations left at this timestamp
            const remainingAtTimestamp = updatedAnnotations.filter(
              a => Math.abs(a.timestamp - currentTime) < 0.15
            );

            // If no annotations left at this timestamp, exit edit mode
            if (remainingAtTimestamp.length === 0) {
              exitEditMode();
            }
          }
        }
      ]
    );
  };

  const handleEditAnnotationComment = (annotation: LimbAnnotation) => {
    setEditingAnnotation(annotation);
    setEditComment(annotation.comment);
    setSwipedAnnotationId(null);
  };

  const saveEditedComment = () => {
    if (!onAnnotationsChange || !editingAnnotation) return;

    const updatedAnnotations = annotations.map(a =>
      a.id === editingAnnotation.id
        ? { ...a, comment: editComment }
        : a
    );
    onAnnotationsChange(updatedAnnotations);
    setEditingAnnotation(null);
    setEditComment('');
  };

  const handleDeleteAllAnnotations = () => {
    Alert.alert(
      'Delete All Annotations',
      `Delete all ${currentAnnotations.length} annotation(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            deleteAnnotationsAtTimestamp();
            exitEditMode();
          }
        }
      ]
    );
  };

  const handleDeleteAnnotations = () => {
    const annotationsAtTimestamp = annotations.filter(
      a => Math.abs(a.timestamp - currentTime) < 0.15
    );

    Alert.alert(
      'Delete Annotations',
      `Delete ${annotationsAtTimestamp.length} annotation(s) at this timestamp?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteAnnotationsAtTimestamp
        }
      ]
    );
  };

  const deleteAnnotationsAtTimestamp = () => {
    if (!onAnnotationsChange) return;
    const updatedAnnotations = annotations.filter(
      a => Math.abs(a.timestamp - currentTime) >= 0.15
    );
    onAnnotationsChange(updatedAnnotations);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    // Always update time from video when not actively dragging
    if (status && typeof status.positionMillis === 'number') {
      if (!isDraggingScrubber) {
        setCurrentTime(status.positionMillis / 1000);
      }
    }
    if (status && typeof status.durationMillis === 'number') {
      const duration = status.durationMillis / 1000;
      if (duration !== videoDuration) {
        setVideoDuration(duration);
      }
    }
  };

  // Generate thumbnails when video duration is known
  useEffect(() => {
    if (videoDuration > 0 && thumbnails.length === 0 && !isGeneratingThumbnails) {
      generateThumbnails();
    }
  }, [videoDuration]);

  // Cleanup seek timeout on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, []);

  // Clear comment text when moving to a new limb
  useEffect(() => {
    if (previousLimbIndexRef.current !== currentLimbIndex) {
      setAnnotationComment('');
      previousLimbIndexRef.current = currentLimbIndex;
    }
  }, [currentLimbIndex]);

  const generateThumbnails = async () => {
    setIsGeneratingThumbnails(true);
    const newThumbnails: { time: number; uri: string }[] = [];
    
    // Generate thumbnails every 2 seconds for better performance
    const interval = 2;
    const count = Math.ceil(videoDuration / interval);
    
    try {
      for (let i = 0; i <= count; i++) {
        const time = i * interval;
        if (time > videoDuration) break;
        
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
            time: time * 1000, // Convert to milliseconds
            quality: 0.5,
          });
          newThumbnails.push({ time, uri });
        } catch (e) {
          console.log(`Failed to generate thumbnail at ${time}s`);
        }
      }
      setThumbnails(newThumbnails);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    } finally {
      setIsGeneratingThumbnails(false);
    }
  };

  const seekTo = async (time: number) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(time * 1000);
      setPaused(true);
    }
  };

  // Get annotations for current timestamp (within 0.15 second tolerance)
  const currentAnnotations = annotations.filter(
    a => Math.abs(a.timestamp - currentTime) < 0.15
  );

  // Scrubber touch handling
  const scrubberLayoutRef = useRef({ x: 0, width: 0 });

  const handleScrubberTouch = (locationX: number) => {
    if (scrubberLayoutRef.current.width > 0 && videoDuration > 0) {
      // Clamp the position within bounds
      const clampedX = Math.max(0, Math.min(locationX, scrubberLayoutRef.current.width));
      const percentage = clampedX / scrubberLayoutRef.current.width;
      const newTime = percentage * videoDuration;
      
      // Update time immediately for visual feedback
      setCurrentTime(newTime);
      
      // Debounce the actual video seek to prevent "Seeking interrupted" errors
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      seekTimeoutRef.current = setTimeout(() => {
        seekTo(newTime);
      }, 20); // 20ms debounce
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Video Player with Overlay */}
      <View 
        style={styles.videoWrapper}
        onLayout={(event) => {
          const { width, height, x, y } = event.nativeEvent.layout;
          setVideoLayout({ width, height, x, y });
        }}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          shouldPlay={!paused}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          useNativeControls={false}
        />
        
        {/* Annotation Overlay */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleVideoPress}
          disabled={readonly || !isAnnotating}
        >
          {/* Show existing annotations for current time (only when not annotating) */}
          {!isAnnotating && currentAnnotations.map((annotation) => (
            <View
              key={annotation.id}
              style={[
                styles.marker,
                {
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  backgroundColor: LIMB_COLORS[annotation.limbType],
                },
              ]}
              pointerEvents="none"
            >
              <View style={[styles.markerRing, { borderColor: LIMB_COLORS[annotation.limbType] }]} />
            </View>
          ))}

          {/* Show sequence annotations being placed */}
          {isAnnotating && Object.entries(sequenceAnnotations).map(([limbType, position]) => (
            <View
              key={limbType}
              style={[
                styles.marker,
                {
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  backgroundColor: LIMB_COLORS[limbType as LimbType],
                },
              ]}
              pointerEvents="none"
            >
              <View style={[styles.markerRing, { borderColor: LIMB_COLORS[limbType as LimbType] }]} />
            </View>
          ))}
        </TouchableOpacity>
      </View>

      {/* Video Controls - Below Video, Above Scrubber */}
      <View style={styles.videoControls}>
        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={() => {
            if (paused) {
              videoRef.current?.playAsync();
              setPaused(false);
            } else {
              videoRef.current?.pauseAsync();
              setPaused(true);
            }
          }}
        >
          <MaterialIcons 
            name={paused ? 'play-arrow' : 'pause'} 
            size={28} 
            color="#2C3D50" 
          />
        </TouchableOpacity>
      </View>

      {/* Edit Mode - Annotation Cards */}
      {isEditMode && !isAnnotating && (
        <View style={styles.editModeContainer}>
          <ScrollView style={styles.annotationsList}>
            {currentAnnotations.map((annotation) => (
              <View key={annotation.id} style={styles.annotationCardWrapper}>
                <View style={styles.annotationCard}>
                  <View style={styles.annotationCardContent}>
                    <View style={styles.annotationCardHeader}>
                      <View style={[styles.limbIndicator, { backgroundColor: LIMB_COLORS[annotation.limbType] }]} />
                      <Text style={styles.limbTypeText}>{LIMB_LABELS[annotation.limbType]}</Text>
                    </View>
                    <Text style={styles.annotationCommentText}>{annotation.comment || 'No comment'}</Text>
                  </View>

                  {swipedAnnotationId === annotation.id && (
                    <View style={styles.swipeActions}>
                      <TouchableOpacity
                        style={styles.editActionButton}
                        onPress={() => handleEditAnnotationComment(annotation)}
                      >
                        <MaterialIcons name="edit" size={24} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteActionButton}
                        onPress={() => handleDeleteSingleAnnotation(annotation)}
                      >
                        <MaterialIcons name="delete" size={24} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.swipeTrigger}
                  onPress={() => setSwipedAnnotationId(swipedAnnotationId === annotation.id ? null : annotation.id)}
                >
                  <MaterialIcons
                    name={swipedAnnotationId === annotation.id ? "chevron-left" : "chevron-right"}
                    size={24}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.deleteAllButton}
            onPress={handleDeleteAllAnnotations}
          >
            <Text style={styles.deleteAllButtonText}>Delete all annotations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneEditingButton}
            onPress={exitEditMode}
          >
            <Text style={styles.doneEditingButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Drag for Scrubber */}
      {!isAnnotating && !isEditMode && (
      <View 
        style={styles.scrubberContainer}
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout;
          scrubberWidthRef.current = width;
          scrubberLayoutRef.current = { x, width };
        }}
      >
        <ScrollView
          ref={scrubberRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.scrubberScroll}
        >
          <View style={styles.thumbnailStrip}>
            {thumbnails.length > 0 ? (
              thumbnails.map((thumbnail, index) => (
                <Image
                  key={index}
                  source={{ uri: thumbnail.uri }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              ))
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Text style={styles.thumbnailPlaceholderText}>
                  {isGeneratingThumbnails ? 'Loading frames...' : 'Drag to scrub'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Draggable overlay */}
        <View
          style={styles.scrubberOverlay}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(evt) => {
            setIsDraggingScrubber(true);
            if (videoRef.current) {
              videoRef.current.pauseAsync();
              setPaused(true);
            }
            handleScrubberTouch(evt.nativeEvent.locationX);
          }}
          onResponderMove={(evt) => {
            if (isDraggingScrubber) {
              handleScrubberTouch(evt.nativeEvent.locationX);
            }
          }}
          onResponderRelease={() => {
            setIsDraggingScrubber(false);
          }}
          onResponderTerminate={() => {
            setIsDraggingScrubber(false);
          }}
        >
          {/* Progress indicator */}
          <View
            style={[
              styles.scrubberProgress,
              { width: videoDuration > 0 ? `${(currentTime / videoDuration) * 100}%` : '0%' }
            ]}
            pointerEvents="none"
          />

          {/* Timestamp markers - show one orange line per annotation timestamp */}
          {!isAnnotating && (() => {
            // Get unique timestamps (one marker per timestamp, not per annotation)
            const uniqueTimestamps = Array.from(
              new Set(annotations.map(a => a.timestamp))
            );

            return uniqueTimestamps.map((timestamp, index) => (
              <View
                key={`timestamp-${timestamp}-${index}`}
                style={[
                  styles.timestampMarker,
                  {
                    left: videoDuration > 0 ? `${(timestamp / videoDuration) * 100}%` : '0%',
                  },
                ]}
                pointerEvents="none"
              />
            ));
          })()}

          {/* Playhead */}
          <View
            style={[
              styles.playhead,
              { left: videoDuration > 0 ? `${(currentTime / videoDuration) * 100}%` : '0%' }
            ]}
            pointerEvents="none"
          />
        </View>
        
        {/* Time display */}
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)}
          </Text>
          <Text style={styles.durationText}>
            {' / '}{formatTime(videoDuration)}
          </Text>
        </View>
      </View>
      )}

      {/* Add Hold Button or Delete Button */}
      {!readonly && !isAnnotating && !isEditMode && (
        currentAnnotations.length > 0 ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditHold}
          >
            <Text style={styles.editButtonText}>
              Edit hold
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addHoldButton} onPress={startAnnotationSequence}>
            <Text style={styles.addHoldButtonText}>Add hold</Text>
          </TouchableOpacity>
        )
      )}

      {/* Sequential Annotation Prompt */}
      {isAnnotating && !showCommentModal && (
        <View style={styles.annotationPrompt}>
          <TouchableOpacity style={styles.backButton} onPress={goBackToPreviousLimb}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.promptContent}>
            <View style={styles.climberIcon}>
              <Text style={styles.climberEmoji}>🧗</Text>
              <View 
                style={[
                  styles.limbHighlight,
                  { backgroundColor: LIMB_COLORS[currentLimbType] }
                ]} 
              />
            </View>
            <Text style={styles.promptText}>
              click on your {LIMB_LABELS[currentLimbType]}
            </Text>
            <TouchableOpacity style={styles.nextButton} onPress={skipCurrentLimb}>
              <Text style={styles.nextButtonText}>skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Done Editing Button */}
      {!readonly && !isAnnotating && !isEditMode && onDoneEditing && (
        <TouchableOpacity style={styles.doneButton} onPress={onDoneEditing}>
          <Text style={styles.doneButtonText}>Done editing</Text>
        </TouchableOpacity>
      )}

      {/* Comment Modal - after all limbs are marked */}
      <Modal
        visible={showCommentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            style={styles.keyboardAvoidingContainer}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalBackButton} onPress={goBackInModal}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                leave a comment?
              </Text>
              <Text style={styles.modalSubtitle}>
                {LIMB_LABELS[currentLimbType]}
              </Text>

              <TextInput
                key={`comment-${currentLimbIndex}`}
                style={styles.modalInput}
                placeholder=""
                value={annotationComment}
                onChangeText={setAnnotationComment}
                multiline
                autoFocus
              />

              <TouchableOpacity
                style={[
                  styles.modalNextButton,
                  annotationComment.trim() === '' && styles.modalNextButtonDisabled
                ]}
                onPressIn={saveCurrentLimbAnnotation}
                disabled={annotationComment.trim() === ''}
              >
                <Text style={styles.modalNextButtonText}>
                  {currentLimbIndex < LIMB_SEQUENCE.length - 1 ? 'Next' : 'Finish'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Edit Comment Modal */}
      <Modal
        visible={editingAnnotation !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingAnnotation(null)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            style={styles.keyboardAvoidingContainer}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setEditingAnnotation(null)}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                Edit comment
              </Text>
              <Text style={styles.modalSubtitle}>
                {editingAnnotation && LIMB_LABELS[editingAnnotation.limbType]}
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder=""
                value={editComment}
                onChangeText={setEditComment}
                multiline
                autoFocus
              />

              <TouchableOpacity
                style={styles.modalNextButton}
                onPress={saveEditedComment}
              >
                <Text style={styles.modalNextButtonText}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
});

VideoAnnotation.displayName = 'VideoAnnotation';

export default VideoAnnotation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoWrapper: {
    width: '100%',
    height: 300,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  marker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    marginTop: -12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  markerRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    position: 'absolute',
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  playPauseButton: {
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scrubberContainer: {
    marginTop: 8,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'visible',
    position: 'relative',
  },
  scrubberScroll: {
    flex: 1,
  },
  thumbnailStrip: {
    flexDirection: 'row',
    height: 80,
  },
  thumbnailImage: {
    width: 100,
    height: 80,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 300,
  },
  thumbnailPlaceholderText: {
    color: '#999',
    fontSize: 14,
  },
  scrubberOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrubberProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(44, 61, 80, 0.2)',
  },
  playhead: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 3,
    backgroundColor: '#000000',
    marginLeft: -1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 10,
    zIndex: 10,
  },
  timestampMarker: {
    position: 'absolute',
    top: -5,
    bottom: -5,
    width: 5,
    marginLeft: -2.5,
    backgroundColor: '#FF6B35',
    opacity: 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 5,
    zIndex: 5,
  },
  timeDisplay: {
    position: 'absolute',
    top: 4,
    right: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  durationText: {
    color: '#CCC',
    fontSize: 12,
  },
  addHoldButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addHoldButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  doneButtonText: {
    color: '#2C3D50',
    fontSize: 16,
    fontWeight: '600',
  },
  annotationPrompt: {
    marginTop: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#2C3D50',
  },
  promptContent: {
    alignItems: 'center',
    width: '100%',
  },
  climberIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  climberEmoji: {
    fontSize: 50,
  },
  limbHighlight: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: 10,
    right: 15,
    opacity: 0.8,
  },
  promptText: {
    fontSize: 18,
    color: '#2C3D50',
    marginBottom: 20,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    minHeight: 300,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    color: '#2C3D50',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
  },
  modalNextButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalNextButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.5,
  },
  modalNextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editModeContainer: {
    marginTop: 20,
  },
  annotationsList: {
    maxHeight: 300,
  },
  annotationCardWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  annotationCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  annotationCardContent: {
    padding: 16,
  },
  annotationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  limbIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  limbTypeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3D50',
    textTransform: 'capitalize',
  },
  annotationCommentText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  swipeActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'column',
    width: 60,
  },
  editActionButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeTrigger: {
    marginLeft: 8,
    padding: 8,
  },
  deleteAllButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  deleteAllButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneEditingButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  doneEditingButtonText: {
    color: '#2C3D50',
    fontSize: 16,
    fontWeight: '600',
  },
});

