export const PROFILE_LIMITS = {
  minAge: 10,
  maxAge: 100,
  minHeightCm: 100,
  maxHeightCm: 280,
  minWeightKg: 35,
  maxWeightKg: 350,
};

function calculateAge(dob: Date, today = new Date()) {
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const birthDate = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());

  let age = current.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday =
    current.getMonth() > birthDate.getMonth() ||
    (current.getMonth() === birthDate.getMonth() &&
      current.getDate() >= birthDate.getDate());

  if (!hasHadBirthday) {
    age -= 1;
  }

  return age;
}

export type ProfileMetricErrors = {
  height: string | null;
  weight: string | null;
  dob: string | null;
};

export function getProfileMetricErrors({
  height,
  weight,
  dob,
  showRequired = true,
}: {
  height: string | number;
  weight: string | number;
  dob: Date | null;
  showRequired?: boolean;
}): ProfileMetricErrors {
  let heightError: string | null = null;
  const normalizedHeightValue = String(height).trim();

  if (!normalizedHeightValue) {
    heightError = showRequired ? 'Height is required.' : null;
  } else {
    const normalizedHeight = Number(normalizedHeightValue);
    if (!Number.isFinite(normalizedHeight)) {
      heightError = 'Height must be a valid number.';
    } else if (
      normalizedHeight < PROFILE_LIMITS.minHeightCm ||
      normalizedHeight > PROFILE_LIMITS.maxHeightCm
    ) {
      heightError = `Height must be between ${PROFILE_LIMITS.minHeightCm} and ${PROFILE_LIMITS.maxHeightCm} cm.`;
    }
  }

  let weightError: string | null = null;
  const normalizedWeightValue = String(weight).trim();

  if (!normalizedWeightValue) {
    weightError = showRequired ? 'Weight is required.' : null;
  } else {
    const normalizedWeight = Number(normalizedWeightValue);
    if (!Number.isFinite(normalizedWeight)) {
      weightError = 'Weight must be a valid number.';
    } else if (
      normalizedWeight < PROFILE_LIMITS.minWeightKg ||
      normalizedWeight > PROFILE_LIMITS.maxWeightKg
    ) {
      weightError = `Weight must be between ${PROFILE_LIMITS.minWeightKg} and ${PROFILE_LIMITS.maxWeightKg} kg.`;
    }
  }

  let dobError: string | null = null;

  if (!dob || Number.isNaN(dob.getTime())) {
    dobError = showRequired ? 'Date of birth is required.' : null;
  } else {
    const age = calculateAge(dob);
    if (age < PROFILE_LIMITS.minAge || age > PROFILE_LIMITS.maxAge) {
      dobError = `Age must be between ${PROFILE_LIMITS.minAge} and ${PROFILE_LIMITS.maxAge} years.`;
    }
  }

  return {
    height: heightError,
    weight: weightError,
    dob: dobError,
  };
}

export function validateProfileMetrics({
  height,
  weight,
  dob,
}: {
  height: string | number;
  weight: string | number;
  dob: Date | null;
}) {
  const errors = getProfileMetricErrors({height, weight, dob, showRequired: false});

  return errors.height || errors.weight || errors.dob;
}
