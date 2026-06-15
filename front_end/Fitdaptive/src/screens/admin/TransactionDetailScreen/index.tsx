import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

interface TransactionDetail {
  id: string;
  orderId: string;
  memberName: string;
  memberEmail: string;
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
  midtransData?: {
    transactionStatus?: string;
    fraudStatus?: string;
    bank?: string;
    vaNumber?: string | null;
    paymentType?: string;
    grossAmount?: string;
    transactionId?: string;
    statusCode?: string;
  };
}

const TransactionDetailScreen = ({route, navigation}: any) => {
  const transaction = route?.params?.transaction ?? null;
  const [details, setDetails] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const transactionId = transaction?.orderId ?? transaction?.id ?? null;

  const fetchTransactionDetails = useCallback(
    async (targetTransactionId: string | null = transactionId) => {
      if (!targetTransactionId) {
        setDetails(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.get(
          `/admin/transactions/${encodeURIComponent(
            String(targetTransactionId),
          )}`,
        );
        setDetails(response.data.transaction);
      } catch (error) {
        console.error('Error fetching transaction details:', error);
        setDetails(null);
        Alert.alert('Error', 'Failed to load transaction details');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [transactionId],
  );

  useEffect(() => {
    fetchTransactionDetails();
  }, [fetchTransactionDetails]);

  const refreshTransaction = async () => {
    setRefreshing(true);
    await fetchTransactionDetails();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const normalizeStatus = (status: string) => {
    return status === 'settlement' ? 'success' : status;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!transactionId) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Transaction information is missing</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!details) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Failed to load transaction details</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchTransactionDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const midtransData = details.midtransData ?? {
    transactionStatus: details.status,
    fraudStatus: 'unknown',
    bank: '-',
    vaNumber: null,
    paymentType: details.paymentMethod,
    grossAmount: String(details.amount),
    transactionId: details.midtransTransactionId,
    statusCode: '-',
  };
  const fraudStatus = midtransData.fraudStatus || 'unknown';
  const fraudStatusColor =
    fraudStatus === 'accept'
      ? '#34C759'
      : fraudStatus === 'unknown'
      ? '#666'
      : '#FF9500';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshTransaction}
          disabled={refreshing}>
          <Icon
            name="refresh"
            size={24}
            color={refreshing ? '#ccc' : '#007AFF'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(details.status) + '20'},
            ]}>
            <Icon
              name={getStatusIcon(details.status)}
              size={32}
              color={getStatusColor(details.status)}
            />
          </View>
          <Text
            style={[
              styles.statusText,
              {color: getStatusColor(details.status)},
            ]}>
            {formatStatusLabel(details.status)}
          </Text>
          <Text style={styles.amount}>{formatPrice(details.amount)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Information</Text>
          <View style={styles.infoRow}>
            <Icon name="person" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{details.memberName}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="mail" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{details.memberEmail}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trainer Information</Text>
          <View style={styles.infoRow}>
            <Icon name="fitness" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Trainer</Text>
              <Text style={styles.infoValue}>{details.trainerName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.infoRow}>
            <Icon name="card" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text style={styles.infoValue}>{details.paymentMethod}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="calendar" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Transaction Time</Text>
              <Text style={styles.infoValue}>
                {formatDate(details.transactionTime)}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="receipt" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>{details.orderId}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Midtrans Details</Text>
          <View style={styles.infoRow}>
            <Icon name="key" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Transaction ID</Text>
              <Text style={styles.infoValue}>
                {midtransData.transactionId ||
                  details.midtransTransactionId ||
                  '-'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="shield-checkmark" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fraud Status</Text>
              <Text style={[styles.infoValue, {color: fraudStatusColor}]}>
                {fraudStatus.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="business" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Bank</Text>
              <Text style={styles.infoValue}>{midtransData.bank || '-'}</Text>
            </View>
          </View>
          {midtransData.vaNumber && (
            <View style={styles.infoRow}>
              <Icon name="card-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>VA Number</Text>
                <Text style={styles.infoValue}>{midtransData.vaNumber}</Text>
              </View>
            </View>
          )}
          <View style={styles.infoRow}>
            <Icon name="code" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Status Code</Text>
              <Text style={styles.infoValue}>
                {midtransData.statusCode || '-'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="pricetag" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Payment Type</Text>
              <Text style={styles.infoValue}>
                {midtransData.paymentType || details.paymentMethod}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

export default TransactionDetailScreen;
