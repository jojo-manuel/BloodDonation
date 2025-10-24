import React, { useState } from 'react';
import { getTranslation, translations } from './MedicalConsentFormTranslations';

const MedicalConsentForm = ({ onConsent, onCancel, donorName }) => {
  const [language, setLanguage] = useState('en'); // 'en' or 'ml'
  const [gender, setGender] = useState(null); // 'male', 'female', or null
  const [formData, setFormData] = useState({
    // Basic Eligibility
    ageEligible: null, // 18-65 years
    weightEligible: null, // > 45kg for 350ml, > 55kg for 450ml
    
    // Recent Medical Procedures (within stated periods)
    toothExtraction: null, // 3 days
    earPiercing: null, // 6 months
    tattoo: null, // 6 months
    injection: null, // 6 months
    surgery: null, // 6 months
    animalBite: null, // 12 months
    
    // Pregnancy/Childbirth related
    pregnant: null, // 12 months
    lactating: null, // 12 months
    delivery: null, // 12 months
    abortion: null, // 6 months
    
    // Diseases
    malaria: null, // 3 months
    std: null, // 5 years
    tuberculosis: null, // 3 months
    asthma: null, // 3 months
    liverDisease: null, // 2 years
    kidneyDisease: null, // 2 years
    
    // Medications/Vaccines
    liveVaccine: null, // 28 days
    antiserumInjection: null, // 28 days
    rabiesVaccine: null, // 1 year
    hormoneTherapy: null, // 28 days
    aspirin: null, // 3 days
    antibiotics: null, // 2 weeks
    
    // Serious Conditions (Permanent deferral)
    heartDisease: null,
    epilepsy: null,
    bloodDisorder: null,
    chronicIllness: null,
    organTransplant: null,
    hiv: null,
    hepatitis: null,
    
    // Current Health
    feelingWell: null,
    fever: null,
    fatigue: null,
    
    // Final Consent
    informationTruthful: null,
    consentToDonate: null
  });

  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  // Helper function to get translated text
  const t = (key) => getTranslation(language, key);

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ml' : 'en');
  };

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;
    if (bottom) {
      setScrolledToBottom(true);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const checkEligibility = () => {
    // Check if all required questions are answered
    const allAnswered = Object.values(formData).every(val => val !== null);
    if (!allAnswered) {
      alert(t('answerAllQuestions'));
      return false;
    }

    // Check basic eligibility - MUST BE YES
    if (!formData.ageEligible) {
      alert('❌ You must be between 18-65 years of age to donate blood.\n\nAge requirement: YES is required');
      return false;
    }
    if (!formData.weightEligible) {
      alert('❌ You must weigh more than 45kg to donate blood.\n\nWeight requirement: YES is required');
      return false;
    }
    if (!formData.feelingWell) {
      alert('❌ You must be feeling healthy and well today to donate blood.\n\nCurrent health: YES is required');
      return false;
    }

    // Check consent - MUST BE YES
    if (!formData.informationTruthful) {
      alert('❌ You must confirm that all information provided is truthful.\n\nTruthful information: YES is required');
      return false;
    }
    if (!formData.consentToDonate) {
      alert('❌ You must consent to donate blood and undergo medical examination.\n\nConsent to donate: YES is required');
      return false;
    }

    // Check permanent deferral conditions - MUST BE NO
    const permanentDeferrals = [
      'heartDisease', 'epilepsy', 'bloodDisorder', 'chronicIllness',
      'organTransplant', 'hiv', 'hepatitis'
    ];
    for (let condition of permanentDeferrals) {
      if (formData[condition] === true) {
        alert('❌ PERMANENT DEFERRAL\n\nYou are not eligible to donate blood due to serious medical conditions.\n\nAll serious medical condition questions must be answered NO.\n\nPlease consult with medical staff for more information.');
        return false;
      }
    }

    // Check temporary deferral conditions - MUST BE NO
    const temporaryDeferrals = [
      'toothExtraction', 'earPiercing', 'tattoo', 'injection', 'surgery',
      'animalBite', 'pregnant', 'lactating', 'delivery', 'abortion',
      'malaria', 'std', 'tuberculosis', 'asthma', 'liverDisease',
      'kidneyDisease', 'liveVaccine', 'antiserumInjection', 'rabiesVaccine',
      'hormoneTherapy', 'aspirin', 'antibiotics', 'fever', 'fatigue'
    ];
    for (let condition of temporaryDeferrals) {
      if (formData[condition] === true) {
        alert('❌ TEMPORARY DEFERRAL\n\nYou may be temporarily deferred from donating blood.\n\nAll medical history questions (procedures, diseases, medications, current symptoms) must be answered NO.\n\nPlease consult with the blood bank medical officer for clearance and deferral period.');
        return false;
      }
    }

    // ✅ All checks passed
    return true;
  };

  const handleSubmit = () => {
    if (checkEligibility()) {
      onConsent(formData);
    }
  };

  const YesNoButton = ({ field, questionKey, deferralKey }) => (
    <div className="border-b border-gray-200 dark:border-gray-700 py-3">
      <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
        {t(questionKey)}
        {deferralKey && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({t(deferralKey)})</span>}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => handleChange(field, true)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            formData[field] === true
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {t('yesButton')}
        </button>
        <button
          onClick={() => handleChange(field, false)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            formData[field] === false
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {t('noButton')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">🩺 {t('title')}</h2>
              <p className="text-sm opacity-90 mt-1">{t('subtitle')}</p>
              <p className="text-xs opacity-75 mt-1">{t('donorLabel')} <span className="font-semibold">{donorName}</span></p>
            </div>
            <button
              onClick={toggleLanguage}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
              title="Switch Language"
            >
              <span className="text-xl">🌐</span>
              <span>{language === 'en' ? 'മലയാളം' : 'English'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-4"
          onScroll={handleScroll}
        >
          {/* Introduction */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>{t('importantLabel')}</strong> {t('importantText')}
            </p>
          </div>

          {/* Instructions - How to Pass */}
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 mb-4">
            <p className="text-sm font-bold text-green-800 dark:text-green-200 mb-2">
              ✅ To be eligible for blood donation:
            </p>
            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
              <p>• <strong>Age & Weight:</strong> Must answer <span className="px-2 py-0.5 bg-green-600 text-white rounded">YES</span></p>
              <p>• <strong>Current Health (Feeling well):</strong> Must answer <span className="px-2 py-0.5 bg-green-600 text-white rounded">YES</span></p>
              <p>• <strong>All Medical History:</strong> Must answer <span className="px-2 py-0.5 bg-red-600 text-white rounded">NO</span> (procedures, diseases, medications, symptoms)</p>
              <p>• <strong>Final Consent:</strong> Must answer <span className="px-2 py-0.5 bg-green-600 text-white rounded">YES</span></p>
            </div>
          </div>

          {/* Basic Eligibility */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">✓</span> {t('basicEligibility')}
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-2 mb-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                ⭐ These 3 questions MUST be answered <strong className="text-green-600">YES</strong> to donate
              </p>
            </div>
            <YesNoButton 
              field="ageEligible" 
              questionKey="q_ageEligible" 
            />
            <YesNoButton 
              field="weightEligible" 
              questionKey="q_weightEligible" 
            />
            <YesNoButton 
              field="feelingWell" 
              questionKey="q_feelingWell" 
            />
          </div>

          {/* Recent Medical Procedures */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">💉</span> {t('recentMedicalProcedures')}
            </h3>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-2 mb-3">
              <p className="text-xs text-red-700 dark:text-red-300">
                ⚠️ All questions in this section MUST be answered <strong className="text-red-600">NO</strong>
              </p>
            </div>
            <YesNoButton field="toothExtraction" questionKey="q_toothExtraction" deferralKey="deferral_3days" />
            <YesNoButton field="earPiercing" questionKey="q_earPiercing" deferralKey="deferral_6months" />
            <YesNoButton field="tattoo" questionKey="q_tattoo" deferralKey="deferral_12months" />
            <YesNoButton field="injection" questionKey="q_injection" deferralKey="deferral_6months" />
            <YesNoButton field="surgery" questionKey="q_surgery" deferralKey="deferral_6months" />
            <YesNoButton field="animalBite" questionKey="q_animalBite" deferralKey="deferral_12months" />
          </div>

          {/* For Women Only */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">👩</span> {t('forWomenOnly')}
            </h3>
            <YesNoButton field="pregnant" questionKey="q_pregnant" deferralKey="deferral_12months" />
            <YesNoButton field="lactating" questionKey="q_lactating" deferralKey="deferral_12months" />
            <YesNoButton field="delivery" questionKey="q_delivery" deferralKey="deferral_12months" />
            <YesNoButton field="abortion" questionKey="q_abortion" deferralKey="deferral_6months" />
          </div>

          {/* Recent Diseases */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">🦠</span> {t('recentDiseases')}
            </h3>
            <YesNoButton field="malaria" questionKey="q_malaria" deferralKey="deferral_3months" />
            <YesNoButton field="std" questionKey="q_std" deferralKey="deferral_permanent" />
            <YesNoButton field="tuberculosis" questionKey="q_tuberculosis" deferralKey="deferral_2years" />
            <YesNoButton field="asthma" questionKey="q_asthma" deferralKey="deferral_permanent" />
            <YesNoButton field="liverDisease" questionKey="q_liverDisease" deferralKey="deferral_12months" />
            <YesNoButton field="kidneyDisease" questionKey="q_kidneyDisease" deferralKey="deferral_6months" />
          </div>

          {/* Medications & Vaccines */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">💊</span> {t('medicationsVaccines')}
            </h3>
            <YesNoButton field="liveVaccine" questionKey="q_liveVaccine" deferralKey="deferral_28days" />
            <YesNoButton field="antiserumInjection" questionKey="q_antiserumInjection" deferralKey="deferral_28days" />
            <YesNoButton field="rabiesVaccine" questionKey="q_rabiesVaccine" deferralKey="deferral_12months" />
            <YesNoButton field="hormoneTherapy" questionKey="q_hormoneTherapy" deferralKey="deferral_28days" />
            <YesNoButton field="aspirin" questionKey="q_aspirin" deferralKey="deferral_3days" />
            <YesNoButton field="antibiotics" questionKey="q_antibiotics" deferralKey="deferral_2weeks" />
          </div>

          {/* Serious Conditions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> {t('seriousConditions')}
            </h3>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
              <p className="text-xs text-red-700 dark:text-red-300">
                {t('seriousConditionsWarning')}
              </p>
            </div>
            <YesNoButton field="heartDisease" questionKey="q_heartDisease" />
            <YesNoButton field="epilepsy" questionKey="q_epilepsy" />
            <YesNoButton field="bloodDisorder" questionKey="q_bloodDisorder" />
            <YesNoButton field="chronicIllness" questionKey="q_chronicIllness" />
            <YesNoButton field="organTransplant" questionKey="q_organTransplant" />
            <YesNoButton field="hiv" questionKey="q_hiv" />
            <YesNoButton field="hepatitis" questionKey="q_hepatitis" />
          </div>

          {/* Current Health Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">🌡️</span> {t('currentHealthStatus')}
            </h3>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-2 mb-3">
              <p className="text-xs text-red-700 dark:text-red-300">
                ⚠️ These questions MUST be answered <strong className="text-red-600">NO</strong> to donate
              </p>
            </div>
            <YesNoButton field="fever" questionKey="q_fever" />
            <YesNoButton field="fatigue" questionKey="q_fatigue" />
          </div>

          {/* Final Consent */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <span className="text-2xl">📋</span> {t('declarationConsent')}
            </h3>
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-2 mb-3">
              <p className="text-xs text-green-700 dark:text-green-300">
                ⭐ Final 2 questions MUST be answered <strong className="text-green-600">YES</strong>
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-3">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                {t('declarationTitle')}
              </p>
              <ul className="list-disc list-inside text-xs text-blue-700 dark:text-blue-300 space-y-1">
                {translations[language].declarationItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <YesNoButton 
              field="informationTruthful" 
              questionKey="q_informationTruthful" 
            />
            <YesNoButton 
              field="consentToDonate" 
              questionKey="q_consentToDonate" 
            />
          </div>

          {!scrolledToBottom && (
            <div className="sticky bottom-0 bg-gradient-to-t from-white dark:from-gray-800 to-transparent py-3 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-bounce">
                ↓ {t('scrollInstruction')} ↓
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!scrolledToBottom}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
            >
              ✓ {t('submitButton')}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 font-semibold transition"
            >
              ✕ {t('cancelButton')}
            </button>
          </div>
          {!scrolledToBottom && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
              {t('scrollToEnableButton')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalConsentForm;


