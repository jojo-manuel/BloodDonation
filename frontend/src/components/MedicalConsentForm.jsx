import React, { useState } from 'react';

const MedicalConsentForm = ({ onConsent, onCancel, donorName }) => {
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
      alert('Please answer all questions before proceeding.');
      return false;
    }

    // Check permanent deferral conditions (must be NO)
    const permanentDeferrals = [
      'heartDisease', 'epilepsy', 'bloodDisorder', 'chronicIllness',
      'organTransplant', 'hiv', 'hepatitis'
    ];
    for (let condition of permanentDeferrals) {
      if (formData[condition] === true) {
        alert(`You are not eligible to donate blood due to medical history. Please consult with medical staff for more information.`);
        return false;
      }
    }

    // Check temporary deferral conditions (must be NO)
    const temporaryDeferrals = [
      'toothExtraction', 'earPiercing', 'tattoo', 'injection', 'surgery',
      'animalBite', 'pregnant', 'lactating', 'delivery', 'abortion',
      'malaria', 'std', 'tuberculosis', 'asthma', 'liverDisease',
      'kidneyDisease', 'liveVaccine', 'antiserumInjection', 'rabiesVaccine',
      'hormoneTherapy', 'aspirin', 'antibiotics', 'fever', 'fatigue'
    ];
    for (let condition of temporaryDeferrals) {
      if (formData[condition] === true) {
        alert(`You may be temporarily deferred from donating blood. Please consult with the blood bank medical officer for clearance.`);
        return false;
      }
    }

    // Check basic eligibility (must be YES)
    if (!formData.ageEligible || !formData.weightEligible || !formData.feelingWell) {
      alert('You must meet basic eligibility criteria (age 18-65, weight > 45kg, feeling well).');
      return false;
    }

    // Check consent (must be YES)
    if (!formData.informationTruthful || !formData.consentToDonate) {
      alert('You must confirm that your information is truthful and consent to donate.');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (checkEligibility()) {
      onConsent(formData);
    }
  };

  const YesNoButton = ({ field, label, note }) => (
    <div className="border-b border-gray-200 dark:border-gray-700 py-3">
      <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
        {label}
        {note && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({note})</span>}
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
          Yes
        </button>
        <button
          onClick={() => handleChange(field, false)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            formData[field] === false
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold">🩺 Medical Consent Form</h2>
          <p className="text-sm opacity-90 mt-1">Blood Donor Eligibility Screening</p>
          <p className="text-xs opacity-75 mt-1">Donor: <span className="font-semibold">{donorName}</span></p>
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-4"
          onScroll={handleScroll}
        >
          {/* Introduction */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> Please answer all questions honestly. This information is confidential and is used to ensure the safety of both donors and recipients. Providing false information may endanger lives.
            </p>
          </div>

          {/* Basic Eligibility */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">✓</span> Basic Eligibility
            </h3>
            <YesNoButton 
              field="ageEligible" 
              label="Are you between 18-65 years of age?" 
            />
            <YesNoButton 
              field="weightEligible" 
              label="Do you weigh more than 45 kg (for 350ml donation) or 55 kg (for 450ml donation)?" 
            />
          </div>

          {/* Recent Medical Procedures */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">💉</span> Recent Medical Procedures
            </h3>
            <YesNoButton 
              field="toothExtraction" 
              label="Have you had a tooth extraction or root canal in the last 3 days?" 
              note="Deferral: 3 days"
            />
            <YesNoButton 
              field="earPiercing" 
              label="Have you had ear piercing or acupuncture in the last 6 months?" 
              note="Deferral: 6 months"
            />
            <YesNoButton 
              field="tattoo" 
              label="Have you gotten a tattoo in the last 6 months?" 
              note="Deferral: 6 months"
            />
            <YesNoButton 
              field="injection" 
              label="Have you received any injections (other than vaccines) in the last 6 months?" 
              note="Deferral: 6 months"
            />
            <YesNoButton 
              field="surgery" 
              label="Have you undergone any surgery in the last 6 months?" 
              note="Deferral: 6 months"
            />
            <YesNoButton 
              field="animalBite" 
              label="Have you been bitten by a rabid or potentially rabid animal in the last 12 months?" 
              note="Deferral: 12 months"
            />
          </div>

          {/* For Women Only */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">👩</span> For Women Only
            </h3>
            <YesNoButton 
              field="pregnant" 
              label="Are you currently pregnant?" 
              note="Deferral: Until delivery + 12 months"
            />
            <YesNoButton 
              field="lactating" 
              label="Are you currently breastfeeding?" 
              note="Deferral: 12 months after delivery"
            />
            <YesNoButton 
              field="delivery" 
              label="Have you given birth in the last 12 months?" 
              note="Deferral: 12 months"
            />
            <YesNoButton 
              field="abortion" 
              label="Have you had a miscarriage or abortion in the last 6 months?" 
              note="Deferral: 6 months"
            />
          </div>

          {/* Recent Diseases */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">🦠</span> Recent Diseases
            </h3>
            <YesNoButton 
              field="malaria" 
              label="Have you had malaria in the last 3 months?" 
              note="Deferral: 3 months"
            />
            <YesNoButton 
              field="std" 
              label="Have you had any sexually transmitted diseases in the last 5 years?" 
              note="Deferral: 5 years"
            />
            <YesNoButton 
              field="tuberculosis" 
              label="Have you been treated for tuberculosis in the last 3 months?" 
              note="Deferral: 3 months"
            />
            <YesNoButton 
              field="asthma" 
              label="Have you had asthma symptoms in the last 3 months?" 
              note="Deferral: 3 months"
            />
            <YesNoButton 
              field="liverDisease" 
              label="Have you had liver disease (jaundice, hepatitis) in the last 2 years?" 
              note="Deferral: 2 years"
            />
            <YesNoButton 
              field="kidneyDisease" 
              label="Have you had kidney disease in the last 2 years?" 
              note="Deferral: 2 years"
            />
          </div>

          {/* Medications & Vaccines */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">💊</span> Recent Medications & Vaccines
            </h3>
            <YesNoButton 
              field="liveVaccine" 
              label="Have you received any live vaccines (BCG, Polio, MMR, etc.) in the last 28 days?" 
              note="Deferral: 28 days"
            />
            <YesNoButton 
              field="antiserumInjection" 
              label="Have you received anti-tetanus, anti-venom, or anti-diphtheria serum in the last 28 days?" 
              note="Deferral: 28 days"
            />
            <YesNoButton 
              field="rabiesVaccine" 
              label="Have you received rabies vaccination in the last 12 months?" 
              note="Deferral: 1 year"
            />
            <YesNoButton 
              field="hormoneTherapy" 
              label="Have you been on hormone therapy or insulin in the last 28 days?" 
              note="Deferral: 28 days"
            />
            <YesNoButton 
              field="aspirin" 
              label="Have you taken aspirin or other pain relievers in the last 3 days?" 
              note="Deferral: 3 days"
            />
            <YesNoButton 
              field="antibiotics" 
              label="Have you taken antibiotics in the last 2 weeks?" 
              note="Deferral: 2 weeks"
            />
          </div>

          {/* Serious Conditions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> Serious Medical Conditions (Permanent Deferral)
            </h3>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
              <p className="text-xs text-red-700 dark:text-red-300">
                If you answer "Yes" to any of these questions, you will not be eligible to donate blood for safety reasons.
              </p>
            </div>
            <YesNoButton 
              field="heartDisease" 
              label="Do you have any heart disease or cardiovascular condition?" 
            />
            <YesNoButton 
              field="epilepsy" 
              label="Do you have epilepsy or have you experienced fainting/seizures?" 
            />
            <YesNoButton 
              field="bloodDisorder" 
              label="Do you have any blood clotting disorder or hemophilia?" 
            />
            <YesNoButton 
              field="chronicIllness" 
              label="Do you have any chronic illness (diabetes, cancer, etc.)?" 
            />
            <YesNoButton 
              field="organTransplant" 
              label="Have you ever received an organ transplant?" 
            />
            <YesNoButton 
              field="hiv" 
              label="Have you ever tested positive for HIV/AIDS?" 
            />
            <YesNoButton 
              field="hepatitis" 
              label="Do you have chronic hepatitis B or C?" 
            />
          </div>

          {/* Current Health Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">🌡️</span> Current Health Status
            </h3>
            <YesNoButton 
              field="feelingWell" 
              label="Do you feel healthy and well today?" 
            />
            <YesNoButton 
              field="fever" 
              label="Do you have fever, cold, cough, or diarrhea today?" 
            />
            <YesNoButton 
              field="fatigue" 
              label="Are you experiencing severe fatigue or weakness today?" 
            />
          </div>

          {/* Final Consent */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <span className="text-2xl">📋</span> Declaration & Consent
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-3">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                I hereby declare that:
              </p>
              <ul className="list-disc list-inside text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>All the information provided above is true and correct to the best of my knowledge</li>
                <li>I understand that providing false information may endanger the recipient's life</li>
                <li>I consent to have my blood tested for HIV, Hepatitis B, Hepatitis C, Syphilis (VDRL), and Malaria</li>
                <li>I agree to donate my blood voluntarily without any payment</li>
                <li>I understand the blood donation procedure and its minimal risks</li>
              </ul>
            </div>
            <YesNoButton 
              field="informationTruthful" 
              label="I confirm that all information provided is truthful and accurate" 
            />
            <YesNoButton 
              field="consentToDonate" 
              label="I consent to donate blood and undergo medical examination" 
            />
          </div>

          {!scrolledToBottom && (
            <div className="sticky bottom-0 bg-gradient-to-t from-white dark:from-gray-800 to-transparent py-3 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-bounce">
                ↓ Scroll down to continue ↓
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
              ✓ I Confirm - Proceed to Booking
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 font-semibold transition"
            >
              ✕ Cancel
            </button>
          </div>
          {!scrolledToBottom && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
              Please scroll to the bottom to enable the submit button
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalConsentForm;

