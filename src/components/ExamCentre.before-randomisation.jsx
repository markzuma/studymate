import { useState, useEffect } from 'react'
import './ExamCentre.css'

const CAT_DURATION = 300

const questionBanks = {
  anatomy: [
    {
      question: 'Which chamber of the heart pumps oxygenated blood into the systemic circulation?',
      options: ['Right atrium', 'Right ventricle', 'Left atrium', 'Left ventricle'],
      answer: 3,
      explanation: 'The left ventricle pumps oxygenated blood through the aorta into the systemic circulation.'
    },
    {
      question: 'Which part of the nephron is primarily responsible for ultrafiltration?',
      options: ['Loop of Henle', 'Glomerulus', 'Collecting duct', 'Distal convoluted tubule'],
      answer: 1,
      explanation: 'Blood is filtered from the glomerular capillaries into Bowman’s capsule during ultrafiltration.'
    },
    {
      question: 'Which hormone lowers blood glucose by promoting cellular glucose uptake?',
      options: ['Glucagon', 'Cortisol', 'Insulin', 'Adrenaline'],
      answer: 2,
      explanation: 'Insulin, produced by pancreatic beta cells, promotes glucose uptake and storage, reducing blood glucose.'
    }
    ,
    {
      question: 'Which organelle is primarily responsible for ATP production during aerobic cellular respiration?',
      options: ['Ribosome', 'Mitochondrion', 'Golgi apparatus', 'Lysosome'],
      answer: 1,
      explanation: 'Mitochondria generate most cellular ATP through aerobic respiration, particularly oxidative phosphorylation.'
    },
    {
      question: 'Which cell structure regulates the movement of substances into and out of the cell?',
      options: ['Nucleus', 'Cell membrane', 'Nucleolus', 'Centrosome'],
      answer: 1,
      explanation: 'The plasma membrane is selectively permeable and controls the movement of substances between the intracellular and extracellular environments.'
    },
    {
      question: 'A patient sustains a fracture of the femur. Which type of bone tissue provides most of the bone’s strength and structural support?',
      options: ['Compact bone', 'Cartilage', 'Yellow bone marrow', 'Fibrous connective tissue'],
      answer: 0,
      explanation: 'Compact bone is dense and provides strength, protection and resistance to mechanical stress.'
    },
    {
      question: 'Which blood component is primarily responsible for transporting oxygen?',
      options: ['Platelets', 'Plasma proteins', 'Red blood cells', 'White blood cells'],
      answer: 2,
      explanation: 'Red blood cells contain haemoglobin, which binds and transports most oxygen in the blood.'
    },
    {
      question: 'Which blood vessel carries deoxygenated blood from the heart to the lungs?',
      options: ['Aorta', 'Pulmonary artery', 'Pulmonary vein', 'Coronary artery'],
      answer: 1,
      explanation: 'The pulmonary arteries carry deoxygenated blood from the right ventricle to the lungs for gas exchange.'
    },
    {
      question: 'Which valve prevents backflow of blood from the left ventricle into the left atrium?',
      options: ['Tricuspid valve', 'Pulmonary valve', 'Mitral valve', 'Aortic valve'],
      answer: 2,
      explanation: 'The mitral or bicuspid valve closes during ventricular contraction to prevent regurgitation into the left atrium.'
    },
    {
      question: 'A nurse measures a patient’s pulse and finds it irregular. Which structure normally initiates the electrical impulse for each heartbeat?',
      options: ['Atrioventricular node', 'Sinoatrial node', 'Bundle of His', 'Purkinje fibres'],
      answer: 1,
      explanation: 'The sinoatrial node is the heart’s natural pacemaker and normally initiates cardiac electrical impulses.'
    },
    {
      question: 'Which structure is the main site of gaseous exchange in the lungs?',
      options: ['Trachea', 'Main bronchi', 'Alveoli', 'Larynx'],
      answer: 2,
      explanation: 'Alveoli have thin walls and a rich capillary network, allowing oxygen and carbon dioxide to diffuse between air and blood.'
    },
    {
      question: 'During inspiration, what happens to the diaphragm?',
      options: ['It relaxes and moves upwards', 'It contracts and moves downwards', 'It remains stationary', 'It contracts and moves upwards'],
      answer: 1,
      explanation: 'Diaphragmatic contraction flattens and lowers the diaphragm, increasing thoracic volume and drawing air into the lungs.'
    },
    {
      question: 'Which organ produces bile, which assists in the digestion and absorption of fats?',
      options: ['Pancreas', 'Stomach', 'Liver', 'Gallbladder'],
      answer: 2,
      explanation: 'The liver produces bile. The gallbladder stores and concentrates it before releasing it into the small intestine.'
    },
    {
      question: 'Most nutrient absorption takes place in which part of the gastrointestinal tract?',
      options: ['Oesophagus', 'Stomach', 'Small intestine', 'Large intestine'],
      answer: 2,
      explanation: 'The small intestine has a large absorptive surface due to its folds, villi and microvilli, making it the principal site of nutrient absorption.'
    },
    {
      question: 'Which structure carries urine from the kidney to the urinary bladder?',
      options: ['Urethra', 'Ureter', 'Renal artery', 'Collecting duct'],
      answer: 1,
      explanation: 'The ureters transport urine from the renal pelvis of each kidney to the urinary bladder through peristaltic contractions.'
    },
    {
      question: 'A patient has reduced glomerular filtration. Which substance would normally be filtered from the blood at the glomerulus?',
      options: ['Large plasma proteins', 'Red blood cells', 'Water and small dissolved substances', 'Platelets'],
      answer: 2,
      explanation: 'The glomerular filtration barrier allows water and small solutes to enter Bowman’s space while normally retaining blood cells and most large proteins.'
    },
    {
      question: 'Which part of the brain is primarily responsible for balance, posture and coordination of voluntary movement?',
      options: ['Cerebrum', 'Cerebellum', 'Medulla oblongata', 'Hypothalamus'],
      answer: 1,
      explanation: 'The cerebellum coordinates movement, balance, posture and motor learning.'
    },
    {
      question: 'Which division of the autonomic nervous system is responsible for the fight-or-flight response?',
      options: ['Parasympathetic division', 'Sympathetic division', 'Somatic division', 'Enteric division only'],
      answer: 1,
      explanation: 'The sympathetic nervous system prepares the body for stress by increasing heart rate, dilating airways and redirecting blood flow.'
    },
    {
      question: 'Which hormone increases blood glucose by stimulating glycogen breakdown in the liver?',
      options: ['Insulin', 'Glucagon', 'Calcitonin', 'Aldosterone'],
      answer: 1,
      explanation: 'Glucagon is released by pancreatic alpha cells and stimulates hepatic glycogenolysis and gluconeogenesis, increasing blood glucose.'
    },
    {
      question: 'A patient has low blood calcium levels. Which hormone helps increase blood calcium concentration?',
      options: ['Insulin', 'Parathyroid hormone', 'Melatonin', 'Oxytocin'],
      answer: 1,
      explanation: 'Parathyroid hormone increases blood calcium through effects on bone, kidneys and indirectly the intestine through activation of vitamin D.'
    }

  ],

  medSurg: [
    {
      question: 'Which clinical finding is most characteristic of left-sided heart failure?',
      options: ['Pulmonary crackles', 'Ascites', 'Enlarged spleen', 'Peripheral oedema only'],
      answer: 0,
      explanation: 'Left ventricular failure causes pulmonary congestion, which may produce crackles, dyspnoea and orthopnoea.'
    },
    {
      question: 'A patient with diabetes is sweating, trembling and confused. What should the nurse suspect first?',
      options: ['Hypercalcaemia', 'Hypoglycaemia', 'Hypertension', 'Hypernatraemia'],
      answer: 1,
      explanation: 'Sweating, tremors and confusion are common manifestations of hypoglycaemia. Check blood glucose promptly and treat according to protocol.'
    },
    {
      question: 'Which precaution is most important when caring for a patient with active pulmonary tuberculosis?',
      options: ['Contact precautions only', 'Droplet precautions only', 'Airborne precautions', 'Protective isolation'],
      answer: 2,
      explanation: 'Pulmonary tuberculosis spreads through airborne droplet nuclei. Appropriate airborne precautions and respiratory protection are required.'
    }
    ,
    {
      question: 'A patient with asthma develops severe breathlessness and wheezing. Which medication is commonly used for rapid relief of acute bronchospasm?',
      options: ['Salbutamol', 'Beclometasone', 'Montelukast', 'Prednisolone tablets as the sole immediate reliever'],
      answer: 0,
      explanation: 'Salbutamol is a short-acting beta-2 agonist that relaxes bronchial smooth muscle and provides rapid bronchodilation.'
    },
    {
      question: 'A patient with pneumonia has a temperature of 39°C, productive cough and oxygen saturation of 88%. What is the nurse’s priority?',
      options: ['Encourage the patient to walk', 'Assess airway and breathing and provide prescribed oxygen', 'Withhold fluids', 'Give cough suppressant before assessment'],
      answer: 1,
      explanation: 'Hypoxaemia is an immediate concern. Assess airway and breathing, position the patient appropriately and administer oxygen as prescribed or according to emergency protocol.'
    },
    {
      question: 'Which position is most helpful for a conscious patient experiencing severe difficulty breathing?',
      options: ['Flat supine position', 'High Fowler’s position', 'Trendelenburg position', 'Prone position in every case'],
      answer: 1,
      explanation: 'High Fowler’s position promotes lung expansion and can reduce the work of breathing.'
    },
    {
      question: 'A patient with left-sided heart failure is most likely to develop which manifestation?',
      options: ['Pulmonary oedema', 'Ascites as the only finding', 'Splenomegaly', 'Isolated jaundice'],
      answer: 0,
      explanation: 'Left ventricular failure causes blood to back up into the pulmonary circulation, leading to pulmonary congestion and potentially pulmonary oedema.'
    },
    {
      question: 'A patient reports crushing central chest pain radiating to the left arm, with sweating and nausea. What should the nurse suspect?',
      options: ['Acute myocardial infarction', 'Peptic ulcer disease', 'Simple muscle strain', 'Acute appendicitis'],
      answer: 0,
      explanation: 'Crushing chest pain with radiation, diaphoresis and nausea is concerning for acute coronary syndrome. Obtain urgent assessment, ECG and follow emergency protocol.'
    },
    {
      question: 'Which laboratory marker is particularly useful in diagnosing myocardial injury?',
      options: ['Serum amylase', 'Cardiac troponin', 'Serum bilirubin', 'Haemoglobin A1c'],
      answer: 1,
      explanation: 'Cardiac troponins are released when myocardial cells are injured and are central biomarkers in evaluating suspected myocardial infarction.'
    },
    {
      question: 'A patient taking furosemide reports muscle weakness. Which electrolyte disturbance should the nurse suspect?',
      options: ['Hyperkalaemia', 'Hypokalaemia', 'Hypercalcaemia', 'Hypernatraemia'],
      answer: 1,
      explanation: 'Furosemide is a loop diuretic that increases potassium excretion. Hypokalaemia can cause muscle weakness and cardiac dysrhythmias.'
    },
    {
      question: 'A patient with hypertension asks why regular blood pressure monitoring is important. Which response is most appropriate?',
      options: ['Hypertension always causes immediate symptoms', 'Monitoring helps assess control and detect persistently elevated blood pressure', 'Blood pressure only matters when a headache occurs', 'Once medication begins, monitoring is unnecessary'],
      answer: 1,
      explanation: 'Hypertension is often asymptomatic. Regular measurements help assess treatment effectiveness and identify uncontrolled blood pressure.'
    },
    {
      question: 'A patient with peptic ulcer disease reports sudden severe abdominal pain and a rigid abdomen. Which complication should the nurse suspect?',
      options: ['Constipation', 'Perforation of the ulcer', 'Mild indigestion', 'Haemorrhoids'],
      answer: 1,
      explanation: 'Sudden severe pain with abdominal rigidity may indicate perforation and peritonitis. This is a surgical emergency requiring urgent medical attention.'
    },
    {
      question: 'Which nursing intervention is most appropriate for a patient experiencing repeated vomiting and dehydration?',
      options: ['Monitor fluid balance and assess hydration status', 'Restrict all assessment of urine output', 'Encourage large meals immediately', 'Administer laxatives'],
      answer: 0,
      explanation: 'Monitoring intake, output, vital signs, mucous membranes and relevant laboratory results helps identify and manage fluid volume deficit.'
    },
    {
      question: 'A patient with chronic liver disease develops abdominal distension due to fluid accumulation. What is this condition called?',
      options: ['Ascites', 'Dysphagia', 'Haematuria', 'Atelectasis'],
      answer: 0,
      explanation: 'Ascites is accumulation of fluid in the peritoneal cavity and is a common complication of advanced liver disease and portal hypertension.'
    },
    {
      question: 'A patient with acute kidney injury has markedly reduced urine output. Which measurement is particularly important for ongoing assessment?',
      options: ['Hourly urine output', 'Hair growth', 'Visual acuity', 'Abdominal circumference only'],
      answer: 0,
      explanation: 'Accurate urine output monitoring helps assess renal perfusion and kidney function. Trends should be interpreted alongside fluid balance and laboratory findings.'
    },
    {
      question: 'Which electrolyte abnormality is particularly dangerous in a patient with severe renal failure because of its effect on cardiac conduction?',
      options: ['Hypochloraemia', 'Hyperkalaemia', 'Mild hypophosphataemia', 'Low serum urate'],
      answer: 1,
      explanation: 'Reduced renal potassium excretion can cause hyperkalaemia, which may produce life-threatening cardiac conduction abnormalities and dysrhythmias.'
    },
    {
      question: 'A patient with suspected stroke suddenly develops facial drooping and weakness of one arm. What is the nurse’s priority?',
      options: ['Allow the patient to sleep', 'Activate the emergency stroke response and establish the time symptoms began', 'Give food and water', 'Delay assessment until symptoms resolve'],
      answer: 1,
      explanation: 'Stroke is time-critical. Activate the emergency pathway, establish last-known-well time, assess vital signs and blood glucose, and arrange urgent evaluation.'
    },
    {
      question: 'A patient with a seizure is experiencing tonic-clonic movements. Which nursing action is appropriate?',
      options: ['Force an object into the mouth', 'Restrain the limbs firmly', 'Protect the patient from injury and maintain a safe environment', 'Give oral medication during the seizure'],
      answer: 2,
      explanation: 'Protect the patient from injury, cushion the head, clear nearby hazards, time the seizure and position the patient on the side when possible. Never restrain or place objects in the mouth.'
    },
    {
      question: 'A patient with diabetes is conscious, sweating and trembling. Blood glucose is 2.8 mmol/L. What is the most appropriate immediate action?',
      options: ['Give a rapid-acting oral glucose source', 'Administer additional insulin', 'Encourage strenuous exercise', 'Withhold all carbohydrate'],
      answer: 0,
      explanation: 'A conscious patient with hypoglycaemia who can swallow safely should receive fast-acting carbohydrate according to the hypoglycaemia protocol, followed by repeat glucose assessment.'
    },
    {
      question: 'A patient with diabetic ketoacidosis is admitted with dehydration and hyperglycaemia. Which intervention is generally initiated promptly alongside close monitoring?',
      options: ['Intravenous isotonic fluid replacement', 'Immediate fluid restriction', 'High-dose oral glucose', 'Routine potassium restriction in every patient'],
      answer: 0,
      explanation: 'Fluid replacement is a key early component of DKA management. Insulin and potassium replacement are guided by clinical assessment, laboratory results and established protocols.'
    }

  ],

  pharmacology: [
    {
      question: 'Which route of drug administration provides the most rapid systemic effect in an emergency?',
      options: ['Oral', 'Intravenous', 'Topical', 'Rectal'],
      answer: 1,
      explanation: 'Intravenous administration delivers the drug directly into the bloodstream, producing a rapid systemic effect.'
    },
    {
      question: 'Which adverse effect is commonly associated with opioid analgesics?',
      options: ['Respiratory depression', 'Hyperactivity', 'Increased bowel motility', 'Excessive urination'],
      answer: 0,
      explanation: 'Opioids can depress the respiratory centre. Nurses must monitor respiratory rate, consciousness and oxygenation.'
    },
    {
      question: 'What is the primary purpose of administering an antibiotic at prescribed intervals?',
      options: ['Prevent all side effects', 'Maintain effective drug concentrations', 'Increase drug colour', 'Eliminate the need for monitoring'],
      answer: 1,
      explanation: 'Correct dosing intervals help maintain therapeutic drug concentrations and improve treatment effectiveness.'
    },

    {
      question: "A patient with severe pain is prescribed morphine. Which mechanism best explains its analgesic action?",
      options: [
        "Inhibition of prostaglandin synthesis",
        "Activation of opioid receptors in the central nervous system",
        "Blockade of sodium channels in peripheral nerves",
        "Inhibition of serotonin reuptake"
      ],
      answer: 1,
      explanation: "Morphine is an opioid agonist. It activates mainly mu-opioid receptors in the CNS, reducing pain transmission and perception. Nurses should monitor respiratory rate, level of consciousness and blood pressure."
    },
    {
      question: "A nurse administers furosemide to a patient with heart failure. Which electrolyte imbalance is the patient most at risk of developing?",
      options: [
        "Hyperkalaemia",
        "Hypokalaemia",
        "Hypercalcaemia",
        "Hypermagnesaemia"
      ],
      answer: 1,
      explanation: "Furosemide is a loop diuretic that increases potassium excretion. Hypokalaemia can cause muscle weakness and potentially life-threatening cardiac dysrhythmias. Monitor electrolytes and renal function."
    },
    {
      question: "Which instruction is most important when administering insulin to a patient with diabetes mellitus?",
      options: [
        "Administer all insulin preparations intravenously",
        "Ensure the patient understands the relationship between insulin and meals",
        "Withhold insulin whenever blood glucose is normal",
        "Massage the injection site vigorously"
      ],
      answer: 1,
      explanation: "Insulin administration must be coordinated with food intake, especially with rapid-acting and short-acting preparations, to reduce hypoglycaemia risk. Route depends on the insulin preparation and clinical indication."
    },
    {
      question: "A patient taking warfarin reports bleeding gums and frequent bruising. Which investigation is most relevant?",
      options: [
        "Serum creatinine",
        "International Normalised Ratio (INR)",
        "Serum sodium",
        "Haemoglobin A1c"
      ],
      answer: 1,
      explanation: "INR monitors the anticoagulant effect of warfarin. A raised INR increases bleeding risk. Assess for bleeding and report abnormal results for appropriate dose review."
    },
    {
      question: "Which adverse effect should a nurse monitor for in a patient taking gentamicin?",
      options: [
        "Ototoxicity and nephrotoxicity",
        "Severe hypoglycaemia",
        "Gingival hyperplasia",
        "Peptic ulcer disease"
      ],
      answer: 0,
      explanation: "Gentamicin is an aminoglycoside antibiotic associated with kidney and inner-ear toxicity. Monitor renal function, urine output, hearing symptoms and drug levels where prescribed."
    },
    {
      question: "A patient develops a persistent dry cough after starting enalapril. Which pharmacological effect is responsible?",
      options: [
        "Increased histamine breakdown",
        "Accumulation of bradykinin",
        "Increased aldosterone secretion",
        "Blockade of beta-2 receptors"
      ],
      answer: 1,
      explanation: "ACE inhibitors reduce bradykinin breakdown. Its accumulation can cause a persistent dry cough. Angioedema is a serious adverse effect requiring urgent assessment."
    },
    {
      question: "Which instruction is appropriate for a patient prescribed oral iron for iron-deficiency anaemia?",
      options: [
        "Take it with tea to improve absorption",
        "Expect stools to become darker",
        "Stop treatment once energy improves",
        "Take it with antacids"
      ],
      answer: 1,
      explanation: "Oral iron commonly causes dark stools and gastrointestinal discomfort. Vitamin C can improve absorption, while tea, calcium and antacids may reduce it. Treatment should continue as prescribed."
    },
    {
      question: "A patient receiving salbutamol for acute bronchospasm reports tremors and palpitations. These effects are mainly due to:",
      options: [
        "Beta-2 adrenergic receptor stimulation",
        "Muscarinic receptor blockade",
        "Histamine receptor blockade",
        "Dopamine receptor inhibition"
      ],
      answer: 0,
      explanation: "Salbutamol is a short-acting beta-2 agonist that relaxes bronchial smooth muscle. Tremor and tachycardia or palpitations may occur. Assess response and monitor the patient's pulse."
    },
    {
      question: "Which statement best describes the action of omeprazole?",
      options: [
        "It neutralises acid already present in the stomach",
        "It blocks histamine receptors in the stomach",
        "It inhibits the gastric proton pump",
        "It increases gastric acid secretion"
      ],
      answer: 2,
      explanation: "Omeprazole is a proton pump inhibitor. It inhibits the hydrogen-potassium ATPase pump in gastric parietal cells, reducing gastric acid secretion."
    },
    {
      question: "A patient taking digoxin complains of nausea, loss of appetite and yellow-green visual disturbances. What should the nurse suspect?",
      options: [
        "Digoxin toxicity",
        "Therapeutic response",
        "Iron deficiency",
        "Hypoglycaemia"
      ],
      answer: 0,
      explanation: "Nausea, anorexia and visual disturbances are recognised features of digoxin toxicity. Check the pulse, review renal function and electrolytes, and withhold the next dose pending urgent clinical review according to protocol."
    },
    {
      question: "Which assessment is essential before administering a beta-blocker such as atenolol?",
      options: [
        "Pupil size",
        "Heart rate and blood pressure",
        "Bowel sounds",
        "Visual acuity"
      ],
      answer: 1,
      explanation: "Beta-blockers reduce heart rate and blood pressure. Assess both before administration and follow prescribed withholding parameters. Use caution in patients with bradycardia or certain forms of heart block."
    },
    {
      question: "A patient taking metformin is scheduled for an investigation involving iodinated contrast. What is the nurse's priority?",
      options: [
        "Double the metformin dose",
        "Check the contrast-related medication instructions and renal function",
        "Give the medication with alcohol",
        "Ignore the investigation because metformin has no precautions"
      ],
      answer: 1,
      explanation: "Iodinated contrast may affect renal function. Metformin management depends on kidney function, contrast route and local guidelines. Follow the facility protocol and prescriber's instructions to reduce the risk of metformin-associated lactic acidosis."
    },
    {
      question: "Which finding in a patient taking lithium requires urgent assessment?",
      options: [
        "Mild thirst",
        "Coarse tremor, vomiting and unsteady gait",
        "Slight increase in urination",
        "Mild transient nausea at initiation"
      ],
      answer: 1,
      explanation: "Coarse tremor, gastrointestinal symptoms and ataxia may indicate lithium toxicity. Withhold further doses pending urgent assessment, check serum lithium and renal function, and assess hydration."
    },
    {
      question: "A patient taking phenytoin develops swollen, bleeding gums. Which adverse effect is most likely?",
      options: [
        "Gingival hyperplasia",
        "Ototoxicity",
        "Pulmonary fibrosis",
        "Nephrotic syndrome"
      ],
      answer: 0,
      explanation: "Phenytoin can cause gingival hyperplasia. Encourage good oral hygiene and regular dental care. Monitor drug levels when indicated because phenytoin has a narrow therapeutic range."
    },
    {
      question: "A patient receiving haloperidol develops high fever, severe muscle rigidity and altered consciousness. What complication should the nurse suspect?",
      options: [
        "Serotonin deficiency",
        "Neuroleptic malignant syndrome",
        "Simple extrapyramidal tremor",
        "Mild allergic reaction"
      ],
      answer: 1,
      explanation: "Neuroleptic malignant syndrome is a life-threatening reaction to dopamine-blocking medicines. Stop the suspected drug, initiate emergency assessment and supportive management, and monitor temperature, renal function and creatine kinase."
    },
    {
      question: "Which instruction is important for a patient prescribed oral prednisolone for several weeks?",
      options: [
        "Stop the medicine immediately when symptoms improve",
        "Take it exactly as prescribed and do not stop suddenly without advice",
        "Avoid reporting signs of infection",
        "Take extra doses when feeling tired"
      ],
      answer: 1,
      explanation: "Prolonged corticosteroid use can suppress the hypothalamic-pituitary-adrenal axis. Abrupt withdrawal may precipitate adrenal insufficiency. Long-term use also increases infection risk and blood glucose."
    },
    {
      question: "A patient taking an antibiotic develops difficulty breathing and swelling of the lips shortly after administration. What is the priority nursing action?",
      options: [
        "Document the reaction and observe for one hour",
        "Recognise possible anaphylaxis and initiate emergency management",
        "Give the next antibiotic dose",
        "Encourage oral fluids"
      ],
      answer: 1,
      explanation: "Airway swelling and breathing difficulty suggest anaphylaxis. Stop the suspected medicine, call for emergency assistance, assess airway and circulation, and administer intramuscular adrenaline according to emergency protocol."
    }

  ],

  midwifery: [
    {
      question: 'Which hormone is primarily responsible for maintaining the uterine lining during early pregnancy?',
      options: ['Oxytocin', 'Progesterone', 'Prolactin', 'Follicle-stimulating hormone'],
      answer: 1,
      explanation: 'Progesterone maintains the endometrium and supports the uterine environment required for pregnancy.'
    },
    {
      question: 'What is the normal duration of a term pregnancy calculated from the first day of the last menstrual period?',
      options: ['28 weeks', '32 weeks', '40 weeks', '44 weeks'],
      answer: 2,
      explanation: 'A normal term pregnancy is approximately 40 weeks or 280 days from the first day of the last menstrual period.'
    },
    {
      question: 'Which stage of labour involves delivery of the placenta?',
      options: ['First stage', 'Second stage', 'Third stage', 'Fourth stage'],
      answer: 2,
      explanation: 'The third stage of labour begins after birth of the baby and ends with delivery of the placenta and membranes.'
    },

    {
      question: "Which hormone is primarily responsible for maintaining the endometrium during early pregnancy?",
      options: ["Oxytocin", "Progesterone", "Prolactin", "Follicle-stimulating hormone"],
      answer: 1,
      explanation: "Progesterone maintains the endometrium, supports implantation and helps maintain pregnancy. In early pregnancy, it is initially produced by the corpus luteum and later mainly by the placenta."
    },
    {
      question: "What is the normal duration of pregnancy calculated from the first day of the last normal menstrual period?",
      options: ["32 weeks", "36 weeks", "40 weeks", "44 weeks"],
      answer: 2,
      explanation: "A normal pregnancy lasts approximately 40 weeks or 280 days from the first day of the last menstrual period. This is the basis of Naegele's rule for estimating the expected date of delivery."
    },
    {
      question: "A pregnant woman attends her first antenatal clinic visit. Which assessment is particularly important for identifying pre-existing health risks?",
      options: ["Obstetric and medical history", "Newborn reflex assessment", "Placental examination", "Assessment of cervical dilation"],
      answer: 0,
      explanation: "A comprehensive history identifies previous pregnancies, medical conditions, medications, allergies, risk factors and social circumstances. It guides individualised antenatal care."
    },
    {
      question: "Which finding is most suggestive of pre-eclampsia in a pregnant woman after 20 weeks of gestation?",
      options: ["Mild nausea alone", "New-onset hypertension with proteinuria or other evidence of organ dysfunction", "Increased appetite", "Physiological urinary frequency"],
      answer: 1,
      explanation: "Pre-eclampsia is a pregnancy-specific hypertensive disorder characterised by new-onset hypertension after 20 weeks, with proteinuria and/or evidence of maternal organ dysfunction. Severe features require urgent assessment."
    },
    {
      question: "Which intervention is most appropriate during an antenatal visit to prevent iron-deficiency anaemia?",
      options: ["Advise avoidance of iron-rich foods", "Provide prescribed iron and folic acid supplementation and nutrition education", "Recommend stopping all physical activity", "Restrict fluid intake"],
      answer: 1,
      explanation: "Iron and folic acid supplementation, alongside dietary advice and appropriate screening, helps prevent maternal anaemia and supports fetal development."
    },
    {
      question: "What is the main purpose of monitoring fetal heart rate during labour?",
      options: ["Determine maternal blood group", "Assess fetal wellbeing", "Measure cervical effacement", "Determine placental weight"],
      answer: 1,
      explanation: "Fetal heart rate monitoring helps assess fetal wellbeing and identify possible fetal compromise. Findings must be interpreted alongside contractions, maternal condition and the clinical situation."
    },
    {
      question: "Which stage of labour begins with the onset of true labour and ends with full cervical dilatation?",
      options: ["First stage", "Second stage", "Third stage", "Fourth stage"],
      answer: 0,
      explanation: "The first stage of labour extends from the onset of true labour until full cervical dilatation, usually 10 cm. It includes cervical effacement and dilatation."
    },
    {
      question: "A woman in labour has reached full cervical dilatation. Which stage of labour is beginning?",
      options: ["First stage", "Second stage", "Third stage", "Fourth stage"],
      answer: 1,
      explanation: "The second stage begins at full cervical dilatation and ends with the birth of the baby. It involves descent and expulsion of the fetus."
    },
    {
      question: "The third stage of labour is the period between:",
      options: ["Onset of contractions and full dilatation", "Full dilatation and birth of the baby", "Birth of the baby and delivery of the placenta", "Delivery of the placenta and discharge home"],
      answer: 2,
      explanation: "The third stage begins after the birth of the baby and ends with delivery of the placenta and membranes. Active management helps reduce the risk of postpartum haemorrhage."
    },
    {
      question: "Which uterotonic medicine is commonly administered during active management of the third stage of labour to prevent postpartum haemorrhage?",
      options: ["Oxytocin", "Salbutamol", "Diazepam", "Furosemide"],
      answer: 0,
      explanation: "Oxytocin promotes uterine contraction and is the recommended first-line uterotonic for prevention of postpartum haemorrhage where available and appropriate. Follow national and facility protocols."
    },
    {
      question: "Immediately after birth, a newborn is breathing normally and has good muscle tone. What is an appropriate immediate care measure?",
      options: ["Separate the newborn routinely from the mother", "Dry the newborn and promote skin-to-skin contact", "Delay all assessment for several hours", "Give oral water"],
      answer: 1,
      explanation: "Drying, warmth and skin-to-skin contact help prevent hypothermia and support early breastfeeding. The newborn should be assessed while maintaining warmth and following essential newborn care guidance."
    },
    {
      question: "Which sign is most characteristic of postpartum haemorrhage?",
      options: ["Heavy vaginal bleeding after birth", "Mild afterpains during breastfeeding", "Normal lochia gradually decreasing", "Temporary breast fullness"],
      answer: 0,
      explanation: "Postpartum haemorrhage involves excessive bleeding after childbirth and can rapidly cause hypovolaemic shock. Prompt recognition, calling for help, uterine assessment and emergency management are essential."
    },
    {
      question: "A postpartum woman has a soft, boggy uterus and heavy vaginal bleeding. What is the most likely cause?",
      options: ["Uterine atony", "Urinary tract infection", "Mastitis", "Normal uterine involution"],
      answer: 0,
      explanation: "Uterine atony is failure of the uterus to contract effectively after birth. It is a major cause of postpartum haemorrhage. Initiate the postpartum haemorrhage response and manage according to protocol."
    },
    {
      question: "Which description best defines exclusive breastfeeding for the first six months of life?",
      options: ["Breast milk together with water", "Breast milk only, with no other foods or liquids except prescribed medicines, vitamins or oral rehydration solution when indicated", "Breast milk and porridge", "Formula during the day and breast milk at night"],
      answer: 1,
      explanation: "Exclusive breastfeeding means providing breast milk only for the first six months, with the recognised exceptions of medicines, vitamin or mineral drops and oral rehydration solution when needed."
    },
    {
      question: "Which hormone stimulates milk production in the mammary glands?",
      options: ["Oxytocin", "Prolactin", "Oestrogen", "Progesterone"],
      answer: 1,
      explanation: "Prolactin stimulates milk synthesis. Oxytocin causes contraction of myoepithelial cells, producing the milk-ejection or let-down reflex."
    },
    {
      question: "A pregnant woman reports severe headache, blurred vision and epigastric pain. What should the midwife do?",
      options: ["Reassure her that these are normal symptoms", "Arrange urgent assessment for possible severe pre-eclampsia", "Advise her to return in one month", "Recommend increased physical exercise"],
      answer: 1,
      explanation: "Severe headache, visual disturbances and epigastric pain are danger signs that may indicate severe pre-eclampsia. Urgent maternal assessment and appropriate referral or management are required."
    },
    {
      question: "Which practice helps prevent neonatal hypothermia immediately after delivery?",
      options: ["Bathing the newborn immediately", "Leaving the newborn uncovered", "Drying thoroughly, skin-to-skin contact and keeping the newborn warm", "Placing the newborn near an open window"],
      answer: 2,
      explanation: "Newborns lose heat rapidly. Thorough drying, immediate skin-to-skin contact, a warm environment and appropriate covering help maintain normal body temperature."
    }

  ],

  community: [
    {
      question: 'What is the main purpose of primary health care?',
      options: ['Provide services only in referral hospitals', 'Make essential health care accessible to communities', 'Focus exclusively on surgery', 'Replace all preventive services'],
      answer: 1,
      explanation: 'Primary health care aims to provide accessible, equitable and comprehensive essential health services close to where people live.'
    },
    {
      question: 'Which measure is commonly used to assess the occurrence of new cases of a disease?',
      options: ['Prevalence', 'Incidence', 'Case fatality rate', 'Crude birth rate'],
      answer: 1,
      explanation: 'Incidence measures new cases occurring in a population at risk over a specified period.'
    },
    {
      question: 'Which intervention is an example of primary prevention?',
      options: ['Rehabilitation after stroke', 'Screening for cervical cancer', 'Immunisation', 'Treatment of established pneumonia'],
      answer: 2,
      explanation: 'Immunisation prevents disease before it occurs and is therefore an example of primary prevention.'
    },

    {
      question: "What is the primary goal of primary health care?",
      options: [
        "To provide specialised hospital treatment only",
        "To make essential health care accessible to individuals and communities",
        "To replace all community health workers",
        "To focus exclusively on communicable diseases"
      ],
      answer: 1,
      explanation: "Primary health care aims to ensure accessible, affordable and acceptable essential health services, with community participation and an emphasis on equity, prevention and health promotion."
    },
    {
      question: "Which principle of primary health care emphasises the involvement of individuals and communities in planning and implementing health services?",
      options: [
        "Community participation",
        "Centralisation",
        "Hospital specialisation",
        "Commercialisation"
      ],
      answer: 0,
      explanation: "Community participation empowers people to identify their health needs, make decisions and take part in implementing and evaluating health activities."
    },
    {
      question: "A community health nurse conducts a household survey to identify common health problems. What is this activity primarily contributing to?",
      options: [
        "Community diagnosis",
        "Hospital discharge",
        "Individual drug prescription",
        "Surgical treatment"
      ],
      answer: 0,
      explanation: "Community diagnosis is the systematic identification and analysis of a community's health problems, needs, resources and determinants to guide interventions."
    },
    {
      question: "Which measure is an example of primary prevention?",
      options: [
        "Rehabilitation after a stroke",
        "Physiotherapy after a fracture",
        "Immunisation against measles",
        "Screening for cervical cancer"
      ],
      answer: 2,
      explanation: "Primary prevention aims to prevent disease before it occurs. Immunisation protects individuals against specific infections. Screening is generally secondary prevention, while rehabilitation is tertiary prevention."
    },
    {
      question: "A health worker screens adults for hypertension to identify disease early. This is an example of:",
      options: [
        "Primary prevention",
        "Secondary prevention",
        "Tertiary prevention",
        "Palliative care"
      ],
      answer: 1,
      explanation: "Secondary prevention involves early detection and prompt treatment of disease to prevent progression and complications. Blood pressure screening is a common example."
    },
    {
      question: "Which epidemiological measure describes the number of new cases of a disease occurring in a population during a specified period?",
      options: [
        "Prevalence",
        "Incidence",
        "Mortality",
        "Case fatality"
      ],
      answer: 1,
      explanation: "Incidence measures new cases arising in a population at risk during a defined period. It helps assess the risk of developing a disease."
    },
    {
      question: "A nurse records all existing cases of diabetes in a community at a particular point in time. Which measure is being determined?",
      options: [
        "Incidence",
        "Prevalence",
        "Birth rate",
        "Case fatality rate"
      ],
      answer: 1,
      explanation: "Prevalence measures all existing cases of a condition in a population at a specified time or over a defined period. It reflects the burden of disease."
    },
    {
      question: "Which action is most appropriate when a community health nurse suspects an outbreak of a notifiable infectious disease?",
      options: [
        "Wait until many more people become ill",
        "Promptly report through the appropriate public health surveillance system",
        "Keep the information within the household",
        "Discontinue all community surveillance activities"
      ],
      answer: 1,
      explanation: "Prompt notification supports outbreak investigation, early control measures and protection of the community. Follow Kenya's disease surveillance and reporting procedures."
    },
    {
      question: "Which method is most appropriate for collecting detailed information about household sanitation during a community assessment?",
      options: [
        "Direct observation using a structured checklist",
        "Guessing from the appearance of the village",
        "Reviewing unrelated hospital records",
        "Interviewing only one person from another community"
      ],
      answer: 0,
      explanation: "Direct observation using a structured checklist provides first-hand information about sanitation conditions, water storage, waste disposal and environmental risks."
    },
    {
      question: "Which intervention is most effective in reducing the transmission of many faecal-oral infections?",
      options: [
        "Open defecation",
        "Handwashing with soap at critical times",
        "Sharing drinking cups",
        "Disposing of waste in rivers"
      ],
      answer: 1,
      explanation: "Handwashing with soap after using the toilet and before preparing or eating food interrupts faecal-oral transmission and reduces diarrhoeal disease."
    },
    {
      question: "A mother brings her child for routine immunisation. What is the nurse's most important initial responsibility?",
      options: [
        "Administer every vaccine regardless of the child's age",
        "Check the child's immunisation history, age and current health status",
        "Ignore previous vaccination records",
        "Give antibiotics before vaccination"
      ],
      answer: 1,
      explanation: "The nurse should review the child's vaccination record, age, eligibility, relevant contraindications and current condition, then administer vaccines according to the current national schedule."
    },
    {
      question: "What is the main purpose of maintaining the cold chain during vaccine storage and transportation?",
      options: [
        "To improve the colour of vaccines",
        "To preserve vaccine potency",
        "To increase vaccine volume",
        "To prevent all injection-site reactions"
      ],
      answer: 1,
      explanation: "The cold chain maintains vaccines within their recommended temperature ranges from manufacture to administration, preserving their potency and effectiveness."
    },
    {
      question: "Which activity best demonstrates health promotion?",
      options: [
        "Educating a community about balanced nutrition and physical activity",
        "Treating only advanced disease",
        "Providing surgery without preventive education",
        "Restricting community access to health information"
      ],
      answer: 0,
      explanation: "Health promotion enables individuals and communities to increase control over the factors affecting their health through education, supportive environments and community action."
    },
    {
      question: "A community health nurse identifies a high number of children with malnutrition. What should be the next appropriate step in planning an intervention?",
      options: [
        "Implement an intervention without further assessment",
        "Analyse contributing factors and prioritise the identified problem with the community",
        "Ignore the problem until hospital admission occurs",
        "Blame caregivers without assessing available resources"
      ],
      answer: 1,
      explanation: "Community health planning should involve analysing causes, available resources and community priorities before selecting appropriate interventions."
    },
    {
      question: "Which indicator measures the number of deaths of infants below one year of age per 1,000 live births in a given period?",
      options: [
        "Maternal mortality ratio",
        "Infant mortality rate",
        "Crude birth rate",
        "Neonatal survival rate"
      ],
      answer: 1,
      explanation: "The infant mortality rate is the number of deaths among children under one year per 1,000 live births in a specified period. It is an important indicator of population health."
    },
    {
      question: "A community health nurse visits a household where a patient with tuberculosis lives. Which intervention is particularly important?",
      options: [
        "Advise the patient to stop treatment when symptoms disappear",
        "Promote adherence to treatment, assess contacts and reinforce infection prevention",
        "Recommend sharing medication with household members",
        "Discourage all household members from seeking screening"
      ],
      answer: 1,
      explanation: "Community TB control includes treatment adherence support, contact investigation, screening where indicated, health education and infection prevention measures."
    },
    {
      question: "Which statement best describes intersectoral collaboration in primary health care?",
      options: [
        "Health services working alone without other departments",
        "Different sectors such as health, education, agriculture and water working together to improve health",
        "Hospitals competing with community units",
        "Restricting health planning to medical professionals"
      ],
      answer: 1,
      explanation: "Intersectoral collaboration recognises that health is influenced by factors beyond health facilities. Cooperation across sectors helps address determinants such as education, food security, housing and sanitation."
    }

  ],

  mentalHealth: [
    {
      question: 'Which communication technique encourages a patient to express their feelings?',
      options: ['Giving false reassurance', 'Using open-ended questions', 'Changing the subject', 'Judging the patient'],
      answer: 1,
      explanation: 'Open-ended questions encourage patients to explain their experiences and feelings in their own words.'
    },
    {
      question: 'Which symptom is commonly associated with a depressive disorder?',
      options: ['Persistent low mood', 'Increased energy in every case', 'Reduced need for sleep with elevated mood', 'Hallucinations in every patient'],
      answer: 0,
      explanation: 'Persistent low mood and loss of interest or pleasure are core features of depressive disorders.'
    },
    {
      question: 'A patient experiencing a panic attack is extremely anxious. What is the most appropriate initial nursing action?',
      options: ['Leave the patient alone', 'Speak calmly and remain with the patient', 'Argue about the patient’s fears', 'Provide complex instructions immediately'],
      answer: 1,
      explanation: 'A calm presence, reassurance without dismissing feelings, and simple communication help reduce distress and promote safety.'
    },

    {
      question: "Which principle is central to therapeutic communication in psychiatric nursing?",
      options: ["Giving personal opinions", "Active listening and empathy", "Changing the subject when emotions arise", "Making promises to the patient"],
      answer: 1,
      explanation: "Active listening and empathy help establish trust, encourage expression of feelings and support a therapeutic nurse-patient relationship."
    },
    {
      question: "A patient says, 'I feel that nobody understands what I am going through.' Which response is most therapeutic?",
      options: ["You should not feel that way.", "Other people have worse problems.", "Tell me more about what you are experiencing.", "You will feel better tomorrow."],
      answer: 2,
      explanation: "An open-ended response encourages the patient to express feelings and provides an opportunity for further assessment without judgement."
    },
    {
      question: "Which symptom is classified as a positive symptom of schizophrenia?",
      options: ["Auditory hallucinations", "Reduced emotional expression", "Social withdrawal", "Avolition"],
      answer: 0,
      explanation: "Positive symptoms are experiences or behaviours added to normal functioning, including hallucinations, delusions and disorganised speech. Negative symptoms include reduced emotional expression, avolition and social withdrawal."
    },
    {
      question: "A patient with schizophrenia says, 'The television presenter is sending me secret messages.' This is an example of:",
      options: ["A hallucination", "A delusion of reference", "Flight of ideas", "Echolalia"],
      answer: 1,
      explanation: "A delusion of reference occurs when a person believes that ordinary events, objects or communications have a special personal meaning directed at them."
    },
    {
      question: "A patient reports hearing voices telling them to harm themselves. What is the nurse's priority?",
      options: ["Ignore the voices because they are not real", "Assess immediate risk, including the content of the commands and the patient's intention to act", "Tell the patient to stop imagining things", "Leave the patient alone to rest"],
      answer: 1,
      explanation: "Command hallucinations may create an immediate safety risk. Assess the commands, intent, ability to resist, access to means and suicidal or violent thoughts. Maintain safety and escalate urgently."
    },
    {
      question: "Which finding is most characteristic of a major depressive episode?",
      options: ["Persistent elevated mood and increased energy", "Persistent depressed mood or loss of interest with associated symptoms", "Brief fear in response to danger", "Increased activity without sleep disturbance"],
      answer: 1,
      explanation: "Major depression involves persistent depressed mood and/or loss of interest or pleasure, accompanied by symptoms such as sleep changes, appetite changes, fatigue, impaired concentration and feelings of worthlessness."
    },
    {
      question: "A patient experiencing mania is pacing, talking rapidly and sleeping very little. Which nursing intervention is most appropriate?",
      options: ["Provide a highly stimulating environment", "Use a calm, low-stimulation environment and offer simple, clear instructions", "Encourage lengthy group discussions", "Challenge every statement made by the patient"],
      answer: 1,
      explanation: "A calm environment reduces stimulation. Simple directions, consistent limits, adequate nutrition, hydration and rest support safety and reduce escalation."
    },
    {
      question: "Which feature is commonly associated with a panic attack?",
      options: ["Gradual painless joint swelling", "Sudden intense fear with palpitations and breathlessness", "Persistent memory loss only", "Progressive hearing loss"],
      answer: 1,
      explanation: "Panic attacks involve sudden intense fear or discomfort, often with palpitations, sweating, trembling, breathlessness and fear of losing control or dying. Assess for medical causes when indicated."
    },
    {
      question: "A patient with obsessive-compulsive disorder repeatedly washes their hands because of contamination fears. These repetitive actions are called:",
      options: ["Delusions", "Compulsions", "Hallucinations", "Confabulations"],
      answer: 1,
      explanation: "Compulsions are repetitive behaviours or mental acts performed in response to obsessions or according to rigid rules, often to reduce distress."
    },
    {
      question: "Which intervention is appropriate when caring for a patient experiencing alcohol withdrawal?",
      options: ["Disregard vital signs", "Monitor for withdrawal severity, seizures and delirium, following the prescribed protocol", "Encourage sudden unsupervised alcohol cessation at home despite dependence", "Administer sedatives without prescription"],
      answer: 1,
      explanation: "Alcohol withdrawal can cause tremors, autonomic instability, seizures and delirium tremens. Monitor closely, assess severity and administer prescribed treatment, commonly including benzodiazepines when indicated."
    },
    {
      question: "A patient expresses suicidal thoughts. Which question is most important for assessing immediate risk?",
      options: ["Do you enjoy watching television?", "Have you thought about how you would kill yourself, and do you have access to the means?", "Why are you behaving this way?", "Can you promise never to feel sad again?"],
      answer: 1,
      explanation: "Direct questions about suicidal thoughts, plans, intent and access to means help determine immediate risk. Take disclosures seriously, maintain safety and arrange urgent assessment."
    },
    {
      question: "Which action is most appropriate when a patient becomes increasingly aggressive and threatens others?",
      options: ["Argue loudly with the patient", "Maintain a safe distance, use calm communication and seek assistance", "Corner the patient", "Make threatening statements in response"],
      answer: 1,
      explanation: "De-escalation involves calm communication, personal space, non-threatening body language, reducing stimulation and obtaining assistance. Follow facility safety procedures."
    },
    {
      question: "Which statement about informed consent in psychiatric care is correct?",
      options: ["Every psychiatric patient automatically lacks decision-making capacity", "Capacity should be assessed for the specific decision and at the relevant time", "Consent is never necessary in mental health care", "A family member must always consent for an adult patient"],
      answer: 1,
      explanation: "Mental illness does not automatically remove decision-making capacity. Capacity is decision-specific and may fluctuate. Follow applicable law, ethical principles and facility procedures."
    },
    {
      question: "A patient taking an antipsychotic develops high fever, severe muscle rigidity and confusion. Which serious adverse reaction should be suspected?",
      options: ["Neuroleptic malignant syndrome", "Mild extrapyramidal symptoms", "Seasonal allergy", "Simple insomnia"],
      answer: 0,
      explanation: "Neuroleptic malignant syndrome is a potentially fatal reaction associated with dopamine-blocking medicines. It requires immediate medical attention, withdrawal of the suspected medicine and supportive management."
    },
    {
      question: "Which adverse effect is commonly associated with long-term use of typical antipsychotic medicines?",
      options: ["Tardive dyskinesia", "Improved visual acuity", "Increased hearing sensitivity", "Permanent immunity to infection"],
      answer: 0,
      explanation: "Tardive dyskinesia involves involuntary repetitive movements, commonly affecting the face, tongue and limbs. Monitor patients for abnormal movements and report findings."
    },
    {
      question: "A patient with dementia becomes confused and agitated in an unfamiliar environment. Which nursing intervention is most appropriate?",
      options: ["Frequently change the patient's surroundings", "Provide a calm, familiar environment with orientation cues", "Argue with the patient about incorrect memories", "Use complex instructions"],
      answer: 1,
      explanation: "A familiar, predictable environment, clocks, calendars, simple communication and reassurance can reduce confusion and agitation in patients with dementia."
    },
    {
      question: "Which nursing action best supports a patient experiencing an acute mental health crisis?",
      options: ["Dismiss the patient's concerns", "Establish safety, assess immediate needs and provide calm supportive communication", "Make decisions without explaining anything", "Avoid assessing suicide or self-harm risk"],
      answer: 1,
      explanation: "Crisis intervention prioritises immediate safety, assessment of risk and needs, emotional support, practical assistance and appropriate referral or treatment."
    }

  ]
}

