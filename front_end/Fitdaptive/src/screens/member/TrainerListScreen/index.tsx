import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);

const resolveAvatarUrl = (avatarUrl?: string | null) => {
  if (!avatarUrl) {
    return null;
  }
  if (/^https?:\/\//i.test(avatarUrl)) {
    return avatarUrl;
  }
  const baseUrl = apiClient.defaults.baseURL?.replace('/api/v1', '') || '';
  return `${baseUrl}${avatarUrl}`;
};

const getAge = (dob?: string | null) => {
  if (!dob) {
    return null;
  }

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const formatGender = (gender?: string | null) => {
  if (!gender) {
    return null;
  }

  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

const parseDateOnly = (value?: string | null) => {
  if (!value) {
    return new Date(NaN);
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  return new Date(value);
};

const getTrainerFacts = (item: any) => {
  const facts = [];
  const age = getAge(item.trainer_dob);
  const gender = formatGender(item.trainer_gender);

  if (gender) {
    facts.push(gender);
  }
  if (age != null) {
    facts.push(`${age} yrs`);
  }
  if (item.trainer_height != null) {
    facts.push(`${Number(item.trainer_height)} cm`);
  }
  if (item.trainer_weight != null) {
    facts.push(`${Number(item.trainer_weight)} kg`);
  }

  return facts;
};

const normalizeText = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase();

const parsePriceInput = (value: string) => {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
};

const DAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

type SortOption =
  | 'price_asc'
  | 'price_desc'
  | 'rating_asc'
  | 'rating_desc'
  | 'name_asc'
  | 'name_desc';

type SortCategory = 'price' | 'rating' | 'name';

const PRICE_SORT_OPTIONS: Array<{label: string; value: SortOption}> = [
  {label: 'Lowest - Highest', value: 'price_asc'},
  {label: 'Highest - Lowest', value: 'price_desc'},
];

const RATING_SORT_OPTIONS: Array<{label: string; value: SortOption}> = [
  {label: 'Lowest - Highest', value: 'rating_asc'},
  {label: 'Highest - Lowest', value: 'rating_desc'},
];

const NAME_SORT_OPTIONS: Array<{label: string; value: SortOption}> = [
  {label: 'A-Z', value: 'name_asc'},
  {label: 'Z-A', value: 'name_desc'},
];

const SORT_OPTION_LABELS: Record<SortOption, string> = {
  price_asc: 'Price: Lowest - Highest',
  price_desc: 'Price: Highest - Lowest',
  rating_asc: 'Rating: Lowest - Highest',
  rating_desc: 'Rating: Highest - Lowest',
  name_asc: 'Name: A-Z',
  name_desc: 'Name: Z-A',
};

const getNumericValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTrainerSortName = (item: any) =>
  normalizeText(item?.trainer_name || item?.title || '');

const getSortCategory = (sortOption: SortOption): SortCategory => {
  if (sortOption.startsWith('price_')) {
    return 'price';
  }
  if (sortOption.startsWith('rating_')) {
    return 'rating';
  }

  return 'name';
};

const compareBySortOption = (a: any, b: any, sortOption: SortOption) => {
  switch (sortOption) {
    case 'price_asc':
      return getNumericValue(a.price) - getNumericValue(b.price);
    case 'price_desc':
      return getNumericValue(b.price) - getNumericValue(a.price);
    case 'rating_asc':
      return getNumericValue(a.avg_rating) - getNumericValue(b.avg_rating);
    case 'rating_desc':
      return getNumericValue(b.avg_rating) - getNumericValue(a.avg_rating);
    case 'name_asc':
      return getTrainerSortName(a).localeCompare(getTrainerSortName(b));
    case 'name_desc':
      return getTrainerSortName(b).localeCompare(getTrainerSortName(a));
    default:
      return 0;
  }
};

export default function TrainerListScreen({navigation}: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasBlockingHire, setHasBlockingHire] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<
    'all' | 'public' | 'private'
  >('all');
  const [sessionTypeFilter, setSessionTypeFilter] = useState<
    'all' | 'online' | 'offline'
  >('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [scheduleDayFilter, setScheduleDayFilter] = useState<string[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [failedAvatarIds, setFailedAvatarIds] = useState<
    Record<string, boolean>
  >({});

  const load = useCallback(async () => {
    try {
      const [postsRes, hiresRes] = await Promise.all([
        apiClient.get('/trainers'),
        apiClient.get('/trainers/hires/mine'),
      ]);
      setPosts(postsRes.data);
      setFailedAvatarIds({});
      const hires: any[] = hiresRes.data || [];
      setHasBlockingHire(
        hires.some(h =>
          [
            'pending_payment',
            'pending_approval',
            'enrolled',
            'active',
          ].includes(h.status),
        ),
      );
    } catch (e) {
      console.error('TrainerList fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const minPriceValue = parsePriceInput(minPrice);
  const maxPriceValue = parsePriceInput(maxPrice);
  const normalizedSearch = normalizeText(search);
  const normalizedFocusKeyword = normalizeText(focusKeyword);
  const normalizedLocationQuery = normalizeText(locationQuery);

  const filteredPosts = posts.filter(item => {
    const searchableText = normalizeText(
      [
        item.trainer_name,
        item.title,
        item.description,
        item.focus_areas,
        item.location,
      ].join(' '),
    );

    if (normalizedSearch && !searchableText.includes(normalizedSearch)) {
      return false;
    }

    if (visibilityFilter !== 'all' && item.visibility !== visibilityFilter) {
      return false;
    }

    if (
      sessionTypeFilter !== 'all' &&
      item.session_type !== sessionTypeFilter
    ) {
      return false;
    }

    if (
      normalizedFocusKeyword &&
      !normalizeText(item.focus_areas).includes(normalizedFocusKeyword)
    ) {
      return false;
    }

    if (normalizedLocationQuery) {
      if (item.session_type !== 'offline') {
        return false;
      }

      if (!normalizeText(item.location).includes(normalizedLocationQuery)) {
        return false;
      }
    }

    if (minPriceValue != null && Number(item.price) < minPriceValue) {
      return false;
    }

    if (maxPriceValue != null && Number(item.price) > maxPriceValue) {
      return false;
    }

    if (scheduleDayFilter.length > 0) {
      const schedule = Array.isArray(item.schedule) ? item.schedule : [];
      const scheduledDays = Array.from(
        new Set(schedule.map((slot: any) => slot?.day).filter(Boolean)),
      );

      if (
        scheduledDays.length === 0 ||
        scheduledDays.some(day => !scheduleDayFilter.includes(day))
      ) {
        return false;
      }
    }

    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    for (const sortOption of sortOptions) {
      const comparison = compareBySortOption(a, b, sortOption);

      if (comparison !== 0) {
        return comparison;
      }
    }

    return 0;
  });

  const activeFilterCount = [
    visibilityFilter !== 'all',
    sessionTypeFilter !== 'all',
    minPrice.trim() !== '',
    maxPrice.trim() !== '',
    focusKeyword.trim() !== '',
    locationQuery.trim() !== '',
    scheduleDayFilter.length > 0,
  ].filter(Boolean).length;
  const activeSortCount = sortOptions.length;
  const activeCriteriaCount = activeFilterCount + activeSortCount;

  const hasSearchOrFilter = normalizedSearch !== '' || activeFilterCount > 0;

  const clearFilters = () => {
    setVisibilityFilter('all');
    setSessionTypeFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setFocusKeyword('');
    setLocationQuery('');
    setScheduleDayFilter([]);
    setSortOptions([]);
  };

  const toggleSortOption = (sortOption: SortOption) => {
    setSortOptions(current => {
      if (current.includes(sortOption)) {
        return current.filter(option => option !== sortOption);
      }

      const nextCategory = getSortCategory(sortOption);
      const categoryIndex = current.findIndex(
        option => getSortCategory(option) === nextCategory,
      );

      if (categoryIndex === -1) {
        return [...current, sortOption];
      }

      const nextOptions = [...current];
      nextOptions[categoryIndex] = sortOption;
      return nextOptions;
    });
  };

  const toggleScheduleDay = (day: string) => {
    setScheduleDayFilter(current =>
      current.includes(day)
        ? current.filter(item => item !== day)
        : [...current, day],
    );
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const shouldRedirectToSubscriptions = !loading && hasBlockingHire;

  useEffect(() => {
    if (shouldRedirectToSubscriptions) {
      navigation.reset({
        index: 0,
        routes: [{name: 'TrainerOffers'}],
      });
    }
  }, [navigation, shouldRedirectToSubscriptions]);

  if (loading || shouldRedirectToSubscriptions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Trainer</Text>
        <Text style={styles.subtitle}>
          {filteredPosts.length} trainer{filteredPosts.length !== 1 ? 's' : ''}
          {hasSearchOrFilter ? ` shown of ${posts.length}` : ' available'}
        </Text>
        <TouchableOpacity
          style={styles.mySubsButton}
          onPress={() => navigation.navigate('TrainerOffers')}>
          <Icon name="receipt-outline" size={16} color="#007AFF" />
          <Text style={styles.mySubsText}>My Subscriptions</Text>
        </TouchableOpacity>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Icon name="search-outline" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search trainer, focus area, location..."
              placeholderTextColor="#999"
            />
            {!!search.trim() && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="close-circle" size={18} color="#bbb" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}>
            <Icon name="options-outline" size={18} color="#007AFF" />
            <Text style={styles.filterButtonText}>Filters</Text>
            {activeCriteriaCount > 0 ? (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>
                  {activeCriteriaCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {activeCriteriaCount > 0 && (
          <View style={styles.activeFilterBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFilterScroll}>
              {sortOptions.map(sortOption => (
                <View key={sortOption} style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    {SORT_OPTION_LABELS[sortOption]}
                  </Text>
                </View>
              ))}
              {visibilityFilter !== 'all' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    {visibilityFilter === 'private' ? 'Private' : 'Public'}
                  </Text>
                </View>
              )}
              {sessionTypeFilter !== 'all' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    {sessionTypeFilter === 'offline' ? 'Offline' : 'Online'}
                  </Text>
                </View>
              )}
              {!!minPrice.trim() && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Min {formatPrice(minPriceValue || 0)}
                  </Text>
                </View>
              )}
              {!!maxPrice.trim() && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Max {formatPrice(maxPriceValue || 0)}
                  </Text>
                </View>
              )}
              {!!focusKeyword.trim() && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Focus: {focusKeyword.trim()}
                  </Text>
                </View>
              )}
              {!!locationQuery.trim() && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    Location: {locationQuery.trim()}
                  </Text>
                </View>
              )}
              {scheduleDayFilter.map(day => (
                <View key={day} style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>Day: {day}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={sortedPosts}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          hasBlockingHire ? (
            <View style={{alignItems: 'center', padding: 32}}>
              <Icon name="checkmark-circle" size={48} color="#34C759" />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#333',
                  marginTop: 12,
                  textAlign: 'center',
                }}>
                You already have a pending or active subscription
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: '#888',
                  marginTop: 6,
                  textAlign: 'center',
                }}>
                Complete or end your current subscription before hiring a new
                trainer.
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: '#007AFF',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
                onPress={() => navigation.navigate('TrainerOffers')}>
                <Text style={{color: '#fff', fontWeight: '600'}}>
                  View My Subscription
                </Text>
              </TouchableOpacity>
            </View>
          ) : hasSearchOrFilter ? (
            <View style={styles.emptyState}>
              <Icon name="search-outline" size={42} color="#bbb" />
              <Text style={styles.emptyTitle}>No matching trainers found</Text>
              <Text style={styles.emptyText}>
                Try changing your search terms or clearing some filters.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="people-outline" size={42} color="#bbb" />
              <Text style={styles.emptyTitle}>No trainers available</Text>
              <Text style={styles.emptyText}>
                Check back later for new trainer posts.
              </Text>
            </View>
          )
        }
        renderItem={({item}) => {
          const itemId = String(item.id);
          const avatarUrl = failedAvatarIds[itemId]
            ? null
            : resolveAvatarUrl(item.avatar_url);
          const trainerFacts = getTrainerFacts(item);

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('TrainerDetail', {postId: item.id})
              }>
              <View style={styles.cardHeader}>
                {avatarUrl ? (
                  <Image
                    source={{uri: avatarUrl}}
                    style={styles.profileImage}
                    onError={() =>
                      setFailedAvatarIds(prev => ({...prev, [itemId]: true}))
                    }
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Icon name="person" size={28} color="#fff" />
                  </View>
                )}
                <View style={styles.headerInfo}>
                  <Text style={styles.trainerName} numberOfLines={1}>
                    {item.trainer_name}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Icon name="star" size={14} color="#FFD700" />
                    <Text style={styles.rating}> {item.avg_rating ?? '—'}</Text>
                    <Text style={styles.experience}>
                      {' '}
                      • {item.review_count} review
                      {item.review_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {!!item.trainer_phone_number && (
                    <View style={styles.phoneRow}>
                      <Icon name="call-outline" size={13} color="#666" />
                      <Text style={styles.phoneText}>
                        {item.trainer_phone_number}
                      </Text>
                    </View>
                  )}
                  {trainerFacts.length > 0 && (
                    <View style={styles.profileFactsRow}>
                      {trainerFacts.map(fact => (
                        <View key={fact} style={styles.profileFactChip}>
                          <Text style={styles.profileFactText}>{fact}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {!!item.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              {!!item.focus_areas && (
                <View style={styles.specializationContainer}>
                  {item.focus_areas.split(',').map((s: string, i: number) => (
                    <View key={i} style={styles.specializationBadge}>
                      <Text style={styles.specializationText}>{s.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.cardMetaRow}>
                  <View style={[styles.metaBadge, styles.metaBadgeNeutral]}>
                    <Icon
                      name={
                        item.session_type === 'offline'
                          ? 'location-outline'
                          : 'videocam-outline'
                      }
                      size={12}
                      color="#555"
                    />
                    <Text
                      style={[
                        styles.metaBadgeText,
                        styles.metaBadgeNeutralText,
                      ]}>
                      {item.session_type === 'offline' ? 'Offline' : 'Online'}
                    </Text>
                  </View>
                  <View style={[styles.metaBadge, styles.metaBadgeNeutral]}>
                    <Icon
                      name={
                        item.visibility === 'private'
                          ? 'lock-closed-outline'
                          : 'people-outline'
                      }
                      size={12}
                      color="#555"
                    />
                    <Text
                      style={[
                        styles.metaBadgeText,
                        styles.metaBadgeNeutralText,
                      ]}>
                      {item.visibility === 'private' ? 'Private' : 'Public'}
                    </Text>
                  </View>
                  {item.session_type === 'offline' && !!item.location && (
                    <View style={[styles.metaBadge, styles.metaBadgeNeutral]}>
                      <Icon name="navigate-outline" size={12} color="#555" />
                      <Text
                        style={[
                          styles.metaBadgeText,
                          styles.metaBadgeNeutralText,
                        ]}
                        numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>
                  )}
                  {!!item.enrollment_deadline && (
                    <View style={[styles.metaBadge, styles.metaBadgeWarning]}>
                      <Icon name="time-outline" size={12} color="#FF9500" />
                      <Text
                        style={[
                          styles.metaBadgeText,
                          styles.metaBadgeWarningText,
                        ]}>
                        Closes{' '}
                        {parseDateOnly(item.enrollment_deadline).toLocaleDateString(
                          'en-GB',
                          {day: '2-digit', month: 'short'},
                        )}
                      </Text>
                    </View>
                  )}
                  {!!item.program_start_date && (
                    <View style={[styles.metaBadge, styles.metaBadgeInfo]}>
                      <Icon name="calendar-outline" size={12} color="#007AFF" />
                      <Text
                        style={[
                          styles.metaBadgeText,
                          styles.metaBadgeInfoText,
                        ]}>
                        Starts{' '}
                        {parseDateOnly(item.program_start_date).toLocaleDateString(
                          'en-GB',
                          {day: '2-digit', month: 'short'},
                        )}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardActionRow}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Monthly</Text>
                    <Text style={styles.price}>
                      {formatPrice(item.price)}/mo
                    </Text>
                  </View>
                  <View style={styles.payButton}>
                    <Icon name="card" size={14} color="#fff" />
                    <Text style={styles.payButtonText}>View & Hire</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Trainers</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Icon name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Visibility</Text>
                <View style={styles.optionRow}>
                  {[
                    {label: 'All', value: 'all'},
                    {label: 'Public', value: 'public'},
                    {label: 'Private', value: 'private'},
                  ].map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionChip,
                        visibilityFilter === option.value &&
                          styles.optionChipActive,
                      ]}
                      onPress={() =>
                        setVisibilityFilter(
                          option.value as 'all' | 'public' | 'private',
                        )
                      }>
                      <Text
                        style={[
                          styles.optionChipText,
                          visibilityFilter === option.value &&
                            styles.optionChipTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Session Type</Text>
                <View style={styles.optionRow}>
                  {[
                    {label: 'All', value: 'all'},
                    {label: 'Online', value: 'online'},
                    {label: 'Offline', value: 'offline'},
                  ].map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionChip,
                        sessionTypeFilter === option.value &&
                          styles.optionChipActive,
                      ]}
                      onPress={() =>
                        setSessionTypeFilter(
                          option.value as 'all' | 'online' | 'offline',
                        )
                      }>
                      <Text
                        style={[
                          styles.optionChipText,
                          sessionTypeFilter === option.value &&
                            styles.optionChipTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Sort by Price</Text>
                <View style={styles.optionRow}>
                  {PRICE_SORT_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionChip,
                        sortOptions.includes(option.value) &&
                          styles.optionChipActive,
                      ]}
                      onPress={() => toggleSortOption(option.value)}>
                      <Text
                        style={[
                          styles.optionChipText,
                          sortOptions.includes(option.value) &&
                            styles.optionChipTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Sort by Rating</Text>
                <View style={styles.optionRow}>
                  {RATING_SORT_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionChip,
                        sortOptions.includes(option.value) &&
                          styles.optionChipActive,
                      ]}
                      onPress={() => toggleSortOption(option.value)}>
                      <Text
                        style={[
                          styles.optionChipText,
                          sortOptions.includes(option.value) &&
                            styles.optionChipTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Sort by Name</Text>
                <View style={styles.optionRow}>
                  {NAME_SORT_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionChip,
                        sortOptions.includes(option.value) &&
                          styles.optionChipActive,
                      ]}
                      onPress={() => toggleSortOption(option.value)}>
                      <Text
                        style={[
                          styles.optionChipText,
                          sortOptions.includes(option.value) &&
                            styles.optionChipTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Price Range</Text>
                <View style={styles.priceRow}>
                  <TextInput
                    style={styles.filterInput}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    placeholder="Min price"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={styles.filterInput}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="Max price"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Schedule Availability</Text>
                <View style={styles.optionRow}>
                  <TouchableOpacity
                    style={[
                      styles.optionChip,
                      scheduleDayFilter.length === 0 && styles.optionChipActive,
                    ]}
                    onPress={() => setScheduleDayFilter([])}>
                    <Text
                      style={[
                        styles.optionChipText,
                        scheduleDayFilter.length === 0 &&
                          styles.optionChipTextActive,
                      ]}>
                      All Days
                    </Text>
                  </TouchableOpacity>
                  {DAY_OPTIONS.map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.optionChip,
                        scheduleDayFilter.includes(day) &&
                          styles.optionChipActive,
                      ]}
                      onPress={() => toggleScheduleDay(day)}>
                      <Text
                        style={[
                          styles.optionChipText,
                          scheduleDayFilter.includes(day) &&
                            styles.optionChipTextActive,
                        ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Focus Area Keyword</Text>
                <TextInput
                  style={styles.filterInputFull}
                  value={focusKeyword}
                  onChangeText={setFocusKeyword}
                  placeholder="e.g. weight loss, mobility, strength"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Offline Location</Text>
                <TextInput
                  style={styles.filterInputFull}
                  value={locationQuery}
                  onChangeText={setLocationQuery}
                  placeholder="Only matches offline trainers by location"
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={clearFilters}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}>
                <Text style={styles.applyButtonText}>Show Results</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
