import { StyleSheet } from 'react-native';
import { themeStyle, pastelRainbowTheme } from './theme.js';

export const tagStyles = StyleSheet.create({
  tagIcon: {
    marginRight: 5,
    color: themeStyle.black,
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
    backgroundColor: themeStyle.lightGrey1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
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

export const searchStyles = StyleSheet.create({
  searchIcon: {
    marginRight: 5,
    color: themeStyle.black,
    size: 20,
  },
  searchContainer: {
    padding: 3,
    margin: 10,
    marginTop: 15,
    backgroundColor: themeStyle.white,
    borderRadius: 10,
    height: '110%',
    width: '95%', 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.3, 
    shadowRadius: 3, 
  },
  searchBorder: {
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  searchText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    paddingVertical: 1,
    paddingHorizontal: 1,
    color: themeStyle.black,
  },
});


export const tagStylesJournalScreen = StyleSheet.create({
  tagText: {
    fontSize: 13,
    color: themeStyle.black,
  },
  tagIcon:{
    color: themeStyle.black,
    size: 16,
  },
  tagBorder: {
    paddingHorizontal: 5,
    margin: 1,
    backgroundColor: themeStyle.lightGrey1,
    marginBottom: 5,
    marginRight: 3,
  },
});

export const entryStyles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: themeStyle.black,
    marginVertical: 5,
  },
})

export const navigatorStyles = StyleSheet.create({
  headerStyle: {
    backgroundColor: pastelRainbowTheme.purple,
    shadowColor: pastelRainbowTheme.purple,
  },
  headerTitleStyle: {
    fontFamily: 'Montserrat-Bold',
    color: themeStyle.black,
  },
  headerTintColor: themeStyle.black,
});

export const deleteStyle = StyleSheet.create({
  deleteEntry: {
    backgroundColor: themeStyle.lightRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const headerSearchStyles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeStyle.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchIcon: {
    color: themeStyle.black,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: themeStyle.black,
    padding: 0,
  },
});

export const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: themeStyle.darkPurple5,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});

export const emptyStateStyles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 24,
    color: themeStyle.black,
    fontFamily: 'Montserrat-Bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Montserrat-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
});