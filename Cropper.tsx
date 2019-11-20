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

type CropContainerProps = {
  imageDimensions: Dimms;
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

const getScaleFactor = (imageWidth: number, imageHeight: number) => {
  const minimumDimension = Math.min(imageWidth, imageHeight);

  if (
    minimumDimension === imageWidth &&
    minimumDimension < CROP_VIEWPORT_WIDTH
  ) {
    return CROP_VIEWPORT_WIDTH / minimumDimension;
  }

  if (
    minimumDimension === imageHeight &&
    minimumDimension < CROP_VIEWPORT_HEIGHT
  ) {
    return CROP_VIEWPORT_HEIGHT / minimumDimension;
  }

  return 1;
};

const CropContainer: React.FC<CropContainerProps> = ({imageDimensions}) => {
  const {width: imageWidth, height: imageHeight} = imageDimensions;
  const scaleFactor = getScaleFactor(imageWidth, imageHeight);
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

  //   const handleAnimatedValueChange = (value: any) => {
  //     console.log({value});
  //   };

  animatedValue = new Animated.ValueXY({x: centerCoords.x, y: centerCoords.y});

  //   useEffect(() => {
  //     const listenerID = animatedValue.addListener(handleAnimatedValueChange);

  //     return () => {
  //       animatedValue.removeListener(listenerID);
  //     };
  //   }, []);

  panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e, g) => {
      animatedValue.extractOffset();
      // this.animatedValue.extractOffset();
    },
    onPanResponderMove: (e, g) => {
      // console.log(g.dx);
      animatedValue.setValue({x: g.dx, y: g.dy});
      // this.animatedValue.setValue(this.getComputedAnimatedValue(g.dx));
      // this.setAnimatedStateValue();
    },
    onPanResponderEnd: (e, g) => {
      // this.animatedValue.setValue(this.getComputedAnimatedValue(g.dx));
      // this.setAnimatedStateValue();
    },
    onPanResponderRelease: (e, g) => {
      animatedValue.flattenOffset();
      const computedAnimatedValue = getComputedAnimatedValue();

      if (computedAnimatedValue.x < minCoords.x) {
        Animated.spring(animatedValue.x, {
          toValue: minCoords.x,
          tension: 1,
        }).start();
      }

      if (computedAnimatedValue.y < minCoords.y) {
        Animated.spring(animatedValue.y, {
          toValue: minCoords.y,
          tension: 1,
        }).start();
      }

      if (computedAnimatedValue.x > maxCoords.x) {
        Animated.spring(animatedValue.x, {
          toValue: maxCoords.x,
          tension: 1,
        }).start();
      }

      if (computedAnimatedValue.y > maxCoords.y) {
        Animated.spring(animatedValue.y, {
          toValue: maxCoords.y,
          tension: 1,
        }).start();
      }
    },
  });

  //   const initializeSystem = () => {
  //     minCoords = getMinCoords(width, height);
  //     maxCoords = getMaxCoords(width, height);
  //     centerCoords = getCenterCoords(width, height);

  //     animatedValue = new Animated.ValueXY({x: minCoords.x, y: minCoords.y});
  //   };

  //   useEffect(() => {
  //     initializeSystem();
  //   }, []);

  // const panResponder = PanResponder.create()

  return (
    <View style={styles.container}>
      <Animated.Image
        style={{
          width,
          height,
          position: 'absolute',
          top: animatedValue.y.interpolate({
            inputRange: [minCoords.y, maxCoords.y],
            outputRange: [minCoords.y, maxCoords.y],
            extrapolate: 'extend',
          }),
          left: animatedValue.x.interpolate({
            inputRange: [minCoords.x, maxCoords.x],
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
          <CropContainer imageDimensions={imageDimensions} />
        )}

        <Slider minimumValue={1} maximumValue={2} step={0.1} />
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
});

export default Cropper;
