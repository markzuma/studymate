// PERIAK interactive nursing education cases.
// Fictional scenarios for study only; not patient-care decision support.
export const clinicalCases = [
  {
    id: 'asthma', title: 'Acute severe asthma', area: 'Medical–Surgical', level: 'Urgent',
    setting: 'Emergency department',
    stem: 'A 22-year-old arrives breathless, speaking only two or three words at a time. RR 34/min, HR 126/min, SpO₂ 88% on room air. Audible wheeze is present.',
    objectives: ['Recognise life-threatening respiratory distress', 'Prioritise immediate assessment and escalation', 'Reassess treatment response'],
    steps: [
      { q:'What is your first priority?', choices:['Take a detailed social history before assessing','Assess airway and breathing, summon urgent help and begin the emergency pathway','Ask the patient to walk to the waiting area','Offer food and recheck in an hour'], correct:1,
        why:'Severe hypoxaemia and inability to speak normally are emergency signs. Initiate ABC assessment, call for urgent help and provide indicated oxygen/bronchodilator care according to the local protocol.',
        pitfall:'Documentation and history matter, but they must not delay stabilisation of a severely breathless patient.' },
      { q:'Which reassessment best detects clinical deterioration?', choices:['Breathing effort, consciousness, SpO₂ and ability to speak','Body mass index alone','Skin moisturisation','Past school attendance'], correct:0,
        why:'Serial assessment of work of breathing, oxygenation, consciousness, respiratory rate and response to initial treatment guides escalation.',
        pitfall:'A single oxygen saturation value is not enough without the rest of the clinical assessment.' },
      { q:'After initial emergency interventions, the patient becomes drowsy and breath sounds are barely audible. What now?', choices:['Interpret less wheezing as recovery','Arrange routine discharge','Immediately escalate for possible impending respiratory failure','Delay further checks until handover'], correct:2,
        why:'Exhaustion, drowsiness and a quiet chest in severe asthma are dangerous; activate urgent senior/critical-care assessment and prepare for advanced support per protocol.',
        pitfall:'A silent or quiet chest may indicate poor airflow rather than improvement.' }
    ]
  },
  {
    id: 'pph', title: 'Postpartum haemorrhage', area: 'Midwifery', level:'Emergency',
    setting:'Maternity unit',
    stem:'Twenty minutes after vaginal birth, a woman has persistent heavy bleeding, pulse 126/min, BP 86/52 mmHg, pale skin and dizziness.',
    objectives:['Recognise shock in obstetric bleeding', 'Activate emergency response', 'Reassess the causes of bleeding'],
    steps:[
      {q:'What should you do immediately?',choices:['Ask her to walk to the bathroom','Activate obstetric emergency assistance and assess ABCs while starting the PPH protocol','Wait for a routine ward round','Give oral iron and reassure her'],correct:1,
       why:'Heavy postpartum bleeding with signs of shock requires immediate coordinated emergency management, resuscitation and treatment under the facility PPH protocol.',pitfall:'Do not delay emergency help while attempting routine observation.'},
      {q:'Which focused assessment helps identify an important cause of bleeding?',choices:['Uterine tone and bleeding while evaluating the four Ts','Hair colour','Hand dominance','Dietary preferences'],correct:0,
       why:'Consider Tone, Trauma, Tissue and Thrombin while resuscitation continues. Assess uterine contraction and look for other causes with the team.',pitfall:'Uterine atony is common, but other causes must not be overlooked.'},
      {q:'What should continue while urgent treatment is underway?',choices:['Monitor vital signs, ongoing blood loss, consciousness and response to resuscitation','Stop documenting all blood loss','Leave her unobserved','Give an unsupervised discharge'],correct:0,
       why:'Ongoing monitoring supports recognition of shock, treatment response and need for transfer or additional intervention. Implement ordered interventions and escalation.',pitfall:'Bleeding may persist or recur despite initial measures.'}
    ]
  },
  {
    id:'sepsis', title:'Suspected sepsis with shock', area:'Medical–Surgical', level:'Emergency',
    setting:'Medical ward',
    stem:'A patient with a suspected urinary infection is newly confused. Temperature 39.3 °C, HR 132/min, BP 84/50 mmHg, RR 30/min.',
    objectives:['Recognise organ dysfunction', 'Escalate promptly', 'Monitor perfusion and response'],
    steps:[
      {q:'Which action takes priority?',choices:['Observe until the next shift','Activate urgent sepsis/emergency assessment and complete an ABCDE review','Give only a cold compress','Focus first on discharge paperwork'],correct:1,
       why:'Hypotension, altered mental status and tachypnoea indicate possible sepsis-associated organ dysfunction or shock and need urgent assessment and protocol-based treatment.',pitfall:'Fever alone is not the main concern: poor perfusion and organ dysfunction make this urgent.'},
      {q:'Which initial information is particularly useful for the emergency team?',choices:['Serial BP, mental state, SpO₂, urine output and available glucose/lactate results','Favourite television show','Shoe size','Preferred meal'],correct:0,
       why:'The team needs signs of perfusion and organ dysfunction, the suspected source, relevant history and time-sensitive investigations. Follow local policy for cultures and treatment without unnecessary delay.',pitfall:'Do not postpone escalation to finish every investigation.'},
      {q:'After ordered treatment begins, what is the nursing priority?',choices:['Reassess perfusion, respiratory status, fluid balance and treatment response','Assume recovery once fever falls','Stop all vital-sign checks','Offer independent unprescribed medicine'],correct:0,
       why:'Repeated reassessment helps detect persistent shock, respiratory compromise and fluid-related harm. Promptly report failure to improve.',pitfall:'A change in temperature alone does not establish recovery.'}
    ]
  },
  {
    id:'hypoglycaemia', title:'Symptomatic hypoglycaemia',area:'Endocrine',level:'Urgent',setting:'Diabetes clinic',
    stem:'An adult receiving insulin becomes sweaty, shaky and confused but remains awake and able to swallow. Capillary glucose is 2.7 mmol/L.',
    objectives:['Recognise low blood glucose','Choose safe immediate support','Recheck and prevent recurrence'],
    steps:[
      {q:'What is the safest immediate response?',choices:['Give fast-acting oral carbohydrate if swallowing is safe, following protocol','Give additional insulin','Encourage strenuous exercise','Leave the patient alone'],correct:0,
       why:'For a conscious patient able to swallow safely, prompt fast-acting oral carbohydrate and glucose reassessment are appropriate under the local hypoglycaemia protocol.',pitfall:'Do not give anything orally if consciousness or swallowing is impaired.'},
      {q:'The patient becomes unresponsive. What changes?',choices:['Continue oral drinks despite unconsciousness','Urgent ABC assessment, summon help, and follow the non-oral emergency treatment protocol','Wait until morning','Ask them to stand'],correct:1,
       why:'Impaired consciousness creates aspiration risk; arrange emergency assessment and prescribed non-oral glucose rescue according to facility protocol.',pitfall:'Oral intake is unsafe in an unconscious patient.'},
      {q:'After symptoms improve, which action matters?',choices:['Recheck glucose and review the cause, meal timing and medication plan','Assume no further monitoring is needed','Double the next insulin dose','Skip documentation'],correct:0,
       why:'Repeat testing and prevention planning are needed because hypoglycaemia can recur, particularly with some medications.',pitfall:'Treating an episode does not address why it happened.'}
    ]
  },
  {
    id:'dehydration',title:'Child with diarrhoea and dehydration',area:'Paediatrics / Community Health',level:'Urgent',setting:'Outpatient clinic',
    stem:'A 2-year-old has frequent watery stools and reduced drinking. The child is lethargic, has sunken eyes and appears poorly perfused.',
    objectives:['Recognise danger signs','Prioritise referral and fluid assessment','Support prevention'],
    steps:[
      {q:'What is the priority?',choices:['Urgently assess danger signs and arrange appropriate facility-based rehydration and referral','Send home without assessment','Give a sugary soft drink only','Ignore lethargy'],correct:0,
       why:'Lethargy and poor perfusion are red flags; apply the locally adopted IMCI/diarrhoea pathway and urgently assess need for supervised rehydration.',pitfall:'Home-only management is inappropriate when severe dehydration or danger signs are suspected.'},
      {q:'Which history and examination are most relevant?',choices:['Duration of diarrhoea, fluid intake, urine output, consciousness and hydration signs','Parents’ occupations alone','Hair style','Only age without assessment'],correct:0,
       why:'Assess dehydration severity and possible causes using recommended child assessment signs, including mental state and drinking ability.',pitfall:'No single sign should be interpreted in isolation.'},
      {q:'As the child stabilises, what teaching helps prevention?',choices:['Use safe fluids and ORS as instructed, continue age-appropriate feeding and know danger signs','Stop all feeding for several days','Use antibiotics without assessment','Avoid handwashing'],correct:0,
       why:'Caregiver education on ORS, continued feeding, hygiene and urgent return signs can reduce harm and improve early response.',pitfall:'Care should follow the child’s severity and local clinical guidelines.'}
    ]
  },
  {
    id:'stroke',title:'Acute stroke recognition',area:'Neurology',level:'Emergency',setting:'Emergency department',
    stem:'A 64-year-old suddenly develops right-arm weakness and slurred speech. A relative says the patient was last well 45 minutes ago.',
    objectives:['Recognise stroke symptoms','Protect the acute stroke pathway','Prevent aspiration'],
    steps:[
      {q:'What is the immediate priority?',choices:['Activate the stroke emergency pathway and record last-known-well time','Schedule routine review next week','Offer a large meal','Ask them to walk alone'],correct:0,
       why:'Acute focal neurological symptoms require time-critical stroke evaluation. Document the last-known-well time and urgently escalate.',pitfall:'Treatment eligibility depends on timely evaluation; avoid delay.'},
      {q:'What bedside assessment is particularly important alongside ABCs?',choices:['Blood glucose and focused neurological assessment','Skin complexion alone','Clothing brand','Diet preference'],correct:0,
       why:'Hypoglycaemia can mimic stroke; check glucose promptly and monitor neurological status while arranging urgent imaging and evaluation.',pitfall:'Do not assume every focal deficit has the same cause.'},
      {q:'What precaution is appropriate pending swallowing assessment?',choices:['Keep oral intake on hold until swallowing safety is assessed','Give water immediately regardless of symptoms','Encourage solid food','Disregard aspiration risk'],correct:0,
       why:'Dysphagia is common after stroke and may cause aspiration. Follow the facility swallow-screening pathway before oral intake.',pitfall:'Do not delay necessary emergency assessment to complete routine feeding.'}
    ]
  },
  {
    id:'chestpain',title:'Possible acute coronary syndrome',area:'Cardiovascular',level:'Emergency',setting:'Casualty unit',
    stem:'A 56-year-old has 30 minutes of heavy central chest pressure, sweating, nausea and increasing breathlessness.',
    objectives:['Recognise cardiac red flags','Escalate and monitor','Communicate clearly during handover'],
    steps:[
      {q:'Which action takes priority?',choices:['Assess ABCs and activate urgent chest-pain/cardiac evaluation','Ask the patient to exercise','Send home with no assessment','Offer a large meal'],correct:0,
       why:'This presentation suggests possible acute coronary syndrome. Urgent evaluation, monitoring and a prompt ECG under the local pathway are necessary.',pitfall:'Symptoms can be atypical and must be assessed urgently.'},
      {q:'Which assessment should be communicated promptly?',choices:['Symptom onset, pain features, vital signs, ECG availability and relevant history','Favourite sports team','Shoe size','Hair texture'],correct:0,
       why:'A focused clinical handover supports timely testing, treatment decisions and recognition of deterioration.',pitfall:'Do not delay emergency action for a lengthy unrelated history.'},
      {q:'The patient becomes pale and hypotensive. What next?',choices:['Urgently reassess and escalate possible haemodynamic instability','Continue an ordinary discharge','Stop monitoring','Give unprescribed medication'],correct:0,
       why:'Hypotension with ongoing symptoms may indicate serious complications. Continue ABC-based monitoring and immediate escalation.',pitfall:'A seemingly simple chest-pain complaint can change rapidly.'}
    ]
  },
  {
    id:'dka',title:'Suspected diabetic ketoacidosis',area:'Endocrine',level:'Emergency',setting:'Medical receiving ward',
    stem:'A 19-year-old with type 1 diabetes reports vomiting and abdominal pain. They are dehydrated with deep rapid breathing and high capillary glucose.',
    objectives:['Recognise possible metabolic emergency','Understand initial investigation priorities','Monitor treatment complications'],
    steps:[
      {q:'What is the initial nursing response?',choices:['Perform ABC assessment, escalate and prepare the DKA pathway','Give a sugary drink without assessment','Ask them to sleep and return tomorrow','Give unprescribed insulin'],correct:0,
       why:'Suspected DKA requires urgent clinical review, assessment of perfusion and consciousness, and protocol-based management.',pitfall:'Do not start unsupervised insulin or delay assessment.'},
      {q:'Which investigations guide safe treatment?',choices:['Glucose, ketones, electrolytes and acid-base status','Eye colour','Height alone','Body temperature alone'],correct:0,
       why:'Acid-base state, ketones and electrolytes—especially potassium—are important for identifying DKA and monitoring treatment.',pitfall:'High glucose alone does not fully establish DKA.'},
      {q:'During ordered fluids and insulin therapy, what must be monitored?',choices:['Glucose trends, potassium, fluid balance, consciousness and vital signs','Only appetite','Only skin colour','No observations once treatment begins'],correct:0,
       why:'Frequent reassessment helps identify hypoglycaemia, electrolyte changes, fluid complications and treatment response.',pitfall:'Treatment is dynamic and requires close supervision.'}
    ]
  }
]

