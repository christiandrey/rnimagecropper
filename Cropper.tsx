import ImageEditor from "@react-native-community/image-editor";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Button,
  Dimensions,
  Image,
  PanResponder,
  SafeAreaView,
  Slider,
  StatusBar,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import RNFS from "react-native-fs";

// const imageURI = 'https://i0.wp.com/thenewcamera.com/wp-content/uploads/2019/09/Fuji-X-A7-sample-image-1.jpg?resize=730%2C730';
const imageURI =
  'https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg';
// const imageURI = 'https://cdn.shopify.com/s/files/1/0100/5302/products/EH028ST_Photo_Web_f912f48f-2834-4a67-a77c-3bd50956df07_grande.jpg?v=1550089716';

const SCREEN_WIDTH = Dimensions.get('screen').width;
const SCREEN_HEIGHT = Dimensions.get('screen').height;
const CROP_VIEWPORT_WIDTH = SCREEN_WIDTH;
const CROP_VIEWPORT_HEIGHT = SCREEN_WIDTH;
const CROP_VIEWPORT_PADDING = 20;

type Dimms = {
  width: number;
  height: number;
};

type Coords = {
  x: number;
  y: number;
};

type CropCoords = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CropContainerProps = {
  animatedValue: Animated.ValueXY;
  minCoords: Coords;
  maxCoords: Coords;
  width: number;
  height: number;
  getComputedAnimatedValue: () => Coords;
};

const getMinCoords = (imageWidth: number, imageHeight: number) => {
  const x = (imageWidth - CROP_VIEWPORT_WIDTH) * -1;
  const y = (imageHeight - CROP_VIEWPORT_HEIGHT) * -1;
  return {x, y};
};

const getMaxCoords = (imageWidth: number, imageHeight: number) => {
  const x = 0;
  const y = 0;

  return {x, y};
};

const getCropCoordinates = (
  x: number,
  y: number,
  scaleFactor: number,
): CropCoords => {
  return {
    x: x * (1 / scaleFactor) * -1 + CROP_VIEWPORT_PADDING / scaleFactor,
    y: y * (1 / scaleFactor) * -1 + CROP_VIEWPORT_PADDING / scaleFactor,
    width:
      (CROP_VIEWPORT_WIDTH - CROP_VIEWPORT_PADDING * 2) * (1 / scaleFactor),
    height:
      (CROP_VIEWPORT_HEIGHT - CROP_VIEWPORT_PADDING * 2) * (1 / scaleFactor),
  };
};

const getScaleFactor = (
  imageWidth: number,
  imageHeight: number,
  userScaleFactor: number,
) => {
  const minimumDimension = Math.min(imageWidth, imageHeight);
  let scaleFactor = 1;

  if (
    minimumDimension === imageWidth &&
    minimumDimension < CROP_VIEWPORT_WIDTH
  ) {
    scaleFactor = CROP_VIEWPORT_WIDTH / minimumDimension;
  }

  if (
    minimumDimension === imageHeight &&
    minimumDimension < CROP_VIEWPORT_HEIGHT
  ) {
    scaleFactor = CROP_VIEWPORT_HEIGHT / minimumDimension;
  }

  return scaleFactor * userScaleFactor;
};

// ------------------------------------------------------------
// CROP CONTAINER
// ------------------------------------------------------------

const CropContainer: React.FC<CropContainerProps> = ({
  animatedValue,
  minCoords,
  maxCoords,
  width,
  height,
  getComputedAnimatedValue,
}) => {
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e, g) => {
      animatedValue.extractOffset();
    },
    onPanResponderMove: (e, g) => {
      const computedX = g.dx / (minCoords.x * -1);
      const computedY = g.dy / (minCoords.y * -1);
      animatedValue.setValue({x: computedX, y: computedY});
    },
    onPanResponderEnd: (e, g) => {},
    onPanResponderRelease: (e, g) => {
      animatedValue.flattenOffset();
      const computedAnimatedValue = getComputedAnimatedValue();

      if (computedAnimatedValue.x < 0) {
        Animated.spring(animatedValue.x, {
          toValue: 0,
          tension: 1,
        }).start();
      }

      if (computedAnimatedValue.y < 0) {
        Animated.spring(animatedValue.y, {
          toValue: 0,
          tension: 1,
        }).start();
      }

      if (computedAnimatedValue.x > 1) {
        Animated.spring(animatedValue.x, {
          toValue: 1,
          tension: 1,
        }).start();
      }

      if (computedAnimatedValue.y > 1) {
        Animated.spring(animatedValue.y, {
          toValue: 1,
          tension: 1,
        }).start();
      }
    },
  });

  return (
    <View style={styles.container}>
      {/* <Image style={{
           transform: [
              {rotate: "90"}
           ]
        }} source={} /> */}
      <Animated.Image
        style={{
          width,
          height,
          position: 'absolute',
          top: animatedValue.y.interpolate({
            inputRange: [0, 1],
            outputRange: [minCoords.y, maxCoords.y],
            extrapolate: 'extend',
          }),
          left: animatedValue.x.interpolate({
            inputRange: [0, 1],
            outputRange: [minCoords.x, maxCoords.x],
            extrapolate: 'extend',
          }),
        }}
        source={{uri: imageURI}}
        {...panResponder.panHandlers}
      />
      <View pointerEvents="none" style={styles.overlay}></View>
    </View>
  );
};

