import React from 'react';
import {View, Text, ScrollView} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import {styles} from './styles';

export default function VideoDetailScreen({route}: any) {
  const video = route?.params?.video || {id: 'dQw4w9WgXcQ', title: 'Sample Workout Video', description: 'This is a sample workout video.'};

  return (
    <ScrollView style={styles.container}>
      <YoutubePlayer height={220} videoId={video.id} />
      <View style={styles.content}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.description}>{video.description}</Text>
      </View>
    </ScrollView>
  );
}
