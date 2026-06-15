import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

interface Content {
  id: string;
  title: string;
  type: 'video' | 'article' | 'guide';
  description: string;
  createdDate: string;
  views: number;
  status: 'published' | 'draft';
}

export default function TrainerContentManagementScreen({navigation}: any) {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'video' | 'article' | 'guide'>('all');

  useEffect(() => {
    fetchContents();
  }, [filter]);

  const fetchContents = async () => {
    try {
      const response = await apiClient.get('/trainer/contents', {
        params: {type: filter === 'all' ? undefined : filter},
      });
      setContents(response.data.contents);
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (contentId: string) => {
    Alert.alert(
      'Delete Content',
      'Are you sure you want to delete this content?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/trainer/contents/${contentId}`);
              setContents(contents.filter(c => c.id !== contentId));
              Alert.alert('Success', 'Content deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete content');
            }
          },
        },
      ],
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'article': return 'document-text';
      case 'guide': return 'book';
      default: return 'document';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return '#FF3B30';
      case 'article': return '#007AFF';
      case 'guide': return '#34C759';
      default: return '#666';
    }
  };

  const filteredContents = contents.filter(content =>
    content.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderContent = ({item}: {item: Content}) => (
    <View style={styles.contentCard}>
      <View style={styles.contentHeader}>
        <View style={[styles.typeIcon, {backgroundColor: getTypeColor(item.type) + '20'}]}>
          <Icon name={getTypeIcon(item.type)} size={24} color={getTypeColor(item.type)} />
        </View>
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle}>{item.title}</Text>
          <Text style={styles.contentDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>

      <View style={styles.contentMeta}>
        <View style={styles.metaItem}>
          <Icon name="eye" size={14} color="#666" />
          <Text style={styles.metaText}>{item.views} views</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="calendar" size={14} color="#666" />
          <Text style={styles.metaText}>{new Date(item.createdDate).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: item.status === 'published' ? '#34C759' : '#FF9500'}]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditContent', {content: item})}>
          <Icon name="create" size={16} color="#007AFF" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteContent(item.id)}>
          <Icon name="trash" size={16} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Content Management</Text>
        <Text style={styles.subtitle}>{contents.length} total contents</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search content..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'video', 'article', 'guide'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.filterButton, filter === type && styles.filterButtonActive]}
            onPress={() => setFilter(type)}>
            <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredContents}
        renderItem={renderContent}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="folder-open-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No content found</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateContent')}>
              <Icon name="add-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Content</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateContent')}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
