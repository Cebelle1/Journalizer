import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TagScreen() {
  return (
    <View style={tagStyles.container}>
      <Text style={tagStyles.text}> Tags Screen </Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 20,
    color: "#333",
  },
});
