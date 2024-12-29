import { Button } from '@react-navigation/elements';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Avatar, Badge } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';

// Assets
import MatCommIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MatIcon from 'react-native-vector-icons/MaterialIcons';

export default function NavigationDrawer({ navigation }) {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
            
                    <MatCommIcon name="notebook-outline" size={24} color="#6a6cff" style={styles.icon} />
                    <Text style={styles.brandText}>Journalizer</Text>
            </View>

            {/* Menu Options */}
            <ScrollView contentContainerStyle={styles.menuContainer}>
                <MenuItem icon="notebook-multiple" label="Journals" active />
                <MenuItem icon="cloud-sync-outline" label="Cloud Sync" />

                <View style={styles.divider} />

                <MenuItem icon="cog-outline" label="Settings" />
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

const MenuItem = ({ icon, label, badge, active, badgeColor = '#2196F3' }) => {
  return (
    <TouchableOpacity style={[styles.menuItem, active && styles.activeItem]}>
      <MatCommIcon name={icon} size={24} color={active ? '#2196F3' : '#6B7280'} />
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
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
  },
  activeText: {
    color: '#2196F3',
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
