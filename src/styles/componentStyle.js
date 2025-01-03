import { StyleSheet } from 'react-native';
import { themeStyle } from './theme.js';

export const tagStyles = StyleSheet.create({
  tagIcon: {
    marginRight: 5,
    color: themeStyle.white,
  },
  tagsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 5,
    },
  tagBorder: {
    paddingHorizontal: 8,
    margin: 3,
    borderWidth: 1,
    backgroundColor: themeStyle.lightGrey1,
    borderColor: themeStyle.darkGrey1,
    borderRadius: 20,
    opacity: 0.7,
  },
  tagText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    paddingVertical: 1,
    paddingHorizontal: 1,
    color: themeStyle.black,
  },
  activeTag: {
    backgroundColor: themeStyle.darkGrey1,
    opacity: 1,
    },
    activeTagText: {
      color: themeStyle.white,
    },
});

