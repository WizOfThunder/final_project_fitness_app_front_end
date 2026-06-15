import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useFocusEffect} from '@react-navigation/native';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const CATEGORIES = [
  {key: 'all', label: 'All', icon: 'apps'},
  {key: 'challenge_complete', label: 'Challenge', icon: 'trophy'},
  {key: 'weekly_streak', label: 'Streak', icon: 'flame'},
  {key: 'steps_total', label: 'Steps', icon: 'walk'},
  {key: 'calories_total', label: 'Calories', icon: 'fitness'},
  {key: 'distance_total', label: 'Distance', icon: 'navigate'},
];

const TYPE_CONFIG: Record<string, {icon: string; color: string; unit: string}> =
  {
    challenge_complete: {icon: 'trophy', color: '#FFD700', unit: 'challenges'},
    weekly_streak: {icon: 'flame', color: '#FF9500', unit: 'weeks'},
    steps_total: {icon: 'walk', color: '#34C759', unit: 'steps'},
    calories_total: {icon: 'fitness', color: '#FF3B30', unit: 'kcal'},
    distance_total: {icon: 'navigate', color: '#007AFF', unit: 'km'},
  };

const TIER_MEDALS = ['🥉', '🥈', '🥇'];
const TIER_COLORS = ['#CD7F32', '#7B8FA1', '#FFD700'];

function getTier(badges: any[], ruleType: string, ruleValue: number): number {
  const sorted = badges
    .filter(b => b.rule_type === ruleType)
    .map(b => b.rule_value)
    .sort((a, b) => a - b);
  return sorted.indexOf(ruleValue);
}

