import React from "react";
import { Modal, View, Text, Image, Pressable, StyleSheet } from "react-native";

const CustomModal = ({ visible, photoPath, onVerify, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {photoPath ? (
            <Image
              source={{ uri: photoPath }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <Text>No image available</Text>
          )}
          <View style={styles.buttonContainer}>
            <Pressable onPress={onVerify} style={styles.button}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.button}>
              <Text style={styles.buttonText}>Re-capture</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  image: {
    width: 300,
    height: 400,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#CBC3E3",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  buttonText: {
    color: "black",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default CustomModal;
