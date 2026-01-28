import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tagStyles } from '../styles/componentStyle';

export default function TagList({ tags , style}){

    const iconSize = style?.tagIcon?.size || tagStyles.tagIcon.size;  // Cannot set in stylesheet and pass in, so set here
    
    // Helper function to determine if a color is light or dark
    const isLightColor = (hexColor) => {
      const color = hexColor.replace('#', '');
      const r = parseInt(color.substr(0, 2), 16);
      const g = parseInt(color.substr(2, 2), 16);
      const b = parseInt(color.substr(4, 2), 16);
      // Calculate relative luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.6;
    };

    return (
      <View style={[tagStyles.tagsContainer, style?.tagsContainer]}>
        <Ionicons name="pricetag-outline" size={iconSize} style={[tagStyles.tagIcon, style?.tagIcon]} />
        {/** Display individual tags */}
        {tags.map((tag, index) => {
          const tagName = typeof tag === 'string' ? tag : tag.name;
          const tagColor = typeof tag === 'string' ? '#8E44AD' : (tag.color || '#8E44AD');
          const textColor = isLightColor(tagColor) ? '#2C3E50' : '#FFFFFF';
          
          return (
            <View key={index} style={[tagStyles.tagBorder, style?.tagBorder, { borderColor: tagColor, borderWidth: 1.5, backgroundColor: tagColor }]}>
              <Text style={[tagStyles.tagText, style?.tagText, { color: textColor, fontWeight: '600' }]}>{tagName}</Text>
            </View>
          );
        })}
      </View>
    );
}