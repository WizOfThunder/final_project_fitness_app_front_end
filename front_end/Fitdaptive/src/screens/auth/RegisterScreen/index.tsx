import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, Alert, KeyboardAvoidingView, Modal, ActivityIndicator} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {useAuth} from '../../../store/AuthContext';
import {apiClient} from '../../../services/api';
import {
  getProfileMetricErrors,
  validateProfileMetrics,
} from '../../../utils/profileValidation';
import {
  getRegisterFieldErrors,
  validateRegisterFields,
} from '../../../utils/accountValidation';
import {styles} from './styles';

export default function RegisterScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('member');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const {register} = useAuth();
  const insets = useSafeAreaInsets();
  
  // Member fields
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(2000, 0, 1));
  const [goal, setGoal] = useState('');
  const [metricTouched, setMetricTouched] = useState({
    height: false,
    weight: false,
    dob: false,
  });
  const [fieldTouched, setFieldTouched] = useState({
    name: false,
    email: false,
    phoneNumber: false,
    password: false,
    confirmPassword: false,
    profession: false,
    experienceYears: false,
    certification: false,
  });
  
  // Trainer fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profession, setProfession] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [certificationFile, setCertificationFile] = useState<any>(null);
  const [certificationUrl, setCertificationUrl] = useState('');

  const handleDateChange = (type: 'day' | 'month' | 'year', value: number) => {
    const newDate = new Date(tempDate);
    if (type === 'day') newDate.setDate(value);
    if (type === 'month') newDate.setMonth(value);
    if (type === 'year') newDate.setFullYear(value);
    setTempDate(newDate);
  };

  const confirmDate = () => {
    setDob(tempDate);
    setMetricTouched(prev => ({...prev, dob: true}));
    setShowDatePicker(false);
  };

  const metricErrors = getProfileMetricErrors({height, weight, dob});
  const fieldErrors = getRegisterFieldErrors({
    name,
    email,
    phoneNumber,
    password,
    confirmPassword,
    role,
    profession,
    experienceYears,
    certificationUrl,
    hasCertificationFile: Boolean(certificationFile),
  });

  const handleNameChange = (value: string) => {
    setName(value);
    setFieldTouched(prev => ({...prev, name: true}));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setFieldTouched(prev => ({...prev, email: true}));
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    setFieldTouched(prev => ({...prev, phoneNumber: true}));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setFieldTouched(prev => ({...prev, password: true}));
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setFieldTouched(prev => ({...prev, confirmPassword: true}));
  };

  const handleProfessionChange = (value: string) => {
    setProfession(value);
    setFieldTouched(prev => ({...prev, profession: true}));
  };

  const handleExperienceYearsChange = (value: string) => {
    setExperienceYears(value);
    setFieldTouched(prev => ({...prev, experienceYears: true}));
  };

  const handleCertificationUrlChange = (value: string) => {
    setCertificationUrl(value);
    setFieldTouched(prev => ({...prev, certification: true}));
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    setMetricTouched(prev => ({...prev, height: true}));
  };

  const handleWeightChange = (value: string) => {
    setWeight(value);
    setMetricTouched(prev => ({...prev, weight: true}));
  };

  const handleCertificationPicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Error', 'Failed to pick file');
          return;
        }
        if (response.assets && response.assets[0]) {
          setCertificationFile(response.assets[0]);
          setFieldTouched(prev => ({...prev, certification: true}));
        }
      },
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleRegister = async () => {
    setMetricTouched({height: true, weight: true, dob: true});
    setFieldTouched({
      name: true,
      email: true,
      phoneNumber: true,
      password: true,
      confirmPassword: true,
      profession: true,
      experienceYears: true,
      certification: true,
    });

    const fieldValidationError = validateRegisterFields({
      name,
      email,
      phoneNumber,
      password,
      confirmPassword,
      role,
      profession,
      experienceYears,
      certificationUrl,
      hasCertificationFile: Boolean(certificationFile),
    });
    if (fieldValidationError) {
      Alert.alert('Error', fieldValidationError);
      return;
    }

    if (!height.trim() || !weight.trim() || !gender) {
      Alert.alert('Error', 'Please fill all required profile fields');
      return;
    }

    const profileValidationError = validateProfileMetrics({height, weight, dob});
    if (profileValidationError) {
      Alert.alert('Error', profileValidationError);
      return;
    }

    setLoading(true);
    try {
      let finalCertUrl = certificationUrl.trim() || null;

      // Upload file first if picked
      if (role === 'trainer' && certificationFile) {
        const formData = new FormData();
        formData.append('certification', {
          uri: certificationFile.uri,
          type: certificationFile.type || 'image/jpeg',
          name: certificationFile.fileName || 'certification.jpg',
        } as any);
        const uploadRes = await apiClient.post('/auth/upload-certification', formData);
        finalCertUrl = uploadRes.data.url;
      }

      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        phone_number: phoneNumber.trim(),
        height: height.trim(),
        weight: weight.trim(),
        gender,
        dob: `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`,
        goal: goal.trim() || null,
        ...(role === 'trainer' && {
          profession: profession.trim(),
          bio: bio.trim() || null,
          experience_years: Number(experienceYears.trim()),
          certification_url: finalCertUrl,
        }),
      });
      Alert.alert('Success', 'Account created successfully!');
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="height">
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
      
      <View style={styles.header}>
        <Icon name="fitness" size={50} color="#fff" />
        <Text style={styles.appName}>Fitdaptive</Text>
      </View>

      <ScrollView 
        style={styles.formContainer} 
        contentContainerStyle={[styles.formContent, {paddingBottom: insets.bottom + 30}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join your fitness journey today</Text>
        
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View
          style={[
            styles.inputContainer,
            fieldTouched.name &&
              Boolean(fieldErrors.name) &&
              styles.inputContainerError,
          ]}>
          <Icon name="person-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            placeholderTextColor="#999"
            value={name}
            onChangeText={handleNameChange}
            autoCapitalize="words"
          />
        </View>
        {fieldTouched.name && fieldErrors.name ? (
          <Text style={styles.errorText}>{fieldErrors.name}</Text>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            fieldTouched.email &&
              Boolean(fieldErrors.email) &&
              styles.inputContainerError,
          ]}>
          <Icon name="mail-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#999"
            value={email}
            onChangeText={handleEmailChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>
        {fieldTouched.email && fieldErrors.email ? (
          <Text style={styles.errorText}>{fieldErrors.email}</Text>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            fieldTouched.phoneNumber &&
              Boolean(fieldErrors.phoneNumber) &&
              styles.inputContainerError,
          ]}>
          <Icon name="call-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            placeholderTextColor="#999"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            keyboardType="phone-pad"
          />
        </View>
        {fieldTouched.phoneNumber && fieldErrors.phoneNumber ? (
          <Text style={styles.errorText}>{fieldErrors.phoneNumber}</Text>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            fieldTouched.password &&
              Boolean(fieldErrors.password) &&
              styles.inputContainerError,
          ]}>
          <Icon name="lock-closed-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password *"
            placeholderTextColor="#999"
            value={password}
            onChangeText={handlePasswordChange}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(value => !value)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
            <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999" />
          </TouchableOpacity>
        </View>
        {fieldTouched.password && fieldErrors.password ? (
          <Text style={styles.errorText}>{fieldErrors.password}</Text>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            fieldTouched.confirmPassword &&
              Boolean(fieldErrors.confirmPassword) &&
              styles.inputContainerError,
          ]}>
          <Icon name="lock-closed-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(value => !value)}
            accessibilityRole="button"
            accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
            <Icon name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999" />
          </TouchableOpacity>
        </View>
        {fieldTouched.confirmPassword && fieldErrors.confirmPassword ? (
          <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text>
        ) : null}

        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <Icon name="flag-outline" size={20} color="#FF6B35" style={styles.inputIconTop} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Fitness goal (optional, e.g. Lose weight, build muscle)"
            placeholderTextColor="#999"
            value={goal}
            onChangeText={setGoal}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        
        <Text style={styles.label}>Role *</Text>
        <View style={styles.roleContainer}>
          {['member', 'trainer'].map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.roleButton, role === r && styles.roleButtonActive]}
              onPress={() => setRole(r)}>
              <Icon 
                name={r === 'member' ? 'person' : 'barbell'} 
                size={18} 
                color={role === r ? '#fff' : '#FF6B35'} 
              />
              <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Member-specific fields */}
        {role === 'member' && (
          <>
            <Text style={styles.sectionTitle}>Member Information</Text>
            
            <View
              style={[
                styles.inputContainer,
                metricTouched.height &&
                  Boolean(metricErrors.height) &&
                  styles.inputContainerError,
              ]}>
              <Icon name="resize-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Height (cm) *"
                placeholderTextColor="#999"
                value={height}
                onChangeText={handleHeightChange}
                keyboardType="decimal-pad"
              />
            </View>
            {metricTouched.height && metricErrors.height ? (
              <Text style={styles.errorText}>{metricErrors.height}</Text>
            ) : null}

            <View
              style={[
                styles.inputContainer,
                metricTouched.weight &&
                  Boolean(metricErrors.weight) &&
                  styles.inputContainerError,
              ]}>
              <Icon name="scale-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Weight (kg) *"
                placeholderTextColor="#999"
                value={weight}
                onChangeText={handleWeightChange}
                keyboardType="decimal-pad"
              />
            </View>
            {metricTouched.weight && metricErrors.weight ? (
              <Text style={styles.errorText}>{metricErrors.weight}</Text>
            ) : null}

            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderContainer}>
              {['male', 'female'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderButton, gender === g && styles.genderButtonActive]}
                  onPress={() => setGender(g)}>
                  <Icon 
                    name={g === 'male' ? 'man' : 'woman'} 
                    size={20} 
                    color={gender === g ? '#fff' : '#FF6B35'} 
                  />
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Date of Birth *</Text>
            <TouchableOpacity 
              style={[
                styles.dateButton,
                metricTouched.dob &&
                  Boolean(metricErrors.dob) &&
                  styles.dateButtonError,
              ]}
              onPress={() => {
                setTempDate(dob);
                setShowDatePicker(true);
              }}>
              <Icon name="calendar-outline" size={20} color="#FF6B35" />
              <Text style={styles.dateText}>{formatDate(dob)}</Text>
            </TouchableOpacity>
            {metricTouched.dob && metricErrors.dob ? (
              <Text style={styles.errorText}>{metricErrors.dob}</Text>
            ) : null}
          </>
        )}

        {/* Trainer-specific fields */}
        {role === 'trainer' && (
          <>
            <Text style={styles.sectionTitle}>Trainer Information</Text>
            
            <View
              style={[
                styles.inputContainer,
                fieldTouched.profession &&
                  Boolean(fieldErrors.profession) &&
                  styles.inputContainerError,
              ]}>
              <Icon name="briefcase-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Profession (e.g., Personal Trainer) *"
                placeholderTextColor="#999"
                value={profession}
                onChangeText={handleProfessionChange}
                autoCapitalize="words"
              />
            </View>
            {fieldTouched.profession && fieldErrors.profession ? (
              <Text style={styles.errorText}>{fieldErrors.profession}</Text>
            ) : null}

            <View
              style={[
                styles.inputContainer,
                fieldTouched.experienceYears &&
                  Boolean(fieldErrors.experienceYears) &&
                  styles.inputContainerError,
              ]}>
              <Icon name="time-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Experience (years) *"
                placeholderTextColor="#999"
                value={experienceYears}
                onChangeText={handleExperienceYearsChange}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            {fieldTouched.experienceYears && fieldErrors.experienceYears ? (
              <Text style={styles.errorText}>{fieldErrors.experienceYears}</Text>
            ) : null}

            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <Icon name="document-text-outline" size={20} color="#FF6B35" style={styles.inputIconTop} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Bio (optional)"
                placeholderTextColor="#999"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                metricTouched.height &&
                  Boolean(metricErrors.height) &&
                  styles.inputContainerError,
              ]}>
              <Icon name="resize-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Height (cm) *"
                placeholderTextColor="#999"
                value={height}
                onChangeText={handleHeightChange}
                keyboardType="decimal-pad"
              />
            </View>
            {metricTouched.height && metricErrors.height ? (
              <Text style={styles.errorText}>{metricErrors.height}</Text>
            ) : null}

            <View
              style={[
                styles.inputContainer,
                metricTouched.weight &&
                  Boolean(metricErrors.weight) &&
                  styles.inputContainerError,
              ]}>
              <Icon name="scale-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Weight (kg) *"
                placeholderTextColor="#999"
                value={weight}
                onChangeText={handleWeightChange}
                keyboardType="decimal-pad"
              />
            </View>
            {metricTouched.weight && metricErrors.weight ? (
              <Text style={styles.errorText}>{metricErrors.weight}</Text>
            ) : null}

            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderContainer}>
              {['male', 'female'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderButton, gender === g && styles.genderButtonActive]}
                  onPress={() => setGender(g)}>
                  <Icon
                    name={g === 'male' ? 'man' : 'woman'}
                    size={20}
                    color={gender === g ? '#fff' : '#FF6B35'}
                  />
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Date of Birth *</Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                metricTouched.dob &&
                  Boolean(metricErrors.dob) &&
                  styles.dateButtonError,
              ]}
              onPress={() => {
                setTempDate(dob);
                setShowDatePicker(true);
              }}>
              <Icon name="calendar-outline" size={20} color="#FF6B35" />
              <Text style={styles.dateText}>{formatDate(dob)}</Text>
            </TouchableOpacity>
            {metricTouched.dob && metricErrors.dob ? (
              <Text style={styles.errorText}>{metricErrors.dob}</Text>
            ) : null}

            <Text style={styles.label}>Certification *</Text>
            <TouchableOpacity 
              style={[
                styles.fileButton,
                fieldTouched.certification &&
                  Boolean(fieldErrors.certification) &&
                  styles.fileButtonError,
              ]}
              onPress={handleCertificationPicker}>
              <Icon name="cloud-upload-outline" size={24} color="#FF6B35" />
              <Text style={styles.fileButtonText}>
                {certificationFile ? certificationFile.fileName || 'File selected' : 'Upload Certification Photo'}
              </Text>
            </TouchableOpacity>
            {certificationFile && (
              <Text style={styles.fileInfo}>✓ {certificationFile.fileName}</Text>
            )}
            <Text style={styles.orText}>— or paste a link —</Text>
            <View
              style={[
                styles.inputContainer,
                fieldTouched.certification &&
                  Boolean(fieldErrors.certification) &&
                  styles.inputContainerError,
              ]}>
              <Icon name="link-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Certification URL (optional)"
                placeholderTextColor="#999"
                value={certificationUrl}
                onChangeText={handleCertificationUrlChange}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            {fieldTouched.certification && fieldErrors.certification ? (
              <Text style={styles.errorText}>{fieldErrors.certification}</Text>
            ) : null}
          </>
        )}
        
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <>
            <Text style={styles.buttonText}>Create Account</Text>
            <Icon name="checkmark-circle" size={20} color="#fff" />
          </>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.modalTitle}>Select Date of Birth</Text>
            
            <View style={styles.datePickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.pickerItem, tempDate.getDate() === day && styles.pickerItemActive]}
                      onPress={() => handleDateChange('day', day)}>
                      <Text style={[styles.pickerText, tempDate.getDate() === day && styles.pickerTextActive]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.pickerItem, tempDate.getMonth() === i && styles.pickerItemActive]}
                      onPress={() => handleDateChange('month', i)}>
                      <Text style={[styles.pickerText, tempDate.getMonth() === i && styles.pickerTextActive]}>{month}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[styles.pickerItem, tempDate.getFullYear() === year && styles.pickerItemActive]}
                      onPress={() => handleDateChange('year', year)}>
                      <Text style={[styles.pickerText, tempDate.getFullYear() === year && styles.pickerTextActive]}>{year}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDatePicker(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmDate}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
