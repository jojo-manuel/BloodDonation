module.exports = {
  default: {
    require: ['features/step_definitions/**/*.cjs'],
    format: [
      'progress-bar',
      'html:cucumber-report.html',
      'json:cucumber-report.json'
    ],
    publishQuiet: true,
    parallel: 1,
    tags: 'not @wip and not @skip',
  },
  
  // Profile for bloodbank patient registration tests
  bloodbank: {
    require: ['features/step_definitions/bloodbank_patient_registration_steps.cjs'],
    format: [
      'progress-bar',
      'html:reports/bloodbank-patient-registration-report.html',
      'json:reports/bloodbank-patient-registration-report.json'
    ],
    paths: ['features/bloodbank-patient-registration.feature'],
    publishQuiet: true,
  },

  // Profile for bloodbank donor management tests
  bloodbankDonor: {
    require: ['features/step_definitions/bloodbank_donor_management_steps.cjs'],
    format: [
      'progress-bar',
      'html:reports/bloodbank-donor-management-report.html',
      'json:reports/bloodbank-donor-management-report.json'
    ],
    paths: ['features/bloodbank-donor-management.feature'],
    publishQuiet: true,
  },

  // Profile for smoke tests
  smoke: {
    require: ['features/step_definitions/**/*.cjs'],
    format: ['progress-bar'],
    tags: '@smoke',
    publishQuiet: true,
  },

  // Profile for critical tests
  critical: {
    require: ['features/step_definitions/**/*.cjs'],
    format: ['progress-bar'],
    tags: '@critical',
    publishQuiet: true,
  }
};
