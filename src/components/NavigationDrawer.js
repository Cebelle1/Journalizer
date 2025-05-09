import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Avatar, Badge } from "react-native-paper";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import {
  GradientTextBT,
  GradientTextTB,
  GradientTextLR,
  GradientTextRL,
} from "../styles/GradientText";
import {
  GradientIconBT,
  GradientIconLR,
  GradientIconRL,
  GradientIconTB,
} from "../styles/GradientIcon";

// Assets
import MatCommIcon from "react-native-vector-icons/MaterialCommunityIcons";
import IonicIcon from "react-native-vector-icons/Ionicons";
import { pastelRainbowTheme, themeStyle } from "../styles/theme";

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
          gradientColors={styles.gradientHeaderColor}
          style={styles.gradientIcon}
        />

        <GradientTextBT
          text="Journalizer"
          gradientColors={styles.gradientHeaderColor}
          fontFamily={styles.gradientHeaderFont}
          style={styles.gradientText}
        />
      </View>

      {/* Menu Options */}
      <ScrollView contentContainerStyle={styles.menuContainer}>
        <MenuItem
          icon="notebook-multiple"
          label="Journals"
          active={currentRoute === "Journals"}
          onPress={() => {
            navigation.navigate("Journals");
            navigation.closeDrawer();
          }}
        />

        <MenuItem
          icon="cloud-sync-outline"
          label="Cloud Sync"
          active={currentRoute === "Cloud Sync"}
          onPress={() => {
            navigation.navigate("Cloud Sync");
            navigation.closeDrawer();
          }}
        />

        <View style={styles.divider} />

        <MenuItem
          icon="cog-outline"
          label="Settings"
          active={currentRoute === "Settings"}
          onPress={() => {
            navigation.navigate("Settings");
            navigation.closeDrawer();
          }}
        />

        <MenuItem
          icon="pricetag-outline"
          iconFamily="Ionic"
          label="Tag"
          active={currentRoute === "Tag"}
          onPress={() => {
            navigation.navigate("Tag");
            navigation.closeDrawer();
          }}
        />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <IonicIcon name="log-out-outline" size={24} color="#000" />
        <MatCommIcon name="bell-outline" size={24} color="#000" />
      </View>
    </View>
  );
}

const MenuItem = ({
  icon,
  iconFamily = "", // If not specified, default to MaterialCommunityIcons.  If "Ionic", use IonicIcon
  label,
  badge,
  active,
  badgeColor = "#3d3b60",
  onPress = () => {},
}) => {
  const IconComponent = iconFamily === "Ionic" ? IonicIcon : MatCommIcon;

  return (
    <TouchableOpacity
      style={[styles.menuItem, active && styles.activeItem]}
      onPress={onPress}
    >
      <IconComponent
        name={icon}
        size={24}
        color={active ? styles.activeIcon : styles.inactiveIcon}
      />
      <Text style={[styles.menuText, active && styles.activeText]}>
        {label}
      </Text>
      {badge && (
        <Badge
          style={[styles.badge, { backgroundColor: badgeColor }]}
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
    backgroundColor: themeStyle.white,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  gradientHeaderColor: [themeStyle.darkPurple5, themeStyle.darkPurple1],
  gradientHeaderFont: "GenBkBasR",
  gradientIcon: {
    marginRight: 10,
  },
  gradientText: {
    fontSize: 26,
  },
  menuContainer: {
    flexGrow: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  menuText: {
    marginLeft: 15,
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
    color: themeStyle.lightPurple2,
  },
  activeItem: {
    backgroundColor: pastelRainbowTheme.purple,
    borderRadius: 8,
  },
  activeText: {
    color: themeStyle.darkPurple5,
    fontFamily: "Montserrat-Bold",
  },
  activeIcon: themeStyle.darkPurple1,
  inactiveIcon: themeStyle.darkPurple1,
  badge: {
    marginLeft: "auto",
    alignSelf: "center",
  },
  divider: {
    height: 1,
    backgroundColor: themeStyle.darkBrown,
    marginVertical: 15,
  },
  avatar: {
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
  },
});
