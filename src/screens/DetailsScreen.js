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
  Dimensions,
  Animated,
} from 'react-native';
import {
  getMovieDetails,
  getSimilarMovies,
  getMovieVideos,
  getBackdropUrl,
  getPosterUrl,
} from '../api/tmdb';

const { width } = Dimensions.get('window');

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

const SimilarMovieItem = React.memo(({ item, navigation, imageLoading, onLoadStart, onLoadEnd }) => (
  <View style={styles.similarMovie}>
    <TouchableOpacity
      onPress={() => {
        navigation.goBack();
        setTimeout(() => navigation.navigate('Details', { movieId: item.id }), 100);
      }}
    >
      <View style={styles.similarPosterContainer}>
        {imageLoading[`similar-${item.id}`] && (
          <View style={styles.similarPosterLoader}>
            <ShimmerPlaceholder />
          </View>
        )}
        <Image
          source={{ uri: getPosterUrl(item.poster_path) }}
          style={styles.similarPoster}
          onLoadStart={() => onLoadStart(`similar-${item.id}`)}
          onLoadEnd={() => onLoadEnd(`similar-${item.id}`)}
        />
      </View>
    </TouchableOpacity>
    <Text style={styles.similarTitle} numberOfLines={2}>
      {item.title}
    </Text>
  </View>
));

export default function DetailsScreen({ route, navigation }) {
  const { movieId } = route.params;
  const [movie, setMovie] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState({});

  const handleImageLoadStart = (id) => {
    setImageLoading(prev => ({ ...prev, [id]: true }));
  };

  const handleImageLoadEnd = (id) => {
    setImageLoading(prev => ({ ...prev, [id]: false }));
  };

  useEffect(() => {
    loadMovieDetails();
  }, [movieId]);

  const loadMovieDetails = async () => {
    try {
      const [movieData, similarData, videosData] = await Promise.all([
        getMovieDetails(movieId),
        getSimilarMovies(movieId),
        getMovieVideos(movieId),
      ]);

      setMovie(movieData);
      setSimilarMovies(similarData.results || []);
      setVideos(videosData.results || []);
    } catch (error) {
      console.error('Error loading movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrailer = () => {
    const trailer = videos.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    ) || videos[0];

    if (trailer) {
      navigation.navigate('Player', { videoKey: trailer.key, movieTitle: movie.title });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Movie not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {/* Backdrop Image */}
      <View style={styles.backdropContainer}>
        {imageLoading['backdrop'] && (
          <View style={styles.backdropLoader}>
            <ShimmerPlaceholder />
          </View>
        )}
        <Image
          source={{ uri: getBackdropUrl(movie.backdrop_path) }}
          style={styles.backdrop}
          onLoadStart={() => handleImageLoadStart('backdrop')}
          onLoadEnd={() => handleImageLoadEnd('backdrop')}
        />
        <View style={styles.backdropOverlay} />
      </View>

      {/* Movie Info */}
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.posterContainer}>
            {imageLoading['poster'] && (
              <View style={styles.posterLoader}>
                <ShimmerPlaceholder />
              </View>
            )}
            <Image
              source={{ uri: getPosterUrl(movie.poster_path) }}
              style={styles.poster}
              onLoadStart={() => handleImageLoadStart('poster')}
              onLoadEnd={() => handleImageLoadEnd('poster')}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{movie.title}</Text>
            <Text style={styles.rating}>⭐ {movie.vote_average.toFixed(1)}/10</Text>
            <Text style={styles.metadata}>
              {movie.release_date?.split('-')[0]} • {movie.runtime} min
            </Text>
            <Text style={styles.genres}>
              {movie.genres?.map((g) => g.name).join(', ')}
            </Text>
          </View>
        </View>

        {/* Play Movie Button */}
        {videos.length > 0 && (
          <TouchableOpacity style={styles.playButton} onPress={handlePlayTrailer}>
            <Text style={styles.playButtonText}>▶ Play Trailer</Text>
          </TouchableOpacity>
        )}

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movie Details</Text>
          <Text style={styles.overview}>{movie.overview}</Text>
        </View>

        {/* Similar Movies */}
        {similarMovies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Title</Text>
            <FlatList
              horizontal={true}
              data={similarMovies.slice(0, 10)}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              initialNumToRender={4}
              maxToRenderPerBatch={4}
              windowSize={5}
              removeClippedSubviews={true}
              renderItem={({ item }) => (
                <SimilarMovieItem
                  item={item}
                  navigation={navigation}
                  imageLoading={imageLoading}
                  onLoadStart={handleImageLoadStart}
                  onLoadEnd={handleImageLoadEnd}
                />
              )}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  backdropContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    zIndex: 1,
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  backdropOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 16,
  },
  headerSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  posterContainer: {
    width: 120,
    height: 180,
    position: 'relative',
  },
  poster: {
    width: 120,
    height: 180,
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
  headerInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  metadata: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  genres: {
    fontSize: 14,
    color: '#007AFF',
  },
  playButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  overview: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  similarMovie: {
    width: 120,
    marginRight: 12,
  },
  similarPosterContainer: {
    width: 120,
    height: 180,
    position: 'relative',
  },
  similarPoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  similarPosterLoader: {
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
  similarTitle: {
    marginTop: 8,
    fontSize: 14,
    height: 36,
  },
});
