import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import BrowseScreen from './src/screens/BrowseScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import PlayerScreen from './src/screens/PlayerScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [selectedVideoKey, setSelectedVideoKey] = useState(null);
  const [selectedMovieTitle, setSelectedMovieTitle] = useState('');

  const navigateTo = (screen, params = {}) => {
    if (params.movieId) setSelectedMovieId(params.movieId);
    if (params.videoKey) setSelectedVideoKey(params.videoKey);
    if (params.movieTitle) setSelectedMovieTitle(params.movieTitle);
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen navigation={{ navigate: navigateTo }} />;
      case 'Browse':
        return <BrowseScreen navigation={{ navigate: navigateTo }} />;
      case 'Details':
        return <DetailsScreen navigation={{ navigate: navigateTo, goBack: () => setCurrentScreen('Browse') }} route={{ params: { movieId: selectedMovieId } }} />;
      case 'Player':
        return <PlayerScreen navigation={{ goBack: () => setCurrentScreen('Details') }} route={{ params: { videoKey: selectedVideoKey, movieTitle: selectedMovieTitle } }} />;
      default:
        return <HomeScreen navigation={{ navigate: navigateTo }} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
      
      {/* Bottom Tab Bar */}
      {(currentScreen === 'Home' || currentScreen === 'Browse') && (
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => setCurrentScreen('Home')}
          >
            <Text style={[styles.tabText, currentScreen === 'Home' && styles.activeTab]}>
              🏠 Home
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => setCurrentScreen('Browse')}
          >
            <Text style={[styles.tabText, currentScreen === 'Browse' && styles.activeTab]}>
              🎬 Browse
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTab: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
