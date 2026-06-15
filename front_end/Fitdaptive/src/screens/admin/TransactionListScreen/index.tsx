import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

interface Transaction {
  id: string;
  orderId: string;
  memberName: string;
  trainerName: string;
  amount: number;
  status:
    | 'pending'
    | 'success'
    | 'settlement'
    | 'failed'
    | 'expired'
    | 'refunded'
    | 'partial_refund';
  paymentMethod: string;
  transactionTime: string;
  midtransTransactionId: string;
}

type TransactionStatusFilter =
  | 'all'
  | 'pending'
  | 'success'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'partial_refund';

type DatePickerTarget = 'start' | 'end' | null;

type TransactionFilters = {
  status: TransactionStatusFilter;
  paymentMethod: string;
  startDate: Date | null;
  endDate: Date | null;
  minAmount: string;
  maxAmount: string;
};

const STATUS_OPTIONS: Array<{value: TransactionStatusFilter; label: string}> = [
  {value: 'all', label: 'All'},
  {value: 'success', label: 'Success'},
  {value: 'pending', label: 'Pending'},
  {value: 'failed', label: 'Failed'},
  {value: 'expired', label: 'Expired'},
  {value: 'refunded', label: 'Refunded'},
  {value: 'partial_refund', label: 'Partial Refund'},
];

const PAYMENT_METHOD_OPTIONS = [
  {value: 'all', label: 'All'},
  {value: 'bank_transfer', label: 'Bank Transfer'},
  {value: 'credit_card', label: 'Credit Card'},
  {value: 'gopay', label: 'GoPay'},
  {value: 'qris', label: 'QRIS'},
  {value: 'shopeepay', label: 'ShopeePay'},
  {value: 'echannel', label: 'Mandiri Bill'},
  {value: 'cstore', label: 'Convenience Store'},
];

