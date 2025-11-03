import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Animated,
} from 'react-native';
import {
  getPopularMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getTopRatedMovies,
  getPosterUrl,
} from '../api/tmdb';

const ShimmerPlaceholder = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.shimmer, { opacity }]} />
  );
};

const MovieItem = React.memo(({ item, navigation, imageLoading, onLoadStart, onLoadEnd }) => (
  <View style={styles.movieItem}>
    <TouchableOpacity
      onPress={() => navigation.navigate('Details', { movieId: item.id })}
    >
      <View style={styles.posterContainer}>
        {imageLoading[item.id] && (
          <View style={styles.posterLoader}>
            <ShimmerPlaceholder />
          </View>
        )}
        <Image
          source={{ uri: getPosterUrl(item.poster_path) }}
          style={styles.moviePoster}
          onLoadStart={() => onLoadStart(item.id)}
          onLoadEnd={() => onLoadEnd(item.id)}
        />
      </View>
    </TouchableOpacity>
    <Text style={styles.movieTitle} numberOfLines={2}>
      {item.title}
    </Text>
    <Text style={styles.movieRating}>⭐ {item.vote_average.toFixed(1)}</Text>
  </View>
));

const MovieRow = ({ title, movies, navigation }) => {
  const [imageLoading, setImageLoading] = React.useState({});

  const handleImageLoadStart = (movieId) => {
    setImageLoading(prev => ({ ...prev, [movieId]: true }));
  };

  const handleImageLoadEnd = (movieId) => {
    setImageLoading(prev => ({ ...prev, [movieId]: false }));
  };

  const renderMovie = ({ item }) => (
    <MovieItem
      item={item}
      navigation={navigation}
      imageLoading={imageLoading}
      onLoadStart={handleImageLoadStart}
      onLoadEnd={handleImageLoadEnd}
    />
  );

  return (
    <View style={styles.rowContainer}>
      <Text style={styles.rowTitle}>{title}</Text>
      <FlatList
        horizontal={true}
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

export default function BrowseScreen({ navigation }) {
  const [popularMovies, setPopularMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllMovies();
  }, []);

  const loadAllMovies = async () => {
    try {
      const [popular, nowPlaying, upcoming, topRated] = await Promise.all([
        getPopularMovies(),
        getNowPlayingMovies(),
        getUpcomingMovies(),
        getTopRatedMovies(),
      ]);

      setPopularMovies(popular.results || []);
      setNowPlayingMovies(nowPlaying.results || []);
      setUpcomingMovies(upcoming.results || []);
      setTopRatedMovies(topRated.results || []);
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <MovieRow title="Popular Movies" movies={popularMovies} navigation={navigation} />
      <MovieRow title="Now Playing" movies={nowPlayingMovies} navigation={navigation} />
      <MovieRow title="Coming Soon" movies={upcomingMovies} navigation={navigation} />
      <MovieRow title="Top Rated" movies={topRatedMovies} navigation={navigation} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  rowContainer: {
    marginVertical: 12,
  },
  rowTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 12,
  },
  rowContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  movieItem: {
    width: 140,
    marginRight: 12,
  },
  posterContainer: {
    width: 140,
    height: 210,
    position: 'relative',
  },
  moviePoster: {
    width: 140,
    height: 210,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  posterLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    zIndex: 1,
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  movieTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    height: 36,
  },
  movieRating: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