// ----------------------------------------------------------------
// CROPPER
// ----------------------------------------------------------------

const Cropper: React.FC = () => {
  const [imageDimensions, setImageDimensions] = useState<Dimms>();
  const [userScaleFactor, setUserScaleFactor] = useState(1);

  useEffect(() => {
    Image.getSize(
      imageURI,
      (width, height) => {
        setImageDimensions({width, height});
      },
      error => false,
    );
  }, []);

  if (!imageDimensions) {
    return <Text>Loading</Text>;
  }

  const animatedValue = new Animated.ValueXY({x: 0.5, y: 0.5});
  const {width: imageWidth, height: imageHeight} = imageDimensions;
  const scaleFactor = getScaleFactor(imageWidth, imageHeight, userScaleFactor);
  const width = imageWidth * scaleFactor;
  const height = imageHeight * scaleFactor;

  let minCoords: Coords, maxCoords: Coords;

  minCoords = getMinCoords(width, height);
  maxCoords = getMaxCoords(width, height);

  const getComputedAnimatedValue = (): Coords => {
    return {
      x: Number((animatedValue.x as any)['_value']),
      y: Number((animatedValue.y as any)['_value']),
    };
  };

  const getComputedTransformValues = (): Coords => {
    const computedAnimatedValue = getComputedAnimatedValue();
    const {x, y} = computedAnimatedValue;

    return {
      x: (1 - Math.abs(x)) * (maxCoords.x - minCoords.x) * -1,
      y: (1 - Math.abs(y)) * (maxCoords.y - minCoords.y) * -1,
    };
  };

  const cropImage = async () => {
    const cropperTransform = getComputedTransformValues();
    const {x, y} = cropperTransform;
    const scaleFactor = getScaleFactor(
      imageDimensions?.width ?? 0,
      imageDimensions?.height ?? 0,
      userScaleFactor,
    );

    const cropCoordinates = getCropCoordinates(x, y, scaleFactor);

    const croppedImage = await ImageEditor.cropImage(imageURI, {
      offset: {x: cropCoordinates.x, y: cropCoordinates.y},
      size: {
        width: cropCoordinates.width,
        height: cropCoordinates.height,
      },
    });

    const base64 = await RNFS.readFile(croppedImage, 'base64');
    console.log(base64);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <Text style={styles.headerText}>
          Crop your picture ({CROP_VIEWPORT_WIDTH}:{CROP_VIEWPORT_HEIGHT})
        </Text>
        {!!imageDimensions && (
          <CropContainer
            animatedValue={animatedValue}
            getComputedAnimatedValue={getComputedAnimatedValue}
            minCoords={minCoords}
            maxCoords={maxCoords}
            width={width}
            height={height}
          />
        )}

        <Slider
          minimumValue={1}
          maximumValue={2}
          step={0.1}
          style={styles.slider}
          value={userScaleFactor}
          onValueChange={setUserScaleFactor}
        />

        <Button title="Crop Image" onPress={cropImage}></Button>
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
    overflow: 'hidden',
  } as ViewStyle,
  slider: {
    marginBottom: 15,
  } as ViewStyle,
  overlay: {
    backgroundColor: 'rgba(255,255,255,.35)',
    width: CROP_VIEWPORT_WIDTH - CROP_VIEWPORT_PADDING * 2,
    height: CROP_VIEWPORT_HEIGHT - CROP_VIEWPORT_PADDING * 2,
    top: CROP_VIEWPORT_PADDING,
    left: CROP_VIEWPORT_PADDING,
    borderRadius: CROP_VIEWPORT_PADDING * 2,
    borderWidth: 4,
    borderColor: 'white',
    borderStyle: 'dotted',
  } as ViewStyle,
});

export default Cropper;
