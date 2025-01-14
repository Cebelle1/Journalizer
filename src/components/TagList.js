import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { tagStyles } from '../styles/componentStyle';

export default function TagList({ tags , style}){

    const iconSize = style?.tagIcon?.size || tagStyles.tagIcon.size;  // Cannot set in stylesheet and pass in, so set here
    return (
      <View style={[tagStyles.tagsContainer, style?.tagsContainer]}>
        <Ionicons name="pricetag-outline" size={iconSize} style={[tagStyles.tagIcon, style?.tagIcon]} />
        {/** Display individual tags */}
        {tags.map((tag, index) => (
          <View key={index} style={[tagStyles.tagBorder, style?.tagBorder]}>
            <Text style={[tagStyles.tagText, style?.tagText]}>{tag}</Text>
          </View>
        ))}
      </View>
    );
}