export default function AchievementScreen() {
  const [category, setCategory] = useState('all');
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/achievements/progress');
      setBadges(res.data || []);
    } catch (_) {
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBadges();
    }, [fetchBadges]),
  );

  const filtered =
    category === 'all' ? badges : badges.filter(b => b.rule_type === category);
  const earned = badges.filter(b => b.earned).length;

  const cfg = (b: any) => {
    const base = TYPE_CONFIG[b.rule_type] || {
      icon: 'medal',
      color: '#ccc',
      unit: '',
    };
    return {...base, icon: b.icon || base.icon};
  };

  const formatValue = (b: any) => {
    if (b.rule_type === 'distance_total')
      return `${b.current_value} / ${b.rule_value} km`;
    if (b.rule_type === 'steps_total')
      return `${Number(b.current_value).toLocaleString()} / ${Number(
        b.rule_value,
      ).toLocaleString()} steps`;
    if (b.rule_type === 'calories_total')
      return `${Number(b.current_value).toLocaleString()} / ${Number(
        b.rule_value,
      ).toLocaleString()} kcal`;
    if (b.rule_type === 'weekly_streak')
      return `${b.current_value} / ${b.rule_value} weeks`;
    if (b.rule_type === 'challenge_complete')
      return `${b.current_value} / ${b.rule_value} challenges`;
    return `${b.current_value} / ${b.rule_value}`;
  };

  return (
    <View style={styles.container}>
      {/* Summary banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryCount}>{earned}</Text>
          <Text style={styles.summaryLabel}>Earned</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryCount}>{badges.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryCount}>
            {badges.length > 0 ? Math.round((earned / badges.length) * 100) : 0}
            %
          </Text>
          <Text style={styles.summaryLabel}>Complete</Text>
        </View>
      </View>

      {/* Category filter — fixed outside FlatList */}
      <View style={styles.categoryScroll}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[
                styles.categoryBtn,
                category === c.key && styles.categoryBtnActive,
              ]}
              onPress={() => setCategory(c.key)}>
              <Icon
                name={c.icon}
                size={14}
                color={category === c.key ? '#fff' : '#888'}
              />
              <Text
                style={[
                  styles.categoryText,
                  category === c.key && styles.categoryTextActive,
                ]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{flex: 1}} size="large" color="#FF6B35" />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="medal-outline" size={56} color="#ddd" />
          <Text style={styles.emptyTitle}>No badges in this category</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={3}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.grid}
          renderItem={({item}) => {
            const c = cfg(item);
            const isEarned = !!item.earned;
            const tier = getTier(badges, item.rule_type, item.rule_value);
            const hasTierStyle =
              tier >= 0 &&
              tier < TIER_COLORS.length &&
              tier < TIER_MEDALS.length;
            const tierColor = hasTierStyle ? TIER_COLORS[tier] : c.color;
            const medal = hasTierStyle ? TIER_MEDALS[tier] : '';
            const pct = Math.min(
              Math.round((item.current_value / item.rule_value) * 100),
              100,
            );
            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => setSelected(item)}
                activeOpacity={0.8}>
                <View
                  style={[
                    styles.box,
                    {backgroundColor: isEarned ? tierColor : '#D0D0D0'},
                  ]}>
                  {isEarned ? (
                    <Icon name={c.icon} size={30} color="#fff" />
                  ) : (
                    <Icon name="lock-closed" size={26} color="#fff" />
                  )}
                  {medal ? (
                    <Text style={styles.medalOverlay}>{medal}</Text>
                  ) : null}
                  {isEarned && (
                    <View style={styles.earnedCheck}>
                      <Icon name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </View>
                {!isEarned && (
                  <View style={styles.miniProgressBar}>
                    <View
                      style={[
                        styles.miniProgressFill,
                        {width: `${pct}%`, backgroundColor: c.color},
                      ]}
                    />
                  </View>
                )}
                <Text
                  style={[
                    styles.title,
                    isEarned && {color: '#333', fontWeight: '600'},
                  ]}
                  numberOfLines={2}>
                  {item.title}
                </Text>
                {!isEarned && <Text style={styles.badgeValue}>{pct}%</Text>}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selected &&
              (() => {
                const c = cfg(selected);
                const isEarned = !!selected.earned;
                const tier = getTier(
                  badges,
                  selected.rule_type,
                  selected.rule_value,
                );
                const hasTierStyle =
                  tier >= 0 &&
                  tier < TIER_COLORS.length &&
                  tier < TIER_MEDALS.length;
                const tierColor = hasTierStyle ? TIER_COLORS[tier] : c.color;
                const medal = hasTierStyle ? TIER_MEDALS[tier] : '';
                const pct = Math.min(
                  Math.round(
                    (selected.current_value / selected.rule_value) * 100,
                  ),
                  100,
                );
                return (
                  <>
                    <View
                      style={[
                        styles.modalBox,
                        {backgroundColor: isEarned ? tierColor : '#D0D0D0'},
                      ]}>
                      {isEarned ? (
                        <Icon name={c.icon} size={48} color="#fff" />
                      ) : (
                        <Icon name="lock-closed" size={40} color="#fff" />
                      )}
                      {medal ? (
                        <Text style={styles.modalMedal}>{medal}</Text>
                      ) : null}
                    </View>
                    {isEarned && (
                      <View style={styles.earnedBanner}>
                        <Icon
                          name="checkmark-circle"
                          size={16}
                          color="#34C759"
                        />
                        <Text style={styles.earnedBannerText}> Earned!</Text>
                      </View>
                    )}
                    <Text style={styles.modalTitle}>{selected.title}</Text>
                    <Text style={styles.modalDescription}>
                      {selected.description}
                    </Text>
                    <Text style={styles.modalProgress}>
                      {formatValue(selected)}
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: isEarned ? tierColor : c.color,
                          },
                        ]}
                      />
                    </View>
                    {isEarned ? (
                      <Text style={styles.modalDate}>
                        Earned:{' '}
                        {new Date(selected.earned_at).toLocaleDateString(
                          'en-GB',
                          {day: '2-digit', month: 'short', year: 'numeric'},
                        )}
                      </Text>
                    ) : (
                      <Text style={styles.modalDate}>{pct}% complete</Text>
                    )}
                  </>
                );
              })()}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
