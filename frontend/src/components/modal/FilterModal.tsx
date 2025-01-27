// src/components/modals/FilterModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Button } from '../form/Button';
import { tokens } from '@/src/theme/tokens';
import Slider from '@react-native-community/slider';
import { useTagsList } from '@/src/hooks/useTagsList';
import MyTagChip from '../chips/TagChip';

import { UseRecipeListProps, Tag } from '@/src/types/recipe';
import { asCategoryType } from '@/src/utils/typeHelpers';
interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    filters: UseRecipeListProps;
    onApplyFilters: (filters: UseRecipeListProps) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ 
    visible, 
    onClose, 
    filters, 
    onApplyFilters 
}) => {
    const [localFilters, setLocalFilters] = useState<UseRecipeListProps>(filters);
    const { tags } = useTagsList();

    useEffect(() => {
        setLocalFilters(filters);
      }, [filters, visible]);
    
      const handleReset = () => {
        const resetFilters: UseRecipeListProps = {
          ...filters, // preserve existing query (input text)
          tags: [],
          difficulty: undefined,
          limit: 10,
          offset: 0
        };
        
        setLocalFilters(resetFilters);
        onApplyFilters(resetFilters);
        onClose();
      };
    
    const handleTagPress = (tag: Tag) => {
        setLocalFilters(prevFilters => {
            const currentTags = prevFilters.tags || [];
            const newTags = currentTags.includes(tag.name)
            ? currentTags.filter(t => t !== tag.name)
            : [...currentTags, tag.name];
            
            return {
                ...prevFilters,
                tags: newTags
            };
        });
    };
    
    return (
        <Modal visible={visible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.container}>
        <TouchableWithoutFeedback>
        <View style={styles.content}>
        <Text style={styles.title}>Filters</Text>
        
        {/* Difficulty Slider */}
        <View style={styles.sliderContainer}>
        <Text style={styles.sectionTitle}>Difficulty</Text>
        <Slider
        value={localFilters.difficulty || 1}
        minimumValue={1}
        maximumValue={4}
        step={1}
        minimumTrackTintColor={tokens.colors.primary[500]}
        maximumTrackTintColor={tokens.colors.gray[300]}
        onSlidingComplete={(value: number) => 
            setLocalFilters((prevFilters) => ({
                ...prevFilters, 
                difficulty: value > 1 ? value : undefined
            }))
        }
        />
        <Text style={styles.difficultyValue}>
        Level: {localFilters.difficulty || 1}
        </Text>
        </View>
        
        {/* Tags Selection */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tagsContainer}
        >
        {tags?.map((tag: Tag) => (
            <MyTagChip
            key={tag.name}
            name={tag.name}
            category={asCategoryType(tag.category)}
            isSelected={(localFilters.tags || []).includes(tag.name)}
            onPress={() => handleTagPress(tag)}
            />
        ))}
        </ScrollView>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
        <Button 
        title="Reset" 
        onPress={handleReset} 
        variant="outline"
        style={styles.button} 
        />
        <Button 
        title="Apply" 
        onPress={() => {
            onApplyFilters(localFilters);
            onClose();
        }}
        style={styles.button}
        />
        </View>
        </View>
        </TouchableWithoutFeedback>
        </View>
        </TouchableWithoutFeedback>
        </Modal>
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
        backgroundColor: tokens.colors.background.primary,
        borderTopLeftRadius: tokens.borderRadius.xl,
        borderTopRightRadius: tokens.borderRadius.xl,
        padding: tokens.spacing.xl,
        minHeight: height * 0.6,
    },
    title: {
        fontSize: tokens.fontSize.xl,
        fontWeight: tokens.fontWeight.bold,
        marginBottom: tokens.spacing.xl,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: tokens.fontSize.lg,
        fontWeight: tokens.fontWeight.medium,
        marginBottom: tokens.spacing.md,
    },
    sliderContainer: {
        marginBottom: tokens.spacing.xl,
    },
    difficultyValue: {
        textAlign: 'center',
        marginTop: tokens.spacing.sm,
        color: tokens.colors.text.secondary,
    },
    tagsContainer: {
        marginBottom: tokens.spacing.xl,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: tokens.spacing.md,
    },
    button: {
        flex: 1,
    }
});