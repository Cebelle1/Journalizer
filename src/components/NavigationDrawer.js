import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Avatar, Badge } from 'react-native-paper';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { GradientTextBT, GradientTextTB, GradientTextLR, GradientTextRL } from '../styles/GradientText';
import { GradientIconBT, GradientIconLR, GradientIconRL, GradientIconTB } from '../styles/GradientIcon';

// Assets
import MatCommIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import IonicIcon from 'react-native-vector-icons/Ionicons';

export default function NavigationDrawer({ navigation }) {
    const nav = useNavigation();
    const currentRoute = nav.getState()?.routes[nav.getState().index]?.name; 

    return (
        <View style={styles.container}>
            <View style={styles.divider} />
            
            {/* Header */}
            <View style={styles.header}>
              <GradientIconBT 
                IconComponent={IonicIcon}
                name="planet-outline" 
                size={36} 
                gradientColors={styles.gradientHeader} 
                style={styles.icon} />

              <GradientTextBT text="Journalizer" gradientColors={styles.gradientHeader} />
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
      
      <MatCommIcon name={icon} size={24} color={active ? styles.activeIcon : styles.inactiveIcon} />
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
  gradientHeader: ['#623c73', '#c599c7'],
  icon: {
    marginRight: 10,
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
    color: '#633c73',
  },
  activeItem: {
    backgroundColor: 'rgba(239,236,242,255)',
    borderRadius: 8,
  },
  activeText: {
    color: '#623c73',
    fontWeight: 'bold',
  },
  activeIcon: '#613f68',
  inactiveIcon: '#6B7280',
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