const subjects = [
  { id: 'anatomy', title: 'Anatomy & Physiology', icon: '🫀' },
  { id: 'medSurg', title: 'Medical-Surgical Nursing', icon: '🩺' },
  { id: 'pharmacology', title: 'Clinical Pharmacology', icon: '💊' },
  { id: 'midwifery', title: 'Midwifery', icon: '🤱' },
  { id: 'community', title: 'Community Health Nursing', icon: '🌍' },
  { id: 'mentalHealth', title: 'Mental Health Nursing', icon: '🧠' }
]

const modes = [
  {
    id: 'practice',
    title: 'Practice Mode',
    icon: '📖',
    description: 'Learn at your own pace with answers and explanations.',
    detail: 'Self-paced learning'
  },
  {
    id: 'cat',
    title: 'CAT Mode',
    icon: '⏱️',
    description: 'Practise continuous assessment tests under timed conditions.',
    detail: 'Five-minute demonstration CAT'
  },
  {
    id: 'mock',
    title: 'Mock Examination',
    icon: '🎓',
    description: 'Experience an examination-style assessment.',
    detail: 'Exam simulation'
  }
]

export default function ExamCentre() {
  const [selectedSubject, setSelectedSubject] = useState('anatomy')
  const [mode, setMode] = useState('practice')
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(CAT_DURATION)
  const [responses, setResponses] = useState([null, null, null])

  const currentQuestions = questionBanks[selectedSubject]
  const question = currentQuestions[index]
  const correct = selected === question.answer
  const examMode = mode === 'cat' || mode === 'mock'

  const correctCount = responses.filter(
    (response, i) => response === currentQuestions[i].answer
  ).length

  const incorrectCount = responses.filter(
    (response, i) => response !== null && response !== currentQuestions[i].answer
  ).length

  const unansweredCount = responses.filter(
    response => response === null
  ).length

  useEffect(() => {
    if (!started || mode !== 'cat' || finished) return

    if (secondsLeft <= 0) {
      setFinished(true)
      return
    }

    const timer = setInterval(() => {
      setSecondsLeft(previous => Math.max(0, previous - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [started, mode, finished, secondsLeft])

  const formattedTime = `${Math.floor(secondsLeft / 60)
    .toString().padStart(2, '0')}:${(secondsLeft % 60)
    .toString().padStart(2, '0')}`

  function startExam() {
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setFinished(false)
    setSecondsLeft(CAT_DURATION)
    setResponses(currentQuestions.map(() => null))
    setStarted(true)
  }

  function chooseAnswer(optionIndex) {
    if (answered) return

    setSelected(optionIndex)

    if (examMode) {
      setResponses(previous =>
        previous.map((response, i) =>
          i === index ? optionIndex : response
        )
      )
    }
  }

  function submitAnswer() {
    if (selected === null || answered) return

    setResponses(previous =>
      previous.map((response, i) =>
        i === index ? selected : response
      )
    )

    setAnswered(true)
  }

  function goToQuestion(newIndex) {
    if (newIndex < 0 || newIndex >= currentQuestions.length) return

    setIndex(newIndex)
    setSelected(responses[newIndex])
    setAnswered(false)
  }

  function nextQuestion() {
    if (index === currentQuestions.length - 1) {
      setFinished(true)
    } else {
      goToQuestion(index + 1)
    }
  }

  function previousQuestion() {
    goToQuestion(index - 1)
  }

  function restart() {
    setStarted(false)
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setFinished(false)
    setSecondsLeft(CAT_DURATION)
    setResponses(currentQuestions.map(() => null))
  }

  return (
    <main className="exam-centre">
      <header className="exam-header">
        <p className="exam-label">STUDYMATE LEARNING</p>
        <h1>Examination Centre</h1>
        <p>Choose a nursing subject and test your knowledge.</p>
      </header>

      {!started ? (
        <section className="exam-card">
          <h2>1. Choose your nursing subject</h2>

          <div style={{ display: 'grid', gap: '12px', marginBottom: '30px' }}>
            {subjects.map(subject => (
              <button
                key={subject.id}
                type="button"
                onClick={() => setSelectedSubject(subject.id)}
                style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  background: selectedSubject === subject.id ? '#eaf3ff' : '#f8fafc',
                  border: selectedSubject === subject.id ? '2px solid #2878d0' : '1px solid #e0e7f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: '#26354a'
                }}
              >
                <span style={{ fontSize: '25px' }}>{subject.icon}</span>
                <strong>{subject.title}</strong>
                <span style={{ marginLeft: 'auto', color: '#2878d0' }}>
                  {selectedSubject === subject.id ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>

          <h2>2. Choose examination mode</h2>

          <div style={{ display: 'grid', gap: '12px' }}>
            {modes.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                style={{
                  padding: '18px',
                  textAlign: 'left',
                  background: mode === item.id ? '#eaf3ff' : '#f8fafc',
                  border: mode === item.id ? '2px solid #2878d0' : '1px solid #e0e7f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: '#26354a'
                }}
              >
                <span style={{ fontSize: '25px' }}>{item.icon}</span>
                <strong style={{ display: 'block', margin: '8px 0' }}>
                  {item.title}
                </strong>
                <span style={{ display: 'block', lineHeight: 1.5 }}>
                  {item.description}
                </span>
                <small style={{ display: 'block', marginTop: '8px', color: '#2878d0' }}>
                  {item.detail}
                </small>
              </button>
            ))}
          </div>

          <p style={{ color: '#68758a', textAlign: 'center', marginTop: '20px' }}>
            {currentQuestions.length} sample questions available for this subject.
          </p>

          <button className="exam-submit" onClick={startExam}>
            Start {modes.find(item => item.id === mode).title}
          </button>
        </section>
      ) : !finished ? (
        <section className="exam-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <strong>{subjects.find(item => item.id === selectedSubject).title}</strong>
            <span className="exam-progress">
              Question {index + 1} of {currentQuestions.length}
            </span>
          </div>

          <p className="exam-progress">
            {modes.find(item => item.id === mode).title}
          </p>

          {mode === 'cat' && (
            <div style={{
              padding: '14px',
              margin: '18px 0',
              borderRadius: '10px',
              background: secondsLeft <= 60 ? '#fff0f0' : '#eaf3ff',
              color: secondsLeft <= 60 ? '#a42c2c' : '#1556a0',
              textAlign: 'center',
              fontWeight: '800',
              fontSize: '22px'
            }}>
              <span style={{ fontSize: '13px', display: 'block', marginBottom: '5px' }}>
                TIME REMAINING
              </span>
              {formattedTime}
            </div>
          )}

          <div className="exam-progress-track">
            <div style={{
              width: `${((index + 1) / currentQuestions.length) * 100}%`
            }} />
          </div>

          {examMode && (
            <p style={{ color: '#68758a', fontSize: '14px' }}>
              Answered: {responses.filter(response => response !== null).length}
              {' '}| Unanswered: {unansweredCount}
            </p>
          )}

          <h2>{question.question}</h2>

          <div className="exam-options">
            {question.options.map((option, i) => {
              let style = 'exam-option'

              if (answered && i === question.answer) {
                style += ' correct'
              } else if (answered && i === selected) {
                style += ' incorrect'
              } else if (selected === i) {
                style += ' selected'
              }

              return (
                <button
                  key={i}
                  className={style}
                  disabled={answered}
                  onClick={() => chooseAnswer(i)}
                >
                  {String.fromCharCode(65 + i)}. {option}
                </button>
              )
            })}
          </div>

          {mode === 'practice' && answered && (
            <div className={`exam-feedback ${correct ? 'feedback-correct' : 'feedback-incorrect'}`}>
              <h3>{correct ? 'Correct answer!' : 'Incorrect answer'}</h3>
              <p>
                <strong>Correct answer:</strong> {question.options[question.answer]}
              </p>
              <p>{question.explanation}</p>
            </div>
          )}

          {mode === 'practice' ? (
            !answered ? (
              <button
                className="exam-submit"
                disabled={selected === null}
                onClick={submitAnswer}
              >
                Submit answer
              </button>
            ) : (
              <button className="exam-submit" onClick={nextQuestion}>
                {index === currentQuestions.length - 1
                  ? 'Finish practice'
                  : 'Next question'}
              </button>
            )
          ) : (
            <>
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '22px',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={previousQuestion}
                  disabled={index === 0}
                  style={{
                    flex: 1,
                    padding: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '9px',
                    cursor: index === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={nextQuestion}
                  style={{
                    flex: 1,
                    padding: '13px',
                    border: '1px solid #2878d0',
                    background: '#eaf3ff',
                    color: '#1556a0',
                    borderRadius: '9px',
                    cursor: 'pointer'
                  }}
                >
                  {index === currentQuestions.length - 1
                    ? 'Finish'
                    : selected === null ? 'Skip question' : 'Next question'}
                </button>
              </div>

              <button
                className="exam-submit"
                onClick={() => setFinished(true)}
                style={{ marginTop: '14px' }}
              >
                Submit examination
              </button>
            </>
          )}

          <button
            type="button"
            onClick={restart}
            style={{
              display: 'block',
              margin: '18px auto 0',
              border: 'none',
              background: 'transparent',
              color: '#68758a',
              cursor: 'pointer'
            }}
          >
            Exit examination
          </button>
        </section>
      ) : (
        <section className="exam-card exam-result">
          <h2>{mode === 'cat' && secondsLeft === 0 ? 'Time is up!' : 'Examination completed!'}</h2>
          <p>{subjects.find(item => item.id === selectedSubject).title}</p>
          <p>{modes.find(item => item.id === mode).title}</p>
          <p>Your final score</p>
          <strong>{correctCount} / {currentQuestions.length}</strong>
          <p>{Math.round(correctCount / currentQuestions.length * 100)}% achieved</p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            margin: '25px 0'
          }}>
            <div style={{ padding: '14px 5px', background: '#eaf7ef', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: '#176b39', fontSize: '25px' }}>{correctCount}</strong>
              <small>Correct</small>
            </div>
            <div style={{ padding: '14px 5px', background: '#fff1f0', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: '#a42c2c', fontSize: '25px' }}>{incorrectCount}</strong>
              <small>Incorrect</small>
            </div>
            <div style={{ padding: '14px 5px', background: '#f0f3f7', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: '#536276', fontSize: '25px' }}>{unansweredCount}</strong>
              <small>Unanswered</small>
            </div>
          </div>

          <div style={{ textAlign: 'left', marginTop: '30px' }}>
            <h2>Answer review</h2>

            {currentQuestions.map((item, i) => {
              const response = responses[i]
              const isCorrect = response === item.answer

              return (
                <div key={i} style={{
                  padding: '18px 0',
                  borderBottom: '1px solid #e4eaf2',
                  lineHeight: 1.6
                }}>
                  <strong>{i + 1}. {item.question}</strong>

                  <p style={{
                    color: response === null ? '#68758a' : isCorrect ? '#176b39' : '#a42c2c',
                    margin: '9px 0'
                  }}>
                    Your answer: {response === null
                      ? 'Not answered'
                      : `${String.fromCharCode(65 + response)}. ${item.options[response]}`}
                  </p>

                  <p style={{ color: '#176b39', margin: '5px 0' }}>
                    <strong>Correct answer:</strong> {String.fromCharCode(65 + item.answer)}. {item.options[item.answer]}
                  </p>

                  <p style={{ color: '#536276', margin: '5px 0' }}>
                    <strong>Explanation:</strong> {item.explanation}
                  </p>

                  <strong style={{
                    color: response === null ? '#68758a' : isCorrect ? '#176b39' : '#a42c2c'
                  }}>
                    {response === null ? 'Unanswered' : isCorrect ? 'Correct' : 'Incorrect'}
                  </strong>
                </div>
              )
            })}
          </div>

          <button className="exam-submit" onClick={restart}>
            Choose another subject or retake
          </button>
        </section>
      )}
    </main>
  )
}