const DATE_PICKER_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DEFAULT_FILTERS: TransactionFilters = {
  status: 'all',
  paymentMethod: 'all',
  startDate: null,
  endDate: null,
  minAmount: '',
  maxAmount: '',
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateValue = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const toDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeStatus = (status: string) =>
  status === 'settlement' ? 'success' : status;

const formatWords = (value: string) =>
  value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getPaymentMethodLabel = (value: string) =>
  PAYMENT_METHOD_OPTIONS.find(option => option.value === value)?.label ||
  formatWords(value);

const getStatusFilterLabel = (value: string) =>
  STATUS_OPTIONS.find(option => option.value === value)?.label || formatWords(value);

const sanitizeAmountInput = (value: string) => value.replace(/[^0-9]/g, '');

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const normalizeDateRange = (startDate: Date | null, endDate: Date | null) => {
  if (startDate && endDate && startDate > endDate) {
    return {startDate: endDate, endDate: startDate};
  }

  return {startDate, endDate};
};

const TransactionListScreen = ({navigation}: any) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<TransactionFilters>(
    DEFAULT_FILTERS,
  );
  const [pickerTarget, setPickerTarget] = useState<DatePickerTarget>(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const normalizedRange = normalizeDateRange(
        filters.startDate,
        filters.endDate,
      );
      const params: Record<string, string> = {};

      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      if (filters.paymentMethod !== 'all') {
        params.paymentMethod = filters.paymentMethod;
      }

      if (normalizedRange.startDate) {
        params.dateFrom = toDateParam(normalizedRange.startDate);
      }

      if (normalizedRange.endDate) {
        params.dateTo = toDateParam(normalizedRange.endDate);
      }

      if (filters.minAmount.trim()) {
        params.minAmount = filters.minAmount.trim();
      }

      if (filters.maxAmount.trim()) {
        params.maxAmount = filters.maxAmount.trim();
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await apiClient.get('/admin/transactions', {
        params,
      });
      setTransactions(
        Array.isArray(response.data.transactions)
          ? response.data.transactions
          : [],
      );
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const getStatusColor = (status: string) => {
    switch (normalizeStatus(status)) {
      case 'success':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'failed':
        return '#FF3B30';
      case 'expired':
        return '#8E8E93';
      case 'refunded':
        return '#5856D6';
      case 'partial_refund':
        return '#AF52DE';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (normalizeStatus(status)) {
      case 'success':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      case 'expired':
        return 'alert-circle';
      case 'refunded':
        return 'refresh-circle';
      case 'partial_refund':
        return 'swap-horizontal';
      default:
        return 'help-circle';
    }
  };

  const formatStatusLabel = (status: string) => {
    return normalizeStatus(status).replace(/_/g, ' ').toUpperCase();
  };

  const activeFilterCount = [
    filters.startDate || filters.endDate,
    filters.status !== 'all',
    filters.paymentMethod !== 'all',
    filters.minAmount.trim() || filters.maxAmount.trim(),
  ].filter(Boolean).length;

  const hasSearch = searchInput.trim().length > 0;
  const hasActiveFilters = activeFilterCount > 0;
  const currentYear = new Date().getFullYear();
  const pickerYears = Array.from(
    {length: 12},
    (_, index) => currentYear - 8 + index,
  );
  const pickerDays = Array.from(
    {
      length: getDaysInMonth(
        pickerDate.getFullYear(),
        pickerDate.getMonth(),
      ),
    },
    (_, index) => index + 1,
  );

  const openFilters = () => {
    setDraftFilters(filters);
    setShowFilters(true);
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const resetDraftFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
  };

  const applyFilters = () => {
    const normalizedRange = normalizeDateRange(
      draftFilters.startDate,
      draftFilters.endDate,
    );
    const minAmount = draftFilters.minAmount.trim();
    const maxAmount = draftFilters.maxAmount.trim();
    let nextMinAmount = minAmount;
    let nextMaxAmount = maxAmount;

    if (
      nextMinAmount &&
      nextMaxAmount &&
      Number(nextMinAmount) > Number(nextMaxAmount)
    ) {
      nextMinAmount = maxAmount;
      nextMaxAmount = minAmount;
    }

    setFilters({
      ...draftFilters,
      startDate: normalizedRange.startDate,
      endDate: normalizedRange.endDate,
      minAmount: nextMinAmount,
      maxAmount: nextMaxAmount,
    });
    setShowFilters(false);
  };

  const openDatePicker = (target: DatePickerTarget) => {
    if (!target) {
      return;
    }

    setPickerTarget(target);
    setPickerDate(
      target === 'start'
        ? draftFilters.startDate || draftFilters.endDate || new Date()
        : draftFilters.endDate || draftFilters.startDate || new Date(),
    );
  };

  const changePickerDatePart = (
    part: 'day' | 'month' | 'year',
    value: number,
  ) => {
    setPickerDate(prev => {
      let year = prev.getFullYear();
      let month = prev.getMonth();
      let day = prev.getDate();

      if (part === 'year') {
        year = value;
      }

      if (part === 'month') {
        month = value;
      }

      if (part === 'day') {
        day = value;
      }

      const maxDay = getDaysInMonth(year, month);
      return new Date(year, month, Math.min(day, maxDay));
    });
  };

  const confirmDatePicker = () => {
    const nextDate = new Date(
      pickerDate.getFullYear(),
      pickerDate.getMonth(),
      pickerDate.getDate(),
    );

    setDraftFilters(prev => ({
      ...prev,
      startDate: pickerTarget === 'start' ? nextDate : prev.startDate,
      endDate: pickerTarget === 'end' ? nextDate : prev.endDate,
    }));
    setPickerTarget(null);
  };

  const activeFilterChips = [] as Array<{key: string; label: string}>;

  if (filters.startDate || filters.endDate) {
    activeFilterChips.push({
      key: 'date',
      label: `Date: ${
        filters.startDate ? formatDateValue(filters.startDate) : 'Any'
      } - ${filters.endDate ? formatDateValue(filters.endDate) : 'Any'}`,
    });
  }

  if (filters.status !== 'all') {
    activeFilterChips.push({
      key: 'status',
      label: `Status: ${getStatusFilterLabel(filters.status)}`,
    });
  }

  if (filters.paymentMethod !== 'all') {
    activeFilterChips.push({
      key: 'paymentMethod',
      label: `Method: ${getPaymentMethodLabel(filters.paymentMethod)}`,
    });
  }

  if (filters.minAmount.trim() || filters.maxAmount.trim()) {
    const amountLabel =
      filters.minAmount.trim() && filters.maxAmount.trim()
        ? `${formatPrice(Number(filters.minAmount))} - ${formatPrice(
            Number(filters.maxAmount),
          )}`
        : filters.minAmount.trim()
        ? `>= ${formatPrice(Number(filters.minAmount))}`
        : `<= ${formatPrice(Number(filters.maxAmount))}`;

    activeFilterChips.push({
      key: 'amount',
      label: `Amount: ${amountLabel}`,
    });
  }

  const renderTransaction = ({item}: {item: Transaction}) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() =>
        navigation.navigate('TransactionDetail', {transaction: item})
      }>
      <View style={styles.cardHeader}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.memberName}</Text>
          <View style={styles.trainerRow}>
            <Icon name="person" size={14} color="#666" />
            <Text style={styles.trainerName}>{item.trainerName}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(item.status) + '20'},
          ]}>
          <Icon
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[styles.statusText, {color: getStatusColor(item.status)}]}>
            {formatStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Icon name="card" size={16} color="#666" />
          <Text style={styles.infoText}>{item.paymentMethod}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="calendar" size={16} color="#666" />
          <Text style={styles.infoText}>
            {formatDateTime(item.transactionTime)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="receipt" size={16} color="#666" />
          <Text style={styles.infoText}>Order: {item.orderId}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.amount}>{formatPrice(item.amount)}</Text>
        <Icon name="chevron-forward" size={20} color="#007AFF" />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing && transactions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>
          {transactions.length} total transactions
        </Text>

        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search user name..."
                placeholderTextColor="#999"
                value={searchInput}
                onChangeText={setSearchInput}
            />
            {hasSearch ? (
              <TouchableOpacity onPress={() => setSearchInput('')}>
                <Icon name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={openFilters}
            accessibilityLabel="Open transaction filters">
            <Icon name="options-outline" size={20} color="#007AFF" />
            {hasActiveFilters ? (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {hasActiveFilters ? (
          <View style={styles.activeFilterBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFilterScroll}>
              {activeFilterChips.map(chip => (
                <View key={chip.key} style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>{chip.label}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={clearAllFilters}>
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {hasSearch || hasActiveFilters
                ? 'No transactions match the selected filters'
                : 'No transactions found'}
            </Text>
          </View>
        }
      />

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Icon name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.dateRangeRow}>
                  <TouchableOpacity
                    style={styles.dateRangeField}
                    onPress={() => openDatePicker('start')}>
                    <Text
                      style={
                        draftFilters.startDate
                          ? styles.dateRangeFieldValue
                          : styles.dateRangeFieldPlaceholder
                      }>
                      {draftFilters.startDate
                        ? formatDateValue(draftFilters.startDate)
                        : 'Start date'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.dateRangeSeparator}>to</Text>

                  <TouchableOpacity
                    style={styles.dateRangeField}
                    onPress={() => openDatePicker('end')}>
                    <Text
                      style={
                        draftFilters.endDate
                          ? styles.dateRangeFieldValue
                          : styles.dateRangeFieldPlaceholder
                      }>
                      {draftFilters.endDate
                        ? formatDateValue(draftFilters.endDate)
                        : 'End date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.optionRow}>
                  {STATUS_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterChip,
                        draftFilters.status === option.value &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setDraftFilters(prev => ({
                          ...prev,
                          status: option.value,
                        }))
                      }>
                      <Text
                        style={[
                          styles.filterChipText,
                          draftFilters.status === option.value &&
                            styles.filterChipTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Payment Method</Text>
                <View style={styles.optionRow}>
                  {PAYMENT_METHOD_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterChip,
                        draftFilters.paymentMethod === option.value &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setDraftFilters(prev => ({
                          ...prev,
                          paymentMethod: option.value,
                        }))
                      }>
                      <Text
                        style={[
                          styles.filterChipText,
                          draftFilters.paymentMethod === option.value &&
                            styles.filterChipTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Amount Range</Text>
                <View style={styles.amountRow}>
                  <View style={styles.amountField}>
                    <Text style={styles.amountPrefix}>Min</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      value={draftFilters.minAmount}
                      onChangeText={value =>
                        setDraftFilters(prev => ({
                          ...prev,
                          minAmount: sanitizeAmountInput(value),
                        }))
                      }
                    />
                  </View>
                  <View style={styles.amountField}>
                    <Text style={styles.amountPrefix}>Max</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      value={draftFilters.maxAmount}
                      onChangeText={value =>
                        setDraftFilters(prev => ({
                          ...prev,
                          maxAmount: sanitizeAmountInput(value),
                        }))
                      }
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetDraftFilters}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={pickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerTarget(null)}>
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>
              Select {pickerTarget === 'start' ? 'Start' : 'End'} Date
            </Text>
            <View style={styles.datePickerColumns}>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerColumnLabel}>Day</Text>
                <ScrollView style={styles.datePickerList}>
                  {pickerDays.map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.datePickerItem,
                        pickerDate.getDate() === day &&
                          styles.datePickerItemActive,
                      ]}
                      onPress={() => changePickerDatePart('day', day)}>
                      <Text
                        style={[
                          styles.datePickerItemText,
                          pickerDate.getDate() === day &&
                            styles.datePickerItemTextActive,
                        ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerColumnLabel}>Month</Text>
                <ScrollView style={styles.datePickerList}>
                  {DATE_PICKER_MONTHS.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.datePickerItem,
                        pickerDate.getMonth() === index &&
                          styles.datePickerItemActive,
                      ]}
                      onPress={() => changePickerDatePart('month', index)}>
                      <Text
                        style={[
                          styles.datePickerItemText,
                          pickerDate.getMonth() === index &&
                            styles.datePickerItemTextActive,
                        ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerColumnLabel}>Year</Text>
                <ScrollView style={styles.datePickerList}>
                  {pickerYears.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.datePickerItem,
                        pickerDate.getFullYear() === year &&
                          styles.datePickerItemActive,
                      ]}
                      onPress={() => changePickerDatePart('year', year)}>
                      <Text
                        style={[
                          styles.datePickerItemText,
                          pickerDate.getFullYear() === year &&
                            styles.datePickerItemTextActive,
                        ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={styles.datePickerCancelButton}
                onPress={() => setPickerTarget(null)}>
                <Text style={styles.datePickerCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerConfirmButton}
                onPress={confirmDatePicker}>
                <Text style={styles.datePickerConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TransactionListScreen;
