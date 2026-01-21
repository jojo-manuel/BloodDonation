export const doctorSelectionCriteria = [
    {
        category: "1. General Criteria",
        items: [
            { id: 1, label: "Well being", description: "In good health, mentally alert, physically fit. No jail/confinement." },
            { id: 2, label: "Age", description: "18-65 years (First time <60). Apheresis: 18-60 years." },
            { id: 3, label: "Weight / Volume", description: "350ml: >45kg | 450ml: >55kg | Apheresis: >50kg." },
            { id: 4, label: "Donation Interval", description: "Male: 3 months, Female: 4 months. Apheresis: 48h (max 2/week, 24/year)." },
            { id: 5, label: "Blood Pressure", description: "Systolic: 100-140 mmHg, Diastolic: 60-90 mmHg. No meds change in 28 days." },
            { id: 6, label: "Pulse", description: "60-100 beats/min, Regular." },
            { id: 7, label: "Temperature", description: "Afebrile; 37°C/98.4°F. Free from acute respiratory disease." },
            { id: 8, label: "Respiration", description: "Normal. Free from acute respiratory disease." },
            { id: 9, label: "Haemoglobin", description: ">= 12.5 g/dL. Thalassemia trait accepted if Hb is acceptable." },
            { id: 10, label: "Meal", description: "Not fasting (last meal 4h prior). No alcohol intoxication." },
            { id: 11, label: "Occupation", description: "Hazardous jobs (air crew, driver): 24h gap. No night shift without sleep." },
            { id: 12, label: "Risk Behaviour", description: "Free from trasmissible disease risk (HIV, Hep B/C, Sex workers, IV drug users)." },
            { id: 13, label: "Travel", description: "No travel/residence in endemic areas for unscreened diseases." },
            { id: 14, label: "Skin", description: "No skin disease at phlebotomy site. No puncture marks/scars." }
        ]
    },
    {
        category: "2. Physiological Status (Women)",
        items: [
            { id: 15, label: "Pregnancy/Delivery", description: "Defer 12 months after delivery." },
            { id: 16, label: "Abortion", description: "Defer 6 months after abortion." },
            { id: 17, label: "Breast Feeding", description: "Defer for total lactation period." },
            { id: 18, label: "Menstruation", description: "Defer during period." }
        ]
    },
    {
        category: "3-4. Illness & Respiratory",
        items: [
            { id: 19, label: "Non-specific symptoms", description: "Defer until afebrile/subsided (malaise, pain)." },
            { id: 20, label: "Cold/Flu/Throat", description: "Defer until afebrile/subsided." },
            { id: 21, label: "Chronic Sinusitis", description: "Accept unless on antibiotics." },
            { id: 22, label: "Asthmatic Attack", description: "Permanently defer." },
            { id: 23, label: "Asthmatics on Steroids", description: "Permanently defer." }
        ]
    },
    {
        category: "5. Surgical Procedures",
        items: [
            { id: 24, label: "Major Surgery", description: "Defer 12 months after recovery." },
            { id: 25, label: "Minor Surgery", description: "Defer 6 months after recovery." },
            { id: 26, label: "Blood Transfusion", description: "Defer 12 months." },
            { id: 27, label: "Heart Surgery", description: "Permanently defer (Bypass, Open heart)." },
            { id: 28, label: "Cancer Surgery", description: "Permanently defer." },
            { id: 29, label: "Tooth Extraction", description: "Defer 6 months." },
            { id: 30, label: "Dental Surgery (Anaesthesia)", description: "Defer 6 months after recovery." }
        ]
    },
    {
        category: "6. Cardio-Vascular Diseases",
        items: [
            { id: 31, label: "Active Symptoms", description: "Permanently defer (Chest pain, SOB, Swelling)." },
            { id: 32, label: "Myocardial Infarction", description: "Permanently defer." },
            { id: 33, label: "Cardiac Medication", description: "Permanently defer (Digitalis, Nitroglycerine)." },
            { id: 34, label: "Hypertensive Heart Disease", description: "Permanently defer." },
            { id: 35, label: "Coronary Artery Disease", description: "Permanently defer." },
            { id: 36, label: "Angina Pectoris", description: "Permanently defer." },
            { id: 37, label: "Rheumatic Heart Disease", description: "Permanently defer." }
        ]
    },
    {
        category: "7. CNS & Psychiatric",
        items: [
            { id: 38, label: "Migraine", description: "Accept if not severe (<1/week)." },
            { id: 39, label: "Convulsions/Epilepsy", description: "Permanently defer." },
            { id: 40, label: "Schizophrenia", description: "Permanently defer." },
            { id: 41, label: "Anxiety/Mood Disorders", description: "Accept if stable and feeling well." }
        ]
    },
    {
        category: "8. Endocrine",
        items: [
            { id: 42, label: "Diabetes", description: "Accept (diet/oral). Defer (insulin/complications/med change 4 weeks)." },
            { id: 43, label: "Thyroid Disorders", description: "Accept benign euthyroid. Defer investigation. Permanent (Graves/Cancer)." },
            { id: 44, label: "Other Endocrine", description: "Permanently defer." }
        ]
    },
    {
        category: "9. Liver & Hepatitis",
        items: [
            { id: 45, label: "Hepatitis B/C Risk/Infection", description: "Permanently defer (Positive/Unknown/At Risk)." },
            { id: 46, label: "Hepatitis Contact", description: "Defer 12 months (Spouse/Household)." },
            { id: 47, label: "Tattoos/Piercing", description: "Defer 12 months." },
            { id: 48, label: "Spouse Transfusion", description: "Defer 12 months." },
            { id: 49, label: "Jaundice", description: "Accept if gall stones/Rh/neonatal. Permanent if viral/unknown." },
            { id: 50, label: "Chronic Liver Disease", description: "Permanently defer." }
        ]
    },
    {
        category: "10. HIV / AIDS",
        items: [
            { id: 51, label: "HIV Risk Behaviour", description: "Permanently defer (Multiple partners, drug users)." },
            { id: 52, label: "HIV Positive / Partner", description: "Permanently defer." },
            { id: 53, label: "Symptoms of AIDS", description: "Permanently defer." }
        ]
    },
    {
        category: "11. Infections & STI",
        items: [
            { id: 54, label: "Syphilis", description: "Permanently defer." },
            { id: 55, label: "Gonorrhoea", description: "Permanently defer." },
            { id: 56, label: "Measles/Mumps/Chickenpox", description: "Defer 2 weeks after recovery." },
            { id: 57, label: "Malaria", description: "Defer 3 months after recovery." },
            { id: 58, label: "Typhoid", description: "Defer 12 months after recovery." },
            { id: 59, label: "Dengue/Chikungunya", description: "Defer 6 months (History). 4 weeks (Endemic visit)." },
            { id: 60, label: "Zika/West Nile", description: "Defer 4 months." },
            { id: 61, label: "Tuberculosis", description: "Defer 2 years after cure." },
            { id: 62, label: "Leishmaniasis", description: "Permanently defer." },
            { id: 63, label: "Leprosy", description: "Permanently defer." },
            { id: 64, label: "Conjunctivitis", description: "Defer for illness duration." },
            { id: 65, label: "Osteomyelitis", description: "Defer 2 years after cure." },
            { id: 66, label: "Kidney Infection", description: "Defer 6 months." },
            { id: 67, label: "Bladder Infection (UTI)", description: "Defer 2 weeks." },
            { id: 68, label: "Chronic Kidney Disease", description: "Permanently defer." }
        ]
    },
    {
        category: "12. Digestive & Systemic",
        items: [
            { id: 69, label: "Diarrhoea", description: "Defer 2 weeks." },
            { id: 70, label: "GI Endoscopy", description: "Defer 12 months." },
            { id: 71, label: "Acid Peptic Disease", description: "Accept mild/GERD. Permanent if ulcer/bleeding." },
            { id: 72, label: "Autoimmune Disorders", description: "Permanently defer." },
            { id: 73, label: "Polycythaemia Vera", description: "Permanently defer." },
            { id: 74, label: "Bleeding Disorders", description: "Permanently defer." },
            { id: 75, label: "Malignancy", description: "Permanently defer." },
            { id: 76, label: "Severe Allergies", description: "Permanently defer." },
            { id: 77, label: "Haemoglobinopathies", description: "Permanently defer." }
        ]
    },
    {
        category: "13. Vaccinations",
        items: [
            { id: 78, label: "Non-live Vaccines", description: "Defer 14 days (Flu, Tetanus, Hep A...)." },
            { id: 79, label: "Live Vaccines", description: "Defer 28 days (Measles, Polio, Yellow Fever)." },
            { id: 80, label: "Anti-serums", description: "Defer 28 days (Tetanus/Rabies serum)." },
            { id: 81, label: "Rabies/Hep B Immunoglobulin", description: "Defer 1 year." }
        ]
    },
    {
        category: "14. Medications",
        items: [
            { id: 82, label: "Oral Contraceptives/Vitamins", description: "Accept." },
            { id: 88, label: "Aspirin/NSAIDs", description: "Defer 3 days (for platelets)." },
            { id: 89, label: "Ketoconazole/Antihelminthic", description: "Defer 7 days." },
            { id: 90, label: "Antibiotics", description: "Defer 2 weeks." },
            { id: 91, label: "Ticlopidine/Clopidogrel", description: "Defer 2 weeks." },
            { id: 93, label: "Finasteride", description: "Defer 1 month." },
            { id: 94, label: "Radioactive Contrast", description: "Defer 8 weeks." },
            { id: 95, label: "Dutasteride", description: "Defer 6 months." },
            { id: 96, label: "Unknown Medication", description: "Defer till details available." },
            { id: 97, label: "Oral Anti-diabetic", description: "Accept (no change 4 weeks)." },
            { id: 98, label: "Insulin", description: "Permanently defer." },
            { id: 99, label: "Critical Meds", description: "Permanently defer (Anti-arrhythmic etc.)." }
        ]
    },
    {
        category: "15. Other Conditions",
        items: [
            { id: 100, label: "Organ/Stem Cell Transplant", description: "Permanently defer." },
            { id: 101, label: "Unexplained/Delayed Faints", description: "Permanently defer." }
        ]
    }
];
