export const ACCOUNT_LIMITS = {
  minNameLetters: 3,
  minPasswordLength: 6,
  minPhoneDigits: 8,
  maxPhoneDigits: 15,
  minProfessionLength: 3,
  minExperienceYears: 1,
  maxExperienceYears: 80,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-()]+$/;
const HTTP_URL_REGEX = /^https?:\/\/\S+$/i;

const normalizeValue = (value?: string | number | null) =>
  String(value ?? '').trim();

const countLetters = (value: string) => (value.match(/[A-Za-z]/g) || []).length;

const firstError = (errors: Array<string | null>) =>
  errors.find(Boolean) ?? null;

export const validateName = (
  value?: string | null,
  {required = true}: {required?: boolean} = {},
) => {
  const normalizedValue = normalizeValue(value);

  if (!normalizedValue) {
    return required ? 'Name is required.' : null;
  }

  if (
    normalizedValue.length < ACCOUNT_LIMITS.minNameLetters ||
    countLetters(normalizedValue) < ACCOUNT_LIMITS.minNameLetters
  ) {
    return `Name must include at least ${ACCOUNT_LIMITS.minNameLetters} letters.`;
  }

  return null;
};

export const validateEmail = (
  value?: string | null,
  {required = true}: {required?: boolean} = {},
) => {
  const normalizedValue = normalizeValue(value).toLowerCase();

  if (!normalizedValue) {
    return required ? 'Email is required.' : null;
  }

  if (!EMAIL_REGEX.test(normalizedValue)) {
    return 'Enter a valid email address.';
  }

  return null;
};

export const validatePassword = (
  value?: string | null,
  {required = true}: {required?: boolean} = {},
) => {
  const normalizedValue = String(value ?? '');

  if (!normalizedValue) {
    return required ? 'Password is required.' : null;
  }

  if (normalizedValue.length < ACCOUNT_LIMITS.minPasswordLength) {
    return `Password must be at least ${ACCOUNT_LIMITS.minPasswordLength} characters.`;
  }

  return null;
};

export const validateConfirmPassword = (
  password?: string | null,
  confirmPassword?: string | null,
) => {
  const normalizedConfirmPassword = String(confirmPassword ?? '');

  if (!normalizedConfirmPassword) {
    return 'Please confirm your password.';
  }

  if (String(password ?? '') !== normalizedConfirmPassword) {
    return 'Passwords do not match.';
  }

  return null;
};

export const validatePhoneNumber = (
  value?: string | null,
  {required = true}: {required?: boolean} = {},
) => {
  const normalizedValue = normalizeValue(value);

  if (!normalizedValue) {
    return required ? 'Phone number is required.' : null;
  }

  if (!PHONE_REGEX.test(normalizedValue)) {
    return 'Phone number can only contain digits, spaces, parentheses, dashes, and an optional leading +.';
  }

  const digitCount = normalizedValue.replace(/\D/g, '').length;
  if (
    digitCount < ACCOUNT_LIMITS.minPhoneDigits ||
    digitCount > ACCOUNT_LIMITS.maxPhoneDigits
  ) {
    return `Phone number must contain ${ACCOUNT_LIMITS.minPhoneDigits} to ${ACCOUNT_LIMITS.maxPhoneDigits} digits.`;
  }

  return null;
};

export const validateProfession = (
  value?: string | null,
  {required = false}: {required?: boolean} = {},
) => {
  const normalizedValue = normalizeValue(value);

  if (!normalizedValue) {
    return required ? 'Profession is required.' : null;
  }

  if (normalizedValue.length < ACCOUNT_LIMITS.minProfessionLength) {
    return `Profession must be at least ${ACCOUNT_LIMITS.minProfessionLength} characters.`;
  }

  return null;
};

export const validateExperienceYears = (
  value?: string | number | null,
  {required = false}: {required?: boolean} = {},
) => {
  const normalizedValue = normalizeValue(value);

  if (!normalizedValue) {
    return required ? 'Experience is required.' : null;
  }

  const years = Number(normalizedValue);
  if (!Number.isInteger(years)) {
    return 'Experience must be a whole number.';
  }

  if (
    years < ACCOUNT_LIMITS.minExperienceYears ||
    years > ACCOUNT_LIMITS.maxExperienceYears
  ) {
    return `Experience must be between ${ACCOUNT_LIMITS.minExperienceYears} and ${ACCOUNT_LIMITS.maxExperienceYears} years.`;
  }

  return null;
};

export const validateCertificationUrl = (
  value?: string | null,
  {
    required = false,
    hasCertificationFile = false,
  }: {required?: boolean; hasCertificationFile?: boolean} = {},
) => {
  const normalizedValue = normalizeValue(value);

  if (!normalizedValue) {
    return required && !hasCertificationFile
      ? 'Upload a certification file or provide a certification URL.'
      : null;
  }

  if (!HTTP_URL_REGEX.test(normalizedValue)) {
    return 'Certification URL must start with http:// or https://.';
  }

  return null;
};

export type RegisterFieldErrors = {
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  password: string | null;
  confirmPassword: string | null;
  profession: string | null;
  experienceYears: string | null;
  certification: string | null;
};

export function getRegisterFieldErrors({
  name,
  email,
  phoneNumber,
  password,
  confirmPassword,
  role,
  profession,
  experienceYears,
  certificationUrl,
  hasCertificationFile,
}: {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: string;
  profession: string;
  experienceYears: string;
  certificationUrl: string;
  hasCertificationFile: boolean;
}): RegisterFieldErrors {
  const isTrainer = role === 'trainer';

  return {
    name: validateName(name),
    email: validateEmail(email),
    phoneNumber: validatePhoneNumber(phoneNumber),
    password: validatePassword(password),
    confirmPassword: validateConfirmPassword(password, confirmPassword),
    profession: isTrainer ? validateProfession(profession, {required: true}) : null,
    experienceYears: isTrainer
      ? validateExperienceYears(experienceYears, {required: true})
      : null,
    certification: isTrainer
      ? validateCertificationUrl(certificationUrl, {
          required: true,
          hasCertificationFile,
        })
      : null,
  };
}

export function validateRegisterFields(args: {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: string;
  profession: string;
  experienceYears: string;
  certificationUrl: string;
  hasCertificationFile: boolean;
}) {
  const errors = getRegisterFieldErrors(args);
  return firstError(Object.values(errors));
}

export type EditProfileFieldErrors = {
  name: string | null;
  phoneNumber: string | null;
  profession: string | null;
  experienceYears: string | null;
};

export function getEditProfileFieldErrors({
  name,
  phoneNumber,
  profession,
  experienceYears,
  isTrainer,
}: {
  name: string;
  phoneNumber: string;
  profession: string;
  experienceYears: string;
  isTrainer: boolean;
}): EditProfileFieldErrors {
  return {
    name: validateName(name),
    phoneNumber: validatePhoneNumber(phoneNumber),
    profession: isTrainer ? validateProfession(profession, {required: false}) : null,
    experienceYears: isTrainer
      ? validateExperienceYears(experienceYears, {required: false})
      : null,
  };
}

export function validateEditProfileFields(args: {
  name: string;
  phoneNumber: string;
  profession: string;
  experienceYears: string;
  isTrainer: boolean;
}) {
  const errors = getEditProfileFieldErrors(args);
  return firstError(Object.values(errors));
}
