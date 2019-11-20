import React, { useEffect, useState } from "react";
import {
   Animated,
   Dimensions,
   Image,
   PanResponder,
   PanResponderInstance,
   SafeAreaView,
   Slider,
   StatusBar,
   StyleSheet,
   Text,
   TextStyle,
   View,
   ViewStyle,
} from "react-native";

const imageURI =
  'https://i0.wp.com/thenewcamera.com/wp-content/uploads/2019/09/Fuji-X-A7-sample-image-1.jpg?resize=730%2C730';
// const imageURI = 'https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg';
// const imageURI = 'https://cdn.shopify.com/s/files/1/0100/5302/products/EH028ST_Photo_Web_f912f48f-2834-4a67-a77c-3bd50956df07_grande.jpg?v=1550089716';
const SCREEN_WIDTH = Dimensions.get('screen').width;
const SCREEN_HEIGHT = Dimensions.get('screen').height;
const CROP_VIEWPORT_WIDTH = SCREEN_WIDTH;
const CROP_VIEWPORT_HEIGHT = SCREEN_HEIGHT * 0.6;

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
  imageDimensions: Dimms;
  userScaleFactor: number;
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

const getCenterCoords = (imageWidth: number, imageHeight: number) => {
  const minCoords = getMinCoords(imageWidth, imageHeight);
  const maxCoords = getMaxCoords(imageWidth, imageHeight);

  return {
    x: (minCoords.x - maxCoords.x) * 0.5,
    y: (minCoords.y - maxCoords.y) * 0.5,
  };
};

const getCropCoordinates = (
  x: number,
  y: number,
  scaleFactor: number,
): CropCoords => {
  return {
    x: x * (1 / scaleFactor) * -1,
    y: y * (1 / scaleFactor) * -1,
    width: (CROP_VIEWPORT_WIDTH * 1) / scaleFactor,
    height: (CROP_VIEWPORT_HEIGHT * 1) / scaleFactor,
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

const CropContainer: React.FC<CropContainerProps> = ({
  imageDimensions,
  userScaleFactor,
}) => {
  const {width: imageWidth, height: imageHeight} = imageDimensions;
  const scaleFactor = getScaleFactor(imageWidth, imageHeight, userScaleFactor);
  const width = imageWidth * scaleFactor;
  const height = imageHeight * scaleFactor;

  let minCoords: Coords,
    maxCoords: Coords,
    centerCoords: Coords,
    animatedValue: Animated.ValueXY,
    panResponder: PanResponderInstance;

  minCoords = getMinCoords(width, height);
  maxCoords = getMaxCoords(width, height);
  centerCoords = getCenterCoords(width, height);

  const getComputedAnimatedValue = (): Coords => {
    return {
      x: Number((animatedValue.x as any)['_value']),
      y: Number((animatedValue.y as any)['_value']),
    };
  };

  animatedValue = new Animated.ValueXY({x: 0.5, y: 0.5});

  panResponder = PanResponder.create({
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
    </View>
  );
};

const Cropper: React.FC = () => {
  const [imageDimensions, setImageDimensions] = useState<Dimms>();
  const [userScaleFactor, setUserScaleFactor] = useState(1);

  useEffect(() => {
    Image.getSize(
      imageURI,
      (width, height) => setImageDimensions({width, height}),
      error => false,
    );
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <Text style={styles.headerText}>
          Crop your picture ({CROP_VIEWPORT_WIDTH}:{CROP_VIEWPORT_HEIGHT})
        </Text>
        {!!imageDimensions && (
          <CropContainer
            imageDimensions={imageDimensions}
            userScaleFactor={userScaleFactor}
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
});

export default Cropper;