export const virtualPatients = [
  {
    id:'v-resp', name:'Patient A', age:'24 years', area:'Respiratory emergency', level:'High priority',
    handover:'A student nurse receives a patient with wheeze and severe breathlessness. No previous observations are documented.',
    observations:['RR 34/min','SpO₂ 88% (room air)','HR 128/min','Speaking in short phrases'],
    phases:[
      {label:'Primary survey',prompt:'Which immediate assessment is most appropriate?',options:['ABCs, breathing effort and immediate help','Comprehensive dietary recall first','Leave the patient to rest unattended'],correct:0,feedback:'Recognise possible respiratory failure early. Escalate and use local emergency protocols.'},
      {label:'Interpret findings',prompt:'What does SpO₂ 88% with severe distress indicate?',options:['Normal exercise response in every adult','A potentially life-threatening oxygenation problem','A reliable sign of recovery'],correct:1,feedback:'Interpret pulse oximetry alongside effort, consciousness, circulation and clinical context.'},
      {label:'Coordinate care',prompt:'What is an appropriate nursing contribution?',options:['Delay all treatment until paperwork is complete','Give a sedative without an order','Prepare indicated emergency oxygen/bronchodilator care with prescribed protocol and monitor response'],correct:2,feedback:'Support rapid multidisciplinary treatment and communicate observations and response.'},
      {label:'Reassess',prompt:'The patient becomes drowsy with quieter breath sounds. What now?',options:['Assume normal recovery','Urgently escalate for possible exhaustion and impending failure','Discharge as improved'],correct:1,feedback:'A quiet chest and altered mental state in severe asthma are danger signs.'}
    ]
  },
  {
    id:'v-maternity',name:'Patient B',age:'29 years',area:'Postpartum haemorrhage',level:'High priority',
    handover:'A woman delivered 25 minutes ago. Staff notice persistent bleeding and she reports dizziness.',
    observations:['Pulse 124/min','BP 88/54 mmHg','Ongoing heavy bleeding','Pale, anxious, dizzy'],
    phases:[
      {label:'Recognise emergency',prompt:'What clinical pattern must be escalated?',options:['A routine, stable postnatal recovery','An isolated mild headache','Shock associated with postpartum bleeding'],correct:2,feedback:'Tachycardia, hypotension and heavy bleeding suggest urgent haemorrhage management.'},
      {label:'Activate team',prompt:'What is the safest team response?',options:['Call obstetric emergency help and start the PPH protocol','Wait for the next shift','Encourage her to walk'],correct:0,feedback:'Coordinate ABC assessment, resuscitation and cause-directed care under the facility pathway.'},
      {label:'Find likely cause',prompt:'What should the team check as treatment continues?',options:['Hair colour','Diet only','Uterine tone, genital trauma, retained tissue and coagulopathy'],correct:2,feedback:'The four Ts help structure evaluation while immediate resuscitation continues.'},
      {label:'Monitor',prompt:'How do you judge early response?',options:['Trend bleeding, pulse, BP, mental state and perfusion','Use one pulse measurement only','Stop monitoring once help arrives'],correct:0,feedback:'Clinical reassessment and escalation of persistent shock are essential.'}
    ]
  },
  {
    id:'v-infection',name:'Patient C',age:'62 years',area:'Sepsis and shock',level:'High priority',
    handover:'A patient with fever and urinary symptoms is now confused and difficult to rouse.',
    observations:['Temperature 39.1 °C','BP 84/50 mmHg','HR 132/min','RR 30/min'],
    phases:[
      {label:'Identify threat',prompt:'Which finding is most concerning?',options:['The presence of a blanket','Hypotension with altered mental status','Their age without assessment'],correct:1,feedback:'The combination suggests organ dysfunction and possible shock.'},
      {label:'Immediate response',prompt:'Which action is appropriate?',options:['Routine discharge','Reassess only in several hours','Urgent ABCDE assessment and activation of sepsis emergency care'],correct:2,feedback:'Time-critical, protocol-based care and urgent escalation are indicated.'},
      {label:'Clinical handover',prompt:'What information matters most?',options:['Favourite meal','Serial observations, source of infection, urine output and treatment timeline','Only height'],correct:1,feedback:'Communicate perfusion, organ dysfunction and relevant test results promptly.'},
      {label:'Reevaluation',prompt:'After initial intervention, the BP remains low. What next?',options:['Escalate persistent shock and reassess response with the team','Assume resolution because fever has decreased','Stop monitoring'],correct:0,feedback:'Persistent hypotension needs urgent reevaluation and specialist support.'}
    ]
  }
]
