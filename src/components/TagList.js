import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tagStyles } from '../styles/componentStyle';

export default function TagList({ tags , style}){

    const iconSize = style?.tagIcon?.size || tagStyles.tagIcon.size;  // Cannot set in stylesheet and pass in, so set here
    
    // Helper function to convert hex color to rgba with opacity
    const hexToRgba = (hexColor, opacity) => {
      const color = hexColor.replace('#', '');
      const r = parseInt(color.substr(0, 2), 16);
      const g = parseInt(color.substr(2, 2), 16);
      const b = parseInt(color.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    return (
      <View style={[tagStyles.tagsContainer, style?.tagsContainer]}>
        <Ionicons name="pricetag-outline" size={iconSize} style={[tagStyles.tagIcon, style?.tagIcon]} />
        {/** Display individual tags */}
        {tags.map((tag, index) => {
          const tagName = typeof tag === 'string' ? tag : tag.name;
          const tagColor = typeof tag === 'string' ? '#8E44AD' : (tag.color || '#8E44AD');
          const backgroundColor = hexToRgba(tagColor, 0.15);
          const borderColor = hexToRgba(tagColor, 0.3);
          
          return (
            <View key={index} style={[tagStyles.tagBorder, style?.tagBorder, { borderColor: borderColor, borderWidth: 1, backgroundColor: backgroundColor }]}>
              <Text style={[tagStyles.tagText, style?.tagText, { color: tagColor, fontWeight: '600' }]}>{tagName}</Text>
            </View>
          );
        })}
      </View>
    );
}