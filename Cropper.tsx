import React from "react";
import { Dimensions, SafeAreaView, StatusBar, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

const imageURI =
  'https://i0.wp.com/thenewcamera.com/wp-content/uploads/2019/09/Fuji-X-A7-sample-image-1.jpg?resize=730%2C730';
const SCREEN_WIDTH = Dimensions.get('screen').width;
const SCREEN_HEIGHT = Dimensions.get('screen').height;
const CROP_VIEWPORT_WIDTH = SCREEN_WIDTH;
const CROP_VIEWPORT_HEIGHT = SCREEN_HEIGHT * 0.6;

const CropContainer: React.FC = () => {
  return <View style={styles.container}></View>;
};

const Cropper: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <Text style={styles.headerText}>Crop your picture</Text>
        <CropContainer />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  headerText: {
    fontSize: 32,
    fontWeight: '500',
    marginBottom: 30,
  } as TextStyle,
  container: {
    width: CROP_VIEWPORT_WIDTH,
    height: CROP_VIEWPORT_HEIGHT,
    position: 'relative',
    backgroundColor: 'gray',
  } as ViewStyle,
});

export default Cropper;
