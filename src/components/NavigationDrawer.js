import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Avatar, Badge } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useNavigationState } from '@react-navigation/native';

// Assets
import MatCommIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MatIcon from 'react-native-vector-icons/MaterialIcons';

export default function NavigationDrawer({ navigation }) {
    //const currentRoute = useNavigationState((state) => state.routes[state.index].name);
    const nav = useNavigation();
    const currentRoute = nav.getState()?.routes[nav.getState().index]?.name; 
    console.log(currentRoute);
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
            
              <MatCommIcon name="notebook-outline" size={24} color="#6a6cff" style={styles.icon} />
              <Text style={styles.brandText}>Journalizer</Text>
            </View>

            {/* Menu Options */}
            <ScrollView contentContainerStyle={styles.menuContainer}>
                <MenuItem 
                  icon="notebook-multiple" 
                  label="Journals"
                  active={currentRoute === 'Journals'}
                  onPress={() => {
                    navigation.navigate('Journals')
                    navigation.closeDrawer();
                  }}/>

                <MenuItem 
                  icon="cloud-sync-outline" 
                  label="Cloud Sync" 
                  active={currentRoute === 'Cloud Sync'}
                  onPress={() => {
                    navigation.navigate('Cloud Sync')
                    navigation.closeDrawer();
                  }} />

                <View style={styles.divider} />

                <MenuItem 
                  icon="cog-outline" 
                  label="Settings" 
                  active={currentRoute === 'Settings'}
                  onPress={() => {
                      navigation.navigate('Settings')
                      navigation.closeDrawer();
                  }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Avatar.Image
                size={30}
                source={{ uri: 'https://randomuser.me/api/portraits/women/45.jpg' }} // Replace with actual image
                />
                <MatCommIcon name="bell-outline" size={24} color="#fff" />
            </View>
        </View>
    );
};

const MenuItem = ({ icon, label, badge, active, badgeColor = '#3d3b60' , onPress = () => {} }) => {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, active && styles.activeItem]}
      onPress={onPress}>
      
      <MatCommIcon name={icon} size={24} color={active ? '#3d3b60' : '#6B7280'} />
      <Text style={[styles.menuText, active && styles.activeText]}>{label}</Text>
      {badge && (
        <Badge
          style={[
            styles.badge,
            { backgroundColor: badgeColor },
          ]}
          size={18}
        >
          {badge}
        </Badge>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  gradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  icon: {
    marginRight: 10,
  },
  brandText: {
    color: '#6a6cff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuContainer: {
    flexGrow: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  menuText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#6B7280',
  },
  activeItem: {
    backgroundColor: 'rgba(225,223,235,255)',
    borderRadius: 8,
  },
  activeText: {
    color: '#3d3b60',
    fontWeight: 'bold',
  },
  badge: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 15,
  },
  avatar: {
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
});
