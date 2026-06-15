import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {useAuth} from '../../../store/AuthContext';
import {styles as s} from './styles';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone_number?: string;
  gender?: string;
  dob?: string;
  height?: number;
  weight?: number;
  profession?: string;
  experience_years?: number;
  bio?: string;
  certification?: string;
  certification_url?: string;
  certification_status?: string;
  avatar_url?: string;
  goal?: string;
  created_at?: string;
  is_active?: boolean | number;
  deactivated_at?: string | null;
};

type Trainer = User;

type EditForm = {
  name: string;
  email: string;
  phone_number: string;
  gender: '' | 'male' | 'female';
  dob: string;
  height: string;
  weight: string;
  goal: string;
  profession: string;
  experience_years: string;
  bio: string;
  certification_status: 'pending' | 'approved' | 'rejected';
};

const EMPTY_EDIT_FORM: EditForm = {
  name: '',
  email: '',
  phone_number: '',
  gender: '',
  dob: '',
  height: '',
  weight: '',
  goal: '',
  profession: '',
  experience_years: '',
  bio: '',
  certification_status: 'pending',
};

const TABS = ['All Users', 'Pending Trainers'];
const BASE_URL = apiClient.defaults.baseURL?.replace('/api/v1', '') || '';
const ROLE_FILTERS: Array<'all' | 'member' | 'trainer' | 'admin'> = [
  'all',
  'member',
  'trainer',
  'admin',
];
const STATUS_FILTERS: Array<'all' | 'active' | 'banned'> = [
  'all',
  'active',
  'banned',
];

