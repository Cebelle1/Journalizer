import { StyleSheet } from 'react-native';
import { themeStyle } from './theme.js';

export const tagStyles = StyleSheet.create({
  tagIcon: {
    marginRight: 5,
    color: themeStyle.white,
    size: 20,
  },
  tagsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 1,
    flexWrap: 'wrap',
    },
  tagBorder: {
    paddingHorizontal: 8,
    margin: 3,
    borderWidth: 1,
    backgroundColor: themeStyle.coffeeBrown,
    borderColor: themeStyle.lightBrown,
    borderRadius: 20,
    opacity: 0.9,
  },
  tagText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    paddingVertical: 1,
    paddingHorizontal: 1,
    color: themeStyle.beigeWhite1,
  },
  activeTag: {
    backgroundColor: themeStyle.darkGrey1,
    opacity: 1,
    },
  activeTagText: {
    color: themeStyle.white,
  },
});


export const tagStylesJournalScreen = StyleSheet.create({
  tagText: {
    fontSize: 13,
    color: themeStyle.darkBrown2,
  },
  tagIcon:{
    color: themeStyle.darkBrown2,
    size: 16,
  },
  tagBorder: {
    paddingHorizontal: 5,
    margin: 1,
    borderWidth: 1,
    backgroundColor: themeStyle.lightBrown,
    borderColor: themeStyle.darkBrown,
    borderRadius: 20,
    opacity: 0.9,
  },
});
