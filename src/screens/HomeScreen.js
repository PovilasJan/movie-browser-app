import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { getPopularMovies, getPosterUrl, getBackdropUrl } from '../api/tmdb';

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

export default function HomeScreen({ navigation }) {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState({});

  const handleImageLoadStart = (id) => {
    setImageLoading(prev => ({ ...prev, [id]: true }));
  };

  const handleImageLoadEnd = (id) => {
    setImageLoading(prev => ({ ...prev, [id]: false }));
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const data = await getPopularMovies();
      if (data.results && data.results.length > 0) {
        setFeaturedMovies(data.results.slice(0, 5));
      }
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

      {/* Featured Movies */}
      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>✨ Featured Today</Text>
        
        {featuredMovies.map((movie, index) => (
          <TouchableOpacity
            key={movie.id}
            style={[
              styles.movieCard,
              index === 0 && styles.firstCard,
            ]}
            onPress={() => navigation.navigate('Details', { movieId: movie.id })}
            activeOpacity={0.9}
          >
            <View style={styles.cardImageContainer}>
              {imageLoading[`featured-${movie.id}`] && (
                <View style={styles.imageLoader}>
                  <ShimmerPlaceholder />
                </View>
              )}
              <Image
                source={{ uri: index === 0 ? getBackdropUrl(movie.backdrop_path) : getPosterUrl(movie.poster_path) }}
                style={index === 0 ? styles.heroImage : styles.cardImage}
                onLoadStart={() => handleImageLoadStart(`featured-${movie.id}`)}
                onLoadEnd={() => handleImageLoadEnd(`featured-${movie.id}`)}
              />
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {movie.vote_average.toFixed(1)}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
              <Text style={styles.movieDescription} numberOfLines={3}>
                {movie.overview}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.releaseDate}>
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                </Text>
                <View style={styles.watchButton}>
                  <Text style={styles.watchButtonText}>View Details →</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  heroSection: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  featuredSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  movieCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  firstCard: {
    elevation: 8,
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardImageContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  cardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  imageLoader: {
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
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  movieDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  releaseDate: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  watchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  watchButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