export default function UserManagementScreen() {
  const {user: currentUser} = useAuth();
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingTrainers, setPendingTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [expandedTrainerId, setExpandedTrainerId] = useState<number | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<
    'all' | 'member' | 'trainer' | 'admin'
  >('all');
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'active' | 'banned'
  >('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, pendingRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/users/pending-trainers'),
      ]);
      setUsers(usersRes.data || []);
      setPendingTrainers(pendingRes.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReview = (trainer: Trainer, status: 'approved' | 'rejected') => {
    Alert.alert(
      `${status === 'approved' ? 'Approve' : 'Reject'} Trainer`,
      `Are you sure you want to ${status} ${trainer.name}'s certification?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          style: status === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await apiClient.patch(`/users/${trainer.id}/certification`, {
                status,
              });
              Alert.alert('Success', `Certification ${status}`);
              setExpandedTrainerId(null);
              fetchData();
            } catch {
              Alert.alert('Error', 'Failed to update certification');
            }
          },
        },
      ],
    );
  };

  const roleColor = (role: string) =>
    role === 'admin' ? '#5856D6' : role === 'trainer' ? '#FF9500' : '#34C759';

  const isImageUrl = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);

  const formatDate = (value?: string) => {
    if (!value) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.split('T')[0];
    }

    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const extractDateOnly = (value?: string | null) => {
    if (!value) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : value;
    }

    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  };

  const getImageUrl = (path?: string) => {
    if (!path) {
      return null;
    }
    return path.startsWith('http') ? path : `${BASE_URL}${path}`;
  };

  const isUserActive = (user: User) =>
    !(user.is_active === false || Number(user.is_active) === 0);

  const updateEditField = <K extends keyof EditForm>(
    field: K,
    value: EditForm[K],
  ) => {
    setEditForm(prev => ({...prev, [field]: value}));
  };

  const openEditModal = (_user: User) => {
    Alert.alert(
      'Unavailable',
      'Editing user info is disabled in User Management.',
    );
  };

  const closeEditModal = () => {
    if (savingEdit) {
      return;
    }

    setEditingUser(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const saveUserEdits = async () => {
    if (!editingUser) {
      return;
    }

    Alert.alert(
      'Unavailable',
      'Editing user info is disabled in User Management.',
    );
    closeEditModal();
  };

  const updateUserStatus = async (user: User, nextActive: boolean) => {
    if (user.role === 'admin') {
      Alert.alert(
        'Not allowed',
        'Admin accounts cannot be banned in User Management.',
      );
      return;
    }

    setUpdatingStatusId(user.id);
    try {
      await apiClient.patch(`/users/${user.id}/status`, {
        is_active: nextActive,
      });
      setExpandedUserId(user.id);
      await fetchData();
      Alert.alert(
        'Success',
        nextActive
          ? `${user.name} has been unbanned.`
          : `${user.name} has been banned.`,
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to update user status',
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const confirmUserStatusChange = (user: User) => {
    if (user.role === 'admin') {
      Alert.alert(
        'Not allowed',
        'Admin accounts cannot be banned in User Management.',
      );
      return;
    }

    if (Number(user.id) === Number(currentUser?.id)) {
      Alert.alert('Not allowed', 'You cannot ban your own admin account.');
      return;
    }

    const nextActive = !isUserActive(user);
    Alert.alert(
      nextActive ? 'Unban User?' : 'Ban User?',
      nextActive
        ? `Unban ${user.name}'s account so they can access the app again?`
        : `Ban ${user.name}'s account? Their data will be kept, but they will lose access.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: nextActive ? 'Unban' : 'Ban',
          style: nextActive ? 'default' : 'destructive',
          onPress: () => updateUserStatus(user, nextActive),
        },
      ],
    );
  };

  const renderInfoItem = (icon: string, label: string, value: string) => (
    <View style={s.infoItem}>
      <Icon name={icon} size={14} color="#888" />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );

  const renderUserDetail = (item: User) => {
    const joinedDate = formatDate(item.created_at);
    const birthDate = formatDate(item.dob);
    const active = isUserActive(item);
    const isSelf = Number(item.id) === Number(currentUser?.id);
    const isAdminAccount = item.role === 'admin';

    return (
      <View style={s.detail}>
        <View style={s.divider} />

        <View style={s.infoGrid}>
          {renderInfoItem('shield-outline', 'Role', item.role)}
          {renderInfoItem(
            active ? 'checkmark-circle-outline' : 'ban-outline',
            'Status',
            active ? 'Active' : 'Banned',
          )}
          {item.phone_number
            ? renderInfoItem('call-outline', 'Phone', item.phone_number)
            : null}
          {item.gender
            ? renderInfoItem('person-outline', 'Gender', item.gender)
            : null}
          {birthDate
            ? renderInfoItem('calendar-outline', 'Date of Birth', birthDate)
            : null}
          {item.height
            ? renderInfoItem('resize-outline', 'Height', `${item.height} cm`)
            : null}
          {item.weight
            ? renderInfoItem('scale-outline', 'Weight', `${item.weight} kg`)
            : null}
          {item.profession
            ? renderInfoItem('briefcase-outline', 'Profession', item.profession)
            : null}
          {item.experience_years != null
            ? renderInfoItem(
                'time-outline',
                'Experience',
                `${item.experience_years} yrs`,
              )
            : null}
          {item.role === 'trainer' && item.certification_status
            ? renderInfoItem(
                'ribbon-outline',
                'Certification',
                item.certification_status,
              )
            : null}
          {joinedDate
            ? renderInfoItem('calendar-clear-outline', 'Joined', joinedDate)
            : null}
        </View>

        {item.goal ? (
          <View style={s.bioBox}>
            <Text style={s.bioLabel}>Goal</Text>
            <Text style={s.bioText}>{item.goal}</Text>
          </View>
        ) : null}

        {item.bio ? (
          <View style={s.bioBox}>
            <Text style={s.bioLabel}>Bio</Text>
            <Text style={s.bioText}>{item.bio}</Text>
          </View>
        ) : null}

        {!isAdminAccount ? (
          <View style={s.actions}>
            <TouchableOpacity
              style={active ? s.banBtn : s.restoreBtn}
              onPress={() => confirmUserStatusChange(item)}
              disabled={updatingStatusId === item.id || isSelf}>
              {updatingStatusId === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon
                    name={active ? 'ban-outline' : 'refresh-outline'}
                    size={16}
                    color="#fff"
                  />
                  <Text style={s.btnText}>{active ? 'Ban' : 'Unban'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {isAdminAccount ? (
          <Text style={s.actionHint}>
            Admin accounts cannot be banned in User Management.
          </Text>
        ) : isSelf ? (
          <Text style={s.actionHint}>
            Your own admin account cannot be banned.
          </Text>
        ) : null}
      </View>
    );
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter(user => {
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && isUserActive(user)) ||
      (selectedStatus === 'banned' && !isUserActive(user));
    const matchesSearch =
      !normalizedQuery ||
      user.name.toLowerCase().includes(normalizedQuery) ||
      user.email.toLowerCase().includes(normalizedQuery);

    return matchesRole && matchesStatus && matchesSearch;
  });

  const renderUser = ({item}: {item: User}) => {
    const isExpanded = expandedUserId === item.id;
    const avatarUrl = getImageUrl(item.avatar_url);

    return (
      <View style={s.card}>
        <TouchableOpacity
          style={s.cardLeft}
          onPress={() => setExpandedUserId(isExpanded ? null : item.id)}
          activeOpacity={0.7}>
          {avatarUrl ? (
            <Image source={{uri: avatarUrl}} style={s.avatarImg} />
          ) : (
            <View
              style={[
                s.avatar,
                {backgroundColor: roleColor(item.role) + '22'},
              ]}>
              <Text style={[s.avatarText, {color: roleColor(item.role)}]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={s.info}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.email}>{item.email}</Text>
            {item.profession ? (
              <Text style={s.meta}>{item.profession}</Text>
            ) : null}
            <View style={s.badgeRow}>
              <View
                style={[
                  s.roleBadge,
                  {backgroundColor: roleColor(item.role) + '22'},
                ]}>
                <Text style={[s.roleText, {color: roleColor(item.role)}]}>
                  {item.role}
                </Text>
              </View>
              <View
                style={[
                  s.statusBadge,
                  isUserActive(item)
                    ? s.statusBadgeActive
                    : s.statusBadgeBanned,
                ]}>
                <Text
                  style={[
                    s.statusBadgeText,
                    isUserActive(item)
                      ? s.statusBadgeTextActive
                      : s.statusBadgeTextBanned,
                  ]}>
                  {isUserActive(item) ? 'Active' : 'Banned'}
                </Text>
              </View>
            </View>
          </View>
          <Icon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#aaa"
          />
        </TouchableOpacity>

        {isExpanded ? renderUserDetail(item) : null}
      </View>
    );
  };

  const renderPendingTrainer = ({item}: {item: Trainer}) => {
    const isExpanded = expandedTrainerId === item.id;
    const avatarUrl = getImageUrl(item.avatar_url);
    const certIsImage = item.certification_url
      ? isImageUrl(item.certification_url)
      : false;
    const certFullUrl = item.certification_url
      ? item.certification_url.startsWith('http')
        ? item.certification_url
        : `${BASE_URL}${item.certification_url}`
      : null;

    return (
      <View style={s.card}>
        {/* Header row — always visible */}
        <TouchableOpacity
          style={s.cardLeft}
          onPress={() => setExpandedTrainerId(isExpanded ? null : item.id)}
          activeOpacity={0.7}>
          {avatarUrl ? (
            <Image source={{uri: avatarUrl}} style={s.avatarImg} />
          ) : (
            <View style={[s.avatar, s.trainerAvatar]}>
              <Text style={[s.avatarText, s.trainerAvatarText]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={s.info}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.email}>{item.email}</Text>
            {item.profession && <Text style={s.meta}>{item.profession}</Text>}
          </View>
          <Icon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#aaa"
          />
        </TouchableOpacity>

        {/* Expanded detail */}
        {isExpanded && (
          <View style={s.detail}>
            <View style={s.divider} />

            {/* Info grid */}
            <View style={s.infoGrid}>
              {item.phone_number && (
                <View style={s.infoItem}>
                  <Icon name="call-outline" size={14} color="#888" />
                  <Text style={s.infoLabel}>Phone</Text>
                  <Text style={s.infoValue}>{item.phone_number}</Text>
                </View>
              )}
              {item.gender && (
                <View style={s.infoItem}>
                  <Icon name="person-outline" size={14} color="#888" />
                  <Text style={s.infoLabel}>Gender</Text>
                  <Text style={s.infoValue}>{item.gender}</Text>
                </View>
              )}
              {item.dob && (
                <View style={s.infoItem}>
                  <Icon name="calendar-outline" size={14} color="#888" />
                  <Text style={s.infoLabel}>Date of Birth</Text>
                  <Text style={s.infoValue}>{extractDateOnly(item.dob)}</Text>
                </View>
              )}
              {item.height && (
                <View style={s.infoItem}>
                  <Icon name="resize-outline" size={14} color="#888" />
                  <Text style={s.infoLabel}>Height</Text>
                  <Text style={s.infoValue}>{item.height} cm</Text>
                </View>
              )}
              {item.weight && (
                <View style={s.infoItem}>
                  <Icon name="scale-outline" size={14} color="#888" />
                  <Text style={s.infoLabel}>Weight</Text>
                  <Text style={s.infoValue}>{item.weight} kg</Text>
                </View>
              )}
              {item.experience_years != null && (
                <View style={s.infoItem}>
                  <Icon name="time-outline" size={14} color="#888" />
                  <Text style={s.infoLabel}>Experience</Text>
                  <Text style={s.infoValue}>{item.experience_years} yrs</Text>
                </View>
              )}
            </View>

            {item.bio ? (
              <View style={s.bioBox}>
                <Text style={s.bioLabel}>Bio</Text>
                <Text style={s.bioText}>{item.bio}</Text>
              </View>
            ) : null}

            {/* Certification */}
            <Text style={s.certTitle}>Certification</Text>
            {certFullUrl ? (
              <>
                {certIsImage ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(certFullUrl)}>
                    <Image
                      source={{uri: certFullUrl}}
                      style={s.certImage}
                      resizeMode="contain"
                    />
                    <Text style={s.certImageHint}>Tap to open full size</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={s.certLinkBtn}
                    onPress={() => Linking.openURL(certFullUrl)}>
                    <Icon name="document-text" size={20} color="#007AFF" />
                    <Text style={s.certLinkText}>
                      Open Certification Document
                    </Text>
                    <Icon name="open-outline" size={16} color="#007AFF" />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={s.noCertBox}>
                <Icon name="warning-outline" size={18} color="#FF9500" />
                <Text style={s.noCertText}>No certification provided</Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={s.actions}>
              <TouchableOpacity
                style={s.rejectBtn}
                onPress={() => handleReview(item, 'rejected')}>
                <Icon name="close" size={16} color="#fff" />
                <Text style={s.btnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.approveBtn}
                onPress={() => handleReview(item, 'approved')}>
                <Icon name="checkmark" size={16} color="#fff" />
                <Text style={s.btnText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={t}
            style={[s.tab, tab === i && s.tabActive]}
            onPress={() => setTab(i)}>
            <Text style={[s.tabText, tab === i && s.tabTextActive]}>{t}</Text>
            {i === 1 && pendingTrainers.length > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{pendingTrainers.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={s.loader} size="large" color="#FF6B35" />
      ) : tab === 0 ? (
        <>
          <View style={s.toolsSection}>
            <View style={s.searchBar}>
              <Icon name="search-outline" size={18} color="#999" />
              <TextInput
                style={s.searchInput}
                placeholder="Search by name or email"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={s.filterGroup}>
              <Text style={s.filterGroupLabel}>Role</Text>
              <View style={s.roleFilters}>
                {ROLE_FILTERS.map(role => {
                  const isActive = selectedRole === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[s.filterChip, isActive && s.filterChipActive]}
                      onPress={() => setSelectedRole(role)}>
                      <Text
                        style={[
                          s.filterChipText,
                          isActive && s.filterChipTextActive,
                        ]}>
                        {role === 'all'
                          ? 'All Roles'
                          : role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={s.filterGroup}>
              <Text style={s.filterGroupLabel}>Status</Text>
              <View style={s.roleFilters}>
                {STATUS_FILTERS.map(status => {
                  const isActive = selectedStatus === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[s.filterChip, isActive && s.filterChipActive]}
                      onPress={() => setSelectedStatus(status)}>
                      <Text
                        style={[
                          s.filterChipText,
                          isActive && s.filterChipTextActive,
                        ]}>
                        {status === 'all'
                          ? 'All Statuses'
                          : status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <FlatList
            data={filteredUsers}
            keyExtractor={item => String(item.id)}
            renderItem={renderUser}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <Text style={s.empty}>No users match the current filters</Text>
            }
          />
        </>
      ) : (
        <FlatList
          data={pendingTrainers}
          keyExtractor={item => String(item.id)}
          renderItem={renderPendingTrainer}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Icon name="checkmark-circle" size={48} color="#34C759" />
              <Text style={s.empty}>No pending trainer approvals</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!editingUser}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={closeEditModal} disabled={savingEdit}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={s.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <Text style={s.modalLabel}>Name</Text>
              <TextInput
                style={s.modalInput}
                value={editForm.name}
                onChangeText={value => updateEditField('name', value)}
                placeholder="Full name"
                placeholderTextColor="#999"
              />

              <Text style={s.modalLabel}>Email</Text>
              <TextInput
                style={s.modalInput}
                value={editForm.email}
                onChangeText={value => updateEditField('email', value)}
                placeholder="Email address"
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={s.modalLabel}>Phone</Text>
              <TextInput
                style={s.modalInput}
                value={editForm.phone_number}
                onChangeText={value => updateEditField('phone_number', value)}
                placeholder="Phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />

              <Text style={s.modalLabel}>Gender</Text>
              <View style={s.optionRow}>
                {[
                  {label: 'Unset', value: ''},
                  {label: 'Male', value: 'male'},
                  {label: 'Female', value: 'female'},
                ].map(option => {
                  const isActive = editForm.gender === option.value;
                  return (
                    <TouchableOpacity
                      key={option.label}
                      style={[s.optionChip, isActive && s.optionChipActive]}
                      onPress={() =>
                        updateEditField(
                          'gender',
                          option.value as EditForm['gender'],
                        )
                      }>
                      <Text
                        style={[
                          s.optionChipText,
                          isActive && s.optionChipTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={s.modalLabel}>Date of Birth</Text>
              <TextInput
                style={s.modalInput}
                value={editForm.dob}
                onChangeText={value => updateEditField('dob', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />

              <View style={s.modalInputRow}>
                <View style={s.modalInputColumn}>
                  <Text style={s.modalLabel}>Height (cm)</Text>
                  <TextInput
                    style={s.modalInput}
                    value={editForm.height}
                    onChangeText={value => updateEditField('height', value)}
                    placeholder="170"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={s.modalInputColumn}>
                  <Text style={s.modalLabel}>Weight (kg)</Text>
                  <TextInput
                    style={s.modalInput}
                    value={editForm.weight}
                    onChangeText={value => updateEditField('weight', value)}
                    placeholder="65"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text style={s.modalLabel}>Goal</Text>
              <TextInput
                style={s.modalInput}
                value={editForm.goal}
                onChangeText={value => updateEditField('goal', value)}
                placeholder="Fitness goal"
                placeholderTextColor="#999"
              />

              {editingUser?.role === 'trainer' ? (
                <>
                  <Text style={s.modalLabel}>Profession</Text>
                  <TextInput
                    style={s.modalInput}
                    value={editForm.profession}
                    onChangeText={value => updateEditField('profession', value)}
                    placeholder="Profession"
                    placeholderTextColor="#999"
                  />

                  <Text style={s.modalLabel}>Verification Status</Text>
                  <View style={s.optionRow}>
                    {[
                      {label: 'Pending', value: 'pending'},
                      {label: 'Approved', value: 'approved'},
                      {label: 'Rejected', value: 'rejected'},
                    ].map(option => {
                      const isActive =
                        editForm.certification_status === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[s.optionChip, isActive && s.optionChipActive]}
                          onPress={() =>
                            updateEditField(
                              'certification_status',
                              option.value as EditForm['certification_status'],
                            )
                          }>
                          <Text
                            style={[
                              s.optionChipText,
                              isActive && s.optionChipTextActive,
                            ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={s.modalLabel}>Experience (years)</Text>
                  <TextInput
                    style={s.modalInput}
                    value={editForm.experience_years}
                    onChangeText={value =>
                      updateEditField('experience_years', value)
                    }
                    placeholder="Experience years"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                  />

                  <Text style={s.modalLabel}>Bio</Text>
                  <TextInput
                    style={[s.modalInput, s.modalTextArea]}
                    value={editForm.bio}
                    onChangeText={value => updateEditField('bio', value)}
                    placeholder="Bio"
                    placeholderTextColor="#999"
                    multiline
                    textAlignVertical="top"
                  />
                </>
              ) : null}
            </ScrollView>

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelButton}
                onPress={closeEditModal}
                disabled={savingEdit}>
                <Text style={s.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalSaveButton}
                onPress={saveUserEdits}
                disabled={savingEdit}>
                {savingEdit ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.modalSaveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
