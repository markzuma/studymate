import { useState } from 'react'
import './App.css'
import ExamCentre from './components/ExamCentre'
import { pharmacologyLessons } from './pharmacologyLessons'
import { midwiferyLessons } from './midwiferyLessons'
import { communityLessons } from './communityLessons'
import { mentalHealthLessons } from './mentalHealthLessons'

const courses = [
  { icon: '🫀', title: 'Anatomy & Physiology', desc: 'Understand the structure and functions of the human body.', level: 'FOUNDATION' },
  { icon: '🩺', title: 'Medical-Surgical Nursing', desc: 'Learn to assess, manage and care for patients with diseases.', level: 'CORE NURSING' },
  { icon: '💊', title: 'Clinical Pharmacology', desc: 'Master medicines, their actions and nursing considerations.', level: 'CORE NURSING' },
  { icon: '🤰', title: 'Midwifery', desc: 'Explore pregnancy, childbirth and essential maternal care.', level: 'SPECIALTY' },
  { icon: '🌍', title: 'Community Health', desc: 'Learn prevention, health promotion and community care.', level: 'SPECIALTY' },
  { icon: '🧠', title: 'Mental Health Nursing', desc: 'Understand mental health conditions and compassionate care.', level: 'SPECIALTY' },
]

const units = {
  'Anatomy & Physiology': ['Introduction to human anatomy and physiology', 'Cells and tissues', 'Skeletal system', 'Muscular system', 'Cardiovascular system', 'Respiratory system', 'Digestive system', 'Urinary system', 'Nervous system', 'Endocrine system'],
  'Medical-Surgical Nursing': ['Introduction to medical-surgical nursing', 'Patient assessment and diagnostic investigations', 'Respiratory disorders', 'Cardiovascular disorders', 'Gastrointestinal disorders', 'Renal and urinary disorders', 'Neurological disorders', 'Endocrine disorders', 'Haematological disorders', 'Perioperative nursing'],
  'Clinical Pharmacology': ['Introduction to pharmacology', 'Drug classifications and dosage forms', 'Pharmacokinetics', 'Pharmacodynamics', 'Medication administration', 'Antibiotics and antimicrobials', 'Cardiovascular drugs', 'Central nervous system drugs', 'Drug safety and adverse reactions'],
  'Midwifery': ['Introduction to midwifery', 'Female reproductive anatomy', 'Conception and embryology', 'Physiological changes in pregnancy', 'Antenatal care', 'Normal labour and delivery', 'Postnatal care', 'Newborn care', 'Obstetric complications'],
  'Community Health': ['Introduction to community health nursing', 'Primary health care', 'Community diagnosis', 'Epidemiology', 'Health promotion and education', 'Environmental health', 'Immunisation', 'Communicable diseases', 'Community assessment'],
  'Mental Health Nursing': ['Introduction to mental health nursing', 'Mental health assessment', 'Therapeutic communication', 'Anxiety disorders', 'Mood disorders', 'Psychotic disorders', 'Substance use disorders', 'Psychiatric medications', 'Psychiatric nursing interventions'],
}


const lessonContent = {
  'Introduction to human anatomy and physiology': {
    objectives: [
      'Define anatomy and physiology.',
      'Differentiate between gross anatomy and microscopic anatomy.',
      'Explain the levels of structural organisation of the human body.',
      'Identify the major organ systems and their functions.',
      'Explain homeostasis and its importance in maintaining health.'
    ],
    notes: [
      {
        heading: '1. Meaning of anatomy',
        body: 'Anatomy is the scientific study of the structure of the human body and the relationships between its parts. It examines the shape, location, organisation and physical relationships of body structures.'
      },
      {
        heading: '2. Meaning of physiology',
        body: 'Physiology is the scientific study of how the body and its parts function. It explains how cells, tissues, organs and organ systems work together to maintain life.'
      },
      {
        heading: '3. Branches of anatomy',
        body: 'Gross anatomy studies structures visible to the naked eye. Microscopic anatomy studies structures that require a microscope, including cytology (the study of cells) and histology (the study of tissues). Developmental anatomy examines structural changes from conception to adulthood. Regional anatomy studies all structures within a particular body region, while systemic anatomy studies the body system by system.'
      },
      {
        heading: '4. Levels of structural organisation',
        body: 'The human body is organised into progressively complex levels: chemical level (atoms and molecules), cellular level (cells), tissue level (groups of similar cells performing related functions), organ level (two or more tissue types forming a structure), organ-system level (organs working together), and organism level (the complete human being).'
      },
      {
        heading: '5. Major organ systems',
        body: 'The integumentary system protects the body; the skeletal system supports and protects organs; the muscular system produces movement; the nervous and endocrine systems coordinate body activities; the cardiovascular system transports blood and substances; the lymphatic and immune systems defend against infection; the respiratory system exchanges gases; the digestive system processes food and absorbs nutrients; the urinary system removes waste and regulates fluid balance; and the reproductive system enables reproduction.'
      },
      {
        heading: '6. Anatomical position and directional terms',
        body: 'The standard anatomical position is standing upright, facing forward, arms at the sides, palms facing forward and feet directed forward. Superior means toward the head; inferior means toward the feet. Anterior means toward the front; posterior means toward the back. Medial means nearer the midline; lateral means farther from it. Proximal means nearer the point of attachment; distal means farther away. Superficial means nearer the body surface; deep means farther from the surface.'
      },
      {
        heading: '7. Body planes and cavities',
        body: 'The sagittal plane divides the body into right and left portions; the midsagittal plane divides it into equal halves. The frontal (coronal) plane divides the body into anterior and posterior portions. The transverse plane divides the body into superior and inferior portions. The dorsal cavity contains the cranial and vertebral cavities. The ventral cavity contains the thoracic and abdominopelvic cavities.'
      },
      {
        heading: '8. Homeostasis',
        body: 'Homeostasis is the maintenance of a relatively stable internal environment despite changes inside or outside the body. It regulates variables such as body temperature, blood glucose, blood pressure, pH and fluid balance. Most homeostatic mechanisms use negative feedback, in which a response reverses the initial change. For example, when body temperature rises, sweating and vasodilation help lower it. Positive feedback amplifies a change until a specific event is completed, as in uterine contractions during childbirth.'
      },
      {
        heading: '9. Organisation of a negative feedback mechanism',
        body: 'A typical negative feedback loop has a receptor that detects a change, a control centre that compares the value with the desired range, and an effector that produces a response. The response reduces the original disturbance and helps restore balance.'
      }
    ],
    clinical: 'A nurse caring for a patient with fever uses knowledge of physiology to understand temperature regulation. The hypothalamus acts as a major temperature-control centre. Increased body temperature may trigger sweating and widening of skin blood vessels to promote heat loss. Understanding anatomy also helps the nurse locate organs, assess body regions and communicate findings accurately.',
    examPoints: [
      'Anatomy concerns structure; physiology concerns function.',
      'Histology is the study of tissues; cytology is the study of cells.',
      'The correct order is chemical → cellular → tissue → organ → organ system → organism.',
      'Homeostasis maintains a relatively stable internal environment.',
      'Negative feedback reverses a change; positive feedback amplifies a change.',
      'The hypothalamus plays a major role in body-temperature regulation.',
      'Know the anatomical position, directional terms, body planes and major cavities.'
    ],
    questions: [
      {
        q: 'Which statement best describes physiology?',
        options: ['Study of body structures', 'Study of how body parts function', 'Study of diseases only', 'Study of body tissues only'],
        answer: 1,
        explanation: 'Physiology examines the functions of cells, tissues, organs and organ systems. Anatomy focuses on structure.'
      },
      {
        q: 'Which is the correct sequence of structural organisation?',
        options: ['Cell, chemical, tissue, organ, organism', 'Chemical, cell, tissue, organ, organ system, organism', 'Tissue, cell, organ, chemical, organism', 'Chemical, tissue, cell, organ system, organ'],
        answer: 1,
        explanation: 'The body progresses from the chemical level to cells, tissues, organs, organ systems and finally the whole organism.'
      },
      {
        q: 'The study of tissues using a microscope is called:',
        options: ['Cytology', 'Gross anatomy', 'Histology', 'Physiology'],
        answer: 2,
        explanation: 'Histology is the study of tissues. Cytology is the study of cells.'
      },
      {
        q: 'Which plane divides the body into anterior and posterior portions?',
        options: ['Transverse', 'Frontal', 'Sagittal', 'Midsagittal'],
        answer: 1,
        explanation: 'The frontal or coronal plane divides the body into front (anterior) and back (posterior) portions.'
      },
      {
        q: 'A patient begins sweating when body temperature rises. This is an example of:',
        options: ['Positive feedback', 'Negative feedback', 'Cell differentiation', 'Tissue organisation'],
        answer: 1,
        explanation: 'Sweating promotes heat loss and counteracts the rise in body temperature, making it a negative feedback response.'
      }
    ]
  },
  'Cells and tissues': {
    objectives: [
      'Define a cell and explain the cell theory.',
      'Describe the structure and functions of major cell organelles.',
      'Explain the structure and functions of the plasma membrane.',
      'Differentiate between passive and active transport.',
      'Identify the four basic types of human tissues.',
      'Explain the clinical significance of cell and tissue organisation.'
    ],
    notes: [
      {
        heading: '1. Introduction to the cell',
        body: 'A cell is the basic structural, functional and biological unit of the human body. The human body consists of trillions of cells that perform specialised functions. Cell theory states that living organisms are composed of cells, the cell is the basic unit of life, and new cells arise from pre-existing cells through cell division.'
      },
      {
        heading: '2. General structure of a human cell',
        body: 'A typical human cell consists of three main components: the plasma membrane, cytoplasm and nucleus. The plasma membrane surrounds the cell and regulates movement of substances. The cytoplasm contains the cytosol and organelles. The nucleus contains most of the genetic material (DNA) and regulates cellular activities.'
      },
      {
        heading: '3. Cell organelles and their functions',
        body: 'The nucleus stores DNA and controls gene expression. The nucleolus produces ribosomal components. Mitochondria generate most cellular ATP through aerobic respiration. Ribosomes synthesise proteins. Rough endoplasmic reticulum synthesises and processes proteins destined for secretion or membranes. Smooth endoplasmic reticulum synthesises lipids, participates in detoxification and stores calcium in some cells. The Golgi apparatus modifies, sorts and packages proteins and lipids. Lysosomes contain enzymes that digest waste and worn-out cell components. Peroxisomes participate in fatty-acid metabolism and breakdown of hydrogen peroxide. The cytoskeleton maintains cell shape and supports movement and intracellular transport. Centrosomes help organise microtubules during cell division.'
      },
      {
        heading: '4. Plasma membrane',
        body: 'The plasma membrane is a selectively permeable boundary surrounding the cell. It is mainly composed of a phospholipid bilayer with embedded proteins, cholesterol and carbohydrate-containing molecules. Phospholipids have hydrophilic heads facing watery environments and hydrophobic tails directed inward. Membrane proteins function as channels, carriers, receptors and enzymes. The membrane regulates movement of substances, cell signalling, recognition and adhesion.'
      },
      {
        heading: '5. Movement of substances across the membrane',
        body: 'Passive transport does not require cellular energy and moves substances down their concentration or electrochemical gradients. Simple diffusion involves movement of molecules from higher to lower concentration, such as oxygen. Facilitated diffusion uses membrane proteins to transport substances down their gradient, such as glucose through specific carriers. Osmosis is the net movement of water across a selectively permeable membrane from a region of lower solute concentration to higher solute concentration. Filtration is movement of water and small solutes driven by hydrostatic pressure differences. Active transport requires energy, directly or indirectly, to move substances against a gradient. The sodium-potassium pump uses ATP to move three sodium ions out of the cell and two potassium ions into the cell. Endocytosis brings material into the cell using vesicles; exocytosis releases material from the cell.'
      },
      {
        heading: '6. Cell division',
        body: 'The cell cycle includes interphase and the division phase. Interphase consists of G1 (growth), S (DNA replication) and G2 (preparation for division). Mitosis divides the nucleus into two genetically similar nuclei through prophase, metaphase, anaphase and telophase, followed by cytokinesis. Mitosis is important for growth, tissue repair and replacement of worn-out cells. Meiosis occurs in germ cells to produce haploid gametes and involves two successive divisions.'
      },
      {
        heading: '7. Introduction to tissues',
        body: 'A tissue is a group of similar cells, together with their surrounding material, organised to perform particular functions. The four basic tissue types are epithelial, connective, muscle and nervous tissue. Different tissues combine to form organs.'
      },
      {
        heading: '8. Epithelial tissue',
        body: 'Epithelial tissue covers body surfaces, lines cavities and forms glands. Its functions include protection, absorption, secretion, filtration and sensation. Epithelia are classified by the number of layers and cell shape. Simple epithelium has one layer; stratified epithelium has multiple layers; pseudostratified epithelium appears multilayered but all cells contact the basement membrane; transitional epithelium changes shape as organs stretch. Cell shapes include squamous (flat), cuboidal (cube-shaped) and columnar (tall). Examples include simple squamous epithelium in alveoli, simple cuboidal epithelium in kidney tubules and stratified squamous epithelium in the epidermis.'
      },
      {
        heading: '9. Connective tissue',
        body: 'Connective tissue supports, binds, protects and connects other tissues. It consists of cells within an extracellular matrix containing ground substance and fibres. Major types include loose connective tissue, dense connective tissue, adipose tissue, cartilage, bone and blood. Collagen fibres provide tensile strength; elastic fibres allow stretching and recoil; reticular fibres form supportive networks. Bone supports and protects the body, cartilage provides flexible support, adipose tissue stores energy and insulates, and blood transports substances.'
      },
      {
        heading: '10. Muscle tissue',
        body: 'Muscle tissue is specialised for contraction. Skeletal muscle is striated, usually under voluntary control and attached to bones to produce movement. Cardiac muscle is striated, involuntary and found in the heart; its cells are connected by intercalated discs. Smooth muscle is non-striated, involuntary and found in walls of hollow organs such as the intestines and blood vessels.'
      },
      {
        heading: '11. Nervous tissue',
        body: 'Nervous tissue is found in the brain, spinal cord and peripheral nerves. It consists mainly of neurons and supporting neuroglial cells. Neurons receive and transmit electrical and chemical signals. A typical neuron has a cell body, dendrites that receive signals and an axon that conducts impulses away from the cell body. Neuroglia support, protect, nourish and maintain the environment around neurons.'
      },
      {
        heading: '12. Tissue repair and regeneration',
        body: 'Tissue repair restores continuity after injury through regeneration, replacement by scar tissue, or a combination of both. Regeneration replaces damaged cells with the same type of cells. Fibrosis replaces damaged tissue with connective tissue scar. The ability to regenerate varies between tissues: epithelial cells and many blood cells are replaced readily, while cardiac muscle has very limited regenerative capacity. Healing is influenced by blood supply, nutrition, infection, age and the extent of injury.'
      }
    ],
    clinical: 'Understanding cells and tissues helps nurses interpret wound healing, oedema, burns, infection and tissue damage. For example, a patient with severe dehydration may experience fluid shifts between body compartments. Knowledge of osmosis helps explain why fluid balance matters. Understanding epithelial tissue also helps nurses assess skin integrity and pressure injuries, while knowledge of connective tissue helps explain the role of collagen in wound strength.',
    examPoints: [
      'The cell is the basic structural and functional unit of life.',
      'Mitochondria generate most cellular ATP.',
      'Ribosomes are the sites of protein synthesis.',
      'The Golgi apparatus modifies, sorts and packages proteins.',
      'Lysosomes digest cellular waste and worn-out organelles.',
      'Osmosis is the net movement of water across a selectively permeable membrane.',
      'The sodium-potassium pump moves 3 sodium ions out and 2 potassium ions in per ATP.',
      'The four basic tissues are epithelial, connective, muscle and nervous.',
      'Cardiac muscle is striated and involuntary; skeletal muscle is generally voluntary.',
      'Epithelial tissue covers surfaces, lines cavities and forms glands.'
    ],
    questions: [
      {
        q: 'Which organelle is primarily responsible for producing ATP during aerobic respiration?',
        options: ['Golgi apparatus', 'Lysosome', 'Mitochondrion', 'Ribosome'],
        answer: 2,
        explanation: 'Mitochondria are the major sites of ATP production through aerobic cellular respiration.'
      },
      {
        q: 'Which organelle modifies, sorts and packages proteins?',
        options: ['Golgi apparatus', 'Nucleus', 'Lysosome', 'Centrosome'],
        answer: 0,
        explanation: 'The Golgi apparatus processes and packages proteins and lipids for delivery to their destinations.'
      },
      {
        q: 'The movement of water across a selectively permeable membrane is called:',
        options: ['Active transport', 'Osmosis', 'Exocytosis', 'Phagocytosis'],
        answer: 1,
        explanation: 'Osmosis is the net movement of water across a selectively permeable membrane in response to a solute concentration difference.'
      },
      {
        q: 'The sodium-potassium pump transports:',
        options: ['Two sodium ions out and three potassium ions in', 'Three sodium ions out and two potassium ions in', 'Three sodium ions in and two potassium ions out', 'Equal amounts of sodium and potassium in both directions'],
        answer: 1,
        explanation: 'The sodium-potassium ATPase uses one ATP to move three sodium ions out of the cell and two potassium ions into it.'
      },
      {
        q: 'Which tissue forms the lining of many body cavities and covers body surfaces?',
        options: ['Muscle tissue', 'Nervous tissue', 'Epithelial tissue', 'Connective tissue'],
        answer: 2,
        explanation: 'Epithelial tissue covers external surfaces, lines internal cavities and forms glands.'
      },
      {
        q: 'Which muscle tissue is found in the wall of the intestine?',
        options: ['Skeletal muscle', 'Cardiac muscle', 'Smooth muscle', 'Striated voluntary muscle'],
        answer: 2,
        explanation: 'Smooth muscle is involuntary and is present in the walls of hollow organs, including the intestines.'
      },
      {
        q: 'Which cell structure contains most of the genetic material?',
        options: ['Nucleus', 'Ribosome', 'Lysosome', 'Cell membrane'],
        answer: 0,
        explanation: 'The nucleus contains most of the cell DNA and regulates many cellular activities.'
      }
    ]
  }
,
  'Skeletal system': {
    objectives: [
      'Define the skeletal system and describe its major functions.',
      'Differentiate the axial and appendicular skeleton.',
      'Classify bones according to shape and describe their structure.',
      'Explain bone cells, bone formation and remodelling.',
      'Classify joints and describe their movements.',
      'Apply skeletal anatomy and physiology to common clinical conditions and nursing care.'
    ],
    notes: [
      {
        heading: '1. Introduction and functions of the skeletal system',
        content: 'The skeletal system consists of bones, cartilage, joints and ligaments. An adult human skeleton typically contains 206 bones. The skeleton provides the structural framework of the body and works with skeletal muscles to produce movement.',
        points: [
          'Support: provides a framework that supports the body and maintains its shape and posture.',
          'Protection: the skull protects the brain, the vertebral column protects the spinal cord, and the rib cage protects the heart and lungs.',
          'Movement: bones act as levers while skeletal muscles provide the force needed for movement.',
          'Mineral storage: bones store calcium and phosphate, which are important for nerve function, muscle contraction and other cellular processes.',
          'Haemopoiesis: red bone marrow produces red blood cells, white blood cells and platelets.',
          'Fat storage: yellow bone marrow stores triglycerides as an energy reserve.'
        ]
      },
      {
        heading: '2. Divisions of the skeleton',
        content: 'The human skeleton is divided into the axial skeleton and the appendicular skeleton.',
        points: [
          'Axial skeleton: approximately 80 bones forming the central axis. It includes the skull, auditory ossicles, hyoid bone, vertebral column, ribs and sternum.',
          'Appendicular skeleton: approximately 126 bones. It includes the upper and lower limbs, pectoral girdles and pelvic girdle.',
          'The pectoral girdle consists of the clavicles and scapulae and connects the upper limbs to the axial skeleton.',
          'The pelvic girdle consists of the two hip bones and connects the lower limbs to the axial skeleton.'
        ]
      },
      {
        heading: '3. Classification of bones by shape',
        content: 'Bones are classified according to their shape and structure.',
        points: [
          'Long bones: longer than they are wide; examples include the femur, humerus, tibia and radius. They function mainly in support and movement.',
          'Short bones: approximately cube-shaped; examples include the carpals and tarsals. They provide stability and limited movement.',
          'Flat bones: thin, often curved bones; examples include the sternum, ribs, scapulae and cranial bones. They protect organs and provide surfaces for muscle attachment.',
          'Irregular bones: have complex shapes; examples include vertebrae and some facial bones.',
          'Sesamoid bones: develop within tendons; the patella is the largest example. They reduce friction and modify the pull of tendons.'
        ]
      },
      {
        heading: '4. Gross structure of a long bone',
        content: 'A long bone has specialised regions that support strength, growth and blood cell production.',
        points: [
          'Diaphysis: the shaft or central portion of a long bone, mainly composed of compact bone.',
          'Epiphysis: the expanded end of a long bone, containing mainly spongy bone covered by a thin layer of compact bone.',
          'Metaphysis: the region between the diaphysis and epiphysis; in growing bones it contains the epiphyseal growth plate.',
          'Epiphyseal plate: a cartilage plate responsible for longitudinal bone growth. It is eventually replaced by bone, leaving an epiphyseal line.',
          'Periosteum: a tough vascular connective tissue membrane covering the outer surface of bone except at articular surfaces. It contains cells important in growth and repair.',
          'Endosteum: a thin membrane lining the medullary cavity and internal bone surfaces.',
          'Medullary cavity: the central cavity of the diaphysis, usually containing yellow marrow in adults.',
          'Compact bone: dense outer bone that provides strength and resistance to mechanical stress.',
          'Spongy bone: a network of trabeculae containing spaces that may house red bone marrow.',
          'Articular cartilage: hyaline cartilage covering the ends of bones at synovial joints; it reduces friction and absorbs shock.'
        ]
      },
      {
        heading: '5. Bone cells and bone matrix',
        content: 'Bone is a living connective tissue made up of cells and a mineralised extracellular matrix.',
        points: [
          'Osteoblasts: bone-forming cells that produce osteoid, the unmineralised organic component of bone matrix. They promote mineralisation.',
          'Osteocytes: mature bone cells located in lacunae. They maintain bone tissue and help sense mechanical stress.',
          'Osteoclasts: large cells that break down and resorb bone during normal remodelling.',
          'Organic matrix: mainly type I collagen, which provides tensile strength and flexibility.',
          'Inorganic matrix: mainly calcium phosphate crystals in the form of hydroxyapatite, which provide hardness and resistance to compression.'
        ]
      },
      {
        heading: '6. Bone formation, growth and remodelling',
        content: 'Ossification is the process by which bone tissue forms. Bone remodelling involves the continuous removal of old bone and formation of new bone.',
        points: [
          'Intramembranous ossification: bone develops directly from mesenchymal connective tissue. It forms many flat bones, including parts of the skull and clavicle.',
          'Endochondral ossification: bone replaces a pre-existing hyaline cartilage model. Most bones, including long bones, develop by this process.',
          'Longitudinal growth occurs at the epiphyseal growth plates while they remain open.',
          'Bone increases in thickness through appositional growth involving cells in the periosteum.',
          'Osteoclasts resorb bone while osteoblasts form new bone. Their coordinated activity maintains bone strength and helps regulate mineral balance.',
          'Parathyroid hormone increases blood calcium partly by promoting bone resorption through its effects on bone cells. Calcitonin can inhibit osteoclast activity, although its role in adult calcium regulation is relatively limited.',
          'Vitamin D supports intestinal absorption of calcium and phosphate, which are essential for normal bone mineralisation.'
        ]
      },
      {
        heading: '7. Classification of joints',
        content: 'A joint, or articulation, is the site where two or more bones meet. Joints are classified structurally according to the tissue connecting the bones and the presence or absence of a joint cavity.',
        points: [
          'Fibrous joints: bones are connected by dense fibrous connective tissue. They usually allow little or no movement. Examples include skull sutures.',
          'Cartilaginous joints: bones are connected by cartilage. Examples include intervertebral discs and the pubic symphysis.',
          'Synovial joints: bones are separated by a joint cavity containing synovial fluid. They are freely movable and are the most common joints in the limbs.'
        ]
      },
      {
        heading: '8. Structure of a synovial joint',
        content: 'Synovial joints permit a wide range of movement and contain several structures that reduce friction and provide stability.',
        points: [
          'Articular cartilage covers the ends of articulating bones and reduces friction.',
          'The joint capsule encloses the joint and consists of an outer fibrous layer and an inner synovial membrane.',
          'The synovial membrane produces synovial fluid, which lubricates the joint and helps nourish articular cartilage.',
          'Ligaments connect bone to bone and reinforce joints.',
          'Tendons connect muscle to bone and help stabilise joints.',
          'Bursae are fluid-filled sacs that reduce friction between moving structures.',
          'Menisci or articular discs are fibrocartilaginous structures found in certain joints, such as the knee, where they improve fit and distribute load.'
        ]
      },
      {
        heading: '9. Common types of synovial joints and movements',
        content: 'The shape of the articulating surfaces influences the movements permitted at a synovial joint.',
        points: [
          'Ball-and-socket: permits movement in several directions, including rotation. Examples are the shoulder and hip.',
          'Hinge: mainly permits flexion and extension. Examples include the elbow and interphalangeal joints.',
          'Pivot: permits rotation around a central axis. Examples include the atlanto-axial joint and proximal radioulnar joint.',
          'Condyloid: permits movement in two planes, such as the wrist joint.',
          'Saddle: permits movement in two planes; an example is the carpometacarpal joint of the thumb.',
          'Plane or gliding: permits sliding movements between relatively flat surfaces; examples include some intercarpal joints.',
          'Flexion decreases the angle between bones; extension increases it.',
          'Abduction moves a body part away from the midline; adduction moves it towards the midline.',
          'Rotation involves movement around a longitudinal axis; circumduction combines several movements.',
          'Dorsiflexion raises the foot towards the shin; plantar flexion points the foot downwards.'
        ]
      },
      {
        heading: '10. Fractures and bone healing',
        content: 'A fracture is a partial or complete break in the continuity of a bone. It may result from trauma, repetitive stress or disease that weakens bone.',
        points: [
          'Closed fracture: the skin over the fracture remains intact.',
          'Open fracture: the fracture communicates with the external environment through a wound, increasing infection risk.',
          'Complete fracture: the bone is broken through its entire width.',
          'Incomplete fracture: the break does not extend through the entire bone; examples include greenstick fractures.',
          'Displaced fracture: the bone fragments have moved out of their normal alignment.',
          'Bone healing begins with haematoma formation and inflammation, followed by soft callus formation, hard callus formation and remodelling.',
          'Adequate blood supply, immobilisation, nutrition and appropriate alignment support healing.'
        ]
      },
      {
        heading: '11. Common skeletal disorders',
        content: 'Skeletal disorders may affect bone density, mineralisation, structure or joint function.',
        points: [
          'Osteoporosis: reduced bone mass and deterioration of bone microarchitecture, increasing fracture risk. Common fracture sites include the hip, vertebrae and wrist.',
          'Rickets: defective mineralisation of growing bones in children, commonly associated with vitamin D deficiency. It may cause bowed legs and skeletal deformities.',
          'Osteomalacia: defective mineralisation of mature bone in adults, which may cause bone pain and muscle weakness.',
          'Osteoarthritis: a degenerative joint disorder involving articular cartilage loss and changes in other joint structures, commonly causing pain and stiffness.',
          'Osteomyelitis: infection of bone, commonly bacterial, which may cause local pain, fever, swelling and reduced function.'
        ]
      },
      {
        heading: '12. Nursing application: care of patients with fractures',
        content: 'Nursing care aims to prevent further injury, maintain circulation and nerve function, control pain, prevent complications and support rehabilitation.',
        points: [
          'Assess the mechanism of injury, pain, swelling, deformity, skin integrity and the affected limb.',
          'Immobilise the injured area and the joints above and below the suspected fracture where appropriate. Avoid unnecessary movement.',
          'Assess distal neurovascular status and compare with the unaffected limb. Check pain, pallor, pulses, paresthesia, paralysis and poikilothermia (unusual coldness).',
          'Severe pain, pain on passive stretch, increasing swelling or altered sensation may indicate compartment syndrome and require urgent escalation. A palpable pulse does not exclude compartment syndrome.',
          'Monitor vital signs, wound condition, bleeding and signs of infection, particularly with open fractures.',
          'Administer prescribed analgesics and antibiotics when indicated, and monitor their effects.',
          'Support prescribed traction, cast or external fixation care. Do not insert objects into a cast or alter it without authorisation.',
          'Encourage prescribed mobilisation, exercises and rehabilitation to reduce complications such as muscle wasting, joint stiffness and venous thromboembolism.',
          'Teach the patient to report increasing pain, numbness, tingling, swelling, colour changes, fever or offensive wound discharge.'
        ]
      }
    ],
    clinical: 'A patient arrives after a road traffic accident with a fractured tibia in a plaster cast. The nurse should assess pain, colour, temperature, movement, sensation and distal pulses, comparing both legs. Increasing severe pain, pain on passive stretch or new numbness may suggest compartment syndrome. This is an emergency requiring immediate escalation; the nurse should not wait for the pulse to disappear.',
    examPoints: [
      'The adult skeleton typically contains 206 bones.',
      'The axial skeleton has approximately 80 bones; the appendicular skeleton has approximately 126.',
      'The femur is the longest and strongest bone in the body.',
      'Osteoblasts build bone, osteocytes maintain bone and osteoclasts resorb bone.',
      'Intramembranous ossification forms many flat bones; endochondral ossification forms most bones.',
      'The epiphyseal plate is responsible for longitudinal growth of long bones.',
      'Red bone marrow is responsible for haemopoiesis.',
      'Yellow bone marrow primarily stores fat.',
      'Synovial joints are freely movable and contain a joint cavity with synovial fluid.',
      'The hip and shoulder are ball-and-socket joints; the elbow is a hinge joint.',
      'Vitamin D supports calcium absorption and normal bone mineralisation.',
      'The six Ps of neurovascular assessment are pain, pallor, pulselessness, paresthesia, paralysis and poikilothermia. Pulselessness is a late and serious sign.'
    ],
    questions: [
      {
        question: 'Which of the following is a major function of the skeletal system?',
        options: ['Production of bile', 'Haemopoiesis', 'Secretion of insulin', 'Production of digestive enzymes'],
        answer: 'B',
        explanation: 'Haemopoiesis is the production of blood cells in red bone marrow. The skeleton also supports the body, protects organs, enables movement and stores minerals.'
      },
      {
        question: 'Which bones form part of the axial skeleton?',
        options: ['Femur and tibia', 'Humerus and radius', 'Ribs and vertebral column', 'Carpals and tarsals'],
        answer: 'C',
        explanation: 'The ribs and vertebral column belong to the axial skeleton, which forms the central axis of the body.'
      },
      {
        question: 'Which bone cell is primarily responsible for bone resorption?',
        options: ['Osteoblast', 'Osteocyte', 'Osteoclast', 'Chondrocyte'],
        answer: 'C',
        explanation: 'Osteoclasts break down bone tissue during resorption. Osteoblasts form new bone, while osteocytes maintain mature bone.'
      },
      {
        question: 'The process by which bone replaces a pre-existing cartilage model is called:',
        options: ['Intramembranous ossification', 'Endochondral ossification', 'Haemopoiesis', 'Appositional growth'],
        answer: 'B',
        explanation: 'Endochondral ossification replaces a hyaline cartilage model with bone and is responsible for the development of most bones.'
      },
      {
        question: 'Which type of joint is found at the shoulder?',
        options: ['Hinge', 'Pivot', 'Ball-and-socket', 'Fibrous suture'],
        answer: 'C',
        explanation: 'The shoulder is a ball-and-socket synovial joint, permitting movement in several directions, including rotation.'
      },
      {
        question: 'A patient with a fracture develops severe increasing pain, pain on passive stretching and numbness. What complication should the nurse suspect?',
        options: ['Osteoporosis', 'Compartment syndrome', 'Osteoarthritis', 'Rickets'],
        answer: 'B',
        explanation: 'These are warning signs of compartment syndrome, in which raised pressure within a closed fascial compartment compromises tissue perfusion. It requires urgent medical assessment.'
      },
      {
        question: 'Which vitamin is essential for normal calcium absorption and bone mineralisation?',
        options: ['Vitamin C', 'Vitamin B12', 'Vitamin D', 'Vitamin K only'],
        answer: 'C',
        explanation: 'Vitamin D promotes intestinal absorption of calcium and phosphate, which are required for normal bone mineralisation.'
      }
    ]
  }
}

lessonContent["Muscular system"] = {
  "objectives": [
    "Define the muscular system and describe its major functions.",
    "Differentiate skeletal, cardiac and smooth muscle.",
    "Describe the microscopic structure of skeletal muscle.",
    "Explain the sliding filament mechanism of muscle contraction.",
    "Describe the roles of ATP, calcium and neuromuscular junctions.",
    "Explain muscle tone, fatigue and energy production.",
    "Relate common muscular disorders to nursing assessment and care."
  ],
  "notes": [
    {
      "heading": "1. Introduction and functions of the muscular system",
      "content": "The muscular system consists of specialised contractile tissues that generate force through the interaction of actin and myosin proteins. Muscles work with the skeletal and nervous systems to produce movement and maintain body functions.",
      "points": [
        "Movement: skeletal muscles produce voluntary body movements such as walking and lifting.",
        "Posture: continuous partial contraction helps maintain body position.",
        "Joint stability: muscles and tendons support and stabilise joints.",
        "Heat production: muscle contraction generates heat and contributes to thermoregulation.",
        "Protection: muscular layers support and protect internal organs.",
        "Movement of substances: smooth muscle moves food through the gastrointestinal tract and regulates blood vessel diameter.",
        "Circulation: cardiac muscle pumps blood, while skeletal muscle contractions assist venous return."
      ]
    },
    {
      "heading": "2. Classification of muscle tissue",
      "content": "There are three major types of muscle tissue. They differ in appearance, location, control and contraction characteristics.",
      "points": [
        "Skeletal muscle: striated, voluntary and usually attached to bones by tendons. It is responsible for body movement.",
        "Cardiac muscle: striated, involuntary and found only in the myocardium of the heart. Its cells are branched and connected by intercalated discs.",
        "Smooth muscle: non-striated and involuntary. It occurs in the walls of hollow organs such as the intestines, uterus, bladder and blood vessels.",
        "Skeletal muscle fibres are long and multinucleated, with nuclei located peripherally.",
        "Cardiac muscle cells usually have one centrally located nucleus, sometimes two.",
        "Smooth muscle cells are spindle-shaped and have a single central nucleus."
      ]
    },
    {
      "heading": "3. Gross structure of skeletal muscle",
      "content": "A skeletal muscle is an organised organ made up of muscle fibres, connective tissue, blood vessels and nerves. Its connective tissue coverings support the muscle and transmit force.",
      "points": [
        "Epimysium surrounds the entire muscle.",
        "Perimysium surrounds bundles of muscle fibres called fascicles.",
        "Endomysium surrounds each individual muscle fibre.",
        "A tendon is a strong connective tissue structure that attaches muscle to bone.",
        "An individual muscle fibre is a muscle cell containing many myofibrils.",
        "Myofibrils consist of repeating functional units called sarcomeres."
      ]
    },
    {
      "heading": "4. Microscopic structure and the sarcomere",
      "content": "The sarcomere is the basic functional contractile unit of striated muscle. It extends from one Z disc to the next. Its organised arrangement of thick and thin filaments produces the characteristic striations.",
      "points": [
        "Actin forms the thin filaments.",
        "Myosin forms the thick filaments and contains heads that bind to actin.",
        "The Z discs mark the boundaries of each sarcomere.",
        "The A band represents the length of the thick filaments and remains relatively constant during contraction.",
        "The I band contains thin filaments without overlapping thick filaments and becomes shorter during contraction.",
        "The H zone is the central region containing thick filaments without thin filament overlap; it narrows during contraction.",
        "The M line is located at the centre of the sarcomere.",
        "The sarcoplasmic reticulum stores and releases calcium ions required for contraction."
      ]
    },
    {
      "heading": "5. Neuromuscular junction and excitation",
      "content": "The neuromuscular junction is the specialised synapse between a motor neuron and a skeletal muscle fibre. It converts a nerve impulse into a muscle action potential.",
      "points": [
        "An action potential reaches the terminal of a motor neuron.",
        "Calcium enters the nerve terminal and triggers release of acetylcholine.",
        "Acetylcholine crosses the synaptic cleft and binds to receptors on the motor end plate.",
        "This produces depolarisation of the muscle membrane and initiates a muscle action potential.",
        "The action potential travels along the sarcolemma and into the transverse tubules.",
        "The signal triggers calcium release from the sarcoplasmic reticulum.",
        "Acetylcholinesterase breaks down acetylcholine, helping terminate the signal."
      ]
    },
    {
      "heading": "6. Sliding filament mechanism of muscle contraction",
      "content": "The sliding filament theory explains how a muscle shortens. Thin actin filaments slide over thick myosin filaments, bringing the Z discs closer together. The filaments themselves do not significantly shorten.",
      "points": [
        "A nerve impulse stimulates release of calcium from the sarcoplasmic reticulum.",
        "Calcium binds to troponin on the thin filament.",
        "Troponin changes shape, moving tropomyosin away from the myosin-binding sites on actin.",
        "Myosin heads attach to actin, forming cross-bridges.",
        "The myosin heads perform a power stroke, pulling actin towards the centre of the sarcomere.",
        "ATP binds to myosin, causing it to detach from actin.",
        "ATP is hydrolysed, re-energising the myosin head for another cycle.",
        "Relaxation occurs when calcium is pumped back into the sarcoplasmic reticulum and binding sites become covered again."
      ]
    },
    {
      "heading": "7. Role of ATP and energy sources",
      "content": "Muscle contraction requires energy in the form of adenosine triphosphate (ATP). ATP is also required for myosin detachment and for calcium transport back into the sarcoplasmic reticulum.",
      "points": [
        "Stored ATP provides energy for a very short period of intense activity.",
        "Creatine phosphate rapidly regenerates ATP during short, high-intensity activity.",
        "Anaerobic glycolysis produces ATP without requiring oxygen and can contribute during intense exercise.",
        "Aerobic respiration uses oxygen to produce larger amounts of ATP from glucose and fatty acids.",
        "Muscle cells contain myoglobin, which stores oxygen and assists its availability during activity.",
        "Prolonged exercise relies increasingly on aerobic energy production."
      ]
    },
    {
      "heading": "8. Types of muscle contraction",
      "content": "Muscle contraction may produce movement or develop tension without changing muscle length.",
      "points": [
        "Isometric contraction: muscle develops tension without a noticeable change in length, for example holding an object still.",
        "Concentric contraction: the muscle shortens while producing force, for example lifting a weight.",
        "Eccentric contraction: the muscle lengthens while remaining active, for example slowly lowering a weight.",
        "Isotonic contraction involves muscle length changing while tension is produced."
      ]
    },
    {
      "heading": "9. Muscle tone, fatigue and motor units",
      "content": "Muscle tone is the continuous, partial contraction of resting skeletal muscles. It helps maintain posture and readiness for movement. A motor unit consists of one motor neuron and all the muscle fibres it supplies.",
      "points": [
        "Small motor units allow precise movements, such as movements of the fingers and eyes.",
        "Large motor units generate greater force and are found in muscles used for powerful movements.",
        "Motor unit recruitment increases the number of active muscle fibres and increases contraction strength.",
        "Muscle fatigue is a reduction in the ability of a muscle to generate the expected force.",
        "Fatigue may be associated with prolonged activity, inadequate energy availability, impaired excitation-contraction processes and other physiological factors.",
        "Adequate rest, nutrition, hydration and appropriate exercise support normal muscle function."
      ]
    },
    {
      "heading": "10. Common muscular disorders",
      "content": "Muscular disorders may result from inherited conditions, autoimmune disease, infection, injury, metabolic problems or nerve dysfunction.",
      "points": [
        "Muscular dystrophy: a group of inherited disorders characterised by progressive muscle weakness and degeneration.",
        "Myasthenia gravis: an autoimmune disorder affecting neuromuscular transmission, commonly causing fatigable muscle weakness.",
        "Myositis: inflammation of muscle tissue, which may cause weakness and muscle pain.",
        "Muscle strain: overstretching or tearing of muscle fibres.",
        "Rhabdomyolysis: breakdown of skeletal muscle releasing myoglobin into the bloodstream, potentially causing acute kidney injury.",
        "Muscle cramps: sudden involuntary painful contractions that may be associated with exertion, dehydration or electrolyte disturbances."
      ]
    },
    {
      "heading": "11. Nursing assessment and management",
      "content": "Nurses assess muscular function through history taking, inspection, palpation and functional assessment. Findings should be interpreted alongside the patient's overall clinical condition.",
      "points": [
        "Assess muscle strength and compare corresponding muscle groups on both sides of the body.",
        "Assess muscle tone, size, symmetry, tenderness and involuntary movements.",
        "Evaluate mobility, gait, balance and ability to perform activities of daily living.",
        "Assess pain, onset of weakness, progression, medication history and recent injury.",
        "Monitor vital signs and respiratory function when severe neuromuscular weakness is suspected.",
        "Review relevant investigations such as creatine kinase, electrolytes, renal function and electromyography as ordered.",
        "Promote safe mobility, appropriate exercise and physiotherapy where indicated.",
        "Prevent complications of immobility through repositioning, skin care, range-of-motion exercises and venous thromboembolism prevention as appropriate.",
        "In suspected rhabdomyolysis, promptly report severe muscle pain, weakness or dark urine and monitor renal function and urine output."
      ]
    }
  ],
  "clinicalApplication": "A patient presents with progressive difficulty climbing stairs and rising from a seated position. The nurse assesses proximal muscle strength, gait, muscle wasting, pain and functional ability. The nurse documents findings, assesses respiratory and swallowing function if a neuromuscular disorder is suspected, and reports significant deterioration promptly. In a patient with severe muscle injury and dark urine, urgent assessment is needed because rhabdomyolysis can cause acute kidney injury.",
  "examPoints": [
    "The three muscle types are skeletal, cardiac and smooth.",
    "Skeletal muscle is voluntary and striated.",
    "Cardiac muscle is involuntary, striated and contains intercalated discs.",
    "Smooth muscle is involuntary and non-striated.",
    "The sarcomere is the functional contractile unit of striated muscle.",
    "Actin forms thin filaments; myosin forms thick filaments.",
    "Calcium binds to troponin to expose actin-binding sites.",
    "ATP is essential for cross-bridge cycling and muscle relaxation.",
    "The neuromuscular junction uses acetylcholine.",
    "The A band remains relatively constant during sarcomere contraction.",
    "Isometric contraction produces tension without changing muscle length.",
    "Myasthenia gravis causes fatigable muscle weakness.",
    "Rhabdomyolysis may lead to acute kidney injury."
  ],
  "questions": [
    {
      "question": "Which type of muscle tissue is found in the walls of the intestines?",
      "options": [
        "Skeletal muscle",
        "Cardiac muscle",
        "Smooth muscle",
        "Striated voluntary muscle"
      ],
      "answer": "C",
      "explanation": "Smooth muscle is involuntary and is found in the walls of hollow organs, including the intestines, where it produces peristalsis."
    },
    {
      "question": "What is the basic functional contractile unit of skeletal muscle?",
      "options": [
        "Myofibril",
        "Sarcomere",
        "Fascicle",
        "Tendon"
      ],
      "answer": "B",
      "explanation": "The sarcomere extends between two Z discs and contains the organised actin and myosin filaments responsible for contraction."
    },
    {
      "question": "Which neurotransmitter is released at the skeletal neuromuscular junction?",
      "options": [
        "Dopamine",
        "Serotonin",
        "Acetylcholine",
        "Noradrenaline"
      ],
      "answer": "C",
      "explanation": "Motor neurons release acetylcholine, which binds to receptors on the motor end plate and initiates a muscle action potential."
    },
    {
      "question": "Which ion binds to troponin to initiate skeletal muscle contraction?",
      "options": [
        "Sodium",
        "Potassium",
        "Calcium",
        "Chloride"
      ],
      "answer": "C",
      "explanation": "Calcium binds to troponin, causing tropomyosin to move and expose myosin-binding sites on actin."
    },
    {
      "question": "Which statement about the sliding filament mechanism is correct?",
      "options": [
        "Actin and myosin filaments both shorten",
        "Actin slides over myosin",
        "Myosin slides over the Z discs",
        "The filaments slide past one another"
      ],
      "answer": "D",
      "explanation": "During contraction, thin and thick filaments slide past each other. The sarcomere shortens, but the filaments themselves do not significantly shorten."
    },
    {
      "question": "Which muscle structure surrounds an individual muscle fibre?",
      "options": [
        "Epimysium",
        "Perimysium",
        "Endomysium",
        "Fascia lata"
      ],
      "answer": "C",
      "explanation": "Endomysium surrounds an individual muscle fibre. Perimysium surrounds a fascicle, while epimysium surrounds the entire muscle."
    },
    {
      "question": "A patient holds a heavy object in one position without moving it. Which type of contraction is occurring?",
      "options": [
        "Concentric",
        "Eccentric",
        "Isometric",
        "Isokinetic"
      ],
      "answer": "C",
      "explanation": "An isometric contraction develops muscle tension without a noticeable change in muscle length."
    },
    {
      "question": "Which feature is characteristic of cardiac muscle?",
      "options": [
        "Multinucleated fibres with peripheral nuclei",
        "Intercalated discs",
        "Voluntary control",
        "Absence of striations"
      ],
      "answer": "B",
      "explanation": "Cardiac muscle cells are connected by intercalated discs, which help coordinate electrical and mechanical activity."
    },
    {
      "question": "A patient with myasthenia gravis is most likely to present with which finding?",
      "options": [
        "Progressive fatigable muscle weakness",
        "Increased muscle strength after activity",
        "Permanent joint dislocation",
        "Excessive bone formation"
      ],
      "answer": "A",
      "explanation": "Myasthenia gravis impairs neuromuscular transmission and commonly causes weakness that worsens with repeated activity and improves with rest."
    },
    {
      "question": "A patient develops severe muscle pain and dark urine following extensive muscle injury. Which complication should the nurse be particularly concerned about?",
      "options": [
        "Acute kidney injury",
        "Peptic ulcer disease",
        "Hyperthyroidism",
        "Cataracts"
      ],
      "answer": "A",
      "explanation": "Rhabdomyolysis releases myoglobin into the circulation. Myoglobin can damage renal tubules and cause acute kidney injury."
    }
  ]
};

lessonContent["Cardiovascular system"] = {
  "objectives": [
    "Describe the location, coverings and chambers of the heart.",
    "Explain the structure and functions of heart valves.",
    "Trace blood flow through pulmonary and systemic circulation.",
    "Describe the cardiac conduction system.",
    "Explain the cardiac cycle and heart sounds.",
    "Discuss cardiac output and factors affecting it.",
    "Explain blood pressure regulation and its clinical significance.",
    "Describe basic cardiovascular assessment and investigations."
  ],
  "notes": [
    {
      "heading": "1. Introduction and functions of the cardiovascular system",
      "content": "The cardiovascular system consists of the heart, blood and blood vessels. It maintains circulation and transports substances throughout the body.",
      "points": [
        "Transports oxygen from the lungs to body tissues.",
        "Carries carbon dioxide from tissues to the lungs for elimination.",
        "Transports nutrients, hormones and metabolic waste products.",
        "Helps regulate body temperature, fluid balance and tissue perfusion.",
        "Supports immune defence by transporting white blood cells and antibodies.",
        "Maintains tissue homeostasis through continuous circulation."
      ]
    },
    {
      "heading": "2. Location and coverings of the heart",
      "content": "The heart is a hollow muscular organ located in the thoracic cavity within the mediastinum, between the lungs. It lies posterior to the sternum and rests on the diaphragm. Its apex points downwards, forwards and to the left.",
      "points": [
        "The heart is approximately the size of a closed fist, although size varies between individuals.",
        "The pericardium is the protective sac surrounding the heart.",
        "The fibrous pericardium is the tough outer layer that helps anchor and protect the heart.",
        "The serous pericardium has parietal and visceral layers.",
        "The visceral layer of the serous pericardium is also called the epicardium.",
        "Pericardial fluid reduces friction during cardiac movement.",
        "The wall of the heart consists of epicardium, myocardium and endocardium.",
        "The myocardium is the muscular middle layer responsible for contraction.",
        "The endocardium lines the internal chambers and covers the valves."
      ]
    },
    {
      "heading": "3. Chambers and septa of the heart",
      "content": "The heart has four chambers: two atria and two ventricles. The atria receive blood, while the ventricles pump blood out of the heart.",
      "points": [
        "The right atrium receives deoxygenated blood from the superior vena cava, inferior vena cava and coronary sinus.",
        "The right ventricle pumps deoxygenated blood to the lungs through the pulmonary trunk.",
        "The left atrium receives oxygenated blood from the pulmonary veins.",
        "The left ventricle pumps oxygenated blood into the aorta for systemic circulation.",
        "The interventricular septum separates the right and left ventricles.",
        "The interatrial septum separates the two atria.",
        "The left ventricular wall is thicker than the right because it pumps blood against the higher resistance of systemic circulation."
      ]
    },
    {
      "heading": "4. Heart valves and their functions",
      "content": "Heart valves maintain one-way blood flow and prevent backflow during the cardiac cycle. They open and close in response to pressure differences.",
      "points": [
        "The tricuspid valve lies between the right atrium and right ventricle.",
        "The pulmonary valve lies between the right ventricle and pulmonary trunk.",
        "The mitral or bicuspid valve lies between the left atrium and left ventricle.",
        "The aortic valve lies between the left ventricle and aorta.",
        "The tricuspid and mitral valves are atrioventricular valves.",
        "The pulmonary and aortic valves are semilunar valves.",
        "Chordae tendineae and papillary muscles help prevent the atrioventricular valves from prolapsing into the atria during ventricular contraction.",
        "Valve disease can cause stenosis, where opening is restricted, or regurgitation, where blood flows backwards."
      ]
    },
    {
      "heading": "5. Blood flow through the heart",
      "content": "Blood passes through the right side of the heart to the lungs for gas exchange, then returns to the left side and is pumped to the rest of the body.",
      "points": [
        "Body tissues → superior and inferior vena cava → right atrium.",
        "Right atrium → tricuspid valve → right ventricle.",
        "Right ventricle → pulmonary valve → pulmonary trunk and pulmonary arteries.",
        "Pulmonary arteries carry deoxygenated blood to the lungs.",
        "In pulmonary capillaries, blood releases carbon dioxide and receives oxygen.",
        "Pulmonary veins carry oxygenated blood to the left atrium.",
        "Left atrium → mitral valve → left ventricle.",
        "Left ventricle → aortic valve → aorta → systemic circulation.",
        "Important exception: pulmonary arteries carry deoxygenated blood, while pulmonary veins carry oxygenated blood."
      ]
    },
    {
      "heading": "6. Pulmonary and systemic circulation",
      "content": "The cardiovascular system operates through two major circulatory pathways that function together.",
      "points": [
        "Pulmonary circulation carries blood from the right ventricle to the lungs and returns it to the left atrium.",
        "Its main purpose is gas exchange in the pulmonary capillaries.",
        "Systemic circulation carries blood from the left ventricle to body tissues and returns it to the right atrium.",
        "The systemic circulation supplies oxygen and nutrients to tissues and collects metabolic waste.",
        "Coronary circulation supplies the myocardium with oxygenated blood through the coronary arteries.",
        "The coronary arteries arise from the base of the aorta.",
        "Most venous blood from the myocardium returns through the coronary sinus into the right atrium."
      ]
    },
    {
      "heading": "7. Cardiac muscle and its properties",
      "content": "Cardiac muscle is specialised striated involuntary muscle found in the myocardium. Its cells are interconnected, allowing coordinated contraction.",
      "points": [
        "Cardiac muscle cells are usually branched and have one centrally located nucleus.",
        "Intercalated discs connect adjacent cardiac muscle cells.",
        "Gap junctions allow electrical impulses to spread between cells.",
        "Desmosomes provide mechanical attachment and prevent cells from separating during contraction.",
        "Cardiac muscle is autorhythmic because specialised cells can generate spontaneous electrical impulses.",
        "The myocardium has a high energy requirement and depends heavily on aerobic metabolism.",
        "The heart normally contracts in a coordinated manner to maintain effective pumping."
      ]
    },
    {
      "heading": "8. Cardiac conduction system",
      "content": "The cardiac conduction system generates and transmits electrical impulses that coordinate atrial and ventricular contraction.",
      "points": [
        "The sinoatrial (SA) node is located in the right atrium near the opening of the superior vena cava.",
        "The SA node is the normal pacemaker of the heart.",
        "The impulse spreads across the atria, causing atrial depolarisation and contraction.",
        "The atrioventricular (AV) node briefly delays conduction, allowing ventricular filling.",
        "The impulse travels through the bundle of His, also called the atrioventricular bundle.",
        "The bundle branches conduct impulses along the interventricular septum.",
        "Purkinje fibres distribute impulses through the ventricular myocardium, producing coordinated ventricular contraction.",
        "Abnormal impulse generation or conduction may cause cardiac arrhythmias."
      ]
    },
    {
      "heading": "9. The cardiac cycle",
      "content": "The cardiac cycle refers to the sequence of events occurring during one complete heartbeat. It includes relaxation and contraction of the atria and ventricles.",
      "points": [
        "Diastole is the relaxation phase, during which the chambers fill with blood.",
        "During ventricular filling, the atrioventricular valves are open and the semilunar valves are closed.",
        "Atrial systole completes ventricular filling by contracting the atria.",
        "Ventricular systole begins with ventricular contraction and closure of the atrioventricular valves.",
        "During ventricular ejection, ventricular pressure exceeds pressure in the aorta and pulmonary trunk, opening the semilunar valves.",
        "As the ventricles relax, the semilunar valves close.",
        "The cycle then returns to ventricular filling.",
        "At a normal resting heart rate, one cardiac cycle lasts approximately 0.8 seconds at 75 beats per minute."
      ]
    },
    {
      "heading": "10. Heart sounds",
      "content": "Normal heart sounds are produced mainly by vibrations associated with closure of the heart valves and surrounding structures.",
      "points": [
        "S1 (lub) results mainly from closure of the mitral and tricuspid valves at the beginning of ventricular systole.",
        "S2 (dub) results mainly from closure of the aortic and pulmonary valves at the beginning of ventricular diastole.",
        "S1 is associated with the start of ventricular systole.",
        "S2 is associated with the end of ventricular systole and start of diastole.",
        "Heart murmurs are abnormal sounds caused by turbulent blood flow, commonly associated with valve abnormalities or structural defects.",
        "Auscultation helps identify heart rate, rhythm, normal sounds and additional sounds or murmurs."
      ]
    },
    {
      "heading": "11. Cardiac output and stroke volume",
      "content": "Cardiac output is the volume of blood pumped by one ventricle per minute. It is determined by heart rate and stroke volume.",
      "points": [
        "Cardiac output (CO) = heart rate (HR) × stroke volume (SV).",
        "Stroke volume is the volume of blood ejected by one ventricle during each heartbeat.",
        "A typical resting adult cardiac output is approximately 5 litres per minute, although it varies with body size and physiological demand.",
        "Preload refers to ventricular stretch at the end of diastole and is influenced by venous return.",
        "Contractility is the intrinsic strength of myocardial contraction.",
        "Afterload is the resistance or pressure against which the ventricle must pump.",
        "Increased heart rate or stroke volume can increase cardiac output, provided adequate filling and effective pumping are maintained.",
        "Severe bradycardia, tachycardia or reduced contractility may reduce effective cardiac output."
      ]
    },
    {
      "heading": "12. Blood vessels and their functions",
      "content": "Blood vessels form a network that distributes blood to tissues and returns it to the heart. Their structures are adapted to their functions.",
      "points": [
        "Arteries carry blood away from the heart and have thick, elastic muscular walls.",
        "Arterioles regulate blood flow into capillary beds and contribute significantly to peripheral vascular resistance.",
        "Capillaries have thin walls that allow exchange of gases, nutrients and waste products.",
        "Venules collect blood from capillaries.",
        "Veins return blood to the heart and have relatively thinner walls and larger lumens than comparable arteries.",
        "Many veins, especially in the limbs, contain valves that prevent backflow.",
        "Skeletal muscle contraction and respiratory movements help venous return."
      ]
    },
    {
      "heading": "13. Blood pressure and its regulation",
      "content": "Blood pressure is the force exerted by circulating blood against arterial walls. It is influenced by cardiac output and systemic vascular resistance.",
      "points": [
        "Systolic blood pressure is the maximum arterial pressure during ventricular contraction.",
        "Diastolic blood pressure is the minimum arterial pressure during ventricular relaxation.",
        "Pulse pressure = systolic pressure minus diastolic pressure.",
        "Mean arterial pressure (MAP) can be estimated as diastolic pressure plus one-third of pulse pressure at a normal heart rate.",
        "Cardiac output and systemic vascular resistance are major determinants of arterial blood pressure.",
        "Baroreceptors in the carotid sinus and aortic arch detect changes in arterial stretch.",
        "The autonomic nervous system adjusts heart rate, contractility and vascular tone.",
        "The renin-angiotensin-aldosterone system promotes vasoconstriction and sodium and water retention, helping regulate blood pressure.",
        "Antidiuretic hormone promotes water retention by the kidneys.",
        "Atrial natriuretic peptide promotes sodium and water excretion and can reduce blood volume and pressure."
      ]
    },
    {
      "heading": "14. Electrocardiogram (ECG)",
      "content": "An electrocardiogram records the electrical activity of the heart using electrodes placed on the body surface. It assists in assessing rhythm, rate and electrical abnormalities.",
      "points": [
        "The P wave represents atrial depolarisation.",
        "The PR interval reflects conduction from the atria through the AV node and conduction pathway to the ventricles.",
        "The QRS complex represents ventricular depolarisation.",
        "Atrial repolarisation occurs but is usually hidden within the QRS complex.",
        "The T wave represents ventricular repolarisation.",
        "An ECG can help identify arrhythmias, conduction abnormalities and evidence suggestive of myocardial ischaemia or infarction.",
        "The nurse should ensure correct electrode placement, patient preparation and minimisation of movement artefacts.",
        "An ECG must be interpreted in clinical context and abnormal findings escalated appropriately."
      ]
    },
    {
      "heading": "15. Cardiovascular assessment and investigations",
      "content": "Cardiovascular assessment evaluates circulation, cardiac function and tissue perfusion. It combines patient history, physical examination and investigations.",
      "points": [
        "Take a history of chest pain, breathlessness, palpitations, dizziness, syncope, oedema and exercise tolerance.",
        "Assess pulse rate, rhythm, volume and equality between limbs where appropriate.",
        "Measure blood pressure using the correct cuff size and technique.",
        "Inspect for peripheral cyanosis, pallor, oedema and raised jugular venous pressure.",
        "Auscultate heart sounds and assess for murmurs or abnormal rhythms.",
        "Assess capillary refill, skin temperature and peripheral perfusion.",
        "ECG evaluates electrical activity.",
        "Echocardiography uses ultrasound to assess chambers, valves, ventricular function and cardiac structure.",
        "Cardiac biomarkers such as troponin assist in assessing myocardial injury.",
        "Full blood count, electrolytes, renal function and lipid profile may help identify contributing factors.",
        "Chest radiography may help assess heart size and pulmonary congestion."
      ]
    },
    {
      "heading": "16. Clinical significance and common disorders",
      "content": "Understanding normal cardiovascular physiology helps nurses recognise disease and identify deterioration early.",
      "points": [
        "Hypertension is persistently elevated arterial blood pressure and increases the risk of cardiovascular and renal complications.",
        "Atherosclerosis involves plaque formation within arterial walls and can restrict blood flow.",
        "Coronary artery disease occurs when coronary blood flow is reduced, commonly due to atherosclerosis.",
        "Myocardial infarction occurs when myocardial tissue is injured or dies due to prolonged inadequate blood supply.",
        "Heart failure occurs when the heart cannot pump sufficiently to meet the body's needs without compensatory elevation of filling pressures.",
        "Arrhythmias are abnormalities in heart rate, rhythm or electrical conduction.",
        "Shock is a state of inadequate tissue perfusion that can lead to cellular injury and organ dysfunction.",
        "Early recognition of chest pain, acute breathlessness, altered consciousness, hypotension and poor peripheral perfusion is essential."
      ]
    }
  ],
  "clinicalApplication": "A patient presents with chest discomfort, sweating and shortness of breath. The nurse rapidly assesses airway, breathing and circulation, obtains vital signs, assesses pain and perfusion, and arranges urgent clinical review. An ECG and cardiac troponin testing may be required. The nurse recognises that myocardial ischaemia can progress to infarction and that early assessment and escalation are critical.",
  "examPoints": [
    "The heart has four chambers: right atrium, right ventricle, left atrium and left ventricle.",
    "The myocardium is the muscular layer responsible for contraction.",
    "The SA node is the normal pacemaker of the heart.",
    "The AV node delays conduction to allow ventricular filling.",
    "The right ventricle pumps blood to the lungs.",
    "The left ventricle pumps blood into systemic circulation.",
    "Pulmonary arteries carry deoxygenated blood; pulmonary veins carry oxygenated blood.",
    "The tricuspid valve is on the right; the mitral valve is on the left.",
    "S1 is mainly due to closure of the mitral and tricuspid valves.",
    "S2 is mainly due to closure of the aortic and pulmonary valves.",
    "Cardiac output = heart rate × stroke volume.",
    "Systolic pressure occurs during ventricular systole; diastolic pressure during ventricular diastole.",
    "P wave = atrial depolarisation; QRS = ventricular depolarisation; T wave = ventricular repolarisation.",
    "Coronary arteries supply the myocardium."
  ],
  "questions": [
    {
      "question": "Which chamber of the heart pumps oxygenated blood into systemic circulation?",
      "options": [
        "Right atrium",
        "Right ventricle",
        "Left atrium",
        "Left ventricle"
      ],
      "answer": "D",
      "explanation": "The left ventricle pumps oxygenated blood through the aortic valve into the aorta for distribution to the body."
    },
    {
      "question": "Which structure is recognised as the normal pacemaker of the heart?",
      "options": [
        "AV node",
        "SA node",
        "Bundle of His",
        "Purkinje fibres"
      ],
      "answer": "B",
      "explanation": "The sinoatrial node normally initiates the electrical impulse that determines the heart's rhythm."
    },
    {
      "question": "Which valve is located between the left atrium and left ventricle?",
      "options": [
        "Tricuspid valve",
        "Pulmonary valve",
        "Mitral valve",
        "Aortic valve"
      ],
      "answer": "C",
      "explanation": "The mitral or bicuspid valve separates the left atrium from the left ventricle."
    },
    {
      "question": "Which blood vessel carries deoxygenated blood from the heart to the lungs?",
      "options": [
        "Pulmonary vein",
        "Aorta",
        "Pulmonary artery",
        "Superior vena cava"
      ],
      "answer": "C",
      "explanation": "The pulmonary arteries carry deoxygenated blood from the right ventricle to the lungs for gas exchange."
    },
    {
      "question": "What does the QRS complex represent on a normal ECG?",
      "options": [
        "Atrial depolarisation",
        "Ventricular depolarisation",
        "Ventricular repolarisation",
        "Atrial contraction only"
      ],
      "answer": "B",
      "explanation": "The QRS complex represents ventricular depolarisation, which precedes ventricular contraction."
    },
    {
      "question": "Which heart sound is mainly associated with closure of the mitral and tricuspid valves?",
      "options": [
        "S1",
        "S2",
        "S3 only",
        "S4 only"
      ],
      "answer": "A",
      "explanation": "S1 is the first heart sound, produced mainly by closure of the atrioventricular valves at the beginning of ventricular systole."
    },
    {
      "question": "A patient has a heart rate of 80 beats per minute and a stroke volume of 70 mL. What is the cardiac output?",
      "options": [
        "1,500 mL/min",
        "3,500 mL/min",
        "5,600 mL/min",
        "7,000 mL/min"
      ],
      "answer": "C",
      "explanation": "Cardiac output = heart rate × stroke volume = 80 × 70 = 5,600 mL/min, or 5.6 L/min."
    },
    {
      "question": "Which blood vessel type is the main site of exchange of gases and nutrients between blood and tissues?",
      "options": [
        "Arteries",
        "Arterioles",
        "Capillaries",
        "Large veins"
      ],
      "answer": "C",
      "explanation": "Capillaries have very thin walls that facilitate exchange between blood and surrounding tissues."
    },
    {
      "question": "Which ECG wave represents ventricular repolarisation?",
      "options": [
        "P wave",
        "QRS complex",
        "T wave",
        "PR interval"
      ],
      "answer": "C",
      "explanation": "The T wave represents ventricular repolarisation, the electrical recovery phase of the ventricles."
    },
    {
      "question": "A patient presents with chest pain, sweating and breathlessness. What is the nurse's most appropriate initial action?",
      "options": [
        "Encourage the patient to walk",
        "Assess airway, breathing, circulation and vital signs, and urgently escalate",
        "Offer a large meal",
        "Delay assessment until the pain resolves"
      ],
      "answer": "B",
      "explanation": "These symptoms may indicate acute coronary syndrome. Immediate assessment, monitoring and urgent escalation are essential."
    }
  ]
};

lessonContent["Respiratory system"] = {
  "objectives": [
    "Describe the anatomy of the respiratory tract and lungs.",
    "Differentiate the conducting and respiratory zones.",
    "Explain the mechanics of inspiration and expiration.",
    "Describe alveolar gas exchange and its influencing factors.",
    "Explain oxygen and carbon dioxide transport in blood.",
    "Discuss the neural and chemical regulation of breathing.",
    "Explain lung volumes and capacities.",
    "Describe respiratory assessment and common diagnostic investigations."
  ],
  "notes": [
    {
      "heading": "1. Introduction and functions of the respiratory system",
      "content": "The respiratory system consists of organs responsible for ventilation and gas exchange between the atmosphere and blood. It works closely with the cardiovascular system to supply oxygen to tissues and remove carbon dioxide.",
      "points": [
        "Oxygen uptake: supplies oxygen required for cellular aerobic metabolism.",
        "Carbon dioxide elimination: removes carbon dioxide produced during cellular metabolism.",
        "Acid-base regulation: controls carbon dioxide elimination and therefore influences blood pH.",
        "Voice production: airflow through the larynx enables phonation.",
        "Olfaction: specialised receptors in the nasal cavity detect odours.",
        "Air conditioning: warms, humidifies and filters inspired air.",
        "Protection: mucus, cilia, cough and sneeze reflexes help remove inhaled particles and pathogens."
      ]
    },
    {
      "heading": "2. Classification of the respiratory tract",
      "content": "The respiratory tract is divided anatomically into upper and lower respiratory tracts and functionally into conducting and respiratory zones.",
      "points": [
        "Upper respiratory tract generally includes the nose, nasal cavity, paranasal sinuses and pharynx.",
        "Lower respiratory tract includes the larynx, trachea, bronchi, bronchioles and lungs.",
        "The conducting zone transports, warms, humidifies and filters air.",
        "The conducting zone extends from the nose to the terminal bronchioles.",
        "The respiratory zone is the site of gas exchange.",
        "The respiratory zone includes respiratory bronchioles, alveolar ducts and alveoli."
      ]
    },
    {
      "heading": "3. Nose, nasal cavity and paranasal sinuses",
      "content": "The nose is the main entrance for inspired air. The nasal cavity conditions inhaled air before it reaches the lower respiratory tract.",
      "points": [
        "Nasal hairs trap relatively large particles.",
        "Mucus traps dust, microorganisms and other inhaled particles.",
        "Ciliated epithelial cells move mucus towards the pharynx for removal or swallowing.",
        "The rich blood supply of the nasal mucosa warms inspired air.",
        "The nasal cavity humidifies inspired air.",
        "The paranasal sinuses are air-filled spaces that communicate with the nasal cavity.",
        "The sinuses contribute to voice resonance and help condition inspired air."
      ]
    },
    {
      "heading": "4. Pharynx and larynx",
      "content": "The pharynx is a muscular passage shared by the respiratory and digestive systems. The larynx connects the pharynx to the trachea and protects the lower airway.",
      "points": [
        "The nasopharynx lies behind the nasal cavity and conducts air.",
        "The oropharynx lies behind the oral cavity and conducts both air and food.",
        "The laryngopharynx is the lower part of the pharynx and leads towards the larynx and oesophagus.",
        "The larynx contains the vocal cords and produces sound.",
        "The epiglottis helps protect the airway during swallowing.",
        "The vocal cords are involved in phonation and airway protection."
      ]
    },
    {
      "heading": "5. Trachea, bronchi and bronchioles",
      "content": "The tracheobronchial tree conducts air from the larynx towards the gas-exchanging regions of the lungs.",
      "points": [
        "The trachea is supported by C-shaped rings of hyaline cartilage that help prevent collapse.",
        "The trachea divides at the carina into right and left main bronchi.",
        "The right main bronchus is wider, shorter and more vertical than the left, making aspiration more likely into the right lung.",
        "The main bronchi divide into lobar bronchi, then segmental bronchi.",
        "Bronchioles are smaller airways with smooth muscle and no cartilage rings.",
        "Terminal bronchioles form the final part of the conducting zone.",
        "Respiratory bronchioles lead into alveolar ducts and alveolar sacs."
      ]
    },
    {
      "heading": "6. Lungs, lobes and pleura",
      "content": "The lungs are paired spongy organs in the thoracic cavity. They are responsible for pulmonary ventilation and gas exchange.",
      "points": [
        "The right lung has three lobes: superior, middle and inferior.",
        "The left lung has two lobes: superior and inferior.",
        "The cardiac notch accommodates part of the heart on the left lung.",
        "The apex of each lung extends slightly above the first rib.",
        "The base rests on the diaphragm.",
        "The visceral pleura covers the lung surface.",
        "The parietal pleura lines the inner thoracic wall and diaphragm.",
        "Pleural fluid reduces friction between the pleural layers.",
        "Negative intrapleural pressure helps keep the lungs expanded."
      ]
    },
    {
      "heading": "7. Alveoli and the respiratory membrane",
      "content": "Alveoli are tiny air sacs where oxygen and carbon dioxide are exchanged between alveolar air and pulmonary capillary blood. Their large surface area and thin walls make gas exchange efficient.",
      "points": [
        "Type I alveolar cells form the thin surface across which gases diffuse.",
        "Type II alveolar cells produce pulmonary surfactant.",
        "Surfactant reduces surface tension and helps prevent alveolar collapse.",
        "Alveolar macrophages engulf inhaled particles and microorganisms.",
        "The respiratory membrane consists of the alveolar epithelium, fused basement membranes and capillary endothelium.",
        "Oxygen diffuses from alveoli into pulmonary capillary blood.",
        "Carbon dioxide diffuses from blood into alveoli for expiration.",
        "Efficient gas exchange requires adequate ventilation, perfusion and diffusion."
      ]
    },
    {
      "heading": "8. Mechanics of breathing",
      "content": "Breathing, or pulmonary ventilation, is the movement of air into and out of the lungs. It occurs because changes in thoracic volume produce pressure differences between the atmosphere and alveoli.",
      "points": [
        "Inspiration is normally an active process involving contraction of the diaphragm and external intercostal muscles.",
        "During inspiration, the diaphragm contracts and flattens, increasing thoracic volume.",
        "External intercostal muscle contraction elevates the ribs and expands the thoracic cavity.",
        "Increased thoracic volume reduces alveolar pressure below atmospheric pressure, causing air to enter the lungs.",
        "Quiet expiration is usually passive and occurs when inspiratory muscles relax and elastic recoil reduces lung volume.",
        "During expiration, alveolar pressure rises above atmospheric pressure and air moves out.",
        "Forced expiration recruits abdominal muscles and internal intercostal muscles.",
        "Accessory muscles such as sternocleidomastoid and scalene muscles may be recruited during respiratory distress."
      ]
    },
    {
      "heading": "9. Intrapleural pressure, compliance and resistance",
      "content": "Normal ventilation depends on the relationship between lung elasticity, surface tension, airway resistance and pressure within the thoracic cavity.",
      "points": [
        "Intrapleural pressure is normally negative relative to atmospheric pressure during quiet breathing.",
        "Transpulmonary pressure is the difference between alveolar and intrapleural pressure and helps keep the lungs expanded.",
        "Lung compliance describes how easily the lungs expand in response to a change in pressure.",
        "Low compliance occurs when the lungs are stiff, as may happen in pulmonary fibrosis or pulmonary oedema.",
        "High airway resistance makes airflow more difficult, as occurs in bronchoconstriction.",
        "Surfactant reduces alveolar surface tension and improves lung compliance.",
        "Pneumothorax introduces air into the pleural space and may cause partial or complete lung collapse."
      ]
    },
    {
      "heading": "10. Gas exchange and factors affecting diffusion",
      "content": "Gas exchange occurs by simple diffusion down partial pressure gradients. Oxygen and carbon dioxide move independently according to their respective gradients.",
      "points": [
        "Alveolar oxygen partial pressure is normally higher than that of incoming pulmonary capillary blood, so oxygen diffuses into blood.",
        "Venous blood entering pulmonary capillaries has a higher carbon dioxide partial pressure than alveolar air, so carbon dioxide diffuses into alveoli.",
        "A large alveolar surface area supports efficient diffusion.",
        "A thin respiratory membrane reduces diffusion distance.",
        "A suitable partial pressure gradient promotes gas movement.",
        "Adequate pulmonary blood flow is required to maintain gas exchange.",
        "Thickening of the respiratory membrane, as in pulmonary fibrosis, impairs diffusion.",
        "Alveolar fluid or collapse can reduce effective gas exchange."
      ]
    },
    {
      "heading": "11. Transport of oxygen in blood",
      "content": "Oxygen is transported from the lungs to tissues mainly bound to haemoglobin within red blood cells, with a small amount dissolved in plasma.",
      "points": [
        "Approximately 98–99% of oxygen in arterial blood is transported bound to haemoglobin under normal conditions.",
        "The remaining small fraction is dissolved in plasma.",
        "Each haemoglobin molecule can bind up to four oxygen molecules.",
        "Oxyhaemoglobin is haemoglobin combined with oxygen.",
        "Oxygen loading occurs mainly in pulmonary capillaries.",
        "Oxygen unloading occurs in systemic tissues where oxygen partial pressure is lower.",
        "Increased carbon dioxide, increased temperature and decreased pH generally promote oxygen unloading in tissues.",
        "The oxyhaemoglobin dissociation curve describes the relationship between oxygen partial pressure and haemoglobin saturation."
      ]
    },
    {
      "heading": "12. Transport of carbon dioxide in blood",
      "content": "Carbon dioxide produced by tissues is transported to the lungs in three main forms.",
      "points": [
        "Most carbon dioxide is transported as bicarbonate ions in plasma.",
        "Some carbon dioxide binds to haemoglobin and other proteins, forming carbamino compounds.",
        "A smaller proportion is transported dissolved in plasma.",
        "Inside red blood cells, carbonic anhydrase catalyses the conversion of carbon dioxide and water into carbonic acid.",
        "Carbonic acid dissociates into hydrogen ions and bicarbonate ions.",
        "In the lungs, the reactions reverse and carbon dioxide is released for expiration.",
        "The chloride shift helps maintain electrical neutrality as bicarbonate moves between red blood cells and plasma."
      ]
    },
    {
      "heading": "13. Regulation of respiration",
      "content": "Respiration is regulated by neural centres in the brainstem and by chemical feedback related mainly to carbon dioxide, hydrogen ions and oxygen.",
      "points": [
        "The medulla oblongata contains important respiratory rhythm-generating networks.",
        "Pontine respiratory centres help modify the pattern of breathing.",
        "Central chemoreceptors respond mainly to changes in cerebrospinal fluid pH resulting from carbon dioxide changes.",
        "Peripheral chemoreceptors are located in the carotid and aortic bodies.",
        "Peripheral chemoreceptors respond to low arterial oxygen, increased carbon dioxide and decreased pH.",
        "In healthy individuals, carbon dioxide is a major regulator of ventilation.",
        "Low arterial oxygen becomes a particularly important stimulus when hypoxaemia is severe.",
        "The respiratory centres adjust the rate and depth of breathing to help maintain blood gas and acid-base balance."
      ]
    },
    {
      "heading": "14. Lung volumes and capacities",
      "content": "Lung volumes describe the amount of air moved or remaining in the lungs during different phases of breathing. Spirometry measures several of these volumes and capacities.",
      "points": [
        "Tidal volume (TV): air inhaled or exhaled during a normal quiet breath, approximately 500 mL in a typical resting adult.",
        "Inspiratory reserve volume (IRV): additional air that can be inhaled after a normal inspiration.",
        "Expiratory reserve volume (ERV): additional air that can be exhaled after a normal expiration.",
        "Residual volume (RV): air remaining in the lungs after maximal expiration.",
        "Vital capacity (VC): maximum volume exhaled after maximal inspiration; TV + IRV + ERV.",
        "Total lung capacity (TLC): total air in the lungs after maximal inspiration; VC + RV.",
        "Functional residual capacity (FRC): air remaining after normal expiration; ERV + RV.",
        "Inspiratory capacity (IC): maximum air inspired after normal expiration; TV + IRV.",
        "Simple spirometry cannot directly measure residual volume or capacities that include residual volume."
      ]
    },
    {
      "heading": "15. Respiratory assessment and diagnostic investigations",
      "content": "Respiratory assessment evaluates airway patency, ventilation, oxygenation and the patient's work of breathing.",
      "points": [
        "Assess respiratory rate, rhythm, depth and pattern.",
        "Inspect chest shape, symmetry, expansion and use of accessory muscles.",
        "Observe for cyanosis, nasal flaring, intercostal recession and inability to speak in full sentences.",
        "Palpate chest expansion and assess tracheal position where indicated.",
        "Percuss the chest to identify areas of resonance, dullness or hyperresonance.",
        "Auscultate breath sounds and identify wheezes, crackles, stridor or reduced air entry.",
        "Pulse oximetry estimates peripheral oxygen saturation but does not directly measure ventilation or carbon dioxide.",
        "Arterial blood gas analysis assesses oxygenation, ventilation and acid-base status.",
        "Chest radiography can identify conditions such as consolidation, pleural effusion and pneumothorax.",
        "Spirometry assesses airflow and lung function, including obstructive and restrictive patterns.",
        "Sputum examination may identify infectious organisms or other abnormalities.",
        "Bronchoscopy allows direct visualisation of the airways and may be used to obtain samples."
      ]
    },
    {
      "heading": "16. Common respiratory disorders",
      "content": "Knowledge of respiratory anatomy and physiology helps nurses understand common diseases and recognise clinical deterioration.",
      "points": [
        "Asthma involves variable airway inflammation and bronchoconstriction, producing wheeze, cough and breathlessness.",
        "Chronic obstructive pulmonary disease involves persistent airflow limitation, commonly associated with chronic bronchitis and emphysema.",
        "Pneumonia is infection of lung tissue, commonly producing fever, cough, sputum and impaired gas exchange.",
        "Pulmonary oedema is accumulation of fluid in lung tissue or alveoli and can cause severe breathlessness and hypoxaemia.",
        "Pneumothorax is air in the pleural space, which can impair lung expansion.",
        "Pulmonary embolism is obstruction of pulmonary arterial circulation, commonly by a thrombus.",
        "Tuberculosis is an infectious disease caused by Mycobacterium tuberculosis and commonly affects the lungs."
      ]
    }
  ],
  "clinicalApplication": "A patient presents with rapid breathing, intercostal recession and oxygen saturation of 88% on room air. The nurse assesses airway patency, respiratory rate, chest movement, breath sounds, consciousness and vital signs. The nurse positions the patient appropriately, initiates oxygen according to emergency protocols or prescription, obtains urgent clinical assistance and prepares for further assessment such as arterial blood gases and chest imaging. Oxygen saturation must be interpreted alongside the patient's clinical condition.",
  "examPoints": [
    "The right lung has three lobes; the left lung has two.",
    "The right main bronchus is wider, shorter and more vertical than the left.",
    "Type I alveolar cells are mainly responsible for gas exchange.",
    "Type II alveolar cells produce surfactant.",
    "Surfactant reduces alveolar surface tension and prevents collapse.",
    "The diaphragm is the major muscle of quiet inspiration.",
    "Quiet expiration is normally passive.",
    "Oxygen is transported mainly bound to haemoglobin.",
    "Most carbon dioxide is transported as bicarbonate ions.",
    "The SA? No: respiratory rhythm is regulated mainly by centres in the medulla and pons.",
    "The Pons and medulla regulate respiratory pattern; chemoreceptors detect chemical changes.",
    "Tidal volume is approximately 500 mL in a typical resting adult.",
    "Residual volume remains in the lungs after maximal expiration.",
    "Pulse oximetry estimates oxygen saturation but does not measure carbon dioxide.",
    "A pneumothorax is air in the pleural space."
  ],
  "questions": [
    {
      "question": "Which structure is the primary muscle of quiet inspiration?",
      "options": [
        "Internal intercostal muscles",
        "Diaphragm",
        "Abdominal muscles",
        "Pectoralis major"
      ],
      "answer": "B",
      "explanation": "The diaphragm contracts and flattens during inspiration, increasing thoracic volume and reducing alveolar pressure."
    },
    {
      "question": "How many lobes are present in the right lung?",
      "options": [
        "One",
        "Two",
        "Three",
        "Four"
      ],
      "answer": "C",
      "explanation": "The right lung has superior, middle and inferior lobes. The left lung has two lobes."
    },
    {
      "question": "Which alveolar cells produce pulmonary surfactant?",
      "options": [
        "Type I pneumocytes",
        "Type II pneumocytes",
        "Alveolar macrophages",
        "Ciliated epithelial cells"
      ],
      "answer": "B",
      "explanation": "Type II alveolar cells secrete surfactant, which reduces surface tension and helps prevent alveolar collapse."
    },
    {
      "question": "What is the main function of pulmonary surfactant?",
      "options": [
        "Increase surface tension",
        "Reduce surface tension",
        "Transport oxygen in blood",
        "Produce mucus in the trachea"
      ],
      "answer": "B",
      "explanation": "Surfactant reduces the surface tension of the alveolar lining fluid, making alveoli easier to expand and less likely to collapse."
    },
    {
      "question": "Which structure separates the right and left main bronchi?",
      "options": [
        "Epiglottis",
        "Carina",
        "Pleura",
        "Diaphragm"
      ],
      "answer": "B",
      "explanation": "The trachea divides at the carina into the right and left main bronchi."
    },
    {
      "question": "Most oxygen in the blood is transported:",
      "options": [
        "Dissolved in plasma",
        "Bound to haemoglobin",
        "As bicarbonate ions",
        "Attached to platelets"
      ],
      "answer": "B",
      "explanation": "Most oxygen is transported bound to haemoglobin in red blood cells; only a small fraction is dissolved in plasma."
    },
    {
      "question": "In what form is most carbon dioxide transported in blood?",
      "options": [
        "Dissolved carbon dioxide",
        "Carbaminohaemoglobin",
        "Bicarbonate ions",
        "Oxyhaemoglobin"
      ],
      "answer": "C",
      "explanation": "Most carbon dioxide is converted into bicarbonate ions, largely within red blood cells, and transported in plasma."
    },
    {
      "question": "Which brain structure contains important respiratory rhythm-generating centres?",
      "options": [
        "Cerebellum",
        "Medulla oblongata",
        "Occipital lobe",
        "Hypothalamus"
      ],
      "answer": "B",
      "explanation": "The medulla oblongata contains important networks responsible for generating and regulating respiratory rhythm."
    },
    {
      "question": "A patient has a tidal volume of 500 mL and a respiratory rate of 12 breaths per minute. What is the minute ventilation?",
      "options": [
        "500 mL/min",
        "2,000 mL/min",
        "6,000 mL/min",
        "12,000 mL/min"
      ],
      "answer": "C",
      "explanation": "Minute ventilation = tidal volume × respiratory rate = 500 × 12 = 6,000 mL/min, or 6 L/min."
    },
    {
      "question": "Which lung volume is the air remaining in the lungs after maximal expiration?",
      "options": [
        "Tidal volume",
        "Inspiratory reserve volume",
        "Residual volume",
        "Vital capacity"
      ],
      "answer": "C",
      "explanation": "Residual volume is the air that remains in the lungs after a person has exhaled as forcefully and completely as possible."
    },
    {
      "question": "A patient with asthma develops wheezing due to:",
      "options": [
        "Bronchoconstriction and airway inflammation",
        "Increased alveolar surfactant only",
        "Closure of the oesophagus",
        "Increased bone marrow activity"
      ],
      "answer": "A",
      "explanation": "Asthma involves airway inflammation and variable bronchoconstriction, which narrow the airways and produce wheezing."
    },
    {
      "question": "A patient has sudden breathlessness and reduced breath sounds on one side following chest trauma. Which condition should the nurse suspect?",
      "options": [
        "Pneumothorax",
        "Gastritis",
        "Anaemia only",
        "Sinusitis"
      ],
      "answer": "A",
      "explanation": "Air entering the pleural space can cause lung collapse, producing sudden breathlessness and reduced breath sounds on the affected side."
    }
  ]
};

lessonContent["Digestive system"] = {
  "objectives": [
    "Describe the anatomy and functions of the alimentary canal.",
    "Explain the roles of accessory digestive organs.",
    "Describe mechanical and chemical digestion.",
    "Explain digestion and absorption of carbohydrates, proteins and fats.",
    "Discuss the functions of gastrointestinal hormones and enzymes.",
    "Describe the functions of the liver, gallbladder and pancreas.",
    "Explain gastrointestinal motility and defecation.",
    "Describe common gastrointestinal disorders and relevant nursing assessments."
  ],
  "notes": [
    {
      "heading": "1. Introduction and functions of the digestive system",
      "content": "The digestive system consists of the gastrointestinal tract and accessory digestive organs. It receives food, breaks it down mechanically and chemically, absorbs nutrients and eliminates indigestible waste.",
      "points": [
        "Ingestion: taking food and fluids into the mouth.",
        "Mechanical digestion: physically breaking food into smaller particles.",
        "Chemical digestion: enzymes break large food molecules into smaller absorbable substances.",
        "Propulsion: movement of food along the gastrointestinal tract through swallowing and peristalsis.",
        "Absorption: movement of digested nutrients, water, vitamins and electrolytes into blood or lymph.",
        "Elimination: removal of indigestible material through defecation.",
        "The digestive system also contributes to immune defence through gut-associated lymphoid tissue."
      ]
    },
    {
      "heading": "2. Organisation of the alimentary canal",
      "content": "The alimentary canal is a continuous muscular tube extending from the mouth to the anus. Its main organs are the mouth, pharynx, oesophagus, stomach, small intestine, large intestine, rectum and anal canal.",
      "points": [
        "The mouth receives food and begins mechanical and chemical digestion.",
        "The pharynx provides a passage for swallowed food.",
        "The oesophagus transports food to the stomach through peristalsis.",
        "The stomach stores food, mixes it with gastric secretions and begins substantial protein digestion.",
        "The small intestine is the principal site of digestion and nutrient absorption.",
        "The large intestine absorbs water and electrolytes and forms faeces.",
        "The rectum stores faeces before defecation.",
        "The anal canal and sphincters regulate elimination."
      ]
    },
    {
      "heading": "3. Layers of the gastrointestinal tract",
      "content": "The wall of most of the gastrointestinal tract has four major layers. Their structure supports protection, secretion, absorption and movement.",
      "points": [
        "Mucosa: the innermost layer, consisting of epithelium, lamina propria and muscularis mucosae. It is involved in secretion, absorption and protection.",
        "Submucosa: connective tissue containing blood vessels, lymphatics and nerves.",
        "Muscularis externa: usually has inner circular and outer longitudinal smooth muscle layers responsible for mixing and propulsion.",
        "Serosa: the outer protective covering in intraperitoneal portions of the tract; some regions have an adventitia instead.",
        "The myenteric plexus lies between the muscle layers and regulates gastrointestinal motility.",
        "The submucosal plexus helps regulate secretion and local blood flow."
      ]
    },
    {
      "heading": "4. Mouth, teeth, tongue and salivary glands",
      "content": "Digestion begins in the oral cavity through chewing and the action of saliva. The tongue assists taste, bolus formation and swallowing.",
      "points": [
        "Teeth mechanically break food into smaller particles through mastication.",
        "The tongue mixes food with saliva and forms a bolus for swallowing.",
        "Saliva lubricates food and protects the oral mucosa.",
        "Salivary amylase begins the digestion of starch into smaller carbohydrates.",
        "Lingual lipase contributes to fat digestion, although its activity becomes more important in the stomach.",
        "The parotid glands produce predominantly serous saliva.",
        "The submandibular glands produce mixed serous and mucous secretions.",
        "The sublingual glands produce predominantly mucous secretions."
      ]
    },
    {
      "heading": "5. Pharynx and oesophagus",
      "content": "The pharynx and oesophagus transport food from the oral cavity to the stomach. Swallowing involves coordinated voluntary and involuntary processes.",
      "points": [
        "The oral phase of swallowing is voluntary.",
        "The pharyngeal phase is involuntary and involves coordinated protection of the airway.",
        "The epiglottis and laryngeal closure mechanisms help prevent aspiration during swallowing.",
        "The oesophagus is a muscular tube connecting the pharynx to the stomach.",
        "Peristalsis moves the food bolus down the oesophagus.",
        "The lower oesophageal sphincter helps prevent reflux of gastric contents into the oesophagus.",
        "Failure of the lower oesophageal sphincter may contribute to gastro-oesophageal reflux disease."
      ]
    },
    {
      "heading": "6. Stomach: anatomy and functions",
      "content": "The stomach is a muscular, J-shaped organ located mainly in the upper left abdomen. It stores food, mixes it with gastric secretions and releases chyme into the duodenum.",
      "points": [
        "The major regions are the cardia, fundus, body and pyloric region.",
        "The pyloric sphincter regulates the passage of stomach contents into the duodenum.",
        "Gastric glands contain several specialised secretory cells.",
        "Parietal cells secrete hydrochloric acid and intrinsic factor.",
        "Chief cells secrete pepsinogen, which is converted into pepsin in the acidic gastric environment.",
        "Mucous cells secrete mucus and bicarbonate that help protect the gastric lining.",
        "G cells secrete gastrin, which stimulates gastric acid secretion and gastric activity.",
        "Hydrochloric acid denatures proteins, helps activate pepsin and provides a hostile environment for many microorganisms.",
        "Pepsin begins protein digestion.",
        "Intrinsic factor is essential for vitamin B12 absorption in the terminal ileum."
      ]
    },
    {
      "heading": "7. Small intestine",
      "content": "The small intestine extends from the pylorus to the ileocaecal junction. It is the main site of chemical digestion and nutrient absorption.",
      "points": [
        "The three regions are duodenum, jejunum and ileum.",
        "The duodenum receives acidic chyme from the stomach, pancreatic secretions and bile.",
        "The jejunum is an important site for absorption of many nutrients.",
        "The ileum absorbs vitamin B12 bound to intrinsic factor and reabsorbs bile salts.",
        "Circular folds, villi and microvilli increase the surface area available for absorption.",
        "Each villus contains blood capillaries and a lymphatic vessel called a lacteal.",
        "Water-soluble nutrients generally enter blood capillaries.",
        "Most absorbed dietary lipids are packaged into chylomicrons and enter lacteals."
      ]
    },
    {
      "heading": "8. Large intestine and defecation",
      "content": "The large intestine receives undigested material from the small intestine, absorbs water and electrolytes, supports gut microbial activity and forms faeces.",
      "points": [
        "Its major sections are the caecum, colon, rectum and anal canal.",
        "The colon includes ascending, transverse, descending and sigmoid portions.",
        "The appendix is attached to the caecum and contains lymphoid tissue.",
        "Water and electrolytes are absorbed in the large intestine.",
        "Gut bacteria ferment some undigested carbohydrates and produce substances including short-chain fatty acids.",
        "Intestinal bacteria contribute to the production of vitamin K and some B vitamins.",
        "Faeces consist of water, bacteria, undigested material, mucus and shed cells.",
        "The defecation reflex involves rectal distension and coordinated relaxation of the internal anal sphincter.",
        "The external anal sphincter is under voluntary control."
      ]
    },
    {
      "heading": "9. Liver: anatomy and functions",
      "content": "The liver is a large glandular organ located mainly in the right upper quadrant beneath the diaphragm. It receives blood from the hepatic artery and the hepatic portal vein.",
      "points": [
        "The hepatic artery supplies oxygenated blood to the liver.",
        "The hepatic portal vein carries nutrient-rich blood from the gastrointestinal tract and spleen.",
        "The liver produces bile, which helps emulsify dietary fats.",
        "It regulates blood glucose through glycogenesis, glycogenolysis and gluconeogenesis.",
        "It synthesises many plasma proteins, including albumin and several clotting factors.",
        "It metabolises drugs, alcohol and other substances.",
        "It converts toxic ammonia into urea for renal excretion.",
        "It stores glycogen, iron and certain vitamins.",
        "It processes bilirubin arising from haemoglobin breakdown.",
        "Kupffer cells are specialised macrophages that remove microorganisms and cellular debris from blood."
      ]
    },
    {
      "heading": "10. Gallbladder and bile",
      "content": "The gallbladder is a small sac located beneath the liver. It stores and concentrates bile produced by hepatocytes and releases it into the duodenum.",
      "points": [
        "Bile contains bile salts, phospholipids, cholesterol, bilirubin and electrolytes.",
        "Bile salts emulsify large fat globules into smaller droplets, increasing the surface area for pancreatic lipase.",
        "Bile is not an enzyme and does not chemically digest fats itself.",
        "The common hepatic duct and cystic duct contribute to formation of the common bile duct.",
        "The common bile duct usually joins the pancreatic duct before opening into the duodenum.",
        "Cholecystokinin stimulates gallbladder contraction in response to fat and protein in the small intestine.",
        "Bile salts are reabsorbed mainly in the terminal ileum and returned to the liver through enterohepatic circulation."
      ]
    },
    {
      "heading": "11. Pancreas and pancreatic secretions",
      "content": "The pancreas is a mixed exocrine and endocrine gland located behind the stomach. Its exocrine function is important in digestion, while its endocrine function regulates blood glucose.",
      "points": [
        "Acinar cells produce digestive enzymes.",
        "Pancreatic duct cells secrete bicarbonate-rich fluid that neutralises acidic chyme entering the duodenum.",
        "Pancreatic amylase digests starch into smaller carbohydrates.",
        "Pancreatic lipase breaks triglycerides into fatty acids and monoglycerides.",
        "Pancreatic proteases include trypsin, chymotrypsin and carboxypeptidase.",
        "Proteases are secreted largely as inactive precursors to reduce the risk of pancreatic autodigestion.",
        "Enteropeptidase in the small intestine activates trypsinogen to trypsin.",
        "Trypsin activates other pancreatic protease precursors.",
        "Pancreatic islets contain beta cells that secrete insulin and alpha cells that secrete glucagon."
      ]
    },
    {
      "heading": "12. Digestion and absorption of carbohydrates",
      "content": "Dietary carbohydrates are broken down into monosaccharides before absorption. The principal absorbable sugars are glucose, galactose and fructose.",
      "points": [
        "Salivary amylase begins starch digestion in the mouth.",
        "Pancreatic amylase continues starch digestion in the small intestine.",
        "Brush-border enzymes such as maltase, sucrase and lactase complete carbohydrate digestion.",
        "Glucose and galactose enter intestinal epithelial cells mainly through sodium-dependent cotransport.",
        "Fructose enters mainly through facilitated diffusion.",
        "Monosaccharides leave enterocytes and enter portal blood for transport to the liver.",
        "Lactase deficiency may result in bloating, abdominal discomfort and diarrhoea after lactose consumption."
      ]
    },
    {
      "heading": "13. Digestion and absorption of proteins",
      "content": "Proteins are digested into amino acids and small peptides that can be absorbed by intestinal epithelial cells.",
      "points": [
        "Protein digestion begins in the stomach through the action of pepsin.",
        "Hydrochloric acid denatures proteins and supports pepsin activity.",
        "Pancreatic proteases continue digestion in the small intestine.",
        "Brush-border and intracellular peptidases complete digestion.",
        "Amino acids are absorbed through specific transport systems.",
        "Small peptides may enter enterocytes and be broken down further into amino acids.",
        "Most absorbed amino acids enter portal blood and travel to the liver."
      ]
    },
    {
      "heading": "14. Digestion and absorption of fats",
      "content": "Dietary fats require emulsification and enzymatic digestion before most can be absorbed. Bile salts and pancreatic enzymes are essential to this process.",
      "points": [
        "Bile salts emulsify fats into small droplets.",
        "Pancreatic lipase breaks triglycerides into monoglycerides and free fatty acids.",
        "These products combine with bile salts to form micelles.",
        "Micelles deliver lipid digestion products to the intestinal brush border.",
        "Lipids enter intestinal epithelial cells and are reassembled into triglycerides.",
        "Triglycerides are packaged with other lipids and proteins into chylomicrons.",
        "Chylomicrons enter lacteals and travel through lymph before reaching the bloodstream.",
        "Long-chain fats are mainly transported through lymph, while some short- and medium-chain fatty acids can enter portal blood directly."
      ]
    },
    {
      "heading": "15. Gastrointestinal hormones and regulation",
      "content": "Gastrointestinal hormones coordinate secretion, motility, pancreatic activity and the delivery of nutrients through the digestive tract.",
      "points": [
        "Gastrin is released mainly by G cells in the stomach and stimulates gastric acid secretion.",
        "Secretin is released by the duodenum in response to acidic chyme and stimulates pancreatic bicarbonate secretion.",
        "Cholecystokinin (CCK) is released in response to fats and amino acids and stimulates pancreatic enzyme secretion and gallbladder contraction.",
        "GIP helps stimulate insulin release in response to nutrients in the intestine and slows some gastric activity.",
        "Motilin contributes to migrating motor complexes during fasting.",
        "The enteric nervous system regulates local gastrointestinal activity.",
        "Parasympathetic stimulation generally promotes digestion, while sympathetic activity generally inhibits gastrointestinal motility and secretion."
      ]
    },
    {
      "heading": "16. Common gastrointestinal disorders",
      "content": "Disorders of the digestive system may affect motility, secretion, digestion, absorption or the integrity of gastrointestinal organs.",
      "points": [
        "Gastro-oesophageal reflux disease occurs when gastric contents reflux into the oesophagus, causing symptoms such as heartburn.",
        "Peptic ulcer disease involves mucosal ulceration, commonly associated with Helicobacter pylori infection or NSAID use.",
        "Gastroenteritis causes inflammation of the stomach and intestines, often resulting in diarrhoea and vomiting.",
        "Appendicitis is inflammation of the appendix and commonly presents with abdominal pain, often localising to the right lower quadrant.",
        "Cholelithiasis refers to gallstones, which may obstruct bile flow and cause biliary pain.",
        "Hepatitis is inflammation of the liver and may be caused by viral infections, medications, toxins or autoimmune disease.",
        "Pancreatitis is inflammation of the pancreas and commonly causes severe upper abdominal pain.",
        "Inflammatory bowel disease includes Crohn's disease and ulcerative colitis.",
        "Intestinal obstruction interferes with normal passage of intestinal contents and may cause vomiting, abdominal distension and pain."
      ]
    },
    {
      "heading": "17. Nursing assessment and investigations",
      "content": "Gastrointestinal nursing assessment evaluates nutritional status, hydration, abdominal symptoms, bowel function and signs of complications.",
      "points": [
        "Obtain a history of pain, nausea, vomiting, appetite, swallowing, bowel habits and dietary intake.",
        "Assess weight changes, nutritional status and hydration.",
        "Inspect the abdomen for distension, scars, visible masses and skin changes.",
        "Auscultate bowel sounds before percussion and palpation during a systematic abdominal examination.",
        "Percuss the abdomen and assess for tenderness, guarding or rigidity during palpation.",
        "Monitor stool characteristics, including colour, consistency and the presence of blood.",
        "Full blood count may help identify anaemia or infection.",
        "Liver function tests help assess hepatocellular injury and cholestasis; albumin and clotting tests can provide information about liver synthetic function.",
        "Serum amylase and lipase may support assessment of acute pancreatitis, with lipase generally more specific.",
        "Abdominal ultrasound may assess the liver, gallbladder and biliary system.",
        "Endoscopy allows direct visualisation of the upper gastrointestinal tract.",
        "Colonoscopy examines the colon and may allow biopsy or removal of polyps.",
        "Stool tests may identify infection, occult blood or other abnormalities."
      ]
    }
  ],
  "clinicalApplication": "A patient presents with repeated vomiting, abdominal pain and reduced urine output. The nurse assesses pain, hydration, vital signs, abdominal findings, fluid balance and urine output. The nurse monitors for signs of dehydration and electrolyte disturbance, obtains prescribed investigations and escalates persistent vomiting, severe pain, abdominal rigidity or haemodynamic instability. Oral or intravenous fluid replacement is provided according to the patient's condition and clinical orders.",
  "examPoints": [
    "The small intestine is the main site of digestion and nutrient absorption.",
    "The three parts of the small intestine are duodenum, jejunum and ileum.",
    "The liver produces bile; the gallbladder stores and concentrates it.",
    "Bile emulsifies fats but is not a digestive enzyme.",
    "The pancreas secretes digestive enzymes and bicarbonate.",
    "Parietal cells secrete hydrochloric acid and intrinsic factor.",
    "Chief cells secrete pepsinogen.",
    "Intrinsic factor is required for vitamin B12 absorption in the terminal ileum.",
    "The duodenum receives bile and pancreatic secretions.",
    "Most absorbed nutrients enter portal blood and pass to the liver.",
    "Most dietary long-chain fats enter intestinal lacteals as chylomicrons.",
    "Secretin stimulates pancreatic bicarbonate secretion.",
    "CCK stimulates gallbladder contraction and pancreatic enzyme secretion.",
    "The large intestine absorbs water and electrolytes.",
    "The pancreas contains endocrine islets that produce insulin and glucagon."
  ],
  "questions": [
    {
      "question": "Which part of the gastrointestinal tract is the main site of nutrient absorption?",
      "options": [
        "Oesophagus",
        "Stomach",
        "Small intestine",
        "Rectum"
      ],
      "answer": "C",
      "explanation": "The small intestine has a large absorptive surface area created by circular folds, villi and microvilli. It is the main site of nutrient absorption."
    },
    {
      "question": "Which gastric cells secrete hydrochloric acid?",
      "options": [
        "Chief cells",
        "Parietal cells",
        "G cells",
        "Goblet cells"
      ],
      "answer": "B",
      "explanation": "Parietal cells secrete hydrochloric acid and intrinsic factor in the stomach."
    },
    {
      "question": "What is the principal function of bile in digestion?",
      "options": [
        "Break down proteins",
        "Emulsify fats",
        "Digest starch",
        "Absorb vitamin B12"
      ],
      "answer": "B",
      "explanation": "Bile salts emulsify fats into smaller droplets, increasing the surface area available for pancreatic lipase."
    },
    {
      "question": "Which organ produces bile?",
      "options": [
        "Gallbladder",
        "Pancreas",
        "Liver",
        "Stomach"
      ],
      "answer": "C",
      "explanation": "The liver produces bile. The gallbladder stores and concentrates it before release into the duodenum."
    },
    {
      "question": "Which hormone stimulates gallbladder contraction?",
      "options": [
        "Gastrin",
        "Secretin",
        "Cholecystokinin",
        "Insulin"
      ],
      "answer": "C",
      "explanation": "Cholecystokinin is released in response to fats and amino acids in the small intestine and stimulates gallbladder contraction."
    },
    {
      "question": "Which substance is essential for vitamin B12 absorption in the terminal ileum?",
      "options": [
        "Pepsin",
        "Intrinsic factor",
        "Bile salts",
        "Amylase"
      ],
      "answer": "B",
      "explanation": "Intrinsic factor, produced by gastric parietal cells, binds vitamin B12 and allows its absorption in the terminal ileum."
    },
    {
      "question": "Which pancreatic enzyme is mainly responsible for triglyceride digestion?",
      "options": [
        "Pancreatic amylase",
        "Trypsin",
        "Pancreatic lipase",
        "Pepsin"
      ],
      "answer": "C",
      "explanation": "Pancreatic lipase hydrolyses triglycerides into smaller lipid products that can be absorbed."
    },
    {
      "question": "Which hormone stimulates pancreatic bicarbonate secretion in response to acidic chyme?",
      "options": [
        "Secretin",
        "Gastrin",
        "Insulin",
        "Motilin"
      ],
      "answer": "A",
      "explanation": "Secretin is released by the duodenum when acidic chyme enters and stimulates bicarbonate-rich pancreatic secretion."
    },
    {
      "question": "Where does most absorption of vitamin B12 bound to intrinsic factor occur?",
      "options": [
        "Duodenum",
        "Jejunum",
        "Terminal ileum",
        "Ascending colon"
      ],
      "answer": "C",
      "explanation": "The vitamin B12-intrinsic factor complex is absorbed in the terminal ileum."
    },
    {
      "question": "Which vessel carries nutrient-rich blood from the gastrointestinal tract to the liver?",
      "options": [
        "Hepatic artery",
        "Hepatic portal vein",
        "Inferior vena cava",
        "Pulmonary vein"
      ],
      "answer": "B",
      "explanation": "The hepatic portal vein carries nutrient-rich blood from the digestive organs to the liver for processing."
    },
    {
      "question": "A patient with repeated vomiting is at risk of which major nursing problem?",
      "options": [
        "Fluid volume deficit",
        "Excessive bone growth",
        "Increased visual acuity",
        "Improved nutritional status"
      ],
      "answer": "A",
      "explanation": "Repeated vomiting results in loss of water and electrolytes. The nurse should assess hydration, vital signs, electrolyte results and urine output."
    },
    {
      "question": "Which pancreatic cells secrete insulin?",
      "options": [
        "Alpha cells",
        "Beta cells",
        "Acinar cells",
        "Parietal cells"
      ],
      "answer": "B",
      "explanation": "Beta cells in the pancreatic islets secrete insulin, which helps lower blood glucose by promoting glucose uptake and storage."
    }
  ]
};

lessonContent["Urinary system"] = {
  "objectives": [
    "Describe the anatomy of the urinary system.",
    "Explain the structure and functions of the kidneys.",
    "Describe the structure of the nephron.",
    "Explain glomerular filtration, tubular reabsorption and secretion.",
    "Discuss the hormonal regulation of urine formation.",
    "Explain the roles of the kidneys in fluid, electrolyte and acid-base balance.",
    "Describe the anatomy and functions of the ureters, bladder and urethra.",
    "Discuss urinary assessment, investigations and common disorders."
  ],
  "notes": [
    {
      "heading": "1. Introduction and functions of the urinary system",
      "content": "The urinary system consists of two kidneys, two ureters, the urinary bladder and the urethra. It filters blood, removes metabolic waste and regulates the internal environment of the body.",
      "points": [
        "Excretion: removes metabolic waste products such as urea, creatinine and excess ions.",
        "Fluid balance: regulates water content and extracellular fluid volume.",
        "Electrolyte balance: regulates sodium, potassium, calcium, phosphate and other electrolytes.",
        "Acid-base balance: helps maintain blood pH by excreting hydrogen ions and reabsorbing or generating bicarbonate.",
        "Blood pressure regulation: influences blood pressure through sodium and water balance and the renin-angiotensin-aldosterone system.",
        "Erythropoiesis: produces erythropoietin, which stimulates red blood cell production in bone marrow.",
        "Vitamin D activation: converts vitamin D into its active hormonal form, calcitriol.",
        "Gluconeogenesis: the kidneys contribute to glucose production, particularly during prolonged fasting."
      ]
    },
    {
      "heading": "2. Gross anatomy of the kidneys",
      "content": "The kidneys are paired, bean-shaped organs located retroperitoneally on the posterior abdominal wall. They lie approximately between the T12 and L3 vertebral levels, with the right kidney usually slightly lower because of the liver.",
      "points": [
        "The renal capsule is a tough fibrous covering that protects the kidney.",
        "The renal cortex is the outer region containing renal corpuscles and parts of renal tubules.",
        "The renal medulla is the inner region organised into renal pyramids.",
        "The renal papilla is the apex of a renal pyramid and drains urine into a minor calyx.",
        "Minor calyces join to form major calyces.",
        "Major calyces drain into the renal pelvis.",
        "The renal pelvis narrows to become the ureter.",
        "The renal hilum is the medial opening through which vessels, nerves and the ureter enter or leave the kidney.",
        "The renal artery supplies blood to the kidney, while the renal vein drains blood from it."
      ]
    },
    {
      "heading": "3. Internal structure and blood supply of the kidney",
      "content": "The kidney receives a substantial proportion of cardiac output to support filtration and regulation of the blood. Its blood vessels form a specialised network around the nephron.",
      "points": [
        "Renal artery → segmental arteries → interlobar arteries → arcuate arteries → cortical radiate arteries.",
        "Afferent arterioles carry blood into the glomerular capillaries.",
        "The glomerulus is a network of capillaries where filtration begins.",
        "Efferent arterioles carry blood away from the glomerulus.",
        "Efferent arterioles form peritubular capillaries and, in juxtamedullary nephrons, vasa recta.",
        "Peritubular capillaries support reabsorption and secretion.",
        "The vasa recta help preserve the medullary concentration gradient."
      ]
    },
    {
      "heading": "4. The nephron: structural and functional unit",
      "content": "The nephron is the microscopic functional unit of the kidney. Each kidney contains approximately one million nephrons, although the number varies.",
      "points": [
        "The renal corpuscle consists of the glomerulus and Bowman's capsule.",
        "The proximal convoluted tubule reabsorbs most filtered water and sodium, as well as glucose, amino acids and bicarbonate.",
        "The loop of Henle descends into the medulla and contributes to the concentration gradient.",
        "The descending limb is relatively permeable to water.",
        "The thick ascending limb reabsorbs sodium, potassium and chloride and is relatively impermeable to water.",
        "The distal convoluted tubule performs further selective electrolyte regulation.",
        "The collecting duct adjusts final urine concentration under hormonal influence, particularly antidiuretic hormone.",
        "Cortical nephrons are located mainly in the cortex and have shorter loops of Henle.",
        "Juxtamedullary nephrons have long loops of Henle extending deep into the medulla and are important for concentrating urine."
      ]
    },
    {
      "heading": "5. Glomerular filtration",
      "content": "Glomerular filtration is the movement of water and small dissolved substances from glomerular blood into Bowman's space. Blood cells and most plasma proteins are normally retained in the circulation.",
      "points": [
        "The filtration membrane includes fenestrated glomerular capillary endothelium, the glomerular basement membrane and filtration slits between podocyte foot processes.",
        "Water, glucose, amino acids, electrolytes and urea can normally pass into the filtrate.",
        "Blood cells and most large plasma proteins are normally excluded.",
        "Glomerular filtration rate (GFR) is the volume of filtrate formed by both kidneys per minute.",
        "A typical normal GFR in a healthy young adult is approximately 90–120 mL/min/1.73 m², with variation according to age and other factors.",
        "Reduced GFR may indicate impaired kidney filtration.",
        "The filtration process is influenced by hydrostatic and oncotic pressure gradients across the filtration membrane.",
        "Autoregulation helps maintain relatively stable renal blood flow and GFR across a range of arterial pressures."
      ]
    },
    {
      "heading": "6. Tubular reabsorption",
      "content": "Tubular reabsorption is the movement of substances from tubular fluid back into the blood. It prevents the loss of useful substances and helps maintain homeostasis.",
      "points": [
        "Most filtered water and sodium are reabsorbed in the proximal convoluted tubule.",
        "Normally, virtually all filtered glucose and amino acids are reabsorbed when the transport capacity is not exceeded.",
        "Sodium reabsorption is an important driver of water reabsorption.",
        "The loop of Henle establishes and maintains the medullary osmotic gradient.",
        "The distal tubule and collecting duct perform fine regulation of sodium, potassium, calcium and water.",
        "Aldosterone increases sodium reabsorption in the late distal tubule and collecting duct.",
        "Antidiuretic hormone increases water permeability of the collecting ducts.",
        "The kidneys can adjust urine composition according to the body's fluid and electrolyte requirements."
      ]
    },
    {
      "heading": "7. Tubular secretion",
      "content": "Tubular secretion is the transfer of substances from peritubular blood into the renal tubular fluid. It assists in waste removal and regulation of electrolytes and acid-base balance.",
      "points": [
        "Hydrogen ions are secreted to help regulate acid-base balance.",
        "Potassium secretion is regulated partly by aldosterone and potassium status.",
        "Organic acids and bases, including some medications and metabolites, can be secreted into the tubules.",
        "Ammonium secretion contributes to acid excretion.",
        "Tubular secretion helps eliminate substances that may not be adequately removed by filtration alone."
      ]
    },
    {
      "heading": "8. Concentration and dilution of urine",
      "content": "The kidneys regulate urine concentration to maintain body water balance. This depends on the medullary osmotic gradient and the action of antidiuretic hormone.",
      "points": [
        "The loop of Henle contributes to the countercurrent multiplier mechanism.",
        "The vasa recta help maintain the medullary osmotic gradient through countercurrent exchange.",
        "Antidiuretic hormone increases water permeability in the collecting ducts by promoting insertion of aquaporin-2 channels.",
        "High ADH activity promotes water reabsorption and produces a smaller volume of concentrated urine.",
        "Low ADH activity reduces collecting duct water permeability and produces a larger volume of dilute urine.",
        "Dehydration generally increases ADH secretion.",
        "Excess water intake generally suppresses ADH secretion."
      ]
    },
    {
      "heading": "9. Hormonal regulation of renal function",
      "content": "Hormones regulate renal handling of water, sodium, potassium and calcium, helping maintain blood pressure and electrolyte balance.",
      "points": [
        "Antidiuretic hormone (ADH) is released from the posterior pituitary and promotes water reabsorption in collecting ducts.",
        "Aldosterone is produced by the adrenal cortex and increases sodium reabsorption and potassium secretion in the distal nephron.",
        "The renin-angiotensin-aldosterone system (RAAS) is activated by reduced renal perfusion, reduced sodium chloride delivery to the macula densa or sympathetic stimulation.",
        "Renin converts angiotensinogen into angiotensin I.",
        "Angiotensin-converting enzyme (ACE) converts angiotensin I into angiotensin II.",
        "Angiotensin II causes vasoconstriction and stimulates aldosterone and ADH activity.",
        "Atrial natriuretic peptide (ANP) promotes sodium and water excretion and opposes some actions of RAAS.",
        "Parathyroid hormone increases renal calcium reabsorption and promotes phosphate excretion."
      ]
    },
    {
      "heading": "10. Regulation of acid-base balance",
      "content": "The kidneys work with the lungs and chemical buffer systems to maintain blood pH within a narrow physiological range. They provide a slower but powerful mechanism of acid-base regulation.",
      "points": [
        "Normal arterial blood pH is approximately 7.35–7.45.",
        "The kidneys reabsorb filtered bicarbonate, especially in the proximal tubule.",
        "The kidneys secrete hydrogen ions into tubular fluid.",
        "Hydrogen ions are excreted using urinary buffers, including phosphate.",
        "Ammonia produced by renal tubular cells combines with hydrogen ions to form ammonium, which can be excreted.",
        "The kidneys generate new bicarbonate to replace bicarbonate consumed in buffering acids.",
        "Renal impairment can reduce acid excretion and cause metabolic acidosis."
      ]
    },
    {
      "heading": "11. Ureters",
      "content": "The ureters are narrow muscular tubes that transport urine from the renal pelvis to the urinary bladder.",
      "points": [
        "There are two ureters, one from each kidney.",
        "Each ureter passes retroperitoneally towards the urinary bladder.",
        "Peristaltic contractions of smooth muscle propel urine towards the bladder.",
        "The ureters enter the bladder obliquely, helping reduce reflux of urine towards the kidneys.",
        "Urinary calculi can obstruct the ureters and cause severe colicky pain called renal or ureteric colic."
      ]
    },
    {
      "heading": "12. Urinary bladder",
      "content": "The urinary bladder is a hollow muscular organ that temporarily stores urine before micturition. Its wall contains the detrusor muscle.",
      "points": [
        "The bladder is located in the pelvic cavity behind the pubic symphysis.",
        "The detrusor muscle consists of smooth muscle fibres that contract during urination.",
        "The trigone is a triangular region between the two ureteric openings and the internal urethral opening.",
        "Stretch receptors in the bladder wall detect filling.",
        "The bladder can expand to accommodate increasing urine volume.",
        "Normal adult bladder capacity varies, commonly around 400–600 mL."
      ]
    },
    {
      "heading": "13. Urethra and micturition",
      "content": "The urethra carries urine from the bladder to the outside of the body. Micturition is the process of bladder emptying.",
      "points": [
        "The female urethra is relatively short, approximately 3–4 cm long.",
        "The male urethra is longer, approximately 18–20 cm, and also carries semen.",
        "The internal urethral sphincter is composed of smooth muscle and is under involuntary control.",
        "The external urethral sphincter is skeletal muscle and is under voluntary control.",
        "Bladder filling activates stretch receptors and sends signals to the spinal cord.",
        "The micturition reflex promotes detrusor contraction and relaxation of the internal sphincter.",
        "Higher brain centres can facilitate or inhibit urination through voluntary control of the external sphincter."
      ]
    },
    {
      "heading": "14. Normal urine characteristics",
      "content": "Urine is a liquid waste product produced by the kidneys. Its composition and volume reflect renal function, hydration and metabolic activity.",
      "points": [
        "Normal urine is usually clear and pale yellow to amber due to urochrome pigments.",
        "Daily urine output in a typical adult is approximately 800–2,000 mL, depending on fluid intake and other factors.",
        "A common minimum adult urine output target in clinical monitoring is approximately 0.5 mL/kg/hour.",
        "Urine is normally slightly acidic, with a variable pH commonly around 4.5–8.",
        "Normal urine contains water, urea, creatinine, uric acid and electrolytes.",
        "Glucose, significant protein, blood and ketones are not normally present in substantial quantities and require clinical interpretation if detected.",
        "Oliguria in adults is commonly defined as urine output below 0.5 mL/kg/hour for at least six hours, although clinical criteria vary.",
        "Anuria refers to extremely low or absent urine production."
      ]
    },
    {
      "heading": "15. Renal assessment and diagnostic investigations",
      "content": "Renal assessment evaluates kidney function, urinary elimination, hydration and complications such as fluid overload or electrolyte imbalance.",
      "points": [
        "Obtain a history of urine frequency, volume, colour, odour, pain, urgency, nocturia and incontinence.",
        "Assess fluid intake, vomiting, diarrhoea, medications and relevant medical history.",
        "Monitor intake and output, especially in acutely ill patients.",
        "Assess blood pressure, oedema, hydration and signs of fluid overload.",
        "Urinalysis can detect protein, blood, glucose, ketones, leucocytes and nitrites.",
        "Serum creatinine and estimated GFR help assess kidney filtration.",
        "Urea is interpreted alongside renal function, hydration and other clinical findings.",
        "Serum electrolytes, particularly potassium, sodium and bicarbonate, help assess renal and metabolic disturbances.",
        "Urine culture identifies urinary pathogens and guides antimicrobial treatment.",
        "Renal ultrasound can assess kidney size, obstruction, hydronephrosis and structural abnormalities.",
        "CT imaging may be used to investigate stones, masses and urinary tract obstruction.",
        "A renal biopsy may be performed when tissue diagnosis is required."
      ]
    },
    {
      "heading": "16. Common urinary and renal disorders",
      "content": "Renal and urinary disorders may affect filtration, urine flow, fluid regulation or the integrity of the urinary tract.",
      "points": [
        "Urinary tract infection (UTI) is infection of the urinary system and may present with dysuria, frequency and urgency.",
        "Pyelonephritis is infection involving the kidney and commonly presents with fever, flank pain and systemic symptoms.",
        "Glomerulonephritis is inflammation of the glomeruli and may cause haematuria, proteinuria, oedema and hypertension.",
        "Acute kidney injury (AKI) is a sudden decline in kidney function, often associated with reduced urine output and rising creatinine.",
        "Chronic kidney disease (CKD) involves persistent abnormalities of kidney structure or function, generally present for at least three months.",
        "Renal calculi are kidney stones that may cause severe colicky pain and haematuria.",
        "Hydronephrosis is dilation of the renal collecting system due to impaired urine drainage.",
        "Urinary incontinence is involuntary leakage of urine.",
        "Urinary retention is inability to empty the bladder adequately."
      ]
    },
    {
      "heading": "17. Nursing care of patients with renal and urinary disorders",
      "content": "Nursing care aims to preserve renal function, maintain fluid and electrolyte balance, prevent infection and support safe urinary elimination.",
      "points": [
        "Monitor vital signs, fluid balance and urine output.",
        "Report sudden reduction in urine output, anuria, haematuria or rapidly increasing oedema.",
        "Assess for signs of fluid overload, including breathlessness, oedema and raised blood pressure.",
        "Monitor renal function and electrolyte results, especially potassium.",
        "Administer prescribed medication safely and consider renal dose adjustment where indicated.",
        "Maintain aseptic technique during urinary catheter insertion and catheter care.",
        "Avoid unnecessary urinary catheterisation and remove catheters as soon as clinically appropriate.",
        "Encourage appropriate hydration unless fluid restriction is prescribed.",
        "Provide education on medication adherence, infection prevention and follow-up.",
        "Prepare and support patients requiring renal replacement therapy, such as haemodialysis or peritoneal dialysis."
      ]
    }
  ],
  "clinicalApplication": "A patient admitted with vomiting and diarrhoea develops reduced urine output, dry mucous membranes and hypotension. The nurse recognises possible reduced renal perfusion due to fluid volume deficit. The nurse assesses vital signs, fluid balance, urine output and renal function, reports deterioration promptly and assists with prescribed fluid replacement. Continued monitoring is essential to identify possible acute kidney injury.",
  "examPoints": [
    "The nephron is the functional unit of the kidney.",
    "The renal corpuscle consists of the glomerulus and Bowman's capsule.",
    "The three processes of urine formation are filtration, reabsorption and secretion.",
    "The proximal convoluted tubule reabsorbs most filtered water and sodium.",
    "The loop of Henle helps establish the medullary osmotic gradient.",
    "ADH increases water reabsorption in the collecting ducts.",
    "Aldosterone increases sodium reabsorption and potassium secretion.",
    "Renin initiates the renin-angiotensin-aldosterone system.",
    "The kidneys produce erythropoietin and activate vitamin D.",
    "The kidneys help regulate acid-base balance through hydrogen ion excretion and bicarbonate handling.",
    "The right kidney is usually slightly lower than the left kidney.",
    "The ureters transport urine from kidneys to bladder by peristalsis.",
    "The detrusor muscle contracts during micturition.",
    "The female urethra is shorter than the male urethra.",
    "Normal adult urine output is commonly around 800–2,000 mL per day, depending on fluid balance."
  ],
  "questions": [
    {
      "question": "What is the functional unit of the kidney?",
      "options": [
        "Nephron",
        "Ureter",
        "Renal pelvis",
        "Bladder"
      ],
      "answer": "A",
      "explanation": "The nephron is the functional unit responsible for filtering blood and modifying the filtrate to produce urine."
    },
    {
      "question": "Where does glomerular filtration occur?",
      "options": [
        "Collecting duct",
        "Glomerulus",
        "Ureter",
        "Urinary bladder"
      ],
      "answer": "B",
      "explanation": "Blood is filtered through the glomerular capillaries into Bowman's space, forming the initial filtrate."
    },
    {
      "question": "Which part of the nephron reabsorbs the greatest proportion of filtered sodium and water?",
      "options": [
        "Proximal convoluted tubule",
        "Distal convoluted tubule",
        "Collecting duct",
        "Ureter"
      ],
      "answer": "A",
      "explanation": "The proximal convoluted tubule reabsorbs approximately 65–70% of filtered sodium and water, as well as many useful solutes."
    },
    {
      "question": "Which hormone increases water reabsorption in the collecting ducts?",
      "options": [
        "Insulin",
        "ADH",
        "Thyroxine",
        "Glucagon"
      ],
      "answer": "B",
      "explanation": "Antidiuretic hormone increases the insertion of aquaporin-2 water channels in collecting duct cells, promoting water reabsorption."
    },
    {
      "question": "Which hormone increases sodium reabsorption and potassium secretion in the distal nephron?",
      "options": [
        "Aldosterone",
        "Calcitonin",
        "Melatonin",
        "Prolactin"
      ],
      "answer": "A",
      "explanation": "Aldosterone acts on the distal nephron to increase sodium reabsorption and potassium secretion."
    },
    {
      "question": "Which kidney-produced hormone stimulates red blood cell production?",
      "options": [
        "Insulin",
        "Erythropoietin",
        "ADH",
        "Renin"
      ],
      "answer": "B",
      "explanation": "Erythropoietin stimulates erythropoiesis in the bone marrow, particularly in response to reduced oxygen availability."
    },
    {
      "question": "Which structure transports urine from the kidney to the urinary bladder?",
      "options": [
        "Urethra",
        "Ureter",
        "Renal artery",
        "Renal vein"
      ],
      "answer": "B",
      "explanation": "Each ureter transports urine from the renal pelvis to the bladder through peristaltic contractions."
    },
    {
      "question": "What is the name of the muscular layer of the urinary bladder?",
      "options": [
        "Myocardium",
        "Detrusor",
        "Endometrium",
        "Pericardium"
      ],
      "answer": "B",
      "explanation": "The detrusor is the smooth muscle layer of the bladder that contracts to expel urine."
    },
    {
      "question": "A patient has a persistent urine output of 0.3 mL/kg/hour. What does this finding suggest?",
      "options": [
        "Polyuria",
        "Oliguria",
        "Normal urine output",
        "Urinary frequency only"
      ],
      "answer": "B",
      "explanation": "Urine output below approximately 0.5 mL/kg/hour is concerning for oliguria in adults, particularly when sustained. The nurse should assess hydration, perfusion and renal function."
    },
    {
      "question": "Which substance is normally absent or present only in negligible amounts in urine?",
      "options": [
        "Urea",
        "Creatinine",
        "Glucose",
        "Water"
      ],
      "answer": "C",
      "explanation": "Normally filtered glucose is almost completely reabsorbed in the proximal tubule. Glucose in urine may occur when blood glucose exceeds the renal threshold or with tubular disorders."
    },
    {
      "question": "A patient with chronic kidney disease develops anaemia. Which mechanism contributes to this complication?",
      "options": [
        "Increased insulin secretion",
        "Reduced erythropoietin production",
        "Excessive bile production",
        "Increased surfactant secretion"
      ],
      "answer": "B",
      "explanation": "Damaged kidneys may produce insufficient erythropoietin, reducing stimulation of red blood cell production in the bone marrow."
    },
    {
      "question": "A patient with acute kidney injury develops severe hyperkalaemia. Which system is at immediate risk?",
      "options": [
        "Cardiovascular system",
        "Integumentary system only",
        "Skeletal system only",
        "Reproductive system only"
      ],
      "answer": "A",
      "explanation": "Severe hyperkalaemia can disrupt cardiac electrical conduction and cause life-threatening arrhythmias. It requires urgent assessment and management."
    }
  ]
};

lessonContent["Nervous system"] = {
  "objectives": [
    "Define the nervous system and explain its major functions.",
    "Differentiate the central and peripheral nervous systems.",
    "Describe the structure and functions of neurons and neuroglia.",
    "Explain resting membrane potential, action potentials and synaptic transmission.",
    "Describe the major divisions of the brain and their functions.",
    "Explain the structure and functions of the spinal cord, meninges and cerebrospinal fluid.",
    "Differentiate sensory, motor and autonomic pathways.",
    "Explain reflex actions and their clinical importance.",
    "Describe neurological assessment and common diagnostic investigations.",
    "Relate nervous system anatomy and physiology to common neurological disorders and nursing care."
  ],
  "notes": [
    {
      "heading": "1. Introduction and definition of the nervous system",
      "content": "The nervous system is the body's rapid communication, coordination and control system. It receives information from internal and external environments, interprets that information, and produces appropriate responses through muscles, glands and other organs. It helps maintain homeostasis by regulating functions such as breathing, heart rate, blood pressure, body temperature, digestion, movement, sensation, consciousness and behaviour.",
      "points": [
        "Sensory function: detects changes such as pain, temperature, pressure, sound, light and changes in blood chemistry.",
        "Integrative function: processes, interprets and stores information, allowing the body to select an appropriate response.",
        "Motor function: sends impulses to effectors, including skeletal muscles, smooth muscles, cardiac muscle and glands.",
        "Higher mental functions include memory, learning, language, reasoning, emotions, judgement and consciousness.",
        "The nervous system works closely with the endocrine system. Nervous responses are generally rapid and relatively short-lived, while hormonal responses may be slower and longer-lasting."
      ]
    },
    {
      "heading": "2. Major divisions of the nervous system",
      "content": "Anatomically, the nervous system is divided into the central nervous system (CNS) and peripheral nervous system (PNS). Functionally, the PNS is divided into sensory (afferent) and motor (efferent) divisions. The motor division includes the somatic and autonomic nervous systems.",
      "points": [
        "Central nervous system: consists of the brain and spinal cord. It is the main processing and coordinating centre.",
        "Peripheral nervous system: consists of cranial nerves, spinal nerves, peripheral ganglia and sensory receptors outside the CNS.",
        "Afferent pathways carry sensory information from receptors towards the CNS.",
        "Efferent pathways carry commands away from the CNS to muscles and glands.",
        "Somatic nervous system: controls voluntary skeletal muscle activity and carries sensory information from skin, muscles and joints.",
        "Autonomic nervous system: regulates involuntary functions of smooth muscle, cardiac muscle and glands.",
        "The autonomic nervous system has sympathetic, parasympathetic and enteric divisions."
      ]
    },
    {
      "heading": "3. Neurons: the structural and functional units",
      "content": "A neuron is a specialised excitable cell responsible for receiving, processing and transmitting electrical and chemical signals. Neurons communicate with other neurons, muscles and glands. Most mature neurons have limited capacity for cell division.",
      "points": [
        "Cell body (soma): contains the nucleus and organelles and maintains the metabolic activities of the neuron.",
        "Dendrites: branched extensions that receive signals from other neurons or sensory receptors and conduct information towards the cell body.",
        "Axon: a long process that carries action potentials away from the cell body towards another neuron or an effector.",
        "Axon hillock and initial segment: region where action potentials are commonly initiated when threshold is reached.",
        "Axon terminals: contain synaptic vesicles that store neurotransmitters for communication with the next cell.",
        "Myelin sheath: an insulating covering around many axons that increases the speed of impulse conduction.",
        "Nodes of Ranvier: gaps between myelin segments where action potentials are regenerated during saltatory conduction.",
        "Neurons may be classified structurally as multipolar, bipolar or unipolar (pseudounipolar). Functionally, they may be sensory, motor or interneurons."
      ]
    },
    {
      "heading": "4. Neuroglia and their functions",
      "content": "Neuroglia, or glial cells, are supporting cells of nervous tissue. Unlike neurons, many glial cells can divide. They maintain the environment around neurons, provide support, contribute to defence and assist in myelination.",
      "points": [
        "Astrocytes: provide structural and metabolic support, regulate extracellular ions and neurotransmitters, and contribute to the blood-brain barrier.",
        "Oligodendrocytes: form myelin around axons in the CNS. One oligodendrocyte can myelinate segments of several axons.",
        "Microglia: immune defence cells of the CNS that remove debris and participate in inflammatory responses.",
        "Ependymal cells: line the ventricles of the brain and the central canal of the spinal cord. Specialised ependymal cells in the choroid plexus participate in CSF production.",
        "Schwann cells: form myelin around axons in the PNS. Each myelinating Schwann cell forms one segment of one axon.",
        "Satellite cells: support neuron cell bodies in peripheral ganglia.",
        "Clinical relevance: damage to myelin disrupts nerve impulse conduction. Multiple sclerosis primarily involves CNS myelin, while Guillain-Barré syndrome commonly involves peripheral nerve myelin."
      ]
    },
    {
      "heading": "5. Resting membrane potential and action potential",
      "content": "Neurons are excitable cells. Their membranes maintain an electrical difference between the inside and outside of the cell. A typical resting membrane potential in a neuron is approximately -70 mV, meaning the inside is more negative than the outside. This potential results from unequal ion distribution and selective membrane permeability.",
      "points": [
        "Sodium (Na+) concentration is higher outside the neuron, while potassium (K+) concentration is higher inside.",
        "The sodium-potassium ATPase pump uses energy to move three sodium ions out of the cell and two potassium ions into the cell.",
        "At rest, the membrane is more permeable to potassium than sodium, contributing to the negative resting potential.",
        "Depolarisation occurs when the membrane becomes less negative, commonly due to sodium entering through voltage-gated sodium channels.",
        "If threshold is reached, an action potential is generated. It follows the all-or-none principle.",
        "Repolarisation occurs when sodium channels inactivate and potassium channels open, allowing potassium to leave the cell.",
        "Hyperpolarisation may briefly occur when potassium channels remain open longer than necessary.",
        "The refractory period limits how frequently another action potential can occur and helps ensure forward propagation.",
        "Saltatory conduction occurs in myelinated axons, with impulses appearing to jump from one node of Ranvier to another, increasing conduction speed."
      ]
    },
    {
      "heading": "6. Synapses and neurotransmitters",
      "content": "A synapse is a functional junction through which one neuron communicates with another neuron or an effector cell. Most synapses in the nervous system are chemical synapses, although electrical synapses also exist.",
      "points": [
        "In a chemical synapse, an action potential reaches the presynaptic terminal and opens voltage-gated calcium channels.",
        "Calcium enters the terminal and promotes fusion of synaptic vesicles with the presynaptic membrane.",
        "Neurotransmitter is released into the synaptic cleft and binds to receptors on the postsynaptic membrane.",
        "The response may be excitatory, increasing the likelihood of an action potential, or inhibitory, decreasing that likelihood.",
        "Acetylcholine: important at the neuromuscular junction and in autonomic neurotransmission.",
        "Dopamine: involved in movement, motivation, reward and other functions. Reduced dopaminergic activity in certain brain pathways is associated with Parkinson disease.",
        "Serotonin: involved in mood, sleep, appetite and other functions.",
        "Noradrenaline: contributes to alertness and sympathetic activity.",
        "Gamma-aminobutyric acid (GABA): the major inhibitory neurotransmitter in the adult brain.",
        "Glutamate: the major excitatory neurotransmitter in the CNS.",
        "Neurotransmitters are removed through enzymatic breakdown, reuptake or diffusion."
      ]
    },
    {
      "heading": "7. The brain: general organisation",
      "content": "The brain is the principal control centre of the CNS. It is located within the cranial cavity and is protected by the skull, meninges and cerebrospinal fluid. It receives sensory information, coordinates responses and supports consciousness, memory, emotions and voluntary movement.",
      "points": [
        "The major anatomical regions are the cerebrum, diencephalon, brainstem and cerebellum.",
        "The cerebrum forms the largest part of the brain and is responsible for higher mental functions, sensory interpretation and voluntary movement.",
        "The diencephalon includes the thalamus and hypothalamus, among other structures.",
        "The brainstem consists of the midbrain, pons and medulla oblongata.",
        "The cerebellum coordinates movement, balance, posture and motor learning.",
        "The right and left cerebral hemispheres communicate mainly through the corpus callosum."
      ]
    },
    {
      "heading": "8. Cerebral lobes and their functions",
      "content": "The cerebral cortex is the outer layer of the cerebrum and contains grey matter. It is divided into lobes, each associated with particular functions. These functions are integrated, so complex activities often involve several regions working together.",
      "points": [
        "Frontal lobe: involved in voluntary motor control, planning, decision-making, personality, behaviour and speech production. The primary motor cortex lies in the precentral gyrus.",
        "Parietal lobe: processes touch, pressure, pain, temperature and body position. The primary somatosensory cortex lies in the postcentral gyrus.",
        "Temporal lobe: involved in hearing, memory and language comprehension. The hippocampus is important in forming new memories.",
        "Occipital lobe: contains the primary visual cortex and is responsible for processing visual information.",
        "Broca's area, usually in the dominant hemisphere, is important in speech production.",
        "Wernicke's area, usually in the dominant hemisphere, is important in language comprehension.",
        "Damage to particular cortical regions may cause weakness, sensory loss, visual disturbances, memory impairment or language difficulties."
      ]
    },
    {
      "heading": "9. Diencephalon and limbic system",
      "content": "The diencephalon lies between the cerebrum and brainstem. It contains important structures involved in sensory relay, homeostasis, endocrine regulation and emotional responses.",
      "points": [
        "Thalamus: acts as a major relay station for most sensory information travelling to the cerebral cortex, with the important exception of much olfactory information.",
        "Hypothalamus: regulates body temperature, hunger, thirst, sleep-wake cycles, autonomic activity and endocrine functions.",
        "The hypothalamus controls the pituitary gland through neural and hormonal mechanisms.",
        "Pineal gland: secretes melatonin, which contributes to regulation of circadian rhythms.",
        "Limbic structures, including the hippocampus and amygdala, participate in memory, emotion and behavioural responses.",
        "Clinical relevance: hypothalamic dysfunction may disturb temperature regulation, thirst, appetite and hormonal balance."
      ]
    },
    {
      "heading": "10. Brainstem and cerebellum",
      "content": "The brainstem connects the brain with the spinal cord and contains pathways and nuclei essential for life-sustaining functions. The cerebellum is located posteriorly and below the cerebrum and is essential for coordination.",
      "points": [
        "Midbrain: contains pathways and centres involved in visual and auditory reflexes, eye movements and motor control.",
        "Pons: connects different parts of the brain and participates in respiratory regulation and sleep-related functions.",
        "Medulla oblongata: contains vital centres involved in regulation of breathing, heart rate and blood vessel tone.",
        "The medulla also contains reflex centres involved in swallowing, coughing, sneezing and vomiting.",
        "Cerebellum: coordinates timing, precision and smoothness of voluntary movement.",
        "Cerebellar damage may produce ataxia, poor balance, intention tremor and uncoordinated movements.",
        "Damage to the brainstem can be life-threatening because it may affect consciousness, breathing and cardiovascular regulation."
      ]
    },
    {
      "heading": "11. Spinal cord: structure and functions",
      "content": "The spinal cord is a cylindrical structure extending from the medulla oblongata through the vertebral canal. In adults, it usually ends around the L1-L2 vertebral level as the conus medullaris. Nerve roots continue below this level as the cauda equina.",
      "points": [
        "The spinal cord carries sensory information towards the brain through ascending tracts.",
        "Descending tracts carry motor commands from the brain to spinal motor neurons.",
        "The spinal cord also integrates many reflex responses without requiring conscious processing by the brain.",
        "In a cross-section, central grey matter is surrounded by white matter.",
        "Grey matter contains neuronal cell bodies, dendrites and synapses; white matter contains mainly myelinated axons organised into tracts.",
        "The dorsal root carries sensory fibres into the spinal cord. The dorsal root ganglion contains sensory neuron cell bodies.",
        "The ventral root carries motor fibres away from the spinal cord.",
        "Dorsal and ventral roots join to form a mixed spinal nerve.",
        "There are 31 pairs of spinal nerves: 8 cervical, 12 thoracic, 5 lumbar, 5 sacral and 1 coccygeal."
      ]
    },
    {
      "heading": "12. Meninges and cerebrospinal fluid",
      "content": "The brain and spinal cord are protected by three connective tissue membranes called meninges. Cerebrospinal fluid (CSF) circulates around the CNS and through the ventricular system, providing mechanical protection and helping maintain a stable chemical environment.",
      "points": [
        "Dura mater: the tough, outermost meningeal layer.",
        "Arachnoid mater: the middle, web-like layer. The subarachnoid space beneath it contains CSF and blood vessels.",
        "Pia mater: the delicate innermost membrane closely attached to the surface of the brain and spinal cord.",
        "CSF is produced mainly by the choroid plexuses within the brain ventricles.",
        "CSF flows through the lateral ventricles, third ventricle, cerebral aqueduct and fourth ventricle before entering the subarachnoid space.",
        "CSF is reabsorbed into venous blood mainly through arachnoid granulations.",
        "Functions of CSF include cushioning the CNS, providing buoyancy, transporting substances and helping remove metabolic waste.",
        "Clinical relevance: meningitis is inflammation of the meninges, while hydrocephalus involves abnormal accumulation of CSF within the ventricular system."
      ]
    },
    {
      "heading": "13. Cranial nerves",
      "content": "There are 12 pairs of cranial nerves arising from the brain or brainstem. They carry sensory, motor or mixed information, mainly involving the head and neck, although the vagus nerve also supplies structures in the thorax and abdomen.",
      "points": [
        "I Olfactory: sensory; smell.",
        "II Optic: sensory; vision.",
        "III Oculomotor: motor; most eye movements, eyelid elevation and pupil constriction.",
        "IV Trochlear: motor; controls the superior oblique muscle of the eye.",
        "V Trigeminal: mixed; facial sensation and muscles of mastication.",
        "VI Abducens: motor; abducts the eye through the lateral rectus muscle.",
        "VII Facial: mixed; facial expression, taste from anterior two-thirds of tongue and some glandular secretion.",
        "VIII Vestibulocochlear: sensory; hearing and balance.",
        "IX Glossopharyngeal: mixed; taste and sensation from posterior one-third of tongue, swallowing and other functions.",
        "X Vagus: mixed; swallowing, voice and parasympathetic control of thoracic and abdominal organs.",
        "XI Accessory: motor; sternocleidomastoid and trapezius muscles.",
        "XII Hypoglossal: motor; tongue movement.",
        "Clinical relevance: cranial nerve assessment can help localise neurological lesions."
      ]
    },
    {
      "heading": "14. Autonomic nervous system",
      "content": "The autonomic nervous system regulates involuntary functions of cardiac muscle, smooth muscle and glands. It helps maintain internal stability by adjusting organ activity in response to the body's needs.",
      "points": [
        "The sympathetic division is commonly associated with the fight-or-flight response.",
        "Sympathetic activation generally increases heart rate and contractility, dilates bronchi, dilates pupils and redirects blood flow towards skeletal muscles.",
        "It generally reduces gastrointestinal motility and secretion during acute stress.",
        "The parasympathetic division is commonly associated with rest-and-digest functions.",
        "Parasympathetic activity generally slows heart rate, constricts pupils and promotes digestion and glandular secretion.",
        "The sympathetic division has thoracolumbar outflow, arising from spinal cord segments T1-L2.",
        "The parasympathetic division has craniosacral outflow, arising from selected cranial nerves and sacral spinal segments S2-S4.",
        "Acetylcholine is released by all autonomic preganglionic neurons and most parasympathetic postganglionic neurons.",
        "Most sympathetic postganglionic neurons release noradrenaline, although important exceptions exist, including sympathetic innervation of many sweat glands.",
        "The enteric nervous system regulates many gastrointestinal activities and interacts with both sympathetic and parasympathetic pathways."
      ]
    },
    {
      "heading": "15. Sensory pathways and motor pathways",
      "content": "Sensory pathways transmit information from receptors to the CNS, where it is interpreted. Motor pathways transmit instructions from the CNS to muscles and other effectors. These pathways allow the body to respond appropriately to changes in the environment.",
      "points": [
        "Sensory receptors detect specific stimuli such as pain, temperature, touch, vibration and changes in body position.",
        "The dorsal column-medial lemniscus pathway carries fine touch, vibration and conscious proprioception.",
        "The spinothalamic pathway carries pain, temperature and crude touch.",
        "The corticospinal tract is an important descending pathway responsible for voluntary skilled movement.",
        "Upper motor neurons originate in the CNS and influence lower motor neurons.",
        "Lower motor neurons directly innervate skeletal muscle fibres.",
        "Upper motor neuron lesions may produce weakness, increased muscle tone, exaggerated deep tendon reflexes and a positive Babinski response in adults.",
        "Lower motor neuron lesions may produce weakness, reduced tone, reduced reflexes, muscle wasting and fasciculations."
      ]
    },
    {
      "heading": "16. Reflex actions and reflex arc",
      "content": "A reflex is a rapid, involuntary and predictable response to a stimulus. Reflexes protect the body and help maintain posture and internal stability. Many spinal reflexes are integrated at the level of the spinal cord.",
      "points": [
        "A reflex arc begins with a receptor that detects a stimulus.",
        "A sensory neuron carries the impulse towards the CNS.",
        "An integration centre in the spinal cord or brain processes the information.",
        "A motor neuron carries the response away from the CNS.",
        "An effector, such as a muscle or gland, produces the response.",
        "A monosynaptic reflex involves one synapse between the sensory and motor neurons, as in the basic stretch reflex.",
        "A polysynaptic reflex involves one or more interneurons, as in the withdrawal reflex.",
        "The patellar reflex tests the L2-L4 spinal segments, particularly L4, through the femoral nerve.",
        "The Achilles tendon reflex primarily tests S1, with contribution from S2.",
        "Reflex assessment helps identify abnormalities in peripheral nerves, spinal cord pathways and upper or lower motor neuron function."
      ]
    },
    {
      "heading": "17. Neurological assessment and diagnostic investigations",
      "content": "Neurological assessment evaluates the functional integrity of the brain, spinal cord and peripheral nerves. It is important in patients with altered consciousness, head injury, stroke, seizures, weakness, sensory changes and suspected spinal cord disorders.",
      "points": [
        "Level of consciousness: assess alertness and response to voice and painful stimulation where appropriate.",
        "Glasgow Coma Scale (GCS): assesses eye opening, verbal response and motor response. Scores range from 3 to 15; lower scores indicate more severe impairment of consciousness.",
        "Pupillary assessment: assess size, equality and reaction to light.",
        "Motor assessment: assess muscle strength, tone, symmetry, coordination and abnormal movements.",
        "Sensory assessment: assess pain, temperature, light touch, vibration and proprioception as clinically indicated.",
        "Reflex assessment: examine deep tendon reflexes and relevant superficial reflexes.",
        "Cranial nerve examination: evaluate functions such as vision, eye movement, facial sensation, facial movement, hearing, swallowing and tongue movement.",
        "CT scan: useful for rapid assessment of suspected intracranial haemorrhage, trauma and other acute structural abnormalities.",
        "MRI: provides detailed images of soft tissues, brain structures and spinal cord pathology.",
        "EEG: records electrical activity of the brain and is used in assessment of seizures and selected encephalopathies.",
        "Lumbar puncture: obtains CSF for investigations such as suspected meningitis or selected neurological disorders. It requires appropriate assessment for contraindications and signs of raised intracranial pressure.",
        "Nerve conduction studies and electromyography assess peripheral nerve and muscle function.",
        "Nursing responsibilities include explaining procedures, obtaining relevant baseline observations, checking safety and monitoring for complications."
      ]
    },
    {
      "heading": "18. Common neurological disorders and clinical relevance",
      "content": "Neurological disorders may affect the brain, spinal cord, peripheral nerves or neuromuscular junction. Understanding normal anatomy and physiology helps nurses recognise abnormalities, identify emergencies and provide safe, timely care.",
      "points": [
        "Stroke: sudden neurological dysfunction caused by interruption of cerebral blood supply (ischaemic stroke) or bleeding into or around the brain (haemorrhagic stroke). Recognise facial drooping, arm weakness and speech difficulty; activate the emergency stroke pathway.",
        "Epilepsy: a neurological condition characterised by an enduring tendency to have epileptic seizures. During a seizure, protect the patient from injury, time the event, maintain safety and assess airway and breathing. Do not restrain the patient or put objects in the mouth.",
        "Meningitis: inflammation of the meninges, commonly due to infection. Features may include fever, headache, neck stiffness and altered mental status. Suspected bacterial meningitis is a medical emergency.",
        "Parkinson disease: a progressive neurodegenerative disorder associated with loss of dopaminergic neurons in the substantia nigra. Features include bradykinesia, rigidity, resting tremor and postural instability.",
        "Alzheimer disease: a progressive neurodegenerative condition and a common cause of dementia, affecting memory, cognition and daily functioning.",
        "Multiple sclerosis: an immune-mediated disease involving CNS demyelination, producing variable neurological symptoms such as visual disturbance, weakness, sensory changes and impaired coordination.",
        "Spinal cord injury: may cause motor, sensory and autonomic dysfunction below the level of injury. Maintain spinal precautions when injury is suspected and monitor respiratory and cardiovascular function.",
        "Peripheral neuropathy: damage to peripheral nerves that may cause numbness, tingling, burning pain, weakness and reduced reflexes. Diabetes is an important cause.",
        "Raised intracranial pressure: may result from trauma, bleeding, tumours or cerebral oedema. Deteriorating consciousness, vomiting and pupillary changes require urgent assessment.",
        "Nursing priorities include airway protection, neurological observations, prevention of injury, aspiration precautions where indicated, pressure area care, rehabilitation and patient and family education."
      ]
    }
  ],
  "clinicalApplication": [
    {
      "heading": "Clinical case: recognising an acute stroke",
      "content": "A 64-year-old patient suddenly develops weakness of the right arm, facial asymmetry and difficulty speaking. The symptoms began approximately 30 minutes ago.",
      "points": [
        "The sudden onset of focal neurological deficits raises suspicion of an acute stroke.",
        "Right-sided weakness may indicate injury to motor pathways in the left cerebral hemisphere.",
        "Speech difficulty may indicate involvement of dominant-hemisphere language regions, although the precise cause requires clinical assessment.",
        "Use a recognised stroke screening approach such as FAST: Face, Arm, Speech, Time.",
        "Activate the emergency stroke pathway immediately and document the time the patient was last known well.",
        "Assess airway, breathing and circulation, monitor vital signs and blood glucose, and assess neurological status.",
        "Keep the patient nil by mouth until swallowing safety has been assessed.",
        "Urgent brain imaging is needed to distinguish ischaemic from haemorrhagic stroke before appropriate treatment is selected.",
        "Do not give food, fluids or oral medication until swallowing safety is established."
      ]
    },
    {
      "heading": "Nursing application: caring for a patient with reduced consciousness",
      "content": "A patient admitted following a head injury becomes increasingly drowsy and responds less effectively to verbal commands.",
      "points": [
        "Treat deterioration in consciousness as an emergency and escalate immediately.",
        "Assess airway patency, respiratory effort, oxygenation and circulation.",
        "Repeat and document GCS, pupil size and reaction, limb movement and vital signs according to the clinical protocol.",
        "Observe for vomiting, seizures, unequal pupils and new neurological deficits.",
        "Maintain appropriate positioning and spinal precautions where indicated.",
        "Prepare for urgent clinical review and investigations.",
        "Avoid assuming that drowsiness is simply due to fatigue or medication without assessment."
      ]
    }
  ],
  "examPoints": [
    "The nervous system has two main anatomical divisions: CNS and PNS.",
    "The CNS consists of the brain and spinal cord.",
    "Afferent neurons carry sensory impulses towards the CNS; efferent neurons carry commands away from it.",
    "The neuron is the functional unit of the nervous system.",
    "Oligodendrocytes form CNS myelin; Schwann cells form PNS myelin.",
    "The typical resting membrane potential of a neuron is approximately -70 mV.",
    "Depolarisation is commonly caused by sodium influx; repolarisation is commonly caused by potassium efflux.",
    "The cerebellum coordinates balance, posture and smooth voluntary movement.",
    "The medulla oblongata contains vital centres involved in cardiovascular and respiratory regulation.",
    "The hypothalamus regulates temperature, hunger, thirst, autonomic activity and endocrine functions.",
    "The spinal cord usually terminates around the L1-L2 vertebral level in adults.",
    "There are 31 pairs of spinal nerves.",
    "The meninges from outermost to innermost are dura mater, arachnoid mater and pia mater.",
    "The patellar reflex primarily tests L2-L4; the Achilles reflex primarily tests S1.",
    "The GCS assesses eye opening, verbal response and motor response, with a maximum score of 15.",
    "The sympathetic division supports fight-or-flight responses; the parasympathetic division supports rest-and-digest functions.",
    "The frontal lobe is associated with voluntary motor control and executive functions; the occipital lobe processes vision.",
    "Stroke, meningitis, seizures and deteriorating consciousness are important neurological emergencies."
  ],
  "questions": [
    {
      "question": "Which two structures form the central nervous system?",
      "options": [
        "Brain and spinal cord",
        "Cranial nerves and spinal nerves",
        "Brain and peripheral ganglia",
        "Spinal nerves and autonomic ganglia"
      ],
      "answer": "A",
      "explanation": "The CNS consists of the brain and spinal cord. Cranial nerves, spinal nerves and peripheral ganglia are components of the PNS."
    },
    {
      "question": "Which part of a neuron primarily receives incoming signals from other neurons?",
      "options": [
        "Axon",
        "Dendrites",
        "Myelin sheath",
        "Axon terminal"
      ],
      "answer": "B",
      "explanation": "Dendrites receive signals and generally conduct them towards the cell body. The axon carries action potentials away from the cell body."
    },
    {
      "question": "Which neuroglial cell forms myelin in the central nervous system?",
      "options": [
        "Schwann cell",
        "Astrocyte",
        "Oligodendrocyte",
        "Microglial cell"
      ],
      "answer": "C",
      "explanation": "Oligodendrocytes form myelin in the CNS. Schwann cells form myelin in the PNS."
    },
    {
      "question": "The typical resting membrane potential of a neuron is approximately:",
      "options": [
        "+70 mV",
        "0 mV",
        "-70 mV",
        "-120 mV"
      ],
      "answer": "C",
      "explanation": "A typical resting neuronal membrane potential is approximately -70 mV, although the exact value varies between cells."
    },
    {
      "question": "Which ion movement is mainly responsible for the rapid depolarisation phase of a typical neuronal action potential?",
      "options": [
        "Sodium entering the neuron",
        "Potassium entering the neuron",
        "Chloride leaving the neuron",
        "Calcium leaving the neuron"
      ],
      "answer": "A",
      "explanation": "Opening of voltage-gated sodium channels allows sodium to enter the neuron, making the membrane potential less negative."
    },
    {
      "question": "Which brain structure is primarily responsible for coordination of voluntary movement and balance?",
      "options": [
        "Hypothalamus",
        "Cerebellum",
        "Medulla oblongata",
        "Thalamus"
      ],
      "answer": "B",
      "explanation": "The cerebellum coordinates the timing, precision and smoothness of movement and contributes to posture and balance."
    },
    {
      "question": "Which structure contains important centres regulating breathing and heart rate?",
      "options": [
        "Occipital lobe",
        "Cerebellum",
        "Medulla oblongata",
        "Hippocampus"
      ],
      "answer": "C",
      "explanation": "The medulla oblongata contains vital autonomic centres involved in respiratory and cardiovascular regulation."
    },
    {
      "question": "Which cranial nerve is responsible for the sense of smell?",
      "options": [
        "Optic nerve",
        "Olfactory nerve",
        "Trigeminal nerve",
        "Facial nerve"
      ],
      "answer": "B",
      "explanation": "Cranial nerve I, the olfactory nerve, is responsible for smell."
    },
    {
      "question": "Which meningeal layer lies directly against the surface of the brain?",
      "options": [
        "Dura mater",
        "Arachnoid mater",
        "Pia mater",
        "Periosteum"
      ],
      "answer": "C",
      "explanation": "The pia mater is the delicate innermost meningeal layer and closely follows the surface of the brain and spinal cord."
    },
    {
      "question": "A patient has difficulty maintaining balance and demonstrates uncoordinated movements. Which structure may be affected?",
      "options": [
        "Cerebellum",
        "Thalamus",
        "Hypothalamus",
        "Frontal sinus"
      ],
      "answer": "A",
      "explanation": "Cerebellar damage can cause ataxia, impaired balance and poor coordination of voluntary movement."
    },
    {
      "question": "A patient suddenly develops facial drooping, arm weakness and speech difficulty. What is the nurse's priority?",
      "options": [
        "Allow the patient to sleep and reassess later",
        "Give oral fluids immediately",
        "Activate the emergency stroke pathway",
        "Encourage the patient to walk"
      ],
      "answer": "C",
      "explanation": "These are warning signs of acute stroke. Immediate escalation and activation of the stroke pathway are essential because timely assessment and treatment can reduce disability and death."
    },
    {
      "question": "Which components are assessed in the Glasgow Coma Scale?",
      "options": [
        "Pupil size, blood pressure and pulse",
        "Eye opening, verbal response and motor response",
        "Memory, hearing and visual acuity",
        "Muscle tone, reflexes and coordination"
      ],
      "answer": "B",
      "explanation": "The GCS assesses eye opening, verbal response and motor response. The maximum score is 15 and the minimum is 3."
    }
  ]
};

lessonContent["Endocrine system"] = {
  "objectives": [
    "Define the endocrine system and distinguish endocrine from exocrine glands.",
    "Classify hormones and explain their mechanisms of action.",
    "Describe the hypothalamus and pituitary gland and their hormonal functions.",
    "Explain the functions of the thyroid and parathyroid glands.",
    "Describe the adrenal glands and their cortical and medullary hormones.",
    "Explain the endocrine functions of the pancreas.",
    "Describe the endocrine roles of the ovaries, testes, pineal gland and thymus.",
    "Explain negative and positive feedback mechanisms.",
    "Describe regulation of blood glucose, calcium, metabolism, growth and reproduction.",
    "Relate endocrine physiology to common clinical disorders and nursing care."
  ],
  "notes": [
    {
      "heading": "1. Introduction to the endocrine system",
      "content": "The endocrine system is a network of ductless glands and hormone-producing tissues that regulate body functions through chemical messengers called hormones. Hormones are released into the interstitial fluid and usually enter the bloodstream, through which they travel to target cells possessing specific receptors. The endocrine system works with the nervous system to maintain homeostasis.",
      "points": [
        "Major functions include regulation of metabolism, growth, development, reproduction, stress responses and fluid-electrolyte balance.",
        "Hormones help regulate blood glucose, calcium concentration, blood pressure, body temperature and energy utilisation.",
        "Endocrine responses are generally slower in onset than nervous responses but may have longer-lasting effects.",
        "Hormones act only on target cells that possess appropriate receptors.",
        "Major endocrine glands include the pituitary, thyroid, parathyroids, adrenals, pancreatic islets, ovaries and testes.",
        "Other hormone-producing organs include the hypothalamus, pineal gland, kidneys, heart, gastrointestinal tract, placenta and adipose tissue."
      ]
    },
    {
      "heading": "2. Endocrine glands versus exocrine glands",
      "content": "Endocrine glands are ductless and release hormones into the surrounding tissue fluid and circulation. Exocrine glands release their products through ducts onto an epithelial surface or into a body cavity. Some organs, such as the pancreas, have both endocrine and exocrine functions.",
      "points": [
        "Endocrine example: thyroid gland releases T3 and T4 into the bloodstream.",
        "Exocrine example: salivary glands release saliva through ducts into the mouth.",
        "Endocrine example: pancreatic islets release insulin and glucagon into the blood.",
        "Exocrine example: pancreatic acinar cells release digestive enzymes through ducts into the duodenum.",
        "The liver has important metabolic and secretory functions, including production of substances released into blood and bile.",
        "Endocrine secretions act on target cells, whereas exocrine secretions generally act locally or within a lumen."
      ]
    },
    {
      "heading": "3. Hormones: classification and characteristics",
      "content": "Hormones are chemical messengers produced by specialised cells. They regulate target-cell activity by binding to specific receptors. Hormones can be classified according to their chemical structure, which influences their solubility, transport in blood, receptor location and duration of action.",
      "points": [
        "Peptide and protein hormones consist of chains of amino acids. Examples include insulin, glucagon, growth hormone, ADH and oxytocin.",
        "Steroid hormones are derived from cholesterol. Examples include cortisol, aldosterone, oestrogen, progesterone and testosterone.",
        "Amine hormones are derived mainly from amino acids such as tyrosine or tryptophan. Examples include adrenaline, noradrenaline, thyroid hormones and melatonin.",
        "Most peptide hormones are water-soluble and circulate freely in plasma.",
        "Steroid hormones are lipid-soluble and commonly circulate bound to transport proteins.",
        "Thyroid hormones are amino-acid derivatives but are lipid-soluble and circulate largely bound to plasma proteins.",
        "Hormone concentration depends on synthesis, secretion, transport, metabolism and elimination.",
        "Hormone effects depend on receptor number, receptor sensitivity and the availability of the hormone."
      ]
    },
    {
      "heading": "4. Mechanisms of hormone action",
      "content": "Hormones produce effects by binding to receptors on the cell membrane or inside the target cell. The mechanism depends largely on whether the hormone is water-soluble or lipid-soluble.",
      "points": [
        "Water-soluble hormones generally bind to receptors on the cell membrane because they cannot readily pass through the lipid bilayer.",
        "Binding may activate intracellular second-messenger systems such as cyclic AMP, calcium or phosphoinositide pathways.",
        "Second messengers amplify signals and alter enzyme activity, ion-channel function or other cellular processes.",
        "Lipid-soluble steroid hormones cross the cell membrane and bind to intracellular receptors.",
        "Hormone-receptor complexes can influence gene transcription and protein synthesis.",
        "Intracellular mechanisms may have a slower onset but can produce prolonged effects.",
        "The same hormone may produce different effects in different tissues because target cells may possess different receptor types and intracellular signalling systems."
      ]
    },
    {
      "heading": "5. Regulation of hormone secretion and feedback mechanisms",
      "content": "Hormone secretion is regulated by feedback mechanisms and by neural or chemical stimuli. Negative feedback is the most common regulatory mechanism. It maintains stability by reducing the original stimulus once an adequate response has occurred.",
      "points": [
        "Negative feedback: the response reduces the stimulus that initiated hormone release.",
        "Example: increased thyroid hormone levels suppress hypothalamic TRH and pituitary TSH secretion.",
        "Example: increased blood glucose stimulates insulin secretion; insulin promotes glucose uptake and storage, reducing blood glucose.",
        "Positive feedback: the response amplifies the original stimulus until a specific event ends the process.",
        "Example: oxytocin intensifies uterine contractions during labour, causing further oxytocin release until delivery.",
        "Humoral stimuli: changes in blood concentrations of substances such as glucose, calcium or potassium trigger hormone secretion.",
        "Hormonal stimuli: one hormone stimulates another endocrine gland, as TSH stimulates thyroid hormone secretion.",
        "Neural stimuli: nerve impulses trigger hormone release, as sympathetic stimulation causes adrenal medullary secretion of catecholamines."
      ]
    },
    {
      "heading": "6. Hypothalamus and its endocrine functions",
      "content": "The hypothalamus is located below the thalamus and forms part of the diencephalon. It links the nervous and endocrine systems and plays a central role in homeostasis. It controls the anterior pituitary through releasing and inhibiting hormones and produces hormones that are released through the posterior pituitary.",
      "points": [
        "Thyrotropin-releasing hormone (TRH) stimulates anterior pituitary TSH secretion and can also influence prolactin secretion.",
        "Corticotropin-releasing hormone (CRH) stimulates ACTH secretion.",
        "Gonadotropin-releasing hormone (GnRH) stimulates FSH and LH secretion.",
        "Growth hormone-releasing hormone (GHRH) stimulates growth hormone secretion.",
        "Somatostatin inhibits growth hormone secretion and also inhibits TSH secretion.",
        "Dopamine inhibits prolactin secretion.",
        "The hypothalamus synthesises antidiuretic hormone (ADH) and oxytocin; these are transported to and released from the posterior pituitary.",
        "The hypothalamus also regulates thirst, hunger, body temperature, sleep, autonomic function and circadian rhythms."
      ]
    },
    {
      "heading": "7. Pituitary gland",
      "content": "The pituitary gland lies in the sella turcica of the sphenoid bone and is connected to the hypothalamus by the infundibulum. It is often called the master gland because many of its hormones regulate other endocrine glands. However, its activity is itself controlled by the hypothalamus and feedback from target hormones.",
      "points": [
        "The anterior pituitary, or adenohypophysis, synthesises and secretes several hormones.",
        "Growth hormone (GH): promotes growth and influences protein synthesis, metabolism and tissue development, partly through insulin-like growth factor 1 (IGF-1).",
        "Thyroid-stimulating hormone (TSH): stimulates thyroid growth and production of T3 and T4.",
        "Adrenocorticotropic hormone (ACTH): stimulates the adrenal cortex, particularly cortisol production.",
        "Follicle-stimulating hormone (FSH): supports ovarian follicular development and oestrogen production; in males it supports spermatogenesis through Sertoli cells.",
        "Luteinising hormone (LH): triggers ovulation and supports progesterone secretion by the corpus luteum; in males it stimulates testosterone production by Leydig cells.",
        "Prolactin: stimulates milk production by the mammary glands after childbirth.",
        "The posterior pituitary, or neurohypophysis, stores and releases ADH and oxytocin made in the hypothalamus.",
        "ADH promotes water reabsorption in the kidney collecting ducts and helps regulate plasma osmolality and blood volume.",
        "Oxytocin stimulates uterine contractions during labour and milk ejection during breastfeeding."
      ]
    },
    {
      "heading": "8. Thyroid gland",
      "content": "The thyroid gland is a butterfly-shaped gland located in the anterior neck, below the larynx and in front of the trachea. It consists of two lobes connected by an isthmus. It contains follicles filled with colloid, where thyroid hormone synthesis and storage occur.",
      "points": [
        "Follicular cells produce thyroxine (T4) and triiodothyronine (T3).",
        "T3 is more biologically active than T4. Much circulating T3 is produced by conversion of T4 in peripheral tissues.",
        "Thyroid hormones increase basal metabolic rate, oxygen consumption and heat production.",
        "They are essential for normal growth, skeletal development and brain development, especially during fetal life and infancy.",
        "Thyroid hormone production requires iodine.",
        "TSH from the anterior pituitary stimulates thyroid hormone synthesis and secretion.",
        "Parafollicular or C cells produce calcitonin, which can inhibit osteoclast activity and reduce blood calcium, although its role in adult calcium regulation is relatively limited.",
        "Hypothyroidism may cause fatigue, cold intolerance, weight gain, constipation, dry skin and bradycardia.",
        "Hyperthyroidism may cause heat intolerance, weight loss, tremor, palpitations, sweating and increased bowel activity.",
        "Goitre refers to enlargement of the thyroid gland and may occur in several thyroid disorders."
      ]
    },
    {
      "heading": "9. Parathyroid glands and calcium regulation",
      "content": "Usually four small parathyroid glands are located on the posterior surface of the thyroid gland. They secrete parathyroid hormone (PTH), a major regulator of extracellular calcium and phosphate balance.",
      "points": [
        "A fall in blood calcium stimulates PTH secretion.",
        "PTH increases renal calcium reabsorption, reducing urinary calcium loss.",
        "PTH reduces renal phosphate reabsorption, increasing phosphate excretion.",
        "PTH stimulates renal activation of vitamin D into calcitriol.",
        "Calcitriol increases intestinal absorption of calcium and phosphate.",
        "PTH promotes increased bone resorption indirectly by stimulating osteoblast-lineage cells to activate osteoclasts.",
        "The overall effect of PTH is to increase blood calcium.",
        "Hypoparathyroidism may cause hypocalcaemia, tingling, muscle cramps, tetany and seizures.",
        "Hyperparathyroidism may cause hypercalcaemia, bone loss, renal stones, abdominal symptoms and neuropsychiatric changes."
      ]
    },
    {
      "heading": "10. Adrenal glands",
      "content": "The adrenal glands are paired endocrine glands situated on the superior poles of the kidneys. Each gland consists of an outer cortex and an inner medulla. These regions have different embryological origins, hormones and functions.",
      "points": [
        "The adrenal cortex produces steroid hormones and is divided into three zones.",
        "Zona glomerulosa: produces mineralocorticoids, mainly aldosterone.",
        "Zona fasciculata: produces glucocorticoids, mainly cortisol.",
        "Zona reticularis: produces adrenal androgens, including dehydroepiandrosterone (DHEA).",
        "The adrenal medulla produces catecholamines, mainly adrenaline and noradrenaline.",
        "Aldosterone increases sodium reabsorption and potassium secretion in the distal nephron, promoting water retention and supporting blood volume and pressure.",
        "Cortisol increases blood glucose availability, supports the stress response, influences protein and fat metabolism and has anti-inflammatory effects.",
        "Adrenal androgens contribute to androgen activity, particularly in females.",
        "Adrenaline and noradrenaline prepare the body for acute stress by increasing heart activity, altering vascular tone and promoting energy mobilisation."
      ]
    },
    {
      "heading": "11. Regulation of adrenal hormone secretion",
      "content": "Adrenal hormone secretion is controlled by different mechanisms depending on the hormone. Cortisol is mainly regulated by the hypothalamic-pituitary-adrenal axis, while aldosterone is mainly controlled by the renin-angiotensin-aldosterone system and plasma potassium.",
      "points": [
        "The hypothalamus releases CRH, which stimulates the anterior pituitary to release ACTH.",
        "ACTH stimulates the adrenal cortex to produce cortisol.",
        "Cortisol exerts negative feedback on the hypothalamus and anterior pituitary, reducing CRH and ACTH secretion.",
        "Reduced blood volume or pressure and reduced renal perfusion stimulate renin release from the kidneys.",
        "Renin converts angiotensinogen into angiotensin I; ACE converts angiotensin I into angiotensin II.",
        "Angiotensin II stimulates aldosterone secretion from the zona glomerulosa.",
        "Increased plasma potassium also directly stimulates aldosterone secretion.",
        "Aldosterone increases sodium reabsorption and potassium secretion in the distal nephron.",
        "The adrenal medulla is stimulated by sympathetic preganglionic nerve fibres during stress."
      ]
    },
    {
      "heading": "12. Pancreas and endocrine regulation of blood glucose",
      "content": "The pancreas is an elongated organ located behind the stomach. It has both exocrine and endocrine functions. Its endocrine component consists of clusters of cells called the islets of Langerhans, which release hormones that regulate nutrient metabolism.",
      "points": [
        "Beta cells produce insulin, which lowers blood glucose by promoting glucose uptake in skeletal muscle and adipose tissue and promoting storage of nutrients.",
        "Insulin stimulates glycogen synthesis in the liver and skeletal muscles and promotes fat and protein synthesis.",
        "Alpha cells produce glucagon, which raises blood glucose mainly by stimulating hepatic glycogenolysis and gluconeogenesis.",
        "Delta cells produce somatostatin, which inhibits the secretion of several hormones, including insulin and glucagon.",
        "Pancreatic polypeptide cells produce pancreatic polypeptide, which influences pancreatic secretion and gastrointestinal functions.",
        "After a meal, increased blood glucose stimulates insulin secretion.",
        "During fasting, low blood glucose stimulates glucagon secretion.",
        "Insulin facilitates glucose entry into skeletal muscle and adipose tissue through GLUT4 transporters.",
        "The liver can take up and release glucose according to metabolic conditions and does not depend on insulin for glucose entry through its principal glucose transporter.",
        "Insufficient insulin production or action contributes to diabetes mellitus."
      ]
    },
    {
      "heading": "13. Other endocrine organs and tissues",
      "content": "Several organs not traditionally classified as endocrine glands also produce hormones. These hormones regulate reproduction, sleep, immunity, fluid balance and digestion.",
      "points": [
        "Pineal gland: secretes melatonin, which helps regulate circadian rhythms and the sleep-wake cycle.",
        "Ovaries: produce oestrogen and progesterone, which regulate female reproductive functions, menstrual cycles and pregnancy-related changes.",
        "Testes: produce testosterone, which supports male reproductive development, spermatogenesis and secondary sexual characteristics.",
        "Thymus: produces thymic hormones that contribute to T-lymphocyte development, particularly during childhood.",
        "Kidneys: produce erythropoietin, which stimulates red blood cell production, and renin, which participates in blood pressure regulation. They also activate vitamin D.",
        "Heart: releases atrial natriuretic peptide (ANP), which promotes sodium and water excretion and helps reduce blood volume and pressure.",
        "Gastrointestinal tract: produces hormones such as gastrin, secretin, cholecystokinin and incretins that regulate digestion and metabolism.",
        "Adipose tissue: produces hormones such as leptin, which signals energy stores and influences appetite regulation.",
        "Placenta: produces hormones including human chorionic gonadotropin, oestrogen and progesterone during pregnancy."
      ]
    },
    {
      "heading": "14. Hormonal regulation of growth and metabolism",
      "content": "Growth and metabolism are regulated through interactions among growth hormone, thyroid hormones, insulin, cortisol and sex hormones. These hormones influence cell division, protein synthesis, energy use and tissue development.",
      "points": [
        "Growth hormone is secreted by the anterior pituitary and promotes tissue growth partly through IGF-1 produced mainly by the liver.",
        "GH promotes protein synthesis and influences fat and carbohydrate metabolism.",
        "Excess GH before closure of the epiphyseal plates may cause gigantism.",
        "Excess GH after epiphyseal plate closure may cause acromegaly.",
        "GH deficiency during childhood may impair linear growth.",
        "Thyroid hormones are necessary for normal growth and development and increase metabolic activity.",
        "Insulin promotes nutrient uptake and storage and is an important anabolic hormone.",
        "Cortisol supports the body's response to stress and helps maintain glucose availability, but prolonged excess can cause muscle wasting and hyperglycaemia."
      ]
    },
    {
      "heading": "15. Hormonal regulation of reproduction",
      "content": "Reproductive functions are controlled by the hypothalamic-pituitary-gonadal axis. GnRH from the hypothalamus stimulates pituitary release of FSH and LH, which regulate the gonads.",
      "points": [
        "In females, FSH stimulates growth and maturation of ovarian follicles.",
        "Oestrogen produced by developing follicles promotes endometrial proliferation and female secondary sexual characteristics.",
        "A sustained high oestrogen level before ovulation produces positive feedback that contributes to the LH surge.",
        "The LH surge triggers ovulation.",
        "After ovulation, the corpus luteum secretes progesterone and oestrogen.",
        "Progesterone prepares and maintains the endometrium for possible implantation.",
        "In males, LH stimulates Leydig cells to produce testosterone.",
        "FSH acts on Sertoli cells and supports spermatogenesis.",
        "Testosterone supports male reproductive organs, sperm production and secondary sexual characteristics.",
        "Prolactin supports milk production, while oxytocin causes milk ejection during breastfeeding."
      ]
    },
    {
      "heading": "16. Hormonal regulation of fluid, electrolytes and blood pressure",
      "content": "The endocrine system regulates extracellular fluid volume, osmolality, sodium, potassium and blood pressure through coordinated action of ADH, aldosterone, the renin-angiotensin system and natriuretic peptides.",
      "points": [
        "ADH is released from the posterior pituitary when plasma osmolality rises or when significant reduction in circulating volume occurs.",
        "ADH increases water reabsorption in collecting ducts by promoting insertion of aquaporin-2 water channels.",
        "Aldosterone promotes sodium reabsorption and potassium secretion in the distal nephron.",
        "The renin-angiotensin-aldosterone system supports blood pressure and circulating volume when renal perfusion is reduced.",
        "ANP is released by atrial muscle cells in response to atrial stretch.",
        "ANP promotes sodium and water excretion and opposes some actions of the renin-angiotensin-aldosterone system.",
        "PTH and vitamin D work together to maintain calcium and phosphate balance.",
        "Abnormalities in these pathways can contribute to dehydration, oedema, hypertension and electrolyte disturbances."
      ]
    },
    {
      "heading": "17. Common endocrine disorders",
      "content": "Endocrine disorders arise when glands produce too much or too little hormone, when target tissues respond abnormally, or when hormone receptors and regulatory pathways are impaired.",
      "points": [
        "Diabetes mellitus: chronic hyperglycaemia caused by deficient insulin secretion, impaired insulin action or both. Type 1 diabetes involves autoimmune destruction of pancreatic beta cells; type 2 diabetes involves insulin resistance with progressive beta-cell dysfunction.",
        "Diabetes insipidus: impaired ADH secretion or renal response to ADH causes excessive dilute urine and intense thirst.",
        "SIADH: inappropriate ADH activity causes excessive water retention and may produce dilutional hyponatraemia.",
        "Hypothyroidism: inadequate thyroid hormone action may cause fatigue, weight gain, cold intolerance, constipation and bradycardia.",
        "Hyperthyroidism: excess thyroid hormone action may cause weight loss, heat intolerance, tremor, tachycardia and anxiety.",
        "Cushing syndrome: prolonged exposure to excess glucocorticoids, often associated with central weight gain, muscle weakness, hyperglycaemia and hypertension.",
        "Addison disease: primary adrenal insufficiency involving deficient cortisol and often aldosterone, which may cause fatigue, weight loss, hypotension, hyperpigmentation and electrolyte abnormalities.",
        "Hyperparathyroidism: excess PTH causes increased blood calcium and may contribute to bone disease and renal stones.",
        "Hypoparathyroidism: reduced PTH can cause hypocalcaemia, paraesthesia, muscle spasms and tetany.",
        "Acromegaly: excess growth hormone after epiphyseal closure causes enlargement of hands, feet and facial structures.",
        "Endocrine emergencies include diabetic ketoacidosis, hyperosmolar hyperglycaemic state, severe hypoglycaemia, thyroid storm and adrenal crisis."
      ]
    },
    {
      "heading": "18. Endocrine investigations and nursing responsibilities",
      "content": "Endocrine investigations assess hormone concentrations, gland function and the effects of hormonal imbalance. Results must be interpreted in relation to symptoms, timing, medications, physiological state and the laboratory's reference ranges.",
      "points": [
        "Blood glucose: assesses current glucose concentration. Fasting plasma glucose and random glucose may be used in diabetes assessment.",
        "HbA1c: reflects average glycaemia over approximately the preceding 2-3 months and is used in diabetes diagnosis and monitoring.",
        "Thyroid function tests: TSH and free T4 are commonly used to assess thyroid function; free T3 may be useful in selected situations.",
        "Cortisol testing: may involve timed blood, saliva or urine testing depending on the suspected disorder.",
        "ACTH testing: helps distinguish certain primary and secondary causes of adrenal insufficiency or cortisol excess.",
        "Serum calcium, phosphate, magnesium and PTH: help assess parathyroid and mineral metabolism disorders.",
        "Serum and urine osmolality and urine volume: help assess disorders involving ADH and water balance.",
        "Dynamic tests: stimulation or suppression tests assess the ability of an endocrine axis to respond appropriately.",
        "Ultrasound, CT and MRI may identify structural abnormalities of endocrine organs.",
        "Nursing responsibilities include explaining the purpose of tests, checking preparation requirements, observing timed sampling instructions and documenting medications that may affect results.",
        "Monitor for clinical deterioration, especially hypoglycaemia, severe hyperglycaemia, dehydration, hypotension and altered consciousness."
      ]
    }
  ],
  "clinicalApplication": [
    {
      "heading": "Clinical case: a patient with possible diabetes mellitus",
      "content": "A 48-year-old patient reports excessive thirst, frequent urination, increased hunger, fatigue and unexplained weight loss. Random plasma glucose is markedly elevated.",
      "points": [
        "Polyuria results partly from glucose in the filtrate causing osmotic diuresis.",
        "Polydipsia develops as the body attempts to replace water lost through increased urination.",
        "Polyphagia may occur because glucose cannot be utilised normally in insulin deficiency or resistance.",
        "Assess hydration status, vital signs, weight and blood glucose.",
        "Check for features of diabetic ketoacidosis or hyperosmolar hyperglycaemic state when clinically indicated.",
        "Explain the importance of diagnostic confirmation, long-term glucose monitoring, nutrition, activity and prescribed treatment.",
        "Teach the patient to recognise symptoms of hypoglycaemia and hyperglycaemia."
      ]
    },
    {
      "heading": "Clinical case: suspected adrenal crisis",
      "content": "A patient with known adrenal insufficiency presents with severe weakness, vomiting, abdominal pain and hypotension following an acute infection.",
      "points": [
        "Consider adrenal crisis, a life-threatening deficiency of cortisol, often with mineralocorticoid deficiency in primary adrenal insufficiency.",
        "Prioritise emergency escalation and assessment of airway, breathing and circulation.",
        "Monitor blood pressure, pulse, consciousness, glucose and electrolytes.",
        "Prepare for prescribed emergency intravenous hydrocortisone and isotonic fluid replacement according to protocol.",
        "Do not delay emergency treatment while waiting for laboratory confirmation when adrenal crisis is strongly suspected.",
        "Provide education about prescribed steroid replacement, sick-day dose instructions and emergency steroid identification."
      ]
    }
  ],
  "examPoints": [
    "Endocrine glands are ductless and release hormones into the circulation.",
    "Hormones act on target cells with specific receptors.",
    "Peptide hormones generally act through membrane receptors; steroid hormones generally act through intracellular receptors.",
    "Negative feedback is the most common mechanism regulating hormone secretion.",
    "The hypothalamus controls the anterior pituitary through releasing and inhibiting hormones.",
    "The posterior pituitary stores and releases ADH and oxytocin, which are synthesised in the hypothalamus.",
    "Anterior pituitary hormones: GH, TSH, ACTH, FSH, LH and prolactin.",
    "Thyroid hormones T3 and T4 increase metabolic activity and are essential for normal growth and development.",
    "PTH increases blood calcium; calcitonin can reduce osteoclast activity.",
    "Adrenal cortex zones: glomerulosa produces aldosterone, fasciculata produces cortisol, reticularis produces adrenal androgens.",
    "Adrenal medulla secretes adrenaline and noradrenaline.",
    "Insulin lowers blood glucose; glucagon raises blood glucose.",
    "ADH increases renal water reabsorption; aldosterone increases sodium reabsorption and potassium secretion.",
    "Cortisol is regulated through the CRH-ACTH-adrenal axis.",
    "LH surge triggers ovulation; FSH supports ovarian follicular development.",
    "Diabetes mellitus involves impaired insulin secretion, insulin action or both.",
    "Addison disease is primary adrenal insufficiency; Cushing syndrome involves excess glucocorticoid exposure.",
    "HbA1c reflects average blood glucose over approximately 2-3 months."
  ],
  "questions": [
    {
      "question": "Which characteristic best distinguishes endocrine glands from exocrine glands?",
      "options": [
        "Endocrine glands release their secretions through ducts.",
        "Endocrine glands release hormones into the surrounding fluid and circulation.",
        "Endocrine glands produce only digestive enzymes.",
        "Endocrine glands are found only in the abdomen."
      ],
      "answer": "B",
      "explanation": "Endocrine glands are ductless and release hormones into interstitial fluid and blood. Exocrine glands release their products through ducts."
    },
    {
      "question": "Which hormone is synthesised in the hypothalamus and released from the posterior pituitary?",
      "options": [
        "Thyroid-stimulating hormone",
        "Growth hormone",
        "Antidiuretic hormone",
        "Adrenocorticotropic hormone"
      ],
      "answer": "C",
      "explanation": "ADH is synthesised in hypothalamic neurons, transported down their axons and stored and released by the posterior pituitary."
    },
    {
      "question": "Which anterior pituitary hormone stimulates the thyroid gland?",
      "options": [
        "ACTH",
        "TSH",
        "FSH",
        "Prolactin"
      ],
      "answer": "B",
      "explanation": "Thyroid-stimulating hormone stimulates thyroid follicular cells to synthesise and release T3 and T4."
    },
    {
      "question": "Which hormone is primarily responsible for lowering blood glucose?",
      "options": [
        "Glucagon",
        "Cortisol",
        "Insulin",
        "Adrenaline"
      ],
      "answer": "C",
      "explanation": "Insulin promotes glucose uptake in skeletal muscle and adipose tissue and promotes storage of glucose as glycogen, reducing blood glucose."
    },
    {
      "question": "Which pancreatic cells secrete glucagon?",
      "options": [
        "Beta cells",
        "Alpha cells",
        "Delta cells",
        "Acinar cells"
      ],
      "answer": "B",
      "explanation": "Alpha cells of the pancreatic islets secrete glucagon, which raises blood glucose mainly by stimulating hepatic glycogenolysis and gluconeogenesis."
    },
    {
      "question": "Which adrenal cortical zone produces aldosterone?",
      "options": [
        "Zona fasciculata",
        "Zona reticularis",
        "Zona glomerulosa",
        "Adrenal medulla"
      ],
      "answer": "C",
      "explanation": "The zona glomerulosa is the outer adrenal cortical layer and produces mineralocorticoids, mainly aldosterone."
    },
    {
      "question": "Which hormone increases sodium reabsorption and potassium secretion in the distal nephron?",
      "options": [
        "Insulin",
        "Aldosterone",
        "Oxytocin",
        "Prolactin"
      ],
      "answer": "B",
      "explanation": "Aldosterone acts on the distal nephron to increase sodium reabsorption and potassium secretion."
    },
    {
      "question": "A patient has weight loss, heat intolerance, tremor and tachycardia. Which condition is most likely?",
      "options": [
        "Hypothyroidism",
        "Hyperthyroidism",
        "Hypoparathyroidism",
        "Addison disease"
      ],
      "answer": "B",
      "explanation": "Excess thyroid hormone increases metabolic activity and may cause weight loss, heat intolerance, tremor and tachycardia."
    },
    {
      "question": "Which hormone stimulates uterine contractions during labour and milk ejection during breastfeeding?",
      "options": [
        "Prolactin",
        "Oestrogen",
        "Oxytocin",
        "Progesterone"
      ],
      "answer": "C",
      "explanation": "Oxytocin stimulates uterine smooth muscle contraction and contraction of myoepithelial cells around mammary alveoli, causing milk ejection. Prolactin stimulates milk production."
    },
    {
      "question": "A patient develops hypocalcaemia following damage to the parathyroid glands. Which clinical manifestation should the nurse anticipate?",
      "options": [
        "Muscle spasms and tetany",
        "Excessive weight gain",
        "Severe hyperglycaemia",
        "Reduced neuromuscular excitability"
      ],
      "answer": "A",
      "explanation": "Low calcium increases neuromuscular excitability and can cause paraesthesia, muscle spasms, tetany and seizures."
    },
    {
      "question": "Which laboratory test gives an indication of average glycaemia over approximately the preceding 2-3 months?",
      "options": [
        "Random blood glucose",
        "HbA1c",
        "Serum sodium",
        "Urine ketones alone"
      ],
      "answer": "B",
      "explanation": "HbA1c reflects the proportion of haemoglobin glycated over the lifespan of circulating red blood cells and provides an estimate of average glycaemia over approximately 2-3 months."
    },
    {
      "question": "A patient with known Addison disease presents with vomiting, severe weakness and hypotension during an infection. What serious complication should the nurse suspect?",
      "options": [
        "Thyroid storm",
        "Adrenal crisis",
        "Acromegaly",
        "Diabetes insipidus"
      ],
      "answer": "B",
      "explanation": "Acute illness can precipitate adrenal crisis in a patient with adrenal insufficiency. It is a life-threatening emergency requiring urgent escalation, corticosteroid replacement and fluid resuscitation as prescribed."
    }
  ]
};

lessonContent["Introduction to medical-surgical nursing"] = {
  "objectives": [
    "Define medical-surgical nursing and explain its scope.",
    "Describe the historical development and importance of medical-surgical nursing.",
    "Explain the roles and responsibilities of a medical-surgical nurse.",
    "Discuss holistic, patient-centred and evidence-based nursing care.",
    "Apply the nursing process to adult patients with medical and surgical conditions.",
    "Explain clinical reasoning, prioritisation and decision-making.",
    "Describe principles of patient safety and infection prevention.",
    "Discuss ethical, legal and professional responsibilities.",
    "Explain admission, transfer, referral and discharge procedures.",
    "Demonstrate the importance of communication, documentation and multidisciplinary teamwork."
  ],
  "notes": [
    {
      "heading": "1. Definition of medical-surgical nursing",
      "content": "Medical-surgical nursing is a specialised area of professional nursing concerned with the comprehensive care of adult patients experiencing actual or potential health problems arising from medical illnesses, surgical conditions, injuries and physiological disturbances. It combines knowledge of anatomy, physiology, pathophysiology, pharmacology, clinical assessment and nursing interventions to promote recovery, prevent complications and improve quality of life.",
      "points": [
        "Medical nursing focuses on patients whose conditions are primarily managed through medical treatment, medication, monitoring and supportive care.",
        "Surgical nursing focuses on patients requiring surgical intervention and includes preoperative, intraoperative and postoperative care.",
        "Medical and surgical nursing overlap because many patients require both medical and surgical interventions.",
        "The medical-surgical nurse assesses patients, identifies nursing problems, plans care, implements interventions and evaluates outcomes.",
        "Care is not limited to treating disease; it also addresses physical, psychological, social, cultural and spiritual needs.",
        "The specialty includes acute, chronic, emergency, rehabilitative and palliative care.",
        "Examples include caring for patients with pneumonia, heart failure, diabetes mellitus, renal failure, gastrointestinal disorders, fractures and postoperative complications."
      ]
    },
    {
      "heading": "2. Historical development of medical-surgical nursing",
      "content": "Medical-surgical nursing developed alongside advances in medicine, surgery, public health, anaesthesia, infection control and professional nursing education. Early nursing was often provided informally, but the development of organised nursing education and scientific approaches transformed patient care.",
      "points": [
        "Florence Nightingale made major contributions to modern nursing through environmental sanitation, observation, nursing education and the use of health statistics.",
        "The development of antiseptic and aseptic techniques reduced infections associated with medical and surgical procedures.",
        "Advances in anaesthesia made increasingly complex surgical procedures possible.",
        "Developments in antibiotics, diagnostic imaging, laboratory medicine and intensive care expanded the scope of medical-surgical nursing.",
        "Modern nursing increasingly uses research evidence, clinical guidelines, technology and interdisciplinary teamwork.",
        "In Kenya, professional nursing practice is regulated by the Nursing Council of Kenya (NCK), within the applicable legal and professional framework."
      ]
    },
    {
      "heading": "3. Scope and areas of medical-surgical nursing",
      "content": "Medical-surgical nursing covers a wide range of adult health conditions and clinical environments. Nurses may work in general medical wards, surgical wards, emergency departments, intensive care units, outpatient clinics, theatres and rehabilitation settings.",
      "points": [
        "Respiratory nursing: care of patients with asthma, pneumonia, chronic obstructive pulmonary disease and respiratory failure.",
        "Cardiovascular nursing: care of patients with hypertension, heart failure, coronary artery disease and arrhythmias.",
        "Gastrointestinal nursing: care of patients with peptic ulcer disease, hepatitis, liver failure, pancreatitis and intestinal disorders.",
        "Renal nursing: care of patients with acute kidney injury, chronic kidney disease, urinary tract disorders and electrolyte disturbances.",
        "Neurological nursing: care of patients with stroke, epilepsy, meningitis, spinal cord injury and neurological impairment.",
        "Endocrine nursing: care of patients with diabetes mellitus, thyroid disorders and adrenal disorders.",
        "Haematological nursing: care of patients with anaemia, sickle cell disease, leukaemia and coagulation disorders.",
        "Musculoskeletal nursing: care of patients with fractures, arthritis, osteoporosis and mobility impairment.",
        "Integumentary nursing: care of patients with wounds, burns, pressure injuries and skin infections.",
        "Perioperative nursing: care before, during and after surgical procedures."
      ]
    },
    {
      "heading": "4. Goals and principles of medical-surgical nursing",
      "content": "The main goal is to promote optimal health and help patients achieve the highest possible level of functioning. Nursing interventions should be individualised according to the patient's condition, preferences, abilities and available resources.",
      "points": [
        "Health promotion: encourage healthy lifestyles, nutrition, physical activity, immunisation and screening.",
        "Disease prevention: identify risk factors and reduce exposure to preventable health threats.",
        "Early detection: recognise changes in health status and initiate timely assessment and referral.",
        "Restoration of health: support treatment, recovery and return to optimal functioning.",
        "Prevention of complications: monitor patients and intervene early when deterioration occurs.",
        "Rehabilitation: help patients regain independence and adapt to residual limitations.",
        "Palliative care: relieve suffering and improve quality of life for patients with serious illness.",
        "Patient education: promote understanding, self-management, adherence and informed decision-making.",
        "Continuity of care: coordinate care across admission, treatment, discharge and follow-up."
      ]
    },
    {
      "heading": "5. Roles and responsibilities of the medical-surgical nurse",
      "content": "The medical-surgical nurse performs several interconnected roles. These roles require clinical competence, effective communication, professional accountability and the ability to respond to changing patient needs.",
      "points": [
        "Caregiver: provides direct nursing interventions such as medication administration, wound care, hygiene, feeding and monitoring.",
        "Assessor: collects subjective and objective information and identifies actual or potential health problems.",
        "Educator: teaches patients and families about diseases, treatment, medication, nutrition and prevention of complications.",
        "Advocate: protects patients' rights, dignity, preferences and safety.",
        "Communicator: shares accurate information with patients, families and members of the healthcare team.",
        "Coordinator: organises nursing care, referrals, investigations and discharge planning.",
        "Collaborator: works with doctors, pharmacists, physiotherapists, nutritionists and other professionals.",
        "Leader and manager: allocates duties appropriately, supervises care and supports efficient use of resources.",
        "Research consumer: uses current evidence and clinical guidelines to improve practice.",
        "Rehabilitator: supports patients in regaining physical, psychological and social functioning.",
        "Professional practitioner: maintains competence, confidentiality, accountability and ethical conduct."
      ]
    },
    {
      "heading": "6. Holistic and patient-centred nursing care",
      "content": "Holistic nursing recognises that illness affects the whole person rather than only an individual organ or body system. Patient-centred care places the patient's values, preferences, needs and participation at the centre of healthcare decisions.",
      "points": [
        "Physical dimension: symptoms, pain, mobility, nutrition, sleep, elimination and physiological functioning.",
        "Psychological dimension: anxiety, depression, fear, coping, self-esteem and emotional wellbeing.",
        "Social dimension: family relationships, employment, financial resources, social support and living conditions.",
        "Spiritual dimension: beliefs, values, meaning, hope and spiritual practices important to the patient.",
        "Cultural dimension: language, dietary practices, health beliefs, family roles and preferences that may influence care.",
        "Individualised care: interventions should reflect the patient's clinical condition and personal circumstances.",
        "Shared decision-making: patients should receive understandable information and participate in decisions where possible.",
        "Respect for dignity: provide privacy, obtain consent and avoid discriminatory or judgemental behaviour."
      ]
    },
    {
      "heading": "7. The nursing process: ADPIE",
      "content": "The nursing process is a systematic, logical and patient-centred framework used to identify health needs, plan care, implement interventions and evaluate outcomes. It is commonly represented by five interconnected stages: Assessment, Diagnosis, Planning, Implementation and Evaluation (ADPIE).",
      "points": [
        "Assessment: collect, organise, validate and document subjective and objective patient information.",
        "Nursing diagnosis: analyse assessment findings and identify actual or potential human responses to health conditions that nursing care can address.",
        "Planning: establish priorities, formulate measurable outcomes and select appropriate nursing interventions.",
        "Implementation: perform planned nursing interventions and document the care provided and patient response.",
        "Evaluation: determine whether expected outcomes were achieved, partially achieved or not achieved, and modify the care plan accordingly.",
        "The process is dynamic rather than strictly linear. New assessment findings may require revision of diagnoses, goals and interventions.",
        "Medical diagnosis identifies a disease or pathological condition, whereas a nursing diagnosis identifies a patient's response or vulnerability to a health problem.",
        "Example: pneumonia is a medical diagnosis; impaired gas exchange may be a nursing diagnosis when supported by assessment findings."
      ]
    },
    {
      "heading": "8. Nursing assessment and collection of patient data",
      "content": "Assessment is the first stage of the nursing process. It establishes a baseline, identifies patient needs and provides information for clinical decision-making. Accurate assessment is essential because errors or omissions may lead to inappropriate nursing interventions.",
      "points": [
        "Subjective data: information reported by the patient, such as pain, nausea, dizziness, fatigue and difficulty breathing.",
        "Objective data: observable or measurable findings, such as temperature, pulse, blood pressure, oxygen saturation, oedema and laboratory results.",
        "Primary source: information obtained directly from the patient when they can communicate reliably.",
        "Secondary sources: family members, caregivers, previous records, referral notes and other healthcare professionals.",
        "Health history: includes presenting complaint, history of present illness, past medical and surgical history, medication history, allergies and family and social history.",
        "Physical examination: may include inspection, palpation, percussion and auscultation.",
        "Vital signs: include temperature, pulse, respiratory rate, blood pressure and oxygen saturation where indicated.",
        "Pain assessment: determine location, onset, character, severity, duration, aggravating factors and relieving factors.",
        "Validate unexpected findings by repeating measurements, checking equipment and comparing with the patient's baseline.",
        "Document findings accurately, including the time of assessment and relevant changes."
      ]
    },
    {
      "heading": "9. Clinical reasoning, critical thinking and prioritisation",
      "content": "Clinical reasoning is the process of collecting and interpreting patient information to understand health problems and decide on appropriate actions. Critical thinking involves questioning assumptions, analysing evidence and evaluating possible consequences before making decisions.",
      "points": [
        "Recognise cues: identify important symptoms, signs, observations and investigation results.",
        "Analyse cues: determine what the findings may indicate and identify relationships between them.",
        "Prioritise hypotheses: identify the most urgent or likely explanations for the patient's condition.",
        "Generate solutions: consider appropriate nursing interventions and expected outcomes.",
        "Take action: implement safe and timely interventions within professional competence.",
        "Evaluate outcomes: reassess the patient to determine whether interventions were effective.",
        "Use the ABC approach when prioritising immediate life-threatening problems: airway, breathing and circulation.",
        "Altered consciousness, severe respiratory distress, uncontrolled bleeding and signs of shock require urgent assessment and escalation.",
        "Prioritisation should also consider patient stability, risk of deterioration, time sensitivity and available resources.",
        "Do not delay emergency escalation while completing routine documentation or non-urgent procedures."
      ]
    },
    {
      "heading": "10. Patient safety and prevention of complications",
      "content": "Patient safety involves preventing avoidable harm during healthcare delivery. Medical-surgical nurses play a major role in identifying risks, applying safety procedures, monitoring patients and reporting incidents appropriately.",
      "points": [
        "Patient identification: use approved identifiers before medication administration, specimen collection, procedures and other relevant interventions.",
        "Medication safety: follow medication rights, verify prescriptions, check allergies and monitor therapeutic and adverse effects.",
        "Fall prevention: assess fall risk, keep call bells accessible, provide assistance with mobility and maintain a safe environment.",
        "Pressure injury prevention: assess skin and risk factors, reposition as appropriate, manage moisture and support nutrition.",
        "Aspiration prevention: assess swallowing where indicated, position patients appropriately and follow prescribed feeding precautions.",
        "Early recognition of deterioration: monitor vital signs, consciousness, respiratory effort and other relevant clinical indicators.",
        "Safe equipment use: check functionality, alarms, oxygen delivery devices and infusion equipment.",
        "Incident reporting: report errors, near misses and safety concerns according to facility policy.",
        "Never ignore a sudden change in patient condition, even if previous observations were normal.",
        "Apply local escalation protocols and seek senior assistance when a patient's condition is outside your competence."
      ]
    },
    {
      "heading": "11. Infection prevention and control",
      "content": "Infection prevention and control refers to practices used to prevent transmission of microorganisms and reduce healthcare-associated infections. Medical-surgical patients may be particularly vulnerable because of surgery, invasive devices, wounds, chronic illnesses and impaired immunity.",
      "points": [
        "Standard precautions apply to all patients regardless of their known or suspected infection status.",
        "Hand hygiene should be performed at appropriate moments, including before patient contact and before aseptic procedures.",
        "Use alcohol-based hand rub when hands are not visibly soiled and use soap and water when indicated by infection prevention guidance.",
        "Personal protective equipment includes gloves, gowns, masks and eye protection according to anticipated exposure risk.",
        "Aseptic technique reduces contamination during procedures such as wound dressing, catheter insertion and intravenous access.",
        "Safe injection practices prevent transmission of blood-borne pathogens.",
        "Sharps should be handled carefully and disposed of immediately in approved puncture-resistant containers.",
        "Transmission-based precautions may include contact, droplet or airborne precautions depending on the infection.",
        "Environmental cleaning, safe waste management and appropriate sterilisation or disinfection help reduce infection risks.",
        "Monitor wounds, intravenous sites, urinary catheters and other invasive devices for signs of infection."
      ]
    },
    {
      "heading": "12. Ethical principles in medical-surgical nursing",
      "content": "Ethics provides principles that guide professional decisions and interactions with patients. Nurses must respect human dignity, protect patient rights and provide safe, fair and compassionate care.",
      "points": [
        "Autonomy: respect the patient's right to make informed decisions about their healthcare.",
        "Beneficence: act in ways that promote the patient's wellbeing.",
        "Non-maleficence: avoid causing preventable harm.",
        "Justice: provide fair and equitable care without discrimination.",
        "Veracity: communicate honestly and provide accurate information.",
        "Fidelity: honour professional commitments and responsibilities.",
        "Confidentiality: protect private patient information and disclose it only when authorised or legally justified.",
        "Informed consent: ensure the patient receives relevant information and voluntarily agrees to an intervention when capable of making the decision.",
        "Respect cultural and religious beliefs while maintaining patient safety and professional standards.",
        "When ethical conflicts arise, seek appropriate guidance through institutional procedures and professional supervision."
      ]
    },
    {
      "heading": "13. Legal and professional responsibilities",
      "content": "Nursing practice is governed by laws, professional regulations, standards of practice and institutional policies. Nurses are accountable for their decisions, actions, omissions and the care they provide.",
      "points": [
        "Practise within the scope of professional education, competence and authorisation.",
        "Maintain valid professional registration and comply with applicable professional requirements.",
        "Obtain and respect consent according to legal and institutional requirements.",
        "Maintain accurate, complete, timely and factual patient records.",
        "Protect confidentiality and privacy.",
        "Avoid negligence by providing care consistent with accepted professional standards.",
        "Do not perform procedures or administer treatment beyond one's competence or authority.",
        "Report unsafe practices, abuse, serious errors and other concerns through appropriate channels.",
        "Maintain professional boundaries with patients and families.",
        "In Kenya, the Nursing Council of Kenya regulates nursing and midwifery practice under the applicable legal framework."
      ]
    },
    {
      "heading": "14. Communication and multidisciplinary teamwork",
      "content": "Effective communication is essential for continuity of care, patient safety and therapeutic relationships. Medical-surgical nurses collaborate with other healthcare professionals to coordinate assessment, treatment, rehabilitation and discharge.",
      "points": [
        "Therapeutic communication uses listening, empathy, clarification, appropriate questioning and respectful responses.",
        "Active listening helps identify patient concerns and improves understanding.",
        "Avoid false reassurance, judgemental language, unnecessary medical jargon and interrupting patients.",
        "Use structured handover approaches such as SBAR: Situation, Background, Assessment and Recommendation.",
        "Situation: state the immediate issue or reason for communication.",
        "Background: provide relevant clinical history and context.",
        "Assessment: communicate current findings and professional concerns.",
        "Recommendation: state what action or review is required.",
        "Multidisciplinary collaboration may involve doctors, pharmacists, laboratory professionals, physiotherapists, nutritionists, social workers and other nurses.",
        "Clear communication reduces medication errors, missed information and delays in treatment."
      ]
    },
    {
      "heading": "15. Nursing documentation and reporting",
      "content": "Documentation is the written or electronic record of patient assessment, nursing interventions, clinical decisions and patient outcomes. It supports continuity of care, professional accountability, communication, quality improvement and legal processes.",
      "points": [
        "Record information promptly and accurately.",
        "Use clear, objective and professional language.",
        "Document relevant assessment findings, nursing diagnoses, interventions and patient responses.",
        "Record medication administration, including relevant dose, route and time according to the documentation system.",
        "Document changes in condition and actions taken, including escalation and the response received.",
        "Use only approved abbreviations and follow facility documentation policies.",
        "Never falsify, backdate or deliberately omit important clinical information.",
        "Correct documentation errors using the approved method; do not conceal or erase the original record improperly.",
        "Maintain confidentiality of paper and electronic records.",
        "A nursing record should provide a clear account of what was assessed, what was done and how the patient responded."
      ]
    },
    {
      "heading": "16. Admission, transfer and discharge procedures",
      "content": "Medical-surgical nurses participate in the movement of patients between healthcare settings and levels of care. Proper admission, transfer and discharge procedures reduce anxiety, support continuity and prevent avoidable complications.",
      "points": [
        "Admission: receive the patient, verify identity, review referral information, assess immediate needs and obtain relevant history.",
        "Explain ward routines, call bell use, safety measures and available facilities.",
        "Complete baseline observations and identify allergies, medication needs and immediate risks.",
        "Transfer: communicate the patient's condition, treatment, medication, investigations, risks and outstanding care needs to the receiving team.",
        "Use a structured handover to minimise loss of important information.",
        "Discharge planning should begin early and consider the patient's diagnosis, functional ability, home environment and available support.",
        "Provide understandable instructions on medication, wound care, diet, activity, follow-up and warning signs.",
        "Confirm that the patient understands when and where to seek further help.",
        "Arrange referrals, rehabilitation, community follow-up and equipment where indicated.",
        "Document discharge arrangements and the patient's condition at discharge."
      ]
    },
    {
      "heading": "17. Evidence-based nursing practice and quality improvement",
      "content": "Evidence-based practice involves integrating the best available research evidence with clinical expertise and patient values. It helps nurses make informed decisions rather than relying solely on tradition or personal opinion.",
      "points": [
        "Best available evidence: use relevant research, systematic reviews and current clinical guidelines.",
        "Clinical expertise: apply professional knowledge, practical skills and experience.",
        "Patient values: consider individual preferences, goals, beliefs and circumstances.",
        "Clinical guidelines support consistent care but must be applied according to patient needs and local protocols.",
        "Quality improvement involves identifying gaps in care, measuring performance and implementing changes to improve outcomes.",
        "Clinical audits can assess compliance with standards such as hand hygiene, documentation and medication safety.",
        "Reflective practice helps nurses identify strengths, weaknesses and opportunities for professional development.",
        "Continuous professional development supports safe practice as knowledge, technology and clinical guidelines change."
      ]
    },
    {
      "heading": "18. Rehabilitation, chronic illness and palliative care",
      "content": "Medical-surgical nursing extends beyond acute treatment. Nurses help patients adapt to long-term illness, regain independence, manage symptoms and maintain quality of life.",
      "points": [
        "Rehabilitation aims to restore or maximise physical, psychological and social functioning.",
        "Chronic disease management requires long-term monitoring, medication adherence, lifestyle modification and patient education.",
        "Support patients in setting realistic goals and participating in self-care.",
        "Palliative care focuses on improving quality of life and relieving suffering associated with serious illness.",
        "Palliative care may be provided alongside disease-directed treatment and is not restricted to the final days of life.",
        "Pain and other distressing symptoms should be assessed regularly and managed using appropriate interventions.",
        "Provide emotional support to patients and families and respect their preferences and values.",
        "Coordinate care with rehabilitation, palliative care and community services when appropriate."
      ]
    }
  ],
  "clinicalApplication": [
    {
      "heading": "Clinical case: applying the nursing process",
      "content": "A 58-year-old patient is admitted with pneumonia. The patient reports difficulty breathing and productive cough. Assessment findings include respiratory rate of 30 breaths per minute, oxygen saturation of 88% on room air, fever and increased work of breathing.",
      "points": [
        "Assessment: collect respiratory history, assess airway, breathing, oxygen saturation, temperature, lung sounds, sputum and level of consciousness.",
        "Nursing diagnosis: impaired gas exchange may be appropriate when supported by the assessment findings.",
        "Planning: establish measurable outcomes, such as improved oxygenation, reduced work of breathing and improved respiratory comfort.",
        "Implementation: position the patient to optimise ventilation, administer prescribed oxygen, monitor observations and administer prescribed treatment.",
        "Evaluation: reassess respiratory rate, oxygen saturation, work of breathing and response to interventions.",
        "Priority: oxygen saturation of 88% with respiratory distress requires urgent assessment and escalation according to the clinical protocol.",
        "Do not rely on a single observation; assess trends and the patient's overall clinical condition."
      ]
    },
    {
      "heading": "Clinical case: ethical and professional responsibility",
      "content": "A conscious adult patient refuses a recommended procedure after receiving an explanation. A relative insists that the procedure should be performed regardless of the patient's wishes.",
      "points": [
        "Assess whether the patient has decision-making capacity for the specific decision.",
        "Explore the patient's concerns and ensure the explanation is understandable.",
        "Respect an informed and voluntary refusal by a patient with appropriate decision-making capacity.",
        "Do not allow relatives to override the decision of a capable adult patient.",
        "Inform the appropriate clinician and follow institutional procedures.",
        "Document the discussion, patient's decision, information provided and actions taken.",
        "Continue to provide respectful care and discuss appropriate alternatives."
      ]
    }
  ],
  "examPoints": [
    "Medical-surgical nursing provides comprehensive care to adults with medical and surgical health problems.",
    "Florence Nightingale contributed to modern nursing through sanitation, observation and nursing education.",
    "Medical nursing commonly focuses on conditions managed medically; surgical nursing includes preoperative, intraoperative and postoperative care.",
    "The nursing process is ADPIE: Assessment, Diagnosis, Planning, Implementation and Evaluation.",
    "Subjective data are reported by the patient; objective data are measurable or observable.",
    "A medical diagnosis identifies a disease; a nursing diagnosis identifies a patient response or vulnerability.",
    "Holistic care considers physical, psychological, social, cultural and spiritual needs.",
    "The ABC approach prioritises airway, breathing and circulation in immediate emergencies.",
    "Standard precautions apply to all patients, irrespective of known infection status.",
    "The four major ethical principles include autonomy, beneficence, non-maleficence and justice.",
    "Confidentiality requires protection of private patient information.",
    "Informed consent must be voluntary and based on adequate information.",
    "SBAR stands for Situation, Background, Assessment and Recommendation.",
    "Accurate documentation supports continuity, communication and professional accountability.",
    "Discharge planning should begin early and include medication, follow-up, education and warning signs.",
    "Evidence-based practice integrates research evidence, clinical expertise and patient values.",
    "The nurse must practise within their competence and professional scope.",
    "Patient safety includes medication safety, fall prevention, infection prevention and early recognition of deterioration."
  ],
  "questions": [
    {
      "question": "Which statement best defines medical-surgical nursing?",
      "options": [
        "Nursing care provided exclusively to patients undergoing surgery",
        "Comprehensive nursing care of adults with medical and surgical health conditions",
        "Care provided only to critically ill patients",
        "Nursing care limited to administering medication"
      ],
      "answer": "B",
      "explanation": "Medical-surgical nursing covers comprehensive adult care across medical and surgical conditions, including prevention, treatment, rehabilitation and health education."
    },
    {
      "question": "Which nurse is widely recognised for major contributions to modern nursing through sanitation, observation and nursing education?",
      "options": [
        "Virginia Henderson",
        "Florence Nightingale",
        "Dorothea Orem",
        "Hildegard Peplau"
      ],
      "answer": "B",
      "explanation": "Florence Nightingale made major contributions to modern nursing, particularly environmental sanitation, patient observation, nursing education and the use of statistics."
    },
    {
      "question": "What is the correct sequence of the nursing process?",
      "options": [
        "Planning, Assessment, Diagnosis, Evaluation, Implementation",
        "Assessment, Diagnosis, Planning, Implementation, Evaluation",
        "Diagnosis, Planning, Assessment, Implementation, Evaluation",
        "Assessment, Planning, Implementation, Diagnosis, Evaluation"
      ],
      "answer": "B",
      "explanation": "ADPIE stands for Assessment, Diagnosis, Planning, Implementation and Evaluation."
    },
    {
      "question": "A patient tells the nurse, 'I have severe abdominal pain.' This information is classified as:",
      "options": [
        "Objective data",
        "Laboratory data",
        "Subjective data",
        "Diagnostic imaging"
      ],
      "answer": "C",
      "explanation": "Subjective data are symptoms or experiences reported by the patient. Pain is subjective because it cannot be directly measured by another person."
    },
    {
      "question": "Which ethical principle refers to respecting a patient's right to make informed healthcare decisions?",
      "options": [
        "Beneficence",
        "Justice",
        "Autonomy",
        "Non-maleficence"
      ],
      "answer": "C",
      "explanation": "Autonomy recognises the patient's right to make informed decisions about their own healthcare, subject to applicable legal requirements."
    },
    {
      "question": "Which action best demonstrates beneficence?",
      "options": [
        "Providing an intervention intended to improve the patient's wellbeing",
        "Withholding information from the patient",
        "Treating patients differently based on wealth",
        "Ignoring a patient's preferences"
      ],
      "answer": "A",
      "explanation": "Beneficence means acting to promote the patient's welfare and wellbeing."
    },
    {
      "question": "What does the acronym SBAR represent in clinical communication?",
      "options": [
        "Situation, Background, Assessment, Recommendation",
        "Symptoms, Behaviour, Action, Response",
        "Safety, Breathing, Airway, Respiration",
        "Situation, Bedside, Admission, Referral"
      ],
      "answer": "A",
      "explanation": "SBAR is a structured communication framework used during handovers and clinical escalation."
    },
    {
      "question": "A patient has severe respiratory distress. Which assessment priority should guide the nurse's immediate response?",
      "options": [
        "Nutritional status",
        "Airway and breathing",
        "Discharge arrangements",
        "Family history"
      ],
      "answer": "B",
      "explanation": "Airway and breathing are immediate priorities in a patient with respiratory distress. The nurse should rapidly assess and escalate according to emergency protocols."
    },
    {
      "question": "Which statement about standard infection prevention precautions is correct?",
      "options": [
        "They are used only for patients with confirmed infections.",
        "They apply to all patients regardless of known infection status.",
        "They are required only in operating theatres.",
        "They eliminate the need for hand hygiene."
      ],
      "answer": "B",
      "explanation": "Standard precautions apply to every patient because infection may be present even when it has not been diagnosed."
    },
    {
      "question": "A nurse documents that a patient received medication but did not administer it. This action primarily violates:",
      "options": [
        "Professional documentation and accountability",
        "Patient nutrition principles",
        "Rehabilitation principles",
        "Therapeutic positioning"
      ],
      "answer": "A",
      "explanation": "Falsifying a medication record is a serious breach of professional accountability and patient safety. Documentation must accurately reflect care delivered."
    },
    {
      "question": "Which combination best describes evidence-based nursing practice?",
      "options": [
        "Personal opinion, tradition and routine",
        "Research evidence, clinical expertise and patient values",
        "Doctors' instructions alone",
        "Hospital policy without clinical judgement"
      ],
      "answer": "B",
      "explanation": "Evidence-based practice integrates the best available research evidence with clinical expertise and patient preferences and values."
    },
    {
      "question": "A conscious adult patient with decision-making capacity refuses a recommended procedure after receiving appropriate information. What is the nurse's best response?",
      "options": [
        "Force the patient to undergo the procedure.",
        "Ask the relative to make the decision instead.",
        "Respect the informed refusal, communicate with the healthcare team and document appropriately.",
        "Discharge the patient immediately."
      ],
      "answer": "C",
      "explanation": "Respect for autonomy requires respecting an informed and voluntary decision by a capable adult. The nurse should ensure understanding, communicate the decision and document the process."
    }
  ]
};

lessonContent["Patient assessment and diagnostic investigations"] = {
  "objectives": [
    "Explain the purpose and principles of comprehensive patient assessment.",
    "Differentiate subjective and objective assessment data.",
    "Describe the components of a complete health history.",
    "Explain the four techniques of physical examination.",
    "Describe the assessment of vital signs and their clinical significance.",
    "Explain common haematological, biochemical and microbiological investigations.",
    "Describe diagnostic imaging and specialised investigations.",
    "Discuss nursing responsibilities before, during and after diagnostic procedures.",
    "Recognise abnormal findings that require urgent intervention.",
    "Apply assessment findings to clinical nursing decisions."
  ],
  "notes": [
    {
      "heading": "1. Introduction and purpose of patient assessment",
      "content": "Patient assessment is the systematic collection, validation, organisation and interpretation of information about an individual's health status. It is a fundamental nursing responsibility and provides the basis for identifying patient needs, formulating nursing diagnoses, planning interventions and evaluating outcomes.",
      "points": [
        "Establish a baseline against which subsequent changes can be compared.",
        "Identify actual and potential health problems.",
        "Recognise early signs of deterioration and life-threatening conditions.",
        "Determine the patient's physical, psychological, social, cultural and spiritual needs.",
        "Provide information for nursing diagnoses and individualised care planning.",
        "Monitor response to treatment and nursing interventions.",
        "Promote communication and continuity of care between healthcare professionals.",
        "Support patient education, discharge planning and rehabilitation.",
        "Assessment should be systematic, accurate, timely, confidential and patient-centred."
      ]
    },
    {
      "heading": "2. Types of nursing assessment",
      "content": "Different types of assessment are used depending on the patient's condition, clinical setting and purpose of evaluation.",
      "points": [
        "Initial or comprehensive assessment: performed when a patient first enters a healthcare setting; includes a detailed health history and physical examination.",
        "Focused assessment: concentrates on a particular problem, symptom or body system, such as chest pain or abdominal pain.",
        "Emergency assessment: rapidly identifies and manages life-threatening problems using an approach such as ABCDE.",
        "Ongoing assessment: repeated at appropriate intervals to monitor changes in the patient's condition and response to care.",
        "Admission assessment: establishes baseline information and immediate nursing priorities when a patient is admitted.",
        "Discharge assessment: evaluates the patient's condition, readiness for discharge and continuing care requirements.",
        "A focused assessment does not replace a comprehensive assessment when the latter is clinically indicated."
      ]
    },
    {
      "heading": "3. Sources and types of assessment data",
      "content": "Assessment information may be obtained directly from the patient or from other reliable sources. Nurses must distinguish between what the patient reports and what can be observed or measured.",
      "points": [
        "Subjective data: information experienced and reported by the patient, including pain, nausea, dizziness, fatigue and breathlessness.",
        "Objective data: measurable or observable findings, including blood pressure, temperature, pulse, oedema, skin colour and laboratory results.",
        "Primary source: the patient, when able to provide reliable information.",
        "Secondary sources: family members, caregivers, previous medical records, referral letters and other healthcare professionals.",
        "Quantitative data: numerical findings such as temperature, weight, blood glucose and respiratory rate.",
        "Qualitative data: descriptive information such as the character of pain, emotional state or appearance of a wound.",
        "Validate inconsistent or unexpected information before using it to make clinical decisions.",
        "Record the source of information when it is clinically relevant."
      ]
    },
    {
      "heading": "4. Comprehensive health history",
      "content": "A health history is a structured interview used to obtain information about the patient's current health problem, previous illnesses, medication use, family history and lifestyle. It helps the nurse understand the patient within their individual circumstances.",
      "points": [
        "Biographical data: name, age, sex, occupation, residence and other relevant identifying information.",
        "Chief complaint: the main reason the patient is seeking healthcare, preferably recorded in the patient's own words.",
        "History of present illness: detailed information about the current problem, including onset, duration, severity, progression and associated symptoms.",
        "Past medical history: previous illnesses, chronic diseases, hospitalisations and significant childhood conditions.",
        "Past surgical history: previous operations, anaesthesia experiences and postoperative complications.",
        "Medication history: prescribed drugs, over-the-counter medicines, traditional remedies, supplements, doses and adherence.",
        "Allergy history: medicines, foods, latex or other substances and the nature of the reaction.",
        "Family history: relevant inherited diseases and conditions occurring among close relatives.",
        "Social history: smoking, alcohol use, substance use, occupation, living conditions and social support.",
        "Nutritional history: usual diet, appetite, recent weight changes, fluid intake and possible nutritional deficiencies.",
        "Functional history: ability to perform activities of daily living, mobility, sleep and self-care.",
        "Psychosocial and spiritual history: coping, emotional wellbeing, support systems, beliefs and preferences.",
        "Review of systems: systematic enquiry about symptoms affecting different body systems."
      ]
    },
    {
      "heading": "5. Assessment of the history of present illness",
      "content": "A structured symptom assessment helps the nurse obtain a clear description of the patient's problem. A useful approach for pain and many other symptoms is PQRST.",
      "points": [
        "P - Provocation and palliation: what causes the symptom, worsens it or relieves it?",
        "Q - Quality: what does the symptom feel like? For pain, examples include sharp, dull, burning or crushing.",
        "R - Region and radiation: where is the symptom located, and does it spread to another area?",
        "S - Severity: how severe is the symptom, often measured using a suitable rating scale.",
        "T - Timing: when did it begin, how long does it last and is it constant or intermittent?",
        "For non-pain symptoms, also assess associated symptoms, previous episodes and effects on daily functioning.",
        "A sudden onset of severe symptoms may indicate an emergency and requires prompt assessment."
      ]
    },
    {
      "heading": "6. Physical examination: principles and preparation",
      "content": "Physical examination is the systematic examination of the body to identify normal and abnormal findings. It should be performed respectfully, with appropriate explanation, privacy, consent and infection prevention measures.",
      "points": [
        "Explain the procedure and obtain consent before examination.",
        "Provide privacy, appropriate draping and a comfortable environment.",
        "Perform hand hygiene before and after patient contact.",
        "Use appropriate personal protective equipment according to exposure risk.",
        "Ensure examination equipment is clean and functional.",
        "Position the patient appropriately and consider pain, mobility and physical limitations.",
        "Compare findings bilaterally where appropriate.",
        "Examine the patient systematically and document significant findings.",
        "Stop or modify an examination if it causes undue pain or distress, unless urgent clinical needs require immediate action."
      ]
    },
    {
      "heading": "7. Four techniques of physical examination",
      "content": "The four basic techniques of physical examination are inspection, palpation, percussion and auscultation. They provide complementary information about the structure and function of body systems.",
      "points": [
        "Inspection: deliberate observation of the patient's body using vision and, where appropriate, smell. Assess colour, shape, symmetry, movement, posture, wounds and visible abnormalities.",
        "Palpation: use of the hands and fingers to assess temperature, texture, tenderness, masses, moisture, pulses and organ characteristics.",
        "Light palpation assesses superficial structures, while deep palpation assesses deeper structures when appropriate.",
        "Percussion: tapping the body surface to produce sounds that help assess underlying structures and determine whether they contain air, fluid or solid tissue.",
        "Tympany is a relatively high-pitched, drum-like sound commonly heard over air-filled abdominal structures.",
        "Resonance is normally heard over healthy lung tissue.",
        "Dullness may occur over solid organs, fluid-filled areas or areas of consolidation.",
        "Auscultation: listening to internal body sounds using a stethoscope, such as heart sounds, breath sounds and bowel sounds.",
        "For abdominal assessment, the usual sequence is inspection, auscultation, percussion and palpation because palpation and percussion may alter bowel sounds."
      ]
    },
    {
      "heading": "8. Assessment of vital signs",
      "content": "Vital signs are basic physiological measurements used to assess essential body functions. They include temperature, pulse, respiratory rate and blood pressure. Oxygen saturation and pain assessment are also commonly included in routine clinical observations.",
      "points": [
        "Temperature: reflects the balance between heat production and heat loss. Common adult oral reference values are approximately 36.5-37.5 degrees Celsius, although normal ranges vary.",
        "Pulse: reflects the heart rate and rhythm and provides information about circulation. A typical resting adult pulse is approximately 60-100 beats per minute.",
        "Respiratory rate: measures breaths per minute. A typical resting adult respiratory rate is approximately 12-20 breaths per minute.",
        "Blood pressure: measures arterial pressure during systole and diastole. A reading below 120/80 mmHg is commonly considered normal for many adults, but interpretation depends on context and guidelines.",
        "Oxygen saturation: estimates the percentage of haemoglobin saturated with oxygen. Approximately 95-100% is typical for many healthy adults at sea level, but individual targets vary.",
        "Pain: assess using an appropriate validated scale, such as a 0-10 numerical rating scale where suitable.",
        "Record the measurement method, relevant patient position, oxygen therapy and other factors affecting interpretation.",
        "Compare current observations with baseline readings and previous trends.",
        "An abnormal vital sign must be interpreted in the context of symptoms, clinical condition and individual baseline."
      ]
    },
    {
      "heading": "9. Temperature assessment",
      "content": "Body temperature is regulated by the hypothalamus. It is affected by age, physical activity, hormonal changes, illness, environmental conditions and measurement site.",
      "points": [
        "Common measurement sites include oral, axillary, tympanic, temporal artery and rectal routes.",
        "Fever or pyrexia is an elevation of body temperature, often associated with infection or inflammation.",
        "Hypothermia is an abnormally low core body temperature, conventionally below 35 degrees Celsius.",
        "Oral temperatures may be affected by recent hot or cold drinks, smoking and oral conditions.",
        "Axillary readings are generally less representative of core temperature than appropriate core measurement methods.",
        "Rectal measurement may be unsuitable in certain patients, including those with some rectal conditions or significant bleeding risk.",
        "Assess for associated findings such as chills, sweating, dehydration, confusion and tachycardia.",
        "Report severe temperature abnormalities or fever accompanied by signs of sepsis or clinical deterioration."
      ]
    },
    {
      "heading": "10. Pulse assessment",
      "content": "Pulse is the palpable pressure wave produced by ventricular contraction and the movement of blood through arteries. Pulse assessment provides information about heart rate, rhythm and peripheral perfusion.",
      "points": [
        "Common pulse sites include radial, brachial, carotid, femoral, popliteal, posterior tibial and dorsalis pedis arteries.",
        "Assess rate, rhythm, volume or strength and equality where appropriate.",
        "Tachycardia refers to a resting adult heart rate above 100 beats per minute.",
        "Bradycardia refers to a resting adult heart rate below 60 beats per minute, although it may be normal in some individuals.",
        "An irregular pulse may indicate an arrhythmia and may require further assessment, including an ECG.",
        "A weak or thready pulse may indicate reduced peripheral perfusion.",
        "Compare peripheral pulses bilaterally when assessing circulation.",
        "Avoid palpating both carotid arteries simultaneously because this may compromise cerebral blood flow."
      ]
    },
    {
      "heading": "11. Respiratory assessment",
      "content": "Respiratory assessment evaluates ventilation, oxygenation and the effort required to breathe. It is particularly important in patients with respiratory, cardiovascular and neurological conditions.",
      "points": [
        "Assess respiratory rate, rhythm, depth and effort.",
        "Observe chest expansion and symmetry.",
        "Look for accessory muscle use, nasal flaring, intercostal recession and abnormal positioning.",
        "Assess skin and mucous membrane colour, recognising that cyanosis is a late and unreliable sign of hypoxaemia.",
        "Auscultate breath sounds and identify normal vesicular and bronchial sounds and abnormal sounds such as wheezes, crackles and stridor.",
        "Wheezes are commonly associated with narrowed airways.",
        "Crackles may occur when air moves through fluid or when small airways and alveoli reopen.",
        "Stridor suggests upper airway obstruction and requires urgent assessment.",
        "Assess oxygen saturation and the patient's response to oxygen therapy.",
        "Severe breathlessness, inability to speak normally, altered consciousness or falling oxygen saturation requires urgent escalation."
      ]
    },
    {
      "heading": "12. Blood pressure assessment",
      "content": "Blood pressure is the force exerted by circulating blood against arterial walls. It is recorded as systolic pressure over diastolic pressure and is influenced by cardiac output, peripheral vascular resistance, blood volume and arterial elasticity.",
      "points": [
        "Systolic pressure is the maximum arterial pressure during ventricular contraction.",
        "Diastolic pressure is the minimum arterial pressure during ventricular relaxation.",
        "Use an appropriately sized cuff and a validated measurement device.",
        "Position the patient comfortably and support the arm at heart level.",
        "Allow the patient to rest where possible and avoid measuring over clothing.",
        "A cuff that is too small may produce a falsely high reading, while an excessively large cuff may produce a falsely low reading.",
        "Hypertension is a sustained elevation of blood pressure diagnosed using appropriate repeated measurements and clinical criteria.",
        "Hypotension may indicate reduced circulating volume, medication effects, cardiac dysfunction or other causes.",
        "Orthostatic hypotension refers to a significant fall in blood pressure after assuming an upright position.",
        "A blood pressure reading must be interpreted alongside symptoms, perfusion, medication history and previous readings."
      ]
    },
    {
      "heading": "13. Oxygen saturation and pain assessment",
      "content": "Pulse oximetry provides a non-invasive estimate of peripheral oxygen saturation, while pain assessment helps identify a patient's subjective experience and guide symptom management.",
      "points": [
        "A pulse oximeter estimates SpO2 by analysing light absorption through a pulsating vascular bed.",
        "Poor peripheral perfusion, movement, cold extremities, nail products and device limitations may affect accuracy.",
        "Pulse oximetry does not directly measure ventilation or carbon dioxide levels.",
        "A patient with normal SpO2 may still have serious respiratory or circulatory problems.",
        "Interpret oxygen saturation alongside respiratory effort, mental status and the overall clinical picture.",
        "Assess pain location, quality, severity, onset, duration, aggravating factors and relieving factors.",
        "Use age-appropriate and communication-appropriate pain scales.",
        "Reassess pain after interventions and document the patient's response.",
        "Do not assume absence of pain means absence of serious disease."
      ]
    },
    {
      "heading": "14. Common haematological investigations",
      "content": "Haematological investigations examine blood cells and related components. They assist in identifying anaemia, infection, inflammation, bleeding disorders and haematological malignancies.",
      "points": [
        "Full blood count (FBC or CBC): assesses haemoglobin, red blood cells, white blood cells and platelets.",
        "Haemoglobin: measures the oxygen-carrying protein in red blood cells; low levels may indicate anaemia.",
        "Haematocrit or packed cell volume: estimates the proportion of blood volume occupied by red blood cells.",
        "Red blood cell count: measures the number of circulating red blood cells.",
        "White blood cell count: helps assess immune and inflammatory responses; increased or decreased values require clinical interpretation.",
        "Differential white cell count: evaluates the proportions of neutrophils, lymphocytes, monocytes, eosinophils and basophils.",
        "Platelet count: assesses the number of platelets involved in haemostasis; low counts may increase bleeding risk.",
        "Peripheral blood film: examines the appearance, size and shape of blood cells.",
        "Reticulocyte count: evaluates young red blood cells and helps assess bone marrow response.",
        "Coagulation tests such as PT, INR and aPTT assess aspects of blood clotting.",
        "Interpret results using the laboratory's reference ranges, patient characteristics and clinical presentation."
      ]
    },
    {
      "heading": "15. Common biochemical investigations",
      "content": "Biochemical investigations assess substances in blood and other body fluids to evaluate organ function, electrolyte balance, metabolism and tissue injury.",
      "points": [
        "Urea and creatinine: commonly used to assess renal function alongside estimated glomerular filtration rate and clinical findings.",
        "Estimated glomerular filtration rate (eGFR): estimates kidney filtration function and is important in assessing chronic kidney disease.",
        "Sodium: important in fluid balance, nerve function and cellular activity.",
        "Potassium: essential for neuromuscular function and cardiac electrical activity; severe abnormalities can cause dangerous arrhythmias.",
        "Chloride and bicarbonate: help assess electrolyte and acid-base balance.",
        "Calcium: important in bone health, muscle contraction, nerve transmission and coagulation.",
        "Magnesium: involved in neuromuscular and cardiac function.",
        "Liver function tests: may include ALT, AST, ALP, GGT, bilirubin and albumin.",
        "ALT and AST may rise with hepatocellular injury, but they do not independently measure overall liver function.",
        "Albumin is synthesised by the liver and is affected by nutrition, inflammation, renal losses and other conditions.",
        "Blood glucose: helps assess glucose regulation and diagnose or monitor diabetes.",
        "HbA1c: estimates average glycaemia over approximately the preceding 2-3 months.",
        "Lipid profile: may include total cholesterol, LDL, HDL and triglycerides.",
        "Cardiac troponin: helps identify myocardial injury and must be interpreted with symptoms, ECG findings and serial measurements where indicated."
      ]
    },
    {
      "heading": "16. Microbiological investigations",
      "content": "Microbiological investigations identify microorganisms responsible for infections and may guide appropriate antimicrobial treatment.",
      "points": [
        "Culture involves growing microorganisms from a specimen to identify a causative organism.",
        "Sensitivity testing evaluates which antimicrobial agents are likely to inhibit or kill the isolated organism.",
        "Blood culture is used when bloodstream infection or sepsis is suspected.",
        "Urine culture may identify organisms responsible for urinary tract infections.",
        "Sputum culture may help identify organisms causing lower respiratory tract infections.",
        "Wound swabs or tissue samples may be used to investigate wound infections, with specimen choice guided by clinical protocols.",
        "Specimens should ideally be collected before antimicrobial therapy when this is clinically safe and does not delay urgent treatment.",
        "Use the correct specimen container, appropriate technique and accurate labelling.",
        "Maintain aseptic technique and transport specimens promptly according to laboratory requirements.",
        "Interpret culture results alongside clinical findings because contamination or colonisation may occur."
      ]
    },
    {
      "heading": "17. Urinalysis and stool investigations",
      "content": "Urinalysis and stool investigations provide useful information about renal, urinary, gastrointestinal and metabolic conditions.",
      "points": [
        "Urinalysis may assess colour, appearance, pH, specific gravity, glucose, protein, blood, ketones, nitrites and leukocyte esterase.",
        "Protein in urine may indicate renal disease, although interpretation depends on the degree and clinical context.",
        "Glucose and ketones in urine may occur in diabetes and other metabolic conditions.",
        "Nitrites and leukocyte esterase may support suspicion of urinary tract infection but do not independently confirm it.",
        "Urine microscopy may identify red cells, white cells, casts, crystals and microorganisms.",
        "Stool occult blood testing detects hidden blood in stool.",
        "Stool culture may help identify bacterial gastrointestinal infections.",
        "Stool ova and parasite examination may detect intestinal parasites.",
        "Faecal tests may be used to investigate inflammation, infection, bleeding and malabsorption.",
        "Collect specimens using the correct container and avoid contamination with urine or other materials."
      ]
    },
    {
      "heading": "18. Arterial blood gas analysis",
      "content": "Arterial blood gas (ABG) analysis evaluates oxygenation, ventilation and acid-base balance. It is particularly useful in patients with respiratory failure, shock, severe metabolic disturbances and critical illness.",
      "points": [
        "pH: commonly 7.35-7.45. Below 7.35 indicates acidemia; above 7.45 indicates alkalemia.",
        "PaCO2: commonly 35-45 mmHg and reflects the respiratory component of acid-base balance.",
        "HCO3-: commonly 22-26 mmol/L and reflects the metabolic component.",
        "PaO2: commonly approximately 80-100 mmHg in healthy adults breathing room air at sea level, with interpretation affected by age and clinical conditions.",
        "Respiratory acidosis: reduced pH with increased PaCO2.",
        "Respiratory alkalosis: increased pH with reduced PaCO2.",
        "Metabolic acidosis: reduced pH with reduced bicarbonate.",
        "Metabolic alkalosis: increased pH with increased bicarbonate.",
        "Compensation occurs when the respiratory or renal systems respond to an acid-base disturbance.",
        "Interpret pH first, then PaCO2 and bicarbonate, and assess oxygenation and compensation.",
        "ABG results must be interpreted with the patient's clinical condition and oxygen therapy."
      ]
    },
    {
      "heading": "19. Electrocardiography (ECG)",
      "content": "An electrocardiogram records the electrical activity of the heart through electrodes placed on the patient's skin. It assists in identifying rhythm abnormalities, conduction disturbances and evidence of myocardial ischaemia or injury.",
      "points": [
        "A standard 12-lead ECG uses ten electrodes to produce twelve electrical views of the heart.",
        "The P wave represents atrial depolarisation.",
        "The QRS complex represents ventricular depolarisation.",
        "The T wave represents ventricular repolarisation.",
        "The PR interval reflects conduction from the atria through the atrioventricular conduction system.",
        "The ST segment is assessed for changes that may occur with myocardial ischaemia or injury.",
        "ECGs may help identify arrhythmias, heart blocks and some electrolyte-related changes.",
        "Ensure the patient is appropriately positioned and the skin is prepared for good electrode contact.",
        "Explain the procedure and ask the patient to remain still during recording.",
        "A normal ECG does not exclude all forms of acute coronary syndrome; clinical assessment and further testing may be required."
      ]
    },
    {
      "heading": "20. Diagnostic imaging: X-rays and computed tomography",
      "content": "Diagnostic imaging uses different technologies to produce images of internal body structures. Imaging helps identify anatomical abnormalities, injuries, infections, tumours and other disease processes.",
      "points": [
        "Plain X-ray uses ionising radiation to produce images, commonly of bones and the chest.",
        "Chest X-ray may help assess pneumonia, pulmonary oedema, pleural effusion, lung abnormalities and heart size.",
        "CT scanning uses X-rays and computer processing to create cross-sectional images.",
        "CT may be used to investigate trauma, stroke, tumours, abdominal conditions and pulmonary embolism using appropriate protocols.",
        "Some CT examinations use iodinated contrast agents.",
        "Before contrast administration, assess previous contrast reactions and relevant renal function and follow local screening protocols.",
        "Explain the procedure and assess pregnancy possibility where ionising radiation is involved.",
        "Check whether fasting or other preparation is required for the specific examination.",
        "After contrast administration, observe for immediate hypersensitivity reactions and follow local post-procedure guidance.",
        "Use appropriate radiation protection measures and follow facility procedures."
      ]
    },
    {
      "heading": "21. Ultrasound and magnetic resonance imaging",
      "content": "Ultrasound uses high-frequency sound waves to produce images, while magnetic resonance imaging (MRI) uses strong magnetic fields and radiofrequency energy to generate detailed images of body structures.",
      "points": [
        "Ultrasound does not use ionising radiation.",
        "Abdominal ultrasound may assess the liver, gallbladder, kidneys, spleen and other abdominal structures.",
        "Doppler ultrasound assesses blood flow through vessels.",
        "Ultrasound may be used to guide certain procedures such as fluid aspiration.",
        "Some ultrasound examinations require fasting or a full bladder; follow the specific instructions.",
        "MRI is useful for detailed assessment of the brain, spinal cord, joints and soft tissues.",
        "MRI does not use ionising radiation.",
        "Screen for pacemakers, implants, metallic foreign bodies and other MRI safety concerns before entry into the scanner environment.",
        "Remove unsafe metal objects and follow MRI-specific screening requirements.",
        "Some MRI examinations use gadolinium-based contrast agents, requiring appropriate assessment and precautions."
      ]
    },
    {
      "heading": "22. Endoscopy and other invasive diagnostic procedures",
      "content": "Endoscopy involves inserting a flexible or rigid instrument with a camera to visualise internal organs. Some procedures also allow tissue sampling or therapeutic intervention.",
      "points": [
        "Gastroscopy or upper gastrointestinal endoscopy examines the oesophagus, stomach and duodenum.",
        "Colonoscopy examines the large intestine and may allow biopsy or polyp removal.",
        "Bronchoscopy examines the tracheobronchial tree and may be used for biopsy or specimen collection.",
        "Cystoscopy examines the bladder and urethra.",
        "Biopsy involves obtaining tissue for histological examination.",
        "Lumbar puncture obtains cerebrospinal fluid for laboratory analysis and other indicated investigations.",
        "Before procedures, explain the examination, verify consent and review relevant preparation and risk factors.",
        "Check fasting requirements, allergies, anticoagulant use and prescribed medication adjustments according to the procedure and clinical orders.",
        "After sedation, monitor consciousness, respiratory status, oxygenation and vital signs.",
        "After biopsy or invasive procedures, observe for bleeding, pain, infection and other procedure-specific complications.",
        "Follow the specific post-procedure instructions for the investigation performed."
      ]
    },
    {
      "heading": "23. Nursing responsibilities before diagnostic investigations",
      "content": "Preparation reduces patient anxiety, improves test accuracy and prevents avoidable complications. The nurse should understand the purpose and requirements of each investigation.",
      "points": [
        "Verify the correct patient using approved identifiers.",
        "Confirm the requested investigation and check the relevant clinical order.",
        "Explain the purpose, expected procedure and any discomfort in language the patient understands.",
        "Confirm that informed consent has been obtained where required.",
        "Assess allergies, previous reactions, relevant medical conditions and current medication.",
        "Check fasting requirements and bowel preparation instructions where applicable.",
        "Assess pregnancy possibility before investigations involving ionising radiation or where relevant to the procedure.",
        "Check relevant laboratory results, such as renal function before certain contrast examinations, according to protocol.",
        "Collect baseline vital signs and assess the patient's current condition.",
        "Ensure required specimens, forms and documentation are correctly prepared.",
        "Provide emotional support and answer questions within professional competence.",
        "Arrange safe transport and appropriate monitoring for patients who are unstable or sedated."
      ]
    },
    {
      "heading": "24. Nursing responsibilities during diagnostic investigations",
      "content": "During an investigation, the nurse supports patient safety, maintains dignity, assists the clinical team and observes for complications.",
      "points": [
        "Maintain patient identification and procedure verification.",
        "Assist with positioning and ensure patient comfort and privacy.",
        "Use appropriate infection prevention and aseptic techniques.",
        "Monitor vital signs and clinical status when indicated.",
        "Observe for pain, respiratory difficulty, bleeding, allergic reactions or changes in consciousness.",
        "Provide reassurance and explain instructions during the procedure.",
        "Assist the clinician within the nurse's competence and assigned responsibilities.",
        "Ensure emergency equipment and assistance are available when clinically necessary.",
        "Document relevant observations, interventions and any adverse events."
      ]
    },
    {
      "heading": "25. Nursing responsibilities after diagnostic investigations",
      "content": "Post-investigation care aims to identify complications early, support recovery and ensure that findings are communicated appropriately.",
      "points": [
        "Monitor vital signs and the patient's level of consciousness according to the procedure and clinical condition.",
        "Observe for bleeding, pain, infection, respiratory depression or allergic reactions.",
        "Assess the relevant body system after the procedure.",
        "After sedation, follow recovery monitoring and discharge criteria before allowing the patient to leave the supervised setting.",
        "After lumbar puncture, monitor for complications according to the procedure protocol and report severe or concerning symptoms.",
        "After endoscopic procedures, follow instructions regarding oral intake and observe for complications such as severe abdominal pain, bleeding or respiratory problems.",
        "After biopsy, monitor the sampling site and observe for bleeding or other procedure-specific complications.",
        "Ensure specimens are correctly labelled and transported promptly.",
        "Document the procedure, observations, patient response and care provided.",
        "Communicate abnormal or critical results promptly through the appropriate clinical pathway.",
        "Explain post-procedure instructions and warning signs to the patient."
      ]
    },
    {
      "heading": "26. Recognition of clinical deterioration",
      "content": "Clinical deterioration refers to worsening physiological or neurological function that may lead to serious harm or death if not recognised and treated promptly. Nurses are often the first healthcare professionals to identify deterioration.",
      "points": [
        "Airway warning signs include obstruction, stridor, inability to speak and reduced airway protection.",
        "Breathing warning signs include severe respiratory distress, cyanosis, markedly abnormal respiratory rate and falling oxygen saturation.",
        "Circulatory warning signs include hypotension, weak peripheral pulses, cold clammy skin, significant bleeding and poor urine output.",
        "Neurological warning signs include sudden confusion, reduced consciousness, seizures, new weakness and unequal pupils.",
        "Other warning signs include rapidly worsening pain, persistent fever with deterioration and reduced urine output.",
        "Use an approved early warning score where available, alongside clinical judgement.",
        "Escalate concerns promptly using the facility's emergency response and communication protocols.",
        "Do not delay urgent care while waiting for routine investigations or senior review."
      ]
    }
  ],
  "clinicalApplication": [
    {
      "heading": "Clinical case 1: interpreting vital signs",
      "content": "A 65-year-old patient is admitted with fever and productive cough. The respiratory rate is 30 breaths per minute, pulse 116 beats per minute, blood pressure 92/58 mmHg and oxygen saturation 89% on room air. The patient appears confused.",
      "points": [
        "Recognise that the patient has multiple concerning findings: tachypnoea, tachycardia, hypotension, hypoxaemia and altered mental status.",
        "Assess airway, breathing and circulation immediately.",
        "Consider serious infection with possible sepsis and impaired tissue perfusion.",
        "Escalate urgently according to the facility's emergency and sepsis protocols.",
        "Monitor vital signs, oxygenation, consciousness and urine output as indicated.",
        "Anticipate investigations such as FBC, renal function, electrolytes, lactate, blood cultures and other tests based on clinical assessment and orders.",
        "Do not delay urgent treatment while waiting for laboratory results."
      ]
    },
    {
      "heading": "Clinical case 2: interpreting a full blood count",
      "content": "A patient presents with fatigue, dizziness and pallor. The full blood count shows a haemoglobin concentration below the laboratory reference range.",
      "points": [
        "Recognise that the low haemoglobin may indicate anaemia.",
        "Assess for breathlessness, palpitations, dizziness, weakness and signs of poor perfusion.",
        "Review red cell indices such as MCV, MCH and MCHC to help classify anaemia.",
        "Consider further investigations such as reticulocyte count, peripheral blood film, iron studies, vitamin B12 and folate depending on the clinical picture.",
        "Assess for possible blood loss, nutritional deficiencies, chronic disease or haemolysis.",
        "Monitor the patient's clinical condition and communicate significant abnormalities to the healthcare team."
      ]
    },
    {
      "heading": "Clinical case 3: nursing care before CT with contrast",
      "content": "A patient is scheduled for a CT scan with intravenous contrast. The patient reports a previous reaction after receiving contrast during an earlier scan.",
      "points": [
        "Clarify the nature and severity of the previous reaction.",
        "Inform the responsible clinician and radiology team before the examination.",
        "Review relevant allergy history and renal function according to protocol.",
        "Check the patient's current condition and any additional preparation requirements.",
        "Do not independently proceed with contrast administration when a significant previous reaction has not been assessed.",
        "Ensure an appropriate risk assessment and plan are made by the responsible team.",
        "Observe the patient for reactions during and after contrast administration as required."
      ]
    }
  ],
  "examPoints": [
    "Assessment is the first stage of the nursing process and provides baseline information.",
    "Subjective data are reported by the patient; objective data are observed or measured.",
    "A comprehensive health history includes the presenting complaint, history of present illness, past history, medication history, allergies, family history and social history.",
    "PQRST is used to assess symptoms, particularly pain.",
    "The four physical examination techniques are inspection, palpation, percussion and auscultation.",
    "The usual sequence for abdominal examination is inspection, auscultation, percussion and palpation.",
    "Typical adult resting respiratory rate is approximately 12-20 breaths per minute.",
    "Typical adult resting pulse is approximately 60-100 beats per minute.",
    "Interpret vital signs in the context of the patient's baseline and clinical presentation.",
    "A full blood count assesses haemoglobin, red blood cells, white blood cells and platelets.",
    "Low haemoglobin may indicate anaemia.",
    "Urea, creatinine and eGFR help assess renal function.",
    "Potassium abnormalities can cause potentially dangerous cardiac arrhythmias.",
    "ALT and AST are markers of hepatocellular injury, not independent measures of overall liver function.",
    "Culture and sensitivity testing helps identify microorganisms and guide antimicrobial therapy.",
    "ABG interpretation begins with pH, followed by PaCO2 and bicarbonate.",
    "Respiratory acidosis is associated with increased PaCO2 and reduced pH.",
    "Metabolic acidosis is associated with reduced bicarbonate and reduced pH.",
    "An ECG records the electrical activity of the heart.",
    "The P wave represents atrial depolarisation; the QRS complex represents ventricular depolarisation.",
    "CT and X-ray use ionising radiation; MRI uses magnetic fields and radiofrequency energy.",
    "Ultrasound uses sound waves and does not use ionising radiation.",
    "Before contrast investigations, assess previous contrast reactions and relevant renal function according to protocol.",
    "After sedation, monitor consciousness, respiration and oxygenation.",
    "Collect microbiological specimens before antibiotics when clinically appropriate and without delaying urgent treatment.",
    "Clinical deterioration requires prompt assessment, escalation and intervention."
  ],
  "questions": [
    {
      "question": "Which of the following best describes the main purpose of a comprehensive nursing assessment?",
      "options": [
        "To establish a medical diagnosis without involving other professionals",
        "To collect information about the patient's health status and identify nursing care needs",
        "To determine the patient's financial status only",
        "To replace diagnostic investigations"
      ],
      "answer": "B",
      "explanation": "Comprehensive assessment provides baseline information, identifies actual and potential health problems and guides individualised nursing care."
    },
    {
      "question": "A patient reports experiencing severe chest pain. This information is classified as:",
      "options": [
        "Objective data",
        "Subjective data",
        "Laboratory data",
        "Radiological data"
      ],
      "answer": "B",
      "explanation": "Pain is a subjective experience reported by the patient, although objective findings may help assess its possible cause and severity."
    },
    {
      "question": "Which of the following is the correct sequence of techniques during routine abdominal examination?",
      "options": [
        "Inspection, palpation, percussion, auscultation",
        "Palpation, inspection, auscultation, percussion",
        "Inspection, auscultation, percussion, palpation",
        "Auscultation, palpation, inspection, percussion"
      ],
      "answer": "C",
      "explanation": "Auscultation is performed before percussion and palpation because these techniques may alter bowel sounds."
    },
    {
      "question": "Which investigation is most useful for assessing haemoglobin, white blood cells and platelet count?",
      "options": [
        "Liver function test",
        "Full blood count",
        "Electrocardiogram",
        "Arterial blood gas"
      ],
      "answer": "B",
      "explanation": "A full blood count measures major blood cell components, including haemoglobin, red blood cells, white blood cells and platelets."
    },
    {
      "question": "A patient has a serum potassium level significantly above the laboratory reference range. Which complication is of greatest concern?",
      "options": [
        "Cardiac arrhythmias",
        "Hearing impairment",
        "Visual impairment",
        "Skin pigmentation"
      ],
      "answer": "A",
      "explanation": "Hyperkalaemia can disturb cardiac electrical conduction and cause life-threatening arrhythmias."
    },
    {
      "question": "Which ABG pattern is most consistent with respiratory acidosis?",
      "options": [
        "Increased pH and decreased PaCO2",
        "Decreased pH and increased PaCO2",
        "Increased pH and increased bicarbonate",
        "Decreased pH and decreased PaCO2"
      ],
      "answer": "B",
      "explanation": "Respiratory acidosis occurs when carbon dioxide is retained, causing PaCO2 to rise and blood pH to fall."
    },
    {
      "question": "Which component of an ECG represents ventricular depolarisation?",
      "options": [
        "P wave",
        "T wave",
        "QRS complex",
        "PR segment"
      ],
      "answer": "C",
      "explanation": "The QRS complex represents ventricular depolarisation, which precedes ventricular contraction."
    },
    {
      "question": "Which imaging investigation uses strong magnetic fields and radiofrequency energy?",
      "options": [
        "Plain X-ray",
        "CT scan",
        "MRI",
        "Fluoroscopy"
      ],
      "answer": "C",
      "explanation": "MRI uses magnetic fields and radiofrequency energy rather than ionising radiation."
    },
    {
      "question": "A patient scheduled for CT with contrast reports a previous severe contrast reaction. What should the nurse do first?",
      "options": [
        "Proceed with the investigation without further assessment",
        "Ignore the information because the reaction occurred previously",
        "Inform the responsible clinician and radiology team before contrast administration",
        "Administer any available antihistamine independently and proceed"
      ],
      "answer": "C",
      "explanation": "A previous severe contrast reaction requires assessment and a plan by the responsible clinical team before proceeding."
    },
    {
      "question": "When should a blood culture ideally be collected in a patient with suspected bloodstream infection?",
      "options": [
        "Only after the entire antibiotic course",
        "Before antimicrobial therapy when clinically safe and without delaying urgent treatment",
        "Only when the patient has recovered",
        "After discharge"
      ],
      "answer": "B",
      "explanation": "Collecting cultures before antibiotics can improve the chance of identifying the causative organism. However, urgent treatment must not be delayed in an unstable patient."
    },
    {
      "question": "A patient has a respiratory rate of 32 breaths per minute, low oxygen saturation and confusion. What is the nurse's priority?",
      "options": [
        "Begin discharge teaching",
        "Complete a routine nutritional assessment",
        "Immediately assess airway and breathing and escalate the patient's deterioration",
        "Wait for the next scheduled observations"
      ],
      "answer": "C",
      "explanation": "Severe tachypnoea, hypoxaemia and altered mental status indicate possible serious deterioration requiring immediate assessment and escalation."
    },
    {
      "question": "Which statement about pulse oximetry is correct?",
      "options": [
        "It directly measures arterial carbon dioxide.",
        "It estimates peripheral oxygen saturation.",
        "It replaces respiratory assessment.",
        "It directly measures haemoglobin concentration."
      ],
      "answer": "B",
      "explanation": "Pulse oximetry estimates oxygen saturation but does not directly measure PaCO2, haemoglobin concentration or the full adequacy of ventilation."
    }
  ]
};

lessonContent["Respiratory disorders"] = {
  "title": "Respiratory Disorders",
  "objectives": [
    "Explain the pathophysiology, causes and manifestations of common respiratory disorders.",
    "Interpret important respiratory investigations and explain nursing responsibilities.",
    "Describe medical, pharmacological and nursing management of respiratory patients.",
    "Identify respiratory emergencies and initiate appropriate nursing actions."
  ],
  "notes": [
    {
      "title": "1. Overview of respiratory disorders",
      "content": "Respiratory disorders affect ventilation, diffusion of gases or perfusion of the lungs. Ventilation is movement of air into and out of the lungs; diffusion is movement of oxygen and carbon dioxide across the alveolar-capillary membrane; perfusion is blood flow through pulmonary capillaries. Failure of any process can cause hypoxaemia, hypercapnia or both. Respiratory failure occurs when the respiratory system cannot maintain adequate oxygenation or carbon dioxide removal."
    },
    {
      "title": "2. Respiratory assessment",
      "content": "Obtain a history of cough, sputum, haemoptysis, chest pain, wheezing, dyspnoea, orthopnoea, smoking, occupational exposure, allergies, previous respiratory disease and medication use. Assess respiratory rate, rhythm, depth, work of breathing, oxygen saturation, skin colour, mental status and ability to speak. Inspect for cyanosis, use of accessory muscles, chest deformity and symmetrical expansion. Palpate chest expansion and tracheal position. Percuss for resonance, dullness or hyperresonance. Auscultate systematically, comparing both sides. Crackles may suggest fluid or opening of small airways; wheezes suggest narrowed airways; stridor suggests upper-airway obstruction; markedly reduced breath sounds may indicate poor air entry, pleural effusion or pneumothorax."
    },
    {
      "title": "3. Investigations and interpretation",
      "content": "Pulse oximetry estimates peripheral oxygen saturation but does not measure carbon dioxide or directly assess ventilation. Arterial blood gases assess pH, PaO2, PaCO2 and bicarbonate. A low PaO2 indicates hypoxaemia; raised PaCO2 indicates inadequate alveolar ventilation. Chest radiography can show consolidation, collapse, pleural fluid or pneumothorax. Sputum microscopy, culture and sensitivity help identify organisms and guide antibiotics. Full blood count may show leukocytosis in infection or anaemia that worsens oxygen delivery. Spirometry assesses airflow obstruction and restriction; a reduced FEV1/FVC ratio supports obstructive disease. CT, bronchoscopy and pulmonary function tests may be requested according to the clinical problem. Confirm results against the laboratory's reference ranges and the patient's clinical condition."
    },
    {
      "title": "4. Asthma",
      "content": "Asthma is a chronic inflammatory airway disorder characterised by variable, usually reversible airflow obstruction and bronchial hyper-responsiveness. Triggers include allergens, respiratory infections, exercise, cold air, smoke and occupational irritants. Inflammation, bronchial smooth-muscle contraction and mucus production narrow the airways. Manifestations include episodic wheezing, cough, chest tightness and breathlessness, often worse at night or early morning. Diagnosis is supported by variable expiratory airflow limitation on spirometry or peak-flow measurements. Management includes trigger avoidance, inhaled corticosteroid-containing treatment and prescribed reliever therapy. Inhaler technique, adherence and an individualised written action plan are essential. A severe attack may present with inability to speak normally, exhaustion, altered consciousness, silent chest or falling oxygen saturation and requires emergency management."
    },
    {
      "title": "5. Chronic obstructive pulmonary disease (COPD)",
      "content": "COPD is a chronic condition characterised by persistent respiratory symptoms and airflow limitation, commonly associated with tobacco smoke, biomass fuel exposure and occupational pollutants. Chronic bronchitis involves chronic productive cough associated with airway inflammation and mucus hypersecretion. Emphysema involves destruction of alveolar walls, loss of elastic recoil and air trapping. Patients may have progressive dyspnoea, chronic cough, sputum production, wheezing and reduced exercise tolerance. Spirometry confirms persistent airflow obstruction. Management includes smoking cessation, vaccination, inhaled bronchodilators, selected inhaled corticosteroids, pulmonary rehabilitation, nutrition support and oxygen for patients who meet appropriate criteria. Teach pursed-lip breathing, energy conservation and correct inhaler use. Oxygen should be prescribed and titrated to the patient's target; in patients at risk of hypercapnic respiratory failure, controlled oxygen and blood-gas monitoring are important."
    },
    {
      "title": "6. Pneumonia",
      "content": "Pneumonia is infection and inflammation of lung parenchyma, causing alveoli to fill with inflammatory fluid and exudate. Causes include bacteria, viruses and fungi. Risk factors include extremes of age, impaired immunity, aspiration, smoking, chronic disease and immobility. Manifestations include fever, cough, sputum, pleuritic chest pain, dyspnoea, crackles, tachypnoea and sometimes confusion, especially in older adults. Chest radiography may show infiltrates or consolidation; blood tests and sputum cultures may help establish severity and cause. Management depends on severity and likely organism and may include appropriate antimicrobials, oxygen when indicated, fluids, antipyretics and respiratory support. Nursing care includes monitoring vital signs and oxygen saturation, administering prescribed treatment, supporting hydration and nutrition, positioning for breathing, promoting mobilisation and monitoring for sepsis or respiratory deterioration."
    },
    {
      "title": "7. Pulmonary tuberculosis",
      "content": "Pulmonary tuberculosis is an infectious disease caused by Mycobacterium tuberculosis and spread through airborne particles from a person with infectious pulmonary or laryngeal TB. Symptoms may include persistent cough, sputum, haemoptysis, fever, night sweats, weight loss, fatigue and reduced appetite. Investigations may include sputum molecular testing, microscopy and culture, chest radiography and assessment for drug resistance. Treatment requires a complete combination regimen according to national guidelines and drug-susceptibility results. Interrupting treatment can lead to relapse, ongoing transmission and drug resistance. Nursing responsibilities include prompt recognition, respiratory infection-control precautions, ensuring treatment adherence, monitoring adverse effects, contact evaluation according to policy, nutrition support and non-stigmatising patient education. Use appropriate airborne precautions and ventilation according to facility guidance."
    },
    {
      "title": "8. Pleural disorders and respiratory emergencies",
      "content": "Pleural effusion is accumulation of fluid in the pleural space and may cause dyspnoea, reduced chest expansion, dull percussion and reduced breath sounds. Pneumothorax is air in the pleural space causing partial or complete lung collapse; findings may include sudden pleuritic pain, dyspnoea, reduced breath sounds and hyperresonance. Tension pneumothorax is life-threatening: rising intrapleural pressure compromises ventilation and venous return, causing severe respiratory distress and circulatory instability. It requires immediate emergency decompression by a qualified clinician, followed by definitive management. Pulmonary embolism is obstruction of pulmonary arteries, usually by a thrombus from deep veins. Sudden dyspnoea, pleuritic pain, tachycardia, hypoxaemia or syncope may occur. Suspected pulmonary embolism requires urgent assessment and prescribed anticoagulation or other specialist treatment. Never delay escalation in a deteriorating patient."
    },
    {
      "title": "9. Nursing management of respiratory patients",
      "content": "Prioritise airway, breathing and circulation. Position the patient upright when tolerated, assess respiratory effort and oxygen saturation, and administer prescribed oxygen safely. Monitor respiratory rate, consciousness, breath sounds, sputum, temperature and response to treatment. Encourage effective coughing, deep breathing and mobilisation when appropriate. Provide oral care, hydration and nutritional support. Administer prescribed inhalers, nebulised medicines, antimicrobials and other treatments, checking allergies and response. Use infection-prevention precautions, teach inhaler technique and smoking cessation, and document changes promptly. Escalate increasing work of breathing, new confusion, cyanosis, exhaustion, hypotension, silent chest or rapidly worsening oxygenation."
    }
  ],
  "clinicalCases": [
    {
      "title": "Case 1: Acute asthma attack",
      "content": "A 19-year-old with asthma presents with severe wheezing, difficulty speaking in full sentences and increased work of breathing. The priority is rapid ABC assessment, urgent escalation, oxygen if indicated and prompt administration of prescribed emergency bronchodilator and corticosteroid treatment. Reassess response frequently. A silent chest or reduced consciousness is a critical warning sign, not improvement."
    },
    {
      "title": "Case 2: Suspected pulmonary tuberculosis",
      "content": "A patient reports cough lasting several weeks, night sweats and weight loss. Arrange prompt clinical evaluation and sputum testing according to local TB pathways. Apply appropriate airborne precautions, explain the need for testing and treatment completion, and avoid stigma or blame."
    }
  ],
  "examPoints": [
    "Differentiate ventilation, diffusion and perfusion.",
    "Asthma usually causes variable and reversible airflow obstruction.",
    "COPD is associated with persistent airflow limitation; spirometry is central to diagnosis.",
    "Crackles may occur in pneumonia; wheezes commonly occur with narrowed airways.",
    "TB spreads through airborne particles, not by sharing ordinary utensils.",
    "Pulse oximetry does not measure PaCO2.",
    "ABG interpretation must consider pH, PaCO2 and bicarbonate together.",
    "Sudden dyspnoea and pleuritic chest pain may indicate pulmonary embolism.",
    "Tension pneumothorax is an emergency requiring immediate intervention.",
    "Controlled oxygen may be necessary in patients at risk of hypercapnic respiratory failure.",
    "Smoking cessation is a key intervention in COPD.",
    "Escalate respiratory exhaustion, altered consciousness and silent chest urgently."
  ],
  "questions": [
    {
      "question": "Which physiological process describes movement of oxygen from alveoli into pulmonary capillary blood?",
      "options": [
        "Ventilation",
        "Diffusion",
        "Perfusion",
        "Expiration"
      ],
      "answer": "B",
      "explanation": "Diffusion is movement of gases across the alveolar-capillary membrane down their partial-pressure gradients."
    },
    {
      "question": "A patient with asthma is unable to complete sentences and has marked respiratory distress. What is the priority?",
      "options": [
        "Arrange routine outpatient review",
        "Assess ABCs and initiate emergency management",
        "Encourage the patient to walk",
        "Withhold all treatment until spirometry is done"
      ],
      "answer": "B",
      "explanation": "Severe respiratory distress requires immediate ABC assessment, escalation and emergency treatment; investigations must not delay stabilisation."
    },
    {
      "question": "Which investigation is central to confirming persistent airflow obstruction in COPD?",
      "options": [
        "Urinalysis",
        "Spirometry",
        "Abdominal ultrasound",
        "Lumbar puncture"
      ],
      "answer": "B",
      "explanation": "Spirometry measures airflow and demonstrates persistent obstruction, commonly using the post-bronchodilator FEV1/FVC ratio."
    },
    {
      "question": "Which finding is most suggestive of consolidation in pneumonia?",
      "options": [
        "Bronchial breath sounds over peripheral lung tissue",
        "Normal vesicular breath sounds everywhere",
        "Hyperresonance over both lungs",
        "Absent bowel sounds"
      ],
      "answer": "A",
      "explanation": "Consolidated lung tissue transmits bronchial breath sounds and may also produce crackles and dullness to percussion."
    },
    {
      "question": "Which statement about pulse oximetry is correct?",
      "options": [
        "It measures PaCO2 directly",
        "It measures blood pH",
        "It estimates peripheral oxygen saturation",
        "It confirms the cause of hypoxaemia"
      ],
      "answer": "C",
      "explanation": "Pulse oximetry estimates oxygen saturation but cannot measure PaCO2, pH or identify the underlying cause."
    },
    {
      "question": "A patient develops sudden severe dyspnoea, hypotension and unilateral absent breath sounds after chest trauma. Which emergency should be suspected?",
      "options": [
        "Tension pneumothorax",
        "Chronic bronchitis",
        "Stable asthma",
        "Uncomplicated rhinitis"
      ],
      "answer": "A",
      "explanation": "The combination suggests tension pneumothorax, which can obstruct venous return and cause life-threatening shock."
    },
    {
      "question": "What is the main route of transmission of infectious pulmonary tuberculosis?",
      "options": [
        "Airborne particles",
        "Contaminated drinking water",
        "Mosquito bites",
        "Sharing plates"
      ],
      "answer": "A",
      "explanation": "TB is transmitted through airborne particles generated by a person with infectious pulmonary or laryngeal disease."
    },
    {
      "question": "Which nursing action is most appropriate for a breathless patient who can tolerate sitting upright?",
      "options": [
        "Place flat in bed",
        "Position upright and reassess breathing",
        "Restrict all observations",
        "Encourage strenuous exercise"
      ],
      "answer": "B",
      "explanation": "Upright positioning can improve chest expansion and reduce the work of breathing while assessment and treatment continue."
    }
  ]
};

lessonContent["Cardiovascular disorders"] = {
  "title": "Cardiovascular Disorders",
  "objectives": [
    "Explain normal cardiac function and the pathophysiology of common cardiovascular disorders.",
    "Recognise clinical manifestations of cardiac disease and cardiovascular emergencies.",
    "Describe cardiovascular investigations and interpret common findings.",
    "Develop safe nursing interventions for patients with cardiovascular disorders."
  ],
  "notes": [
    {
      "title": "1. Cardiovascular assessment and physiology",
      "content": "The cardiovascular system consists of the heart, blood and blood vessels. The right side of the heart pumps deoxygenated blood to the lungs; the left side pumps oxygenated blood to the systemic circulation. Cardiac output (CO) is the volume of blood pumped per minute and is calculated as heart rate multiplied by stroke volume. Stroke volume is influenced by preload, afterload and myocardial contractility. Assess chest pain, dyspnoea, palpitations, syncope, fatigue, oedema and exercise tolerance. Examine pulse rate, rhythm and volume, blood pressure, capillary refill, peripheral temperature, jugular venous pressure, heart sounds, lung sounds and peripheral oedema."
    },
    {
      "title": "2. Cardiovascular investigations",
      "content": "A 12-lead ECG records the heart's electrical activity and helps identify rhythm abnormalities and ischaemic changes. Serial ECGs and cardiac troponins are important in suspected acute coronary syndrome. Troponin elevation indicates myocardial injury but must be interpreted with symptoms, ECG and clinical context. Echocardiography assesses cardiac structure, valves, wall motion and ejection fraction. Chest radiography may show cardiomegaly or pulmonary congestion. Lipid profile, glucose or HbA1c, renal function, electrolytes and full blood count help assess risk and guide management. Blood pressure should be measured with the correct cuff size and appropriate technique; repeat abnormal readings and assess for target-organ damage."
    },
    {
      "title": "3. Hypertension",
      "content": "Hypertension is persistently elevated arterial blood pressure. It is often asymptomatic, which is why screening and accurate repeated measurement are important. Risk factors include age, family history, excess dietary sodium, obesity, physical inactivity, tobacco use, harmful alcohol use, diabetes and kidney disease. Persistent high pressure damages blood vessels and increases the risk of stroke, coronary disease, heart failure, kidney disease and retinopathy. Management includes lifestyle measures such as reduced sodium intake, healthy diet, physical activity, weight management and smoking cessation, alongside prescribed antihypertensive medicines. Drug classes include thiazide-like diuretics, ACE inhibitors, ARBs and calcium-channel blockers; selection depends on patient factors and guidelines. Teach adherence and monitoring; do not advise stopping medication when the patient feels well."
    },
    {
      "title": "4. Atherosclerosis and coronary artery disease",
      "content": "Atherosclerosis involves lipid-rich inflammatory plaques in arterial walls. Plaque growth narrows the lumen and may reduce blood supply; plaque rupture can trigger platelet aggregation and thrombosis. Coronary artery disease occurs when coronary blood flow is insufficient for myocardial oxygen demand. Risk factors include smoking, hypertension, dyslipidaemia, diabetes, age and family history. Stable angina is predictable chest discomfort associated with exertion or stress and relieved by rest or prescribed anti-anginal treatment. New, worsening or rest pain may indicate acute coronary syndrome and must be treated as an emergency."
    },
    {
      "title": "5. Acute coronary syndrome and myocardial infarction",
      "content": "Acute coronary syndrome includes unstable angina and myocardial infarction. Myocardial infarction occurs when prolonged ischaemia causes myocardial cell death, commonly following acute coronary thrombosis. Symptoms may include central chest pressure or pain radiating to the arm, jaw or back, sweating, nausea, dyspnoea and anxiety. Some patients, including people with diabetes and older adults, may have atypical or less obvious symptoms. Urgent assessment includes ABCs, 12-lead ECG, serial cardiac troponins and monitoring. Management may include antiplatelets, anticoagulation, nitrates when appropriate, analgesia, statins and urgent reperfusion by PCI or other indicated strategy. Oxygen is not automatically required for every patient; use it when clinically indicated by hypoxaemia or respiratory distress and local protocol. Nursing priorities include rapid escalation, monitoring, reducing exertion, administering prescribed therapy and watching for arrhythmias, shock and heart failure."
    },
    {
      "title": "6. Heart failure",
      "content": "Heart failure is a clinical syndrome in which structural or functional cardiac impairment results in inadequate cardiac output or elevated filling pressures. It may be classified by ejection fraction and by left- or right-sided manifestations. Left-sided failure commonly causes pulmonary congestion, dyspnoea, orthopnoea, paroxysmal nocturnal dyspnoea and crackles. Right-sided failure commonly causes peripheral oedema, raised jugular venous pressure, hepatomegaly and abdominal swelling. Causes include ischaemic heart disease, hypertension, cardiomyopathy and valvular disease. Assessment includes symptoms, weight trends, fluid balance, renal function, electrolytes, ECG, chest imaging and echocardiography. Management may include diuretics for congestion and disease-modifying medicines such as ACE inhibitors/ARNI, beta-blockers, mineralocorticoid receptor antagonists and SGLT2 inhibitors when indicated. Nursing care includes monitoring weight, oedema, breathlessness, fluid balance, renal function and electrolytes; teaching medication adherence, symptom recognition, diet and follow-up."
    },
    {
      "title": "7. Cardiac arrhythmias",
      "content": "Arrhythmias are abnormalities of cardiac rate, rhythm or electrical conduction. Atrial fibrillation is disorganised atrial electrical activity causing an irregularly irregular pulse and increased risk of thromboembolic stroke. Other arrhythmias include supraventricular tachycardia, ventricular tachycardia, ventricular fibrillation and bradyarrhythmias. Assess symptoms, haemodynamic stability, pulse and ECG. Unstable tachyarrhythmias may require urgent synchronised cardioversion; pulseless ventricular tachycardia and ventricular fibrillation require immediate CPR and defibrillation according to resuscitation guidelines. Atrial fibrillation management may involve rate or rhythm control and anticoagulation based on individual stroke and bleeding risk."
    },
    {
      "title": "8. Valvular and peripheral vascular disorders",
      "content": "Heart valve disease may cause stenosis, where a valve does not open adequately, or regurgitation, where it does not close effectively. Manifestations depend on the valve and severity and may include murmurs, dyspnoea, fatigue, syncope and heart failure. Echocardiography is central to assessment. Peripheral arterial disease results from reduced arterial blood flow, commonly due to atherosclerosis; symptoms include intermittent claudication, cool extremities, reduced pulses and poorly healing wounds. Chronic venous insufficiency causes venous hypertension, oedema, varicosities and skin changes, often with shallow ulcers around the medial ankle. Assess pulses, skin, temperature, sensation, pain and wounds. Sudden limb pain, pallor, pulselessness, paraesthesia, paralysis and poikilothermia suggest acute limb ischaemia and require urgent escalation."
    },
    {
      "title": "9. Cardiovascular nursing management",
      "content": "Prioritise ABCs and recognise chest pain, syncope, shock and acute pulmonary oedema as potential emergencies. Monitor vital signs, ECG rhythm, oxygenation, pain, peripheral perfusion, fluid balance, urine output and mental status. Administer prescribed medicines safely and monitor for hypotension, bradycardia, electrolyte disturbances, bleeding and renal impairment. Support appropriate activity, nutrition, smoking cessation and rehabilitation. Teach patients to recognise worsening symptoms, adhere to medicines and attend follow-up. Document assessment, interventions and response, and escalate deterioration promptly."
    }
  ],
  "clinicalCases": [
    {
      "title": "Case 1: Suspected myocardial infarction",
      "content": "A 58-year-old reports crushing central chest pain radiating to the left arm with sweating and nausea. Treat as a possible acute coronary syndrome. Initiate rapid ABC assessment, call for urgent clinical review, obtain a 12-lead ECG promptly, establish monitoring and administer prescribed treatment according to protocol. Do not delay escalation while waiting for pain to resolve."
    },
    {
      "title": "Case 2: Worsening heart failure",
      "content": "A patient with known heart failure reports increasing orthopnoea and has gained weight over several days with bilateral ankle oedema. Assess respiratory status, oxygenation, weight, fluid balance, lung sounds and prescribed medication adherence. Escalate possible fluid overload and monitor response to treatment."
    }
  ],
  "examPoints": [
    "Cardiac output = heart rate × stroke volume.",
    "Preload relates to ventricular filling; afterload is resistance against which the ventricle pumps.",
    "Hypertension may be asymptomatic but causes long-term target-organ damage.",
    "Atherosclerotic plaque rupture can produce acute coronary thrombosis.",
    "New or worsening chest pain at rest is an emergency warning sign.",
    "Troponin is a marker of myocardial injury and must be interpreted clinically.",
    "Left-sided heart failure commonly produces pulmonary congestion.",
    "Right-sided heart failure commonly produces systemic venous congestion and peripheral oedema.",
    "Atrial fibrillation increases the risk of thromboembolic stroke.",
    "Ventricular fibrillation and pulseless ventricular tachycardia require CPR and defibrillation.",
    "Daily weight trends can help detect fluid retention in heart failure.",
    "Acute limb ischaemia requires urgent escalation."
  ],
  "questions": [
    {
      "question": "How is cardiac output calculated?",
      "options": [
        "Heart rate multiplied by stroke volume",
        "Blood pressure divided by respiratory rate",
        "Stroke volume divided by temperature",
        "Pulse pressure multiplied by oxygen saturation"
      ],
      "answer": "A",
      "explanation": "Cardiac output is the volume pumped by one ventricle per minute: heart rate multiplied by stroke volume."
    },
    {
      "question": "Which symptom pattern is most concerning for acute coronary syndrome?",
      "options": [
        "Brief pain only after pressing a rib",
        "New central chest pressure with sweating and nausea",
        "Mild itching on the arm",
        "Chronic ankle swelling without other symptoms"
      ],
      "answer": "B",
      "explanation": "Central chest pressure with autonomic symptoms is concerning for myocardial ischaemia and requires urgent assessment."
    },
    {
      "question": "Which manifestation is most characteristic of left-sided heart failure?",
      "options": [
        "Pulmonary crackles and orthopnoea",
        "Isolated ear pain",
        "Increased visual acuity",
        "Unilateral calf rash"
      ],
      "answer": "A",
      "explanation": "Left ventricular failure increases pulmonary venous pressure, causing congestion, crackles and breathlessness when lying flat."
    },
    {
      "question": "A patient with atrial fibrillation is at increased risk of which complication?",
      "options": [
        "Thromboembolic stroke",
        "Appendicitis",
        "Cataract",
        "Peptic ulcer in every case"
      ],
      "answer": "A",
      "explanation": "Blood stasis in the atria can promote thrombus formation and systemic embolisation, including stroke."
    },
    {
      "question": "Which test directly assesses cardiac structure and estimates ejection fraction?",
      "options": [
        "Echocardiography",
        "Urine microscopy",
        "Sputum culture",
        "Peak expiratory flow"
      ],
      "answer": "A",
      "explanation": "Echocardiography uses ultrasound to assess cardiac chambers, valves, wall motion and ejection fraction."
    },
    {
      "question": "Which nursing observation is especially useful for detecting fluid retention in a patient with heart failure?",
      "options": [
        "Daily weight under consistent conditions",
        "Hair length",
        "Visual acuity alone",
        "Hand dominance"
      ],
      "answer": "A",
      "explanation": "A consistent daily weight trend can reveal fluid accumulation before severe symptoms develop."
    },
    {
      "question": "A patient is found pulseless with ventricular fibrillation on the monitor. What is the priority?",
      "options": [
        "Offer oral fluids",
        "Start CPR and arrange immediate defibrillation",
        "Wait for a routine ECG",
        "Encourage the patient to cough"
      ],
      "answer": "B",
      "explanation": "Ventricular fibrillation is a shockable cardiac arrest rhythm requiring high-quality CPR and prompt defibrillation."
    },
    {
      "question": "Which finding may indicate acute limb ischaemia?",
      "options": [
        "Sudden severe limb pain with a cold, pulseless extremity",
        "Warm feet with normal pulses",
        "Gradual hair growth",
        "Bilateral painless bruising only"
      ],
      "answer": "A",
      "explanation": "Sudden pain, pallor, pulselessness, paraesthesia, paralysis and coldness are classic warning signs of acute limb ischaemia."
    }
  ]
};

lessonContent["Gastrointestinal disorders"] = {
  "title": "Gastrointestinal Disorders",
  "objectives": [
    "Describe the pathophysiology and manifestations of common gastrointestinal disorders.",
    "Explain the investigations used to diagnose gastrointestinal disease.",
    "Discuss medical, surgical and nursing management of gastrointestinal conditions.",
    "Identify gastrointestinal emergencies and prevent complications."
  ],
  "notes": [
    {
      "title": "1. Gastrointestinal assessment",
      "content": "The gastrointestinal system includes the mouth, oesophagus, stomach, small and large intestines, rectum and anus, with accessory organs including the liver, gallbladder and pancreas. Obtain a history of abdominal pain, appetite, nausea, vomiting, dysphagia, reflux, bowel pattern, stool colour, bleeding, weight change, diet, alcohol use, medication and previous surgery. Assess hydration, nutritional status and abdominal distension. Examine the abdomen systematically: inspect, auscultate, percuss and palpate. Auscultate before percussion and palpation because manipulation may alter bowel sounds. Assess pain using onset, site, character, radiation, severity, timing and associated symptoms."
    },
    {
      "title": "2. Gastrointestinal investigations",
      "content": "Full blood count may identify anaemia or infection. Electrolytes and renal function assess dehydration and losses from vomiting or diarrhoea. Liver function tests include enzymes and bilirubin, interpreted according to the suspected disease. Amylase and lipase may support assessment of pancreatitis; lipase is generally more specific. Stool tests may identify pathogens, occult blood or inflammation. Abdominal ultrasound assesses hepatobiliary structures; CT may identify inflammation, obstruction, perforation or masses. Endoscopy allows direct visualisation and biopsy of the upper gastrointestinal tract; colonoscopy examines the colon and may permit biopsy or polyp removal. Before procedures, explain the test, confirm consent and preparation, check allergies and prescribed fasting requirements, and monitor after sedation according to policy."
    },
    {
      "title": "3. Gastro-oesophageal reflux disease (GERD)",
      "content": "GERD occurs when gastric contents reflux into the oesophagus, causing troublesome symptoms or complications. It is associated with impaired lower oesophageal sphincter function and may be worsened by obesity, large meals, certain foods, smoking and lying down soon after eating. Symptoms include heartburn, acid regurgitation, sour taste, chronic cough or hoarseness. Management may include weight reduction when appropriate, smaller meals, avoiding individual triggers, not lying down soon after meals, elevating the head of the bed for nocturnal symptoms and prescribed acid-suppressing medicines such as proton pump inhibitors. Dysphagia, gastrointestinal bleeding, persistent vomiting, unexplained weight loss or anaemia require further assessment."
    },
    {
      "title": "4. Peptic ulcer disease and gastritis",
      "content": "Peptic ulcer disease involves a break in the gastric or duodenal mucosa caused by an imbalance between mucosal defence and damaging factors. Major causes include Helicobacter pylori infection and NSAID use. Symptoms may include epigastric pain, nausea, bloating and gastrointestinal bleeding; symptom patterns alone do not reliably distinguish gastric from duodenal ulcers. Diagnosis may involve H. pylori testing and upper endoscopy. Treatment includes eradication therapy when H. pylori is present, acid suppression and avoidance of ulcerogenic medicines where possible. Gastritis is inflammation of the gastric mucosa and may be acute or chronic. Complications of ulcers include haemorrhage, perforation and gastric outlet obstruction. Sudden severe abdominal pain with guarding or rigidity may indicate perforation and requires emergency care."
    },
    {
      "title": "5. Gastroenteritis and diarrhoeal illness",
      "content": "Gastroenteritis is inflammation of the stomach and intestines, commonly due to viral or bacterial infection or contaminated food and water. Symptoms include diarrhoea, vomiting, abdominal cramps and sometimes fever. The main immediate danger is dehydration and electrolyte imbalance. Assess fluid intake, urine output, mucous membranes, pulse, blood pressure, mental status and signs of poor perfusion. Oral rehydration solution is important for mild to moderate dehydration when the patient can drink; severe dehydration or inability to tolerate oral fluids may require intravenous fluids under clinical supervision. Continue appropriate feeding as tolerated, maintain hand hygiene and food safety, and use infection-control precautions. Bloody diarrhoea, severe dehydration, persistent high fever or altered consciousness require urgent review."
    },
    {
      "title": "6. Inflammatory bowel disease",
      "content": "Inflammatory bowel disease includes ulcerative colitis and Crohn's disease. Ulcerative colitis causes continuous mucosal inflammation beginning in the rectum and extending proximally through the colon. Crohn's disease may affect any part of the gastrointestinal tract and often causes patchy, transmural inflammation. Symptoms include diarrhoea, abdominal pain, weight loss, fatigue and, particularly in ulcerative colitis, rectal bleeding. Crohn's disease may cause strictures, fistulas and malabsorption. Diagnosis may involve blood and stool tests, endoscopy with biopsy and imaging. Management may include anti-inflammatory medicines, corticosteroids for selected flares, immunomodulators, biologic therapies, nutritional support and surgery for complications. Monitor hydration, nutrition, stool frequency, bleeding, pain and adverse effects of immunosuppressive treatment."
    },
    {
      "title": "7. Intestinal obstruction and appendicitis",
      "content": "Intestinal obstruction is partial or complete blockage of intestinal contents. Causes include adhesions, hernias, tumours and volvulus. Manifestations include colicky abdominal pain, vomiting, distension and inability to pass stool or flatus; bowel sounds vary with stage and cause. Complications include dehydration, electrolyte disturbance, ischaemia and perforation. Management may involve bowel rest, intravenous fluids, electrolyte correction, nasogastric decompression and surgery depending on cause and severity. Appendicitis is inflammation of the appendix, often following luminal obstruction. It commonly presents with abdominal pain that may migrate to the right lower quadrant, anorexia, nausea and fever, although presentations vary. Perforation can cause peritonitis and sepsis. Suspected appendicitis requires prompt clinical assessment; do not give laxatives or apply heat to the abdomen."
    },
    {
      "title": "8. Hepatitis and liver cirrhosis",
      "content": "Hepatitis is inflammation of the liver and may be caused by viruses, alcohol, medicines, toxins or autoimmune disease. Viral hepatitis types differ in transmission, chronicity and prevention. Manifestations may include fatigue, anorexia, nausea, right upper quadrant discomfort, dark urine, pale stools and jaundice. Liver tests, viral serology and imaging help establish cause and severity. Cirrhosis is chronic diffuse liver scarring with regenerative nodules and impaired liver function. Complications include portal hypertension, ascites, variceal bleeding, hepatic encephalopathy, coagulopathy, infection and hepatocellular carcinoma. Nursing care includes monitoring mental status, abdominal girth, weight, fluid balance, bleeding, nutrition and medication effects. Avoid alcohol and hepatotoxic medicines unless specifically directed; teach follow-up and adherence to the treatment plan."
    },
    {
      "title": "9. Pancreatitis and gallbladder disease",
      "content": "Acute pancreatitis is inflammation of the pancreas, commonly associated with gallstones or alcohol, although other causes exist. It often presents with severe epigastric pain radiating to the back, nausea and vomiting. Serum lipase is commonly used in diagnosis alongside characteristic symptoms and imaging when needed. Management involves prompt assessment, appropriate fluid resuscitation, analgesia, nutrition planning and treatment of the underlying cause. Monitor for shock, respiratory complications, renal injury and infection. Cholelithiasis refers to gallstones; cholecystitis is inflammation of the gallbladder, often due to cystic duct obstruction by a stone. Right upper quadrant pain, fever, nausea and tenderness may occur. Ultrasound is commonly used. Management may include analgesia, antibiotics when indicated and cholecystectomy. Fever with jaundice and right upper quadrant pain may indicate biliary infection and requires urgent assessment."
    },
    {
      "title": "10. Gastrointestinal nursing care and emergencies",
      "content": "Prioritise ABCs, pain assessment, hydration, nutrition and early recognition of bleeding, perforation, obstruction and sepsis. Monitor vital signs, intake and output, stool and vomit characteristics, abdominal findings, weight and relevant laboratory results. Administer prescribed fluids, medicines and nutritional support. Maintain accurate fluid balance and provide skin care when diarrhoea is frequent. Prepare patients safely for endoscopy or surgery and monitor recovery. Urgent warning signs include haematemesis, melaena, large-volume rectal bleeding, rigid abdomen, sudden severe abdominal pain, persistent vomiting, shock, severe dehydration and altered consciousness. Escalate promptly."
    }
  ],
  "clinicalCases": [
    {
      "title": "Case 1: Suspected upper gastrointestinal bleeding",
      "content": "A patient presents with vomiting of blood, dizziness and tachycardia. This may represent significant upper gastrointestinal haemorrhage. Prioritise ABC assessment, urgent escalation, monitoring, intravenous access and blood investigations as directed. Keep the patient under close observation and prepare for definitive evaluation and treatment."
    },
    {
      "title": "Case 2: Possible acute appendicitis",
      "content": "A patient reports abdominal pain that began near the umbilicus and later localised to the right lower quadrant, with nausea and fever. Suspect appendicitis and arrange urgent medical assessment. Keep the patient nil by mouth if surgery is being considered, monitor observations and avoid laxatives or abdominal heat."
    }
  ],
  "examPoints": [
    "Abdominal examination sequence: inspection, auscultation, percussion, palpation.",
    "H. pylori infection and NSAID use are major causes of peptic ulcer disease.",
    "Haematemesis means vomiting blood; melaena is black, tarry stool from digested blood.",
    "Severe diarrhoea and vomiting can cause dehydration and electrolyte imbalance.",
    "Oral rehydration solution is important in suitable patients with diarrhoeal dehydration.",
    "Ulcerative colitis affects the colon continuously from the rectum; Crohn's disease can affect any GI segment and is often patchy.",
    "Intestinal obstruction may cause colicky pain, vomiting, distension and failure to pass flatus or stool.",
    "Appendicitis can progress to perforation, peritonitis and sepsis.",
    "Cirrhosis can cause portal hypertension, ascites, varices and hepatic encephalopathy.",
    "Acute pancreatitis commonly causes severe epigastric pain radiating to the back.",
    "Ultrasound is commonly used to assess gallstones and gallbladder inflammation.",
    "Sudden severe abdominal pain, a rigid abdomen or signs of shock require urgent escalation."
  ],
  "questions": [
    {
      "question": "What is the correct sequence for routine abdominal examination?",
      "options": [
        "Palpation, percussion, inspection, auscultation",
        "Inspection, auscultation, percussion, palpation",
        "Auscultation, palpation, inspection, percussion",
        "Percussion, inspection, palpation, auscultation"
      ],
      "answer": "B",
      "explanation": "Auscultation is performed before percussion and palpation because physical manipulation can alter bowel sounds."
    },
    {
      "question": "Which two factors are major causes of peptic ulcer disease?",
      "options": [
        "H. pylori infection and NSAID use",
        "Exercise and adequate hydration",
        "Vitamin C and fibre",
        "Cold weather and sunlight"
      ],
      "answer": "A",
      "explanation": "H. pylori damages mucosal defence and NSAIDs reduce protective prostaglandin activity."
    },
    {
      "question": "A patient with diarrhoea has dry mucous membranes and reduced urine output. What is the priority concern?",
      "options": [
        "Dehydration",
        "Improved renal perfusion",
        "Excessive hydration",
        "Increased bone density"
      ],
      "answer": "A",
      "explanation": "Dry mucosa and oliguria suggest fluid depletion; assess circulation and hydration and initiate appropriate rehydration."
    },
    {
      "question": "Which feature is most consistent with melaena?",
      "options": [
        "Black, tarry stool",
        "Bright yellow urine",
        "Clear sputum",
        "White skin patches"
      ],
      "answer": "A",
      "explanation": "Melaena is typically black, tarry stool caused by digested blood, commonly from upper GI bleeding."
    },
    {
      "question": "Which statement correctly describes Crohn's disease?",
      "options": [
        "It affects only the rectum",
        "It can affect any part of the GI tract and may be transmural",
        "It is always caused by H. pylori",
        "It is a disease of the gallbladder"
      ],
      "answer": "B",
      "explanation": "Crohn's disease can involve any gastrointestinal segment and characteristically causes patchy, transmural inflammation."
    },
    {
      "question": "A patient has sudden severe abdominal pain and a rigid abdomen after a history of peptic ulcer disease. What complication should be suspected?",
      "options": [
        "Perforation with peritonitis",
        "Uncomplicated reflux",
        "Mild constipation",
        "Seasonal allergy"
      ],
      "answer": "A",
      "explanation": "Sudden severe pain and rigidity may indicate perforation and peritonitis, a surgical emergency."
    },
    {
      "question": "Which laboratory test is commonly used to support diagnosis of acute pancreatitis?",
      "options": [
        "Serum lipase",
        "Haemoglobin A1c only",
        "Troponin only",
        "Thyroid-stimulating hormone"
      ],
      "answer": "A",
      "explanation": "Serum lipase is commonly used alongside clinical features and imaging when indicated."
    },
    {
      "question": "Which is a major complication of liver cirrhosis?",
      "options": [
        "Portal hypertension and ascites",
        "Improved clotting function",
        "Permanent immunity to infection",
        "Increased normal liver architecture"
      ],
      "answer": "A",
      "explanation": "Fibrosis and altered hepatic blood flow can cause portal hypertension, ascites, varices and other complications."
    }
  ]
};

lessonContent["Renal and urinary disorders"] = {
  "title": "Renal and Urinary Disorders",
  "objectives": [
    "Explain the structure and functions of the kidneys and urinary tract.",
    "Describe the causes, pathophysiology and manifestations of common renal disorders.",
    "Interpret renal investigations and explain their clinical significance.",
    "Discuss medical, pharmacological and nursing management of renal patients."
  ],
  "notes": [
    {
      "title": "1. Renal system overview and assessment",
      "content": "The urinary system consists of two kidneys, two ureters, the urinary bladder and urethra. The kidneys maintain fluid, electrolyte and acid-base balance; remove metabolic waste; regulate blood pressure through renin release; produce erythropoietin; and activate vitamin D. The nephron is the functional unit, comprising the glomerulus, Bowman's capsule, proximal tubule, loop of Henle, distal tubule and collecting duct. Assess urinary frequency, urgency, dysuria, haematuria, nocturia, urine volume, flank pain, oedema, fluid intake and medication use. Examine blood pressure, hydration, weight, bladder distension and peripheral oedema."
    },
    {
      "title": "2. Renal investigations and interpretation",
      "content": "Urinalysis assesses colour, concentration, pH, protein, glucose, ketones, blood, nitrites and leukocyte esterase. Urine microscopy may identify red cells, white cells, casts, crystals and organisms. Urine culture and sensitivity identify pathogens and guide antimicrobial selection. Serum creatinine and estimated glomerular filtration rate (eGFR) assess kidney filtration; trends are more useful than an isolated result. Urea may rise with impaired renal function but is also influenced by hydration, protein intake and catabolism. Electrolytes are essential because renal disease may cause hyperkalaemia, sodium disturbances and acid-base abnormalities. Renal ultrasound assesses kidney size, obstruction and structural abnormalities. A renal biopsy may be required for selected glomerular diseases. Monitor urine output accurately; a sudden reduction may indicate deterioration."
    },
    {
      "title": "3. Acute kidney injury (AKI)",
      "content": "AKI is an abrupt decline in kidney function, demonstrated by a rise in serum creatinine and/or reduced urine output. It is classified as prerenal, intrinsic renal or postrenal. Prerenal AKI results from reduced renal perfusion, for example dehydration, haemorrhage or shock. Intrinsic AKI results from damage to renal tissue, such as acute tubular necrosis, glomerulonephritis or nephrotoxic injury. Postrenal AKI results from obstruction, such as an enlarged prostate or urinary stones. Manifestations include oliguria, fluid overload, oedema, nausea, confusion and electrolyte disturbances, although urine output may remain normal in some cases. Management involves correcting the cause, restoring perfusion where appropriate, relieving obstruction, avoiding nephrotoxins and managing fluid and electrolyte disturbances. Dialysis may be needed for severe complications."
    },
    {
      "title": "4. Chronic kidney disease (CKD)",
      "content": "CKD is an abnormality of kidney structure or function present for at least three months, with implications for health. Common causes include diabetes mellitus, hypertension, chronic glomerular disease and inherited disorders. Progressive nephron loss reduces filtration and causes retention of waste products, fluid and electrolytes. Complications include anaemia due to reduced erythropoietin, metabolic acidosis, mineral and bone disorders, hypertension, fluid overload and cardiovascular disease. Patients may remain asymptomatic in early stages; later manifestations include fatigue, anorexia, nausea, pruritus, oedema and reduced urine concentrating ability. Management focuses on treating the underlying cause, controlling blood pressure and diabetes, reducing cardiovascular risk, adjusting medicines to renal function, dietary counselling and monitoring complications. Advanced kidney failure may require dialysis or transplantation."
    },
    {
      "title": "5. Glomerulonephritis and nephrotic syndrome",
      "content": "Glomerulonephritis is inflammation or injury of the glomeruli, often immune-mediated. It may follow infection or occur with systemic autoimmune disease. Features include haematuria, proteinuria, hypertension, oedema and reduced renal function. Nephrotic syndrome is characterised by heavy proteinuria, hypoalbuminaemia, oedema and hyperlipidaemia. Loss of albumin reduces plasma oncotic pressure, contributing to generalised oedema; urinary loss of anticoagulant proteins may increase thrombotic risk. Investigations include urinalysis, renal function tests, complement and immune studies, and sometimes renal biopsy. Treatment depends on cause and may include blood pressure control, immunosuppressive treatment for selected conditions, diuretics and management of complications. Monitor weight, oedema, urine protein, blood pressure, renal function and infection risk."
    },
    {
      "title": "6. Urinary tract infections and pyelonephritis",
      "content": "Urinary tract infection (UTI) commonly results from ascending bacterial infection, often involving Escherichia coli. Cystitis affects the bladder and may cause dysuria, frequency, urgency and suprapubic discomfort. Pyelonephritis involves the kidney and may cause fever, chills, flank pain, nausea, vomiting and systemic illness. Older adults may present atypically, but confusion alone should not automatically be attributed to UTI without assessment. Diagnosis uses clinical findings, urinalysis and urine culture when indicated. Treatment involves appropriate antibiotics based on severity, culture results and local antimicrobial guidance. Encourage suitable hydration unless contraindicated, teach perineal hygiene and advise completion of prescribed treatment. Sepsis, pregnancy, obstruction and significant comorbidity require careful assessment."
    },
    {
      "title": "7. Urinary stones and obstruction",
      "content": "Urolithiasis refers to formation of stones in the urinary tract. Stones may contain calcium oxalate, calcium phosphate, uric acid or other substances. Risk factors include dehydration, metabolic abnormalities, dietary factors and family history. Renal colic commonly causes severe intermittent flank pain radiating to the groin, nausea, vomiting and sometimes haematuria. Diagnosis may involve ultrasound or non-contrast CT, depending on clinical circumstances. Management includes analgesia, appropriate hydration, selected medical expulsive therapy and procedures such as ureteroscopy or lithotripsy when indicated. Urinary obstruction may also result from prostatic enlargement, tumours or strictures. Obstruction with infection, anuria or deteriorating renal function is urgent because it can damage the kidneys."
    },
    {
      "title": "8. Renal replacement therapy and nursing management",
      "content": "Haemodialysis removes waste products and excess fluid through an extracorporeal circuit, usually via an arteriovenous fistula or graft or a central venous catheter. Peritoneal dialysis uses the peritoneal membrane for exchange of solutes and fluid through dialysate introduced into the abdomen. Kidney transplantation provides a functioning donor kidney but requires lifelong immunosuppression and follow-up. Nursing responsibilities include monitoring vital signs, fluid balance, weight, electrolytes and access sites. For an AV fistula, assess for a thrill and bruit and avoid blood pressure measurement, venepuncture or tight compression on that arm. In peritoneal dialysis, use aseptic technique and monitor for cloudy effluent, abdominal pain and fever, which may indicate peritonitis. Educate patients on treatment adherence, diet, fluid recommendations and infection prevention."
    }
  ],
  "clinical": "Clinical application: A patient with chronic kidney disease presents with increasing ankle oedema, fatigue, hypertension and reduced urine output. Assess airway and breathing, vital signs, weight, fluid balance, lung sounds and mental status. Review creatinine, eGFR, potassium, bicarbonate and haemoglobin trends. Escalate signs of pulmonary oedema, severe hyperkalaemia, confusion or rapidly declining urine output. Administer prescribed treatment, monitor response and educate the patient about medication adherence, diet, fluid recommendations and follow-up. A patient with fever, flank pain and vomiting may have pyelonephritis and requires prompt assessment for systemic infection.",
  "examPoints": [
    "Nephron is the functional unit of the kidney.",
    "Kidneys regulate fluid, electrolytes, acid-base balance and blood pressure.",
    "Kidneys produce erythropoietin and activate vitamin D.",
    "AKI is classified as prerenal, intrinsic renal and postrenal.",
    "CKD requires kidney abnormalities persisting for at least three months.",
    "Creatinine and eGFR help assess renal filtration.",
    "Hyperkalaemia is a potentially life-threatening complication of renal failure.",
    "Nephrotic syndrome features heavy proteinuria, hypoalbuminaemia, oedema and hyperlipidaemia.",
    "Cystitis commonly causes dysuria, urgency and frequency.",
    "Pyelonephritis may cause fever, chills and flank pain.",
    "Obstruction with infection is a urological emergency.",
    "Cloudy peritoneal dialysis effluent may indicate peritonitis.",
    "Assess an AV fistula for a thrill and bruit."
  ],
  "questions": [
    {
      "question": "What is the functional unit of the kidney?",
      "options": [
        "Alveolus",
        "Nephron",
        "Neuron",
        "Hepatocyte"
      ],
      "answer": "B",
      "explanation": "The nephron performs filtration, reabsorption and secretion to form urine and regulate body homeostasis."
    },
    {
      "question": "Which type of acute kidney injury results from reduced renal blood flow?",
      "options": [
        "Prerenal",
        "Intrinsic renal",
        "Postrenal",
        "Congenital"
      ],
      "answer": "A",
      "explanation": "Prerenal AKI occurs when renal perfusion falls, such as in dehydration, haemorrhage or shock."
    },
    {
      "question": "Which finding is characteristic of nephrotic syndrome?",
      "options": [
        "Heavy proteinuria and hypoalbuminaemia",
        "Isolated glycosuria",
        "Severe thrombocytosis only",
        "Low urine protein"
      ],
      "answer": "A",
      "explanation": "Nephrotic syndrome causes substantial urinary protein loss, low serum albumin, oedema and often hyperlipidaemia."
    },
    {
      "question": "A patient with renal failure has severe hyperkalaemia. What is the major immediate concern?",
      "options": [
        "Cardiac dysrhythmias",
        "Hair loss",
        "Cataracts",
        "Constipation alone"
      ],
      "answer": "A",
      "explanation": "Elevated potassium alters myocardial electrical conduction and can cause life-threatening arrhythmias."
    },
    {
      "question": "Which symptom is most suggestive of acute pyelonephritis?",
      "options": [
        "Fever with flank pain",
        "Painless itching of the scalp",
        "Isolated ankle sprain",
        "Chronic visual blurring"
      ],
      "answer": "A",
      "explanation": "Kidney infection commonly causes fever, chills, flank pain and systemic symptoms."
    },
    {
      "question": "Which assessment is important for a patient with an arteriovenous fistula?",
      "options": [
        "Assess for thrill and bruit",
        "Apply a tight bandage continuously",
        "Use the fistula arm for routine blood pressure measurement",
        "Avoid checking the access site"
      ],
      "answer": "A",
      "explanation": "A palpable thrill and audible bruit indicate blood flow through the fistula. The access arm must be protected."
    },
    {
      "question": "Chronic kidney disease is generally defined by kidney abnormalities persisting for at least:",
      "options": [
        "One day",
        "One week",
        "Three months",
        "One year only"
      ],
      "answer": "C",
      "explanation": "CKD requires abnormalities of kidney structure or function for at least three months."
    },
    {
      "question": "Cloudy peritoneal dialysis effluent accompanied by abdominal pain suggests:",
      "options": [
        "Peritonitis",
        "Normal dialysis clearance",
        "Improved kidney function",
        "Hypoglycaemia"
      ],
      "answer": "A",
      "explanation": "Cloudy effluent and abdominal pain are warning signs of peritoneal dialysis-associated peritonitis and require urgent review."
    }
  ]
};

lessonContent["Neurological disorders"] = {
  "title": "Neurological Disorders",
  "objectives": [
    "Describe the major structures and functions of the nervous system.",
    "Explain the pathophysiology and manifestations of common neurological disorders.",
    "Perform and interpret basic neurological assessment findings.",
    "Discuss emergency, medical and nursing management of neurological patients."
  ],
  "notes": [
    {
      "title": "1. Neurological system assessment",
      "content": "The nervous system consists of the central nervous system (brain and spinal cord) and peripheral nervous system. The brain controls consciousness, movement, sensation, cognition and autonomic functions. Neurological assessment includes level of consciousness, orientation, pupils, speech, motor strength, sensation, coordination, gait and reflexes. The Glasgow Coma Scale assesses eye opening, verbal response and motor response, producing a score from 3 to 15. Record individual components as well as the total score. Assess limb power on both sides and compare findings. A sudden change in consciousness, new weakness, unequal pupils or seizure requires urgent escalation."
    },
    {
      "title": "2. Neurological investigations",
      "content": "CT brain is commonly used urgently to identify intracranial haemorrhage, major structural lesions and some causes of acute neurological deterioration. MRI provides detailed imaging of brain and spinal cord tissues. Lumbar puncture obtains cerebrospinal fluid for analysis but must only be performed after assessing contraindications; suspected raised intracranial pressure from a mass lesion may make it unsafe. EEG records electrical activity and assists in seizure assessment. Cerebral angiography and vascular imaging assess blood vessels. Blood glucose, electrolytes, full blood count, coagulation profile and infection tests may identify reversible causes of neurological symptoms. Always assess airway, breathing, circulation and glucose in an acutely altered patient."
    },
    {
      "title": "3. Stroke and transient ischaemic attack",
      "content": "Stroke is an acute neurological deficit caused by interruption of cerebral blood flow (ischaemic stroke) or bleeding into or around the brain (haemorrhagic stroke). Ischaemic stroke commonly results from thrombosis or embolism. Risk factors include hypertension, diabetes, smoking, dyslipidaemia and atrial fibrillation. Features may include sudden facial droop, arm weakness, speech difficulty, visual disturbance, imbalance or severe headache. Use a recognised stroke screen such as FAST and establish the exact time the patient was last known well. Urgent brain imaging distinguishes ischaemic from haemorrhagic stroke. Selected ischaemic strokes may be eligible for thrombolysis or mechanical thrombectomy within appropriate time and clinical criteria. Do not give food, fluids or oral medicines until swallowing safety has been assessed. A transient ischaemic attack causes temporary neurological dysfunction without acute infarction and is an urgent warning of future stroke."
    },
    {
      "title": "4. Epilepsy and seizure management",
      "content": "A seizure is a transient episode of abnormal excessive neuronal activity. Epilepsy is a condition characterised by an enduring predisposition to recurrent unprovoked seizures. Seizures may be focal or generalised and can involve altered awareness, abnormal movements, sensory symptoms or behavioural changes. During a seizure, protect the patient from injury, clear nearby hazards, cushion the head, loosen restrictive clothing and note the duration and features. Do not restrain the patient and do not put anything into the mouth. After convulsions, assess airway and breathing, place the patient in the recovery position when appropriate and monitor consciousness. Status epilepticus is a prolonged seizure, commonly defined as lasting five minutes or more, or recurrent seizures without recovery; it is a medical emergency requiring immediate treatment and escalation. Antiseizure medicines must be taken consistently; monitor adverse effects and interactions."
    },
    {
      "title": "5. Meningitis and encephalitis",
      "content": "Meningitis is inflammation of the meninges surrounding the brain and spinal cord. Causes include bacterial, viral, fungal and other infections. Bacterial meningitis can progress rapidly and is a medical emergency. Manifestations may include fever, severe headache, neck stiffness, photophobia, vomiting and altered mental status; infants and older adults may present atypically. A non-blanching rash may occur in meningococcal disease. Encephalitis is inflammation of brain tissue and may cause altered behaviour, confusion, seizures and focal neurological deficits. Investigations may include blood cultures, lumbar puncture when safe, CSF analysis, imaging and pathogen testing. Start prescribed empirical treatment promptly when bacterial meningitis is suspected according to emergency protocols; do not delay treatment for investigations. Apply appropriate transmission-based precautions according to the suspected organism and local policy."
    },
    {
      "title": "6. Increased intracranial pressure and head injury",
      "content": "Intracranial pressure is influenced by brain tissue, blood and cerebrospinal fluid within the skull. Increased intracranial pressure may result from traumatic brain injury, haemorrhage, tumour, oedema or hydrocephalus. Early features may include worsening headache, vomiting, reduced consciousness and behavioural change. Late signs may include abnormal pupils, posturing and Cushing's triad: hypertension with widening pulse pressure, bradycardia and irregular respirations. These are serious warning signs. Nursing management includes frequent neurological observations, maintaining airway and oxygenation, avoiding unnecessary increases in intracranial pressure and urgent escalation. In selected patients, the head of bed may be elevated with the neck kept neutral according to clinical orders. Prevent hypoxia and hypotension in head injury and monitor for deterioration."
    },
    {
      "title": "7. Parkinson's disease",
      "content": "Parkinson's disease is a progressive neurodegenerative disorder associated with loss of dopamine-producing neurons in the substantia nigra. Reduced dopamine disrupts basal ganglia motor control. Cardinal manifestations include resting tremor, rigidity, bradykinesia and postural instability. Patients may also experience constipation, sleep disturbance, depression, autonomic dysfunction and swallowing difficulties. Treatment includes levodopa combined with a peripheral dopa-decarboxylase inhibitor and other medicines depending on symptoms. Medication timing is important because delayed doses can worsen mobility. Nursing care includes falls prevention, mobility support, swallowing and aspiration assessment, nutrition, bowel management and support with activities of daily living. Encourage exercise and rehabilitation where appropriate."
    },
    {
      "title": "8. Alzheimer's disease and other dementias",
      "content": "Alzheimer's disease is a progressive neurodegenerative disorder and a common cause of dementia. It affects memory, thinking, language and the ability to perform daily activities. Dementia is a syndrome with decline in cognitive function that interferes with independent functioning; it is not a normal part of ageing. Assess for reversible contributors to confusion, including infection, medication effects, dehydration, metabolic abnormalities and delirium. Provide a calm, safe and structured environment, simple communication, orientation cues and support for nutrition and personal care. Involve caregivers in education and care planning. Distinguish chronic cognitive decline from acute delirium, which develops over a short period and requires prompt assessment."
    },
    {
      "title": "9. Spinal cord injury and neurological nursing care",
      "content": "Spinal cord injury may cause motor, sensory and autonomic impairment below the level of injury. Cervical injuries may compromise respiratory function. Neurogenic shock may occur after high spinal injury and is associated with hypotension and bradycardia due to loss of sympathetic tone. Spinal shock refers to temporary loss of reflexes and motor and sensory function below the injury. Maintain spinal precautions when injury is suspected, support airway and breathing, monitor circulation and prevent secondary injury. Ongoing care includes pressure injury prevention, bladder and bowel management, respiratory care, mobility support, rehabilitation and psychosocial support. Autonomic dysreflexia may occur in some people with injuries at or above T6 and is characterised by sudden severe hypertension, headache, sweating or flushing above the lesion; it requires urgent action to identify and remove triggers and obtain medical review."
    }
  ],
  "clinical": "Clinical application: A patient arrives with sudden right-sided weakness and slurred speech. Treat this as a possible acute stroke. Establish the last-known-well time, assess ABCs and blood glucose, activate the stroke pathway and arrange urgent brain imaging. Keep the patient nil by mouth until a swallowing assessment confirms safety. Another patient develops a generalised convulsion: protect from injury, time the seizure, do not restrain or insert objects into the mouth, and assess airway and breathing after the seizure. Escalate prolonged or recurrent seizures immediately.",
  "examPoints": [
    "The central nervous system consists of the brain and spinal cord.",
    "The Glasgow Coma Scale assesses eye, verbal and motor responses.",
    "FAST is used to recognise common stroke warning signs.",
    "Brain imaging is required to distinguish ischaemic from haemorrhagic stroke.",
    "Record the exact last-known-well time in suspected acute stroke.",
    "Do not give oral intake after stroke until swallowing safety is assessed.",
    "During a seizure, protect the patient and never put anything in the mouth.",
    "Status epilepticus is a medical emergency.",
    "Bacterial meningitis requires urgent treatment and appropriate precautions.",
    "Cushing's triad is hypertension with widening pulse pressure, bradycardia and irregular respirations.",
    "Parkinson's disease commonly presents with tremor, rigidity and bradykinesia.",
    "Acute confusion may indicate delirium rather than dementia.",
    "High spinal cord injury can compromise respiratory function.",
    "Autonomic dysreflexia is a serious risk in some spinal injuries at or above T6."
  ],
  "questions": [
    {
      "question": "Which three components are assessed in the Glasgow Coma Scale?",
      "options": [
        "Pulse, temperature and blood pressure",
        "Eye, verbal and motor responses",
        "Memory, appetite and sleep",
        "Pupils, urine output and reflexes only"
      ],
      "answer": "B",
      "explanation": "The GCS assesses eye opening, verbal response and motor response, with a total score ranging from 3 to 15."
    },
    {
      "question": "A patient suddenly develops facial droop and unilateral arm weakness. What is the priority?",
      "options": [
        "Activate urgent stroke assessment and establish last-known-well time",
        "Give food and water immediately",
        "Allow the patient to sleep without assessment",
        "Wait until the next routine ward round"
      ],
      "answer": "A",
      "explanation": "Sudden focal neurological deficits suggest stroke. Rapid assessment and time documentation are essential for treatment eligibility."
    },
    {
      "question": "Which action is appropriate during a generalised tonic-clonic seizure?",
      "options": [
        "Restrain the limbs",
        "Put a spoon in the mouth",
        "Protect the head and remove nearby hazards",
        "Force oral medication"
      ],
      "answer": "C",
      "explanation": "Protecting the patient from injury is essential. Never restrain or place objects in the mouth."
    },
    {
      "question": "Which condition is suggested by fever, headache, neck stiffness and photophobia?",
      "options": [
        "Meningitis",
        "Osteoarthritis",
        "Renal colic",
        "Peptic ulcer disease"
      ],
      "answer": "A",
      "explanation": "These are classic features of meningeal inflammation, although presentation can vary."
    },
    {
      "question": "Which combination describes Cushing's triad?",
      "options": [
        "Hypotension, tachycardia and fever",
        "Hypertension with widening pulse pressure, bradycardia and irregular respirations",
        "Hypoglycaemia, sweating and tremor",
        "Tachycardia, diarrhoea and vomiting"
      ],
      "answer": "B",
      "explanation": "Cushing's triad is a late warning sign of significantly increased intracranial pressure."
    },
    {
      "question": "Which neurotransmitter deficiency is strongly associated with Parkinson's disease?",
      "options": [
        "Dopamine",
        "Insulin",
        "Histamine",
        "Thyroxine"
      ],
      "answer": "A",
      "explanation": "Degeneration of dopaminergic neurons in the substantia nigra reduces dopamine and disrupts motor control."
    },
    {
      "question": "An older patient develops sudden confusion over one day. What should the nurse consider?",
      "options": [
        "Delirium and potentially reversible causes",
        "Normal ageing in every case",
        "Alzheimer's disease as the only possible cause",
        "No assessment is needed"
      ],
      "answer": "A",
      "explanation": "Acute confusion may be delirium due to infection, medication effects, dehydration or metabolic disturbance and needs prompt assessment."
    },
    {
      "question": "What is an important initial nursing precaution in suspected spinal cord injury?",
      "options": [
        "Maintain spinal precautions and assess ABCs",
        "Encourage unrestricted neck movement",
        "Sit the patient upright without assessment",
        "Massage the injured spinal area"
      ],
      "answer": "A",
      "explanation": "Spinal precautions reduce the risk of secondary injury while airway, breathing and circulation are assessed."
    }
  ]
};

lessonContent["Endocrine disorders"] = {
  "title": "Endocrine Disorders",
  "objectives": [
    "Explain the organisation and functions of the endocrine system.",
    "Describe the pathophysiology and manifestations of common endocrine disorders.",
    "Interpret important endocrine investigations.",
    "Discuss pharmacological and nursing management of endocrine emergencies and chronic disorders."
  ],
  "notes": [
    {
      "title": "1. Endocrine system overview and assessment",
      "content": "The endocrine system consists of hormone-producing glands and tissues. Major structures include the hypothalamus, pituitary, thyroid, parathyroids, adrenal glands, pancreas, ovaries and testes. Hormones regulate metabolism, growth, reproduction, stress responses, fluid balance and glucose homeostasis. Most hormone secretion is controlled by feedback mechanisms, especially negative feedback. Assess weight changes, appetite, thirst, urination, heat or cold intolerance, fatigue, skin changes, bowel pattern, menstrual changes and medication history. Examine vital signs, hydration, body habitus, skin, neck, eyes, peripheral sensation and mental status."
    },
    {
      "title": "2. Endocrine investigations",
      "content": "Blood glucose and HbA1c assess glucose control. Thyroid function tests commonly include TSH and free T4; interpretation depends on whether the problem is primary or central. Serum cortisol, ACTH and dynamic stimulation or suppression tests may assess adrenal function. Electrolytes, especially sodium and potassium, are important in adrenal and pituitary disorders. Calcium, phosphate and parathyroid hormone help assess parathyroid function. Urine or serum osmolality and urine volume may be used in water-balance disorders. Interpret hormone results with symptoms, timing, medication use and laboratory reference ranges; some endocrine tests require specific timing or preparation."
    },
    {
      "title": "3. Diabetes mellitus: classification and pathophysiology",
      "content": "Diabetes mellitus is a group of metabolic disorders characterised by chronic hyperglycaemia due to inadequate insulin secretion, impaired insulin action or both. Type 1 diabetes results from autoimmune destruction of pancreatic beta cells, causing absolute insulin deficiency. Type 2 diabetes involves insulin resistance and progressive beta-cell dysfunction. Gestational diabetes is glucose intolerance first recognised during pregnancy. Chronic hyperglycaemia damages blood vessels and nerves, increasing the risk of retinopathy, nephropathy, neuropathy, cardiovascular disease and foot complications. Symptoms may include polyuria, polydipsia, polyphagia, fatigue, blurred vision and recurrent infections, although type 2 diabetes may remain asymptomatic for years."
    },
    {
      "title": "4. Diabetes investigations and long-term management",
      "content": "Diagnosis uses accepted laboratory criteria, including fasting plasma glucose, random plasma glucose in a symptomatic patient, oral glucose tolerance testing or HbA1c, with confirmation where required. HbA1c reflects average glycaemia over approximately two to three months but may be unreliable in some conditions affecting red-cell turnover. Management includes individualised nutrition, physical activity, education, glucose monitoring and prescribed medication. Type 1 diabetes requires insulin. Type 2 diabetes may be managed with lifestyle measures and medicines such as metformin, SGLT2 inhibitors, GLP-1 receptor agonists, sulfonylureas or insulin depending on patient factors and current guidance. Monitor renal function, hypoglycaemia risk, cardiovascular risk and complications. Teach foot care, eye screening, medication adherence and sick-day management."
    },
    {
      "title": "5. Acute diabetic emergencies",
      "content": "Hypoglycaemia is abnormally low blood glucose and may cause sweating, tremor, hunger, palpitations, confusion, seizures or unconsciousness. If the patient is conscious and can swallow safely, give fast-acting oral glucose according to protocol and recheck glucose. If unconscious or unable to swallow safely, do not give oral fluids or food; use prescribed emergency glucagon or intravenous glucose according to protocol and seek urgent help. Diabetic ketoacidosis (DKA) results from severe insulin deficiency, leading to ketone production, metabolic acidosis and dehydration. It commonly occurs in type 1 diabetes but can occur in other contexts. Features include nausea, vomiting, abdominal pain, dehydration, deep rapid breathing and altered consciousness. Hyperosmolar hyperglycaemic state (HHS) involves severe hyperglycaemia, hyperosmolality and profound dehydration, usually with little or no significant ketoacidosis. Both require urgent hospital treatment, careful fluid and electrolyte management, insulin when indicated and close monitoring."
    },
    {
      "title": "6. Thyroid disorders",
      "content": "Hyperthyroidism results from excessive thyroid hormone action. Causes include Graves' disease, toxic nodules and thyroiditis. Manifestations include weight loss despite appetite, heat intolerance, sweating, tremor, palpitations, anxiety and frequent stools. Graves' disease may cause eye signs and diffuse goitre. Hypothyroidism results from inadequate thyroid hormone and may cause fatigue, weight gain, cold intolerance, constipation, dry skin, bradycardia and slowed cognition. Diagnosis commonly uses TSH and free T4. Hyperthyroidism may be treated with antithyroid medicines, radioactive iodine or surgery depending on cause. Hypothyroidism is generally treated with levothyroxine, with monitoring and dose adjustment. Thyroid storm is a life-threatening exacerbation of thyrotoxicosis; myxoedema coma is a severe decompensated hypothyroid state. Both require emergency management."
    },
    {
      "title": "7. Adrenal disorders",
      "content": "The adrenal cortex produces glucocorticoids, mineralocorticoids and androgens; the adrenal medulla produces catecholamines. Addison's disease (primary adrenal insufficiency) results from inadequate adrenal cortical hormone production, often involving cortisol and aldosterone deficiency. Features include fatigue, weight loss, hypotension, dehydration, salt craving, hyperpigmentation and electrolyte abnormalities such as hyponatraemia and hyperkalaemia. Treatment usually requires lifelong glucocorticoid replacement and, in primary disease, mineralocorticoid replacement. Cushing's syndrome results from prolonged excess cortisol exposure and may cause central weight gain, rounded face, proximal muscle weakness, thin skin, bruising, hypertension, hyperglycaemia and increased infection risk. Management depends on the cause and may involve reducing exogenous steroid exposure safely, surgery or other specialist treatment. Never abruptly stop long-term corticosteroids without medical direction."
    },
    {
      "title": "8. Pituitary and parathyroid disorders",
      "content": "The pituitary gland regulates several endocrine glands through hormones including TSH, ACTH, growth hormone, prolactin, LH and FSH. Diabetes insipidus results from deficient ADH secretion or renal resistance to ADH, causing large volumes of dilute urine, thirst and risk of dehydration and hypernatraemia. SIADH involves excessive ADH effect, causing water retention, dilutional hyponatraemia and concentrated urine. Monitor fluid balance, sodium, urine output and neurological status. The parathyroid glands regulate calcium and phosphate through parathyroid hormone. Hyperparathyroidism may cause hypercalcaemia, kidney stones, bone pain and gastrointestinal or neuropsychiatric symptoms. Hypoparathyroidism may cause hypocalcaemia, tingling, muscle cramps, tetany and seizures. Monitor calcium, phosphate, ECG when indicated and signs of neuromuscular irritability."
    },
    {
      "title": "9. Endocrine nursing management and education",
      "content": "Endocrine nursing care involves accurate assessment, monitoring, safe medicine administration and patient education. Monitor vital signs, weight, fluid balance, glucose, electrolytes and relevant hormone results. Recognise hypoglycaemia, DKA, HHS, adrenal crisis, thyroid storm and severe sodium or calcium abnormalities as emergencies. Teach medication timing, adverse effects, glucose monitoring, nutrition, activity, sick-day rules and when to seek help. Encourage regular follow-up and screening for complications. Individualise care to the patient's age, pregnancy status, comorbidities, resources and treatment goals."
    }
  ],
  "clinical": "Clinical application: A patient with type 1 diabetes presents with vomiting, abdominal pain, dehydration and deep rapid breathing. Suspect diabetic ketoacidosis. Assess ABCs, check capillary glucose and ketones if available, escalate urgently and prepare for prescribed intravenous fluids, insulin and electrolyte monitoring. Another patient with Addison's disease presents with severe weakness, vomiting and hypotension after an infection. Suspect adrenal crisis: obtain urgent medical assistance, monitor circulation and administer prescribed emergency corticosteroid and fluid treatment without delay.",
  "examPoints": [
    "Endocrine hormones are commonly regulated by negative feedback.",
    "Type 1 diabetes involves autoimmune beta-cell destruction and absolute insulin deficiency.",
    "Type 2 diabetes involves insulin resistance and progressive beta-cell dysfunction.",
    "HbA1c reflects average blood glucose over approximately two to three months.",
    "Insulin is essential in type 1 diabetes.",
    "Hypoglycaemia can cause sweating, tremor, confusion, seizures and unconsciousness.",
    "Never give oral food or fluids to an unconscious patient.",
    "DKA involves ketone production and metabolic acidosis.",
    "HHS is associated with severe hyperglycaemia, hyperosmolality and dehydration.",
    "Hyperthyroidism may cause weight loss, tremor, palpitations and heat intolerance.",
    "Hypothyroidism may cause fatigue, weight gain, cold intolerance and constipation.",
    "Addison's disease can cause hypotension, hyperpigmentation, hyponatraemia and hyperkalaemia.",
    "Cushing's syndrome is associated with prolonged excess cortisol.",
    "Diabetes insipidus causes large volumes of dilute urine.",
    "SIADH causes water retention and dilutional hyponatraemia.",
    "Hypocalcaemia can cause tetany and neuromuscular irritability."
  ],
  "questions": [
    {
      "question": "Which mechanism is responsible for type 1 diabetes mellitus?",
      "options": [
        "Autoimmune destruction of pancreatic beta cells",
        "Excessive insulin production",
        "Excessive thyroid hormone secretion",
        "Increased ADH secretion"
      ],
      "answer": "A",
      "explanation": "Type 1 diabetes results from immune-mediated destruction of beta cells, producing absolute insulin deficiency."
    },
    {
      "question": "Which test reflects average glycaemic control over approximately two to three months?",
      "options": [
        "HbA1c",
        "Single urine dipstick",
        "Serum sodium",
        "White blood cell count"
      ],
      "answer": "A",
      "explanation": "HbA1c reflects the proportion of haemoglobin exposed to glucose over the red-cell lifespan, approximately two to three months."
    },
    {
      "question": "A conscious diabetic patient is sweating, trembling and has a low blood glucose reading. What should the nurse do first?",
      "options": [
        "Give fast-acting oral glucose if swallowing is safe",
        "Give long-acting insulin immediately",
        "Restrict all food and fluids",
        "Encourage strenuous exercise"
      ],
      "answer": "A",
      "explanation": "A conscious patient who can swallow safely should receive fast-acting glucose according to the hypoglycaemia protocol, followed by reassessment."
    },
    {
      "question": "Which acid-base disturbance is characteristic of diabetic ketoacidosis?",
      "options": [
        "Metabolic acidosis",
        "Metabolic alkalosis",
        "Respiratory alkalosis only",
        "No acid-base disturbance"
      ],
      "answer": "A",
      "explanation": "Ketone accumulation produces a high-anion-gap metabolic acidosis in DKA."
    },
    {
      "question": "Which finding is commonly associated with hyperthyroidism?",
      "options": [
        "Heat intolerance and weight loss",
        "Cold intolerance and weight gain",
        "Markedly slowed pulse in every case",
        "Reduced bowel activity"
      ],
      "answer": "A",
      "explanation": "Excess thyroid hormone increases metabolic activity, often causing heat intolerance, weight loss, tremor and tachycardia."
    },
    {
      "question": "Which clinical finding is suggestive of Addison's disease?",
      "options": [
        "Hypotension and hyperpigmentation",
        "Persistent hypertension and central obesity",
        "Exophthalmos and tremor",
        "Excessive insulin secretion"
      ],
      "answer": "A",
      "explanation": "Primary adrenal insufficiency may cause cortisol and aldosterone deficiency, hypotension, salt loss and increased ACTH-associated pigmentation."
    },
    {
      "question": "What is the main electrolyte abnormality associated with SIADH?",
      "options": [
        "Dilutional hyponatraemia",
        "Severe hypercalcaemia",
        "Hypernatraemia in every case",
        "Isolated hypophosphataemia"
      ],
      "answer": "A",
      "explanation": "Excess ADH causes water retention, diluting serum sodium and producing hyponatraemia."
    },
    {
      "question": "A patient with diabetes insipidus is most likely to experience:",
      "options": [
        "Large volumes of dilute urine",
        "Very low urine output with concentrated urine",
        "Severe fluid retention",
        "Persistent hypoglycaemia"
      ],
      "answer": "A",
      "explanation": "Deficient ADH action prevents adequate water reabsorption, producing polyuria and dilute urine."
    }
  ]
};

lessonContent["Haematological disorders"] = {
  "title": "Haematological Disorders",
  "objectives": [
    "Explain the functions of blood and the pathophysiology of common blood disorders.",
    "Differentiate anaemias, haemolytic disorders, inherited blood disorders and malignancies.",
    "Interpret common haematological investigations.",
    "Discuss medical, pharmacological and nursing management of haematological patients.",
    "Explain safe blood transfusion practice and recognition of transfusion reactions."
  ],
  "notes": [
    {
      "title": "1. Blood composition and functions",
      "content": "Blood consists of plasma and formed elements: red blood cells, white blood cells and platelets. Plasma contains water, electrolytes, proteins, nutrients, hormones and waste products. Red blood cells transport oxygen through haemoglobin and contribute to carbon dioxide transport. White blood cells provide immune defence. Platelets participate in haemostasis and clot formation. Haematopoiesis is blood cell production, primarily in bone marrow in adults. Erythropoietin from the kidneys stimulates red cell production; thrombopoietin promotes platelet production. Assess fatigue, pallor, breathlessness, bleeding, bruising, recurrent infections, bone pain, weight loss and lymph node enlargement."
    },
    {
      "title": "2. Haematological investigations",
      "content": "A full blood count (FBC) measures haemoglobin, haematocrit, red cell indices, white cell count and platelet count. Mean corpuscular volume (MCV) helps classify anaemia as microcytic, normocytic or macrocytic. A peripheral blood film examines cell size, shape and appearance. Reticulocyte count assesses bone marrow response to anaemia. Iron studies include ferritin, serum iron, transferrin and transferrin saturation. Vitamin B12 and folate tests assess nutritional causes of macrocytosis. Haemolysis investigations may include bilirubin, lactate dehydrogenase, haptoglobin and direct antiglobulin testing. Coagulation tests include PT/INR and aPTT. Bone marrow aspiration or biopsy may be required for suspected marrow disease. Interpret results alongside symptoms, trends, medication history and laboratory reference ranges."
    },
    {
      "title": "3. Anaemia: classification and pathophysiology",
      "content": "Anaemia is a reduction in haemoglobin concentration below the appropriate reference range, reducing oxygen-carrying capacity. It may result from blood loss, reduced red cell production or increased red cell destruction. Iron deficiency anaemia is commonly microcytic and hypochromic due to inadequate haemoglobin synthesis. Vitamin B12 or folate deficiency commonly causes macrocytic anaemia due to impaired DNA synthesis. Anaemia of chronic inflammation is often associated with chronic infection, inflammation, malignancy or renal disease. Aplastic anaemia involves bone marrow failure and may cause pancytopenia. Symptoms include fatigue, pallor, dizziness, headache, palpitations, dyspnoea and reduced exercise tolerance. Severe or rapidly developing anaemia can compromise tissue oxygenation."
    },
    {
      "title": "4. Iron deficiency and megaloblastic anaemia",
      "content": "Iron deficiency may result from inadequate dietary intake, poor absorption, increased requirements or chronic blood loss, including gastrointestinal or menstrual bleeding. Investigations commonly show low haemoglobin, low MCV, low ferritin and reduced iron stores, although ferritin may rise with inflammation. Management includes identifying and treating the underlying cause and replacing iron orally or intravenously when indicated. Teach patients that oral iron may cause nausea, constipation and dark stools; absorption may be reduced by tea, coffee and some medicines. Vitamin C can improve non-haem iron absorption. Vitamin B12 deficiency may result from pernicious anaemia, malabsorption or inadequate intake and can cause neurological manifestations such as paraesthesia, impaired balance and cognitive changes. Folate deficiency causes megaloblastic anaemia but does not typically produce the characteristic neurological damage of B12 deficiency. Exclude or treat B12 deficiency before giving folic acid alone when clinically indicated, because folate may correct anaemia while neurological injury progresses."
    },
    {
      "title": "5. Sickle cell disease",
      "content": "Sickle cell disease is an inherited autosomal recessive disorder involving abnormal haemoglobin, commonly HbSS. Under low-oxygen conditions, dehydration, acidosis or stress, haemoglobin S polymerises and distorts red cells into rigid sickle shapes. These cells cause haemolysis and vaso-occlusion, producing chronic anaemia, pain and organ damage. Manifestations include recurrent painful crises, fatigue, jaundice, pallor, delayed growth, infections and complications affecting the lungs, brain, kidneys and bones. Acute chest syndrome is a life-threatening complication characterised by a new pulmonary infiltrate with symptoms such as chest pain, fever, cough or respiratory distress. Stroke, splenic sequestration and severe infection are other emergencies. Management includes individualised pain control, appropriate hydration, treatment of infection, oxygen when hypoxaemia is present, and selected disease-modifying treatment such as hydroxyurea. Transfusion is used for specific indications. Nursing care includes rapid pain assessment and treatment, monitoring oxygenation and vital signs, infection prevention, patient education and early recognition of complications."
    },
    {
      "title": "6. Thalassaemia and other inherited anaemias",
      "content": "Thalassaemia is an inherited disorder of globin-chain synthesis. Alpha-thalassaemia results from reduced alpha-globin production, while beta-thalassaemia results from reduced beta-globin production. Severity ranges from carrier states to transfusion-dependent disease. Severe forms may cause chronic haemolytic anaemia, growth delay, skeletal changes, hepatosplenomegaly and iron overload, especially after repeated transfusions. Management may include regular transfusions, iron chelation, folate in selected cases and specialist consideration of curative therapies such as stem cell transplantation. G6PD deficiency is an inherited enzyme disorder that makes red cells vulnerable to oxidative stress. Certain medicines, infections and foods such as fava beans can trigger haemolysis in susceptible individuals. Manifestations may include jaundice, dark urine, pallor and sudden fatigue. Management involves stopping the trigger, treating infection and providing supportive care or transfusion if severe."
    },
    {
      "title": "7. Haemolytic anaemias",
      "content": "Haemolytic anaemia occurs when red cells are destroyed faster than bone marrow can replace them. Causes may be inherited, such as sickle cell disease, thalassaemia and G6PD deficiency, or acquired, such as autoimmune haemolysis, mechanical destruction and infections. Features include pallor, jaundice, dark urine, splenomegaly and fatigue. Laboratory findings may include raised reticulocytes, indirect bilirubin and lactate dehydrogenase, with reduced haptoglobin. A direct antiglobulin test may support immune-mediated haemolysis. Treatment depends on cause and may include removal of triggers, treatment of infection, immunosuppressive therapy for autoimmune disease, folate support and transfusion when clinically indicated. Monitor for worsening anaemia, renal injury and circulatory compromise."
    },
    {
      "title": "8. Leukaemia and lymphoma",
      "content": "Leukaemia is a malignancy of blood-forming tissues involving abnormal proliferation of white cell precursors or mature cells. It may be acute or chronic and classified by myeloid or lymphoid lineage. Bone marrow replacement can cause anaemia, thrombocytopenia and neutropenia, resulting in fatigue, bleeding and infection. Lymphoma is a malignancy of lymphocytes, commonly presenting with painless lymph node enlargement, fever, night sweats and unexplained weight loss. Diagnosis may involve FBC, blood film, bone marrow examination, lymph node biopsy, immunophenotyping and imaging. Treatment depends on type and stage and may include chemotherapy, targeted therapy, immunotherapy, radiotherapy and stem cell transplantation. Nursing care includes infection prevention, bleeding precautions, nutritional support, symptom management, psychosocial support and monitoring for treatment complications such as tumour lysis syndrome."
    },
    {
      "title": "9. Bleeding and coagulation disorders",
      "content": "Haemostasis involves vascular constriction, platelet plug formation and coagulation. Thrombocytopenia is a reduced platelet count and may cause petechiae, bruising, mucosal bleeding and prolonged bleeding. Haemophilia A results from factor VIII deficiency; haemophilia B results from factor IX deficiency. Both cause impaired coagulation and may produce prolonged bleeding, haemarthrosis and deep tissue haemorrhage. Von Willebrand disease involves deficient or dysfunctional von Willebrand factor and commonly causes mucosal bleeding. Disseminated intravascular coagulation (DIC) is widespread activation of coagulation, resulting in microvascular thrombosis and consumption of platelets and clotting factors, with simultaneous risk of severe bleeding. It may occur in sepsis, obstetric emergencies, trauma and malignancy. Management addresses the underlying cause and may include blood component replacement and specialist haemostatic treatment. Monitor for bleeding, thrombosis, shock and organ dysfunction."
    },
    {
      "title": "10. Blood transfusion and nursing responsibilities",
      "content": "Blood components include red cells, platelets, fresh frozen plasma and cryoprecipitate, each with specific indications. Before transfusion, verify the prescription, informed consent, patient identity, blood group compatibility, component details, expiry and integrity according to facility policy. Obtain baseline observations and assess for previous transfusion reactions. Use the approved blood administration set and commence according to local protocol. Closely observe the patient, especially during the early period, and monitor vital signs according to policy. If a transfusion reaction is suspected, stop the transfusion immediately, maintain intravenous access with compatible fluid using new tubing as directed by protocol, assess ABCs, urgently inform the clinician and blood bank, and follow the facility reaction investigation procedure. Do not restart the implicated unit unless specifically authorised under the applicable protocol. Reactions may include fever, chills, rash, dyspnoea, hypotension, back pain, haemoglobinuria and circulatory overload."
    },
    {
      "title": "11. Nursing management and patient education",
      "content": "Assess fatigue, pallor, dyspnoea, bleeding, bruising, fever, pain and nutritional status. Monitor FBC trends, reticulocyte count, iron studies and coagulation results as relevant. In neutropenic patients, follow protective infection-prevention measures and promptly report fever. For thrombocytopenia, reduce trauma, use a soft toothbrush and avoid unnecessary invasive procedures or intramuscular injections where possible. For anaemia, balance activity with rest and provide nutritional support. Teach patients about medicine adherence, transfusion follow-up, trigger avoidance in G6PD deficiency, hydration and early reporting of fever, chest pain, breathlessness, neurological symptoms or uncontrolled pain."
    }
  ],
  "clinical": "Clinical application: A patient with sickle cell disease presents with severe limb pain, fever and chest discomfort. Assess ABCs, pain, temperature, respiratory status and oxygen saturation; urgently escalate fever and chest symptoms because acute chest syndrome and infection are possible. Administer prescribed analgesia promptly, provide appropriate hydration and investigate according to the sickle cell emergency pathway. In a separate scenario, a patient receiving a blood transfusion develops chills, fever and breathlessness. Stop the transfusion immediately, maintain IV access according to protocol, assess ABCs and notify the clinical team and blood bank urgently.",
  "examPoints": [
    "Red cells transport oxygen through haemoglobin.",
    "Reticulocyte count reflects bone marrow response to anaemia.",
    "Microcytic anaemia is commonly associated with iron deficiency.",
    "Vitamin B12 and folate deficiency commonly cause macrocytic anaemia.",
    "Vitamin B12 deficiency can cause neurological manifestations.",
    "Sickle cell disease is an inherited disorder involving haemoglobin S.",
    "Vaso-occlusion causes painful crises and organ ischaemia in sickle cell disease.",
    "Acute chest syndrome is a life-threatening sickle cell complication.",
    "Thalassaemia results from reduced globin-chain synthesis.",
    "G6PD deficiency can cause oxidative haemolysis after exposure to triggers.",
    "Leukaemia may cause anaemia, infection and bleeding through marrow failure.",
    "Haemophilia A is factor VIII deficiency; haemophilia B is factor IX deficiency.",
    "DIC causes widespread coagulation activation and consumption of clotting factors.",
    "Stop a transfusion immediately if a serious reaction is suspected.",
    "Verify patient identity and blood component compatibility before transfusion."
  ],
  "questions": [
    {
      "question": "Which investigation assesses the bone marrow response to anaemia?",
      "options": [
        "Reticulocyte count",
        "Serum sodium",
        "ECG",
        "Urine culture"
      ],
      "answer": "A",
      "explanation": "Reticulocytes are immature red cells. Their number indicates whether the bone marrow is responding appropriately to anaemia."
    },
    {
      "question": "Which type of anaemia is commonly associated with iron deficiency?",
      "options": [
        "Microcytic hypochromic anaemia",
        "Macrocytic anaemia",
        "Haemolytic anaemia only",
        "Aplastic anaemia in every case"
      ],
      "answer": "A",
      "explanation": "Iron deficiency limits haemoglobin synthesis, commonly producing small, pale red blood cells."
    },
    {
      "question": "What causes vaso-occlusive pain in sickle cell disease?",
      "options": [
        "Sickled red cells obstruct small blood vessels",
        "Excess insulin production",
        "Increased platelet production only",
        "Low thyroid hormone"
      ],
      "answer": "A",
      "explanation": "Rigid sickled red cells obstruct microcirculation, causing tissue ischaemia and severe pain."
    },
    {
      "question": "Which sickle cell complication is particularly associated with chest pain, fever and respiratory distress?",
      "options": [
        "Acute chest syndrome",
        "Simple constipation",
        "Uncomplicated rhinitis",
        "Otitis externa"
      ],
      "answer": "A",
      "explanation": "Acute chest syndrome is a potentially fatal pulmonary complication requiring urgent assessment and treatment."
    },
    {
      "question": "Haemophilia A results from deficiency of which clotting factor?",
      "options": [
        "Factor VIII",
        "Factor IX",
        "Factor II",
        "Factor VII"
      ],
      "answer": "A",
      "explanation": "Haemophilia A is caused by factor VIII deficiency; haemophilia B is caused by factor IX deficiency."
    },
    {
      "question": "Which finding may suggest haemolysis?",
      "options": [
        "Jaundice and dark urine",
        "Improved haemoglobin with no treatment",
        "Persistent normal bilirubin in all cases",
        "Increased visual acuity"
      ],
      "answer": "A",
      "explanation": "Red cell destruction increases bilirubin production and may cause jaundice and dark urine."
    },
    {
      "question": "A patient develops fever and chills during a blood transfusion. What should the nurse do first?",
      "options": [
        "Stop the transfusion immediately",
        "Increase the transfusion rate",
        "Ignore the symptoms",
        "Leave the patient unobserved"
      ],
      "answer": "A",
      "explanation": "A suspected transfusion reaction requires immediate cessation of the transfusion, assessment and urgent escalation."
    },
    {
      "question": "Which condition involves widespread activation of coagulation with consumption of platelets and clotting factors?",
      "options": [
        "Disseminated intravascular coagulation",
        "Iron deficiency anaemia",
        "Sickle cell trait",
        "Uncomplicated lymphadenopathy"
      ],
      "answer": "A",
      "explanation": "DIC causes widespread clotting activation and consumption of haemostatic components, producing both thrombosis and bleeding."
    }
  ]
};

lessonContent["Perioperative nursing"] = {
  "title": "Perioperative Nursing",
  "objectives": [
    "Explain the phases of perioperative nursing care.",
    "Describe preoperative assessment, preparation and patient education.",
    "Discuss the roles and responsibilities of the surgical team.",
    "Identify common anaesthetic, intraoperative and postoperative complications.",
    "Develop safe nursing interventions before, during and after surgery."
  ],
  "notes": [
    {
      "title": "1. Overview and phases of perioperative care",
      "content": "Perioperative nursing covers care before, during and after surgery. The preoperative phase begins when surgery is planned and ends when the patient is transferred to the operating room. The intraoperative phase begins on transfer to the operating room and continues until the patient enters the recovery area. The postoperative phase starts in the post-anaesthesia care unit (PACU) and continues through recovery and discharge. The nurse promotes safety, reduces anxiety, prevents complications, protects patient rights and supports recovery."
    },
    {
      "title": "2. Preoperative assessment",
      "content": "Preoperative assessment identifies risks that may affect anaesthesia, surgery and recovery. Obtain medical and surgical history, allergies, current medicines, previous anaesthetic reactions, bleeding history, chronic illnesses, smoking and alcohol use. Assess airway, cardiovascular and respiratory status, nutritional status, hydration, mobility, skin integrity and baseline vital signs. Review relevant investigations such as FBC, renal function, electrolytes, coagulation studies, ECG and imaging according to the procedure and patient risk. Identify anticoagulants, antiplatelets, insulin, steroids and other medicines requiring a specific perioperative plan. Report abnormal findings and ensure optimisation before surgery where possible."
    },
    {
      "title": "3. Informed consent and patient rights",
      "content": "Informed consent is a voluntary decision made by a patient with decision-making capacity after receiving adequate information about the proposed procedure, benefits, material risks, alternatives and consequences of refusing treatment. The responsible practitioner performing or proposing the procedure has the duty to explain it and obtain consent according to law and facility policy. The nurse may witness a signature where permitted but should not replace the clinician's explanation or pressure the patient to agree. Confirm identity, procedure and documentation, and raise concerns if the patient appears confused, coerced or uncertain. Consent must be handled according to applicable legal and institutional requirements, including special considerations for children and patients lacking capacity."
    },
    {
      "title": "4. Preoperative preparation",
      "content": "Preparation may include prescribed fasting, bathing or skin preparation, removal and safe storage of jewellery and valuables, changing into theatre clothing, baseline observations, medication administration and completion of the checklist. Fasting requirements depend on the type of food or fluid, anaesthetic plan, patient factors and local policy; follow the specific anaesthesia instructions rather than applying one rule to every patient. Confirm allergies, identity, procedure, surgical site marking and required investigations. Ensure the patient has passed urine or has a urinary catheter plan where appropriate. Provide psychological support and explain expected events, pain management, breathing exercises, coughing, mobilisation and recovery equipment."
    },
    {
      "title": "5. Surgical safety and operating-room responsibilities",
      "content": "The operating-room team includes surgeons, anaesthesia professionals, nurses and other trained personnel. Surgical safety processes include patient identity confirmation, procedure and site verification, surgical site marking where appropriate, a team time-out before incision and sign-out before leaving theatre. The circulating nurse coordinates activities outside the sterile field, documents care and helps maintain safety. The scrub nurse maintains the sterile field and handles sterile instruments. Both roles require vigilance for contamination, equipment problems, positioning injuries, specimen errors and count discrepancies. Surgical counts of instruments, needles and swabs must follow institutional policy. Report discrepancies immediately and do not assume that a count is correct without verification."
    },
    {
      "title": "6. Asepsis, infection prevention and surgical positioning",
      "content": "Surgical asepsis aims to prevent contamination of the operative field. Hand hygiene, appropriate surgical attire, sterile instruments, skin antisepsis and correct sterile technique are essential. Breaks in sterile technique must be recognised and corrected immediately. Positioning must provide surgical access while protecting breathing, circulation, nerves, skin and joints. Pressure points should be padded, limbs aligned and devices secured. Common positions include supine, prone, lateral and lithotomy. Complications may include nerve injury, pressure injury, impaired ventilation, venous stasis and musculoskeletal injury. Document positioning and protective measures."
    },
    {
      "title": "7. Anaesthesia and its complications",
      "content": "General anaesthesia produces unconsciousness and loss of protective reflexes; regional anaesthesia blocks sensation in a body region; local anaesthesia numbs a limited area; sedation reduces awareness and anxiety to varying degrees. Anaesthesia professionals monitor airway, ventilation, circulation, depth of anaesthesia and physiological response. Potential complications include airway obstruction, aspiration, hypotension, respiratory depression, postoperative nausea and vomiting, allergic reactions and malignant hyperthermia. Malignant hyperthermia is a rare, life-threatening hypermetabolic reaction associated with certain anaesthetic agents in susceptible individuals. Warning signs may include rapidly rising end-tidal carbon dioxide, muscle rigidity, tachycardia and hyperthermia, although temperature rise may be late. It requires immediate emergency treatment, including stopping triggering agents and administration of dantrolene under the emergency protocol."
    },
    {
      "title": "8. Immediate postoperative assessment",
      "content": "On arrival in PACU, prioritise airway, breathing and circulation. Assess respiratory rate, oxygenation, airway patency, level of consciousness, blood pressure, pulse, temperature, pain, nausea, wound dressing, drains, fluid balance and urine output where relevant. Compare findings with baseline and the expected procedure. Monitor for airway obstruction, respiratory depression, bleeding, shock, hypothermia and delayed emergence from anaesthesia. Maintain prescribed oxygen and monitoring, ensure safe positioning and escalate deterioration promptly. Use structured handover, including procedure, anaesthesia, allergies, medicines, blood loss, fluids, drains and concerns."
    },
    {
      "title": "9. Postoperative complications",
      "content": "Haemorrhage may present with tachycardia, hypotension, pallor, restlessness, increasing wound drainage or reduced urine output. Shock requires urgent recognition and treatment. Respiratory complications include atelectasis, pneumonia, aspiration and pulmonary embolism. Encourage deep breathing, coughing and early mobilisation when appropriate, and provide prescribed respiratory support. Venous thromboembolism risk is reduced through mobilisation, prescribed mechanical measures and pharmacological prophylaxis when indicated. Wound infection may present with redness, warmth, pain, swelling, purulent discharge or fever. Dehiscence is separation of wound edges; evisceration is protrusion of abdominal contents and is an emergency. Cover exposed organs with sterile saline-moistened dressings, do not attempt to push them back, and summon immediate surgical assistance."
    },
    {
      "title": "10. Pain management, wound care and discharge",
      "content": "Assess pain regularly using an appropriate scale and consider location, character, severity and effect on function. Administer prescribed analgesia and evaluate response and adverse effects. Multimodal pain management may combine different medicine classes and non-pharmacological approaches. Inspect wounds and drains, maintain aseptic dressing technique, record drainage and monitor for infection or bleeding. Encourage mobilisation, breathing exercises, nutrition and hydration according to the care plan. Before discharge, explain wound care, medication use, activity restrictions, follow-up, warning signs and whom to contact. Urgent warning signs include increasing breathlessness, chest pain, uncontrolled bleeding, fever with deterioration, calf swelling or pain, wound separation and persistent vomiting."
    },
    {
      "title": "11. Special considerations and ethical responsibilities",
      "content": "Perioperative care should be individualised for older adults, children, pregnant patients and people with diabetes, cardiovascular disease, renal impairment or disability. Assess risks of pressure injury, hypothermia, delirium, aspiration, medication interactions and delayed healing. Protect confidentiality, dignity, privacy and cultural needs. Respect the patient's autonomy and right to ask questions or refuse treatment. Maintain accurate documentation, safe handover and accountability for actions within professional scope. Escalate concerns early rather than relying on routine observation schedules when a patient is deteriorating."
    }
  ],
  "clinical": "Clinical application: A patient is scheduled for abdominal surgery. Before transfer, verify identity, procedure, consent documentation, allergies, fasting instructions, investigations, baseline observations and completion of the surgical checklist. Provide reassurance and explain postoperative breathing exercises and mobilisation. In PACU, a patient develops increasing restlessness, tachycardia, falling blood pressure and fresh wound drainage. Suspect haemorrhage and possible shock: assess ABCs, call for urgent assistance, monitor observations, maintain access and prepare for prescribed emergency management. If abdominal wound evisceration occurs, cover the exposed tissue with sterile saline-moistened dressings and obtain immediate surgical assistance.",
  "examPoints": [
    "Perioperative care has preoperative, intraoperative and postoperative phases.",
    "The preoperative assessment identifies risks before anaesthesia and surgery.",
    "Informed consent must be voluntary and based on adequate information.",
    "The clinician responsible for the procedure explains it and obtains consent according to policy.",
    "Confirm identity, procedure and surgical site before surgery.",
    "The surgical time-out is performed before incision.",
    "The circulating nurse works outside the sterile field; the scrub nurse maintains the sterile field.",
    "Maintain aseptic technique and correct breaks in sterility immediately.",
    "Positioning must protect nerves, skin, joints, breathing and circulation.",
    "Postoperative assessment prioritises airway, breathing and circulation.",
    "Tachycardia, hypotension and increasing wound drainage may indicate haemorrhage.",
    "Early mobilisation and prescribed prophylaxis help reduce venous thromboembolism risk.",
    "Evisceration requires sterile saline-moistened dressings and immediate surgical assistance.",
    "Malignant hyperthermia is an anaesthetic emergency requiring immediate treatment.",
    "Discharge education includes wound care, medicines, activity and warning signs."
  ],
  "questions": [
    {
      "question": "Which phase of perioperative care begins when the patient is transferred to the operating room?",
      "options": [
        "Preoperative phase",
        "Intraoperative phase",
        "Postoperative phase",
        "Rehabilitation phase only"
      ],
      "answer": "B",
      "explanation": "The intraoperative phase covers care from transfer to the operating room until transfer to the recovery area."
    },
    {
      "question": "Who is primarily responsible for explaining the proposed surgical procedure and obtaining informed consent?",
      "options": [
        "The practitioner performing or proposing the procedure",
        "The hospital cleaner",
        "The patient transporter",
        "Any visitor"
      ],
      "answer": "A",
      "explanation": "The responsible practitioner must explain the procedure, benefits, risks and alternatives and obtain valid consent according to policy."
    },
    {
      "question": "What is the purpose of the surgical time-out?",
      "options": [
        "Confirm patient, procedure and site before incision",
        "Replace all preoperative assessment",
        "Allow staff to leave theatre",
        "Determine the patient's discharge date"
      ],
      "answer": "A",
      "explanation": "The time-out is a team safety check immediately before incision to confirm essential details and reduce wrong-patient, wrong-site and wrong-procedure errors."
    },
    {
      "question": "Which assessment has the highest priority immediately after a patient arrives in PACU?",
      "options": [
        "Airway, breathing and circulation",
        "Hair and nail care",
        "Long-term dietary preferences",
        "Routine discharge paperwork"
      ],
      "answer": "A",
      "explanation": "Airway, breathing and circulation are immediate priorities after anaesthesia because airway obstruction and respiratory or cardiovascular compromise can be life-threatening."
    },
    {
      "question": "A postoperative patient has tachycardia, hypotension and increasing wound drainage. What should the nurse suspect?",
      "options": [
        "Haemorrhage",
        "Normal uncomplicated recovery",
        "Improved circulation",
        "Simple hunger"
      ],
      "answer": "A",
      "explanation": "These findings may indicate significant blood loss and shock and require immediate assessment and escalation."
    },
    {
      "question": "What is the appropriate immediate action if abdominal wound evisceration occurs?",
      "options": [
        "Cover exposed organs with sterile saline-moistened dressings and summon surgical help",
        "Push the organs back into the abdomen",
        "Apply dry cotton wool and discharge the patient",
        "Ask the patient to walk"
      ],
      "answer": "A",
      "explanation": "Evisceration is a surgical emergency. Protect exposed tissue with sterile saline-moistened dressings, avoid manipulation and obtain immediate surgical assistance."
    },
    {
      "question": "Which measure helps prevent postoperative venous thromboembolism?",
      "options": [
        "Early mobilisation and prescribed prophylaxis",
        "Prolonged unnecessary immobility",
        "Avoiding all leg movement",
        "Restricting all fluids in every patient"
      ],
      "answer": "A",
      "explanation": "Mobilisation and prescribed mechanical or pharmacological prophylaxis reduce venous stasis and thromboembolism risk."
    },
    {
      "question": "Which finding may be an early warning sign of malignant hyperthermia during anaesthesia?",
      "options": [
        "Rapidly rising end-tidal carbon dioxide",
        "Improved appetite",
        "Reduced hair growth",
        "Mild thirst alone"
      ],
      "answer": "A",
      "explanation": "A rapid rise in end-tidal carbon dioxide and muscle rigidity may occur early in malignant hyperthermia; urgent emergency treatment is required."
    }
  ]
};

Object.assign(lessonContent, pharmacologyLessons)
Object.assign(lessonContent, midwiferyLessons)
Object.assign(lessonContent, communityLessons)
Object.assign(lessonContent, mentalHealthLessons)

function App() {
  const [showExams, setShowExams] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)

  const openCourse = (course) => {
    setSelectedCourse(course)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goHome = () => {
    setSelectedUnit(null)
    setSelectedCourse(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (showExams) {
    return (
      <div className="app">
        <header className="navbar">
          <a className="brand" href="#" onClick={() => setShowExams(false)}>
            <span className="brand-icon">✚</span>
            <span>Study<span className="brand-green">Mate</span></span>
          </a>
          <button type="button" className="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(open => !open)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
          <nav className={mobileMenuOpen ? 'mobile-open' : ''}>
            <a href="#" onClick={() => { setMobileMenuOpen(false); setShowExams(false) }}>Home</a>
            <a href="#courses" onClick={() => { setMobileMenuOpen(false); setShowExams(false) }}>Courses</a>
          </nav>
        </header>
        <ExamCentre onHome={() => setShowExams(false)} />
      </div>
    )
  }

  if (selectedCourse && selectedUnit) {
    return (
      <div className="app">
        <header className="navbar">
          <a className="brand" href="#" onClick={goHome}>
            <span className="brand-icon">✚</span>
            <span>Study<span className="brand-green">Mate</span></span>
          </a>
          <button className="nav-button" onClick={() => setSelectedUnit(null)}>
            Course content ←
          </button>
        </header>

        <main className="lesson-page">
          <button className="back-link" onClick={() => setSelectedUnit(null)}>
            ← Back to course content
          </button>

          <div className="lesson-heading">
            <div className="eyebrow">{selectedCourse.title}</div>
            <h1>{selectedUnit}</h1>
            <p>Learn systematically, understand the concepts and prepare for your nursing examinations.</p>
          </div>

          {lessonContent[selectedUnit] ? (
            <>
              <section className="lesson-panel">
                <h2>Learning objectives</h2>
                <p>By the end of this unit, you should be able to:</p>
                <ul>
                  {lessonContent[selectedUnit].objectives.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </section>

              <section className="lesson-panel">
                <h2>Comprehensive study notes</h2>
                {lessonContent[selectedUnit].notes.map((item, index) => (
                  <div className="note-topic" key={index}>
                    <h3>{item.heading || item.title}</h3>
                    {item.content && <p>{item.content}</p>}
                    {item.body && <p>{item.body}</p>}
                    {item.points && (
                      <ul>
                        {item.points.map((point, pointIndex) => (
                          <li key={pointIndex}>{point}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>

              <section className="lesson-panel">
                <h2>Clinical application</h2>
                {Array.isArray(lessonContent[selectedUnit].clinical) ? (
                  lessonContent[selectedUnit].clinical.map((item, index) => (
                    typeof item === 'string' ? (
                      <p key={index}>{item}</p>
                    ) : (
                      <div className="note-topic" key={index}>
                        <h3>{item.heading}</h3>
                        {item.content && <p>{item.content}</p>}
                        {item.points && (
                          <ul>
                            {item.points.map((point, pointIndex) => (
                              <li key={pointIndex}>{point}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  ))
                ) : (
                  <p>{lessonContent[selectedUnit].clinical}</p>
                )}
              </section>

              <section className="lesson-panel">
                <h2>High-yield examination points</h2>
                <ul>
                  {lessonContent[selectedUnit].examPoints.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </section>

              <section className="lesson-panel">
                <h2>Practice questions</h2>
                <p>Choose an answer, then open the explanation to check your understanding.</p>
                {(lessonContent[selectedUnit].questions || lessonContent[selectedUnit].mcqs || []).map((question, index) => (
                  <div className="practice-question" key={index}>
                    <h3>{index + 1}. {question.question || question.q}</h3>
                    {Object.values(question.options).map((option, optionIndex) => (
                      <p className="question-option" key={optionIndex}>
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </p>
                    ))}
                    <details>
                      <summary>Reveal answer and explanation</summary>
                      {(() => {
                        const answerIndex = typeof question.answer === 'number'
                          ? question.answer
                          : String(question.answer).trim().toUpperCase().charCodeAt(0) - 65;
                        return (
                          <p><strong>
                            Correct answer: {String.fromCharCode(65 + answerIndex)}. {Object.values(question.options)[answerIndex]}
                          </strong></p>
                        );
                      })()}
                      <p>{question.explanation}</p>
                    </details>
                  </div>
                ))}
              </section>
            </>
          ) : (
            <>
              <section className="lesson-panel">
                <h2>Learning objectives</h2>
                <p>Learning objectives and detailed notes for this unit will be added as its lesson is developed.</p>
              </section>
              <section className="lesson-panel">
                <h2>Study notes</h2>
                <p className="coming-soon">This lesson is being prepared. Its full notes and revision materials are coming soon.</p>
              </section>
            </>
          )}

          <button className="primary-button lesson-back-button" onClick={() => setSelectedUnit(null)}>
            Return to course units →
          </button>
        </main>

        <footer>
          <a className="brand footer-brand" href="#" onClick={goHome}><span className="brand-icon">✚</span> Study<span className="brand-green">Mate</span></a>
          <p>Supporting nursing education in Kenya.</p>
          <span>© 2026 StudyMate. Learning made easier.</span>
        </footer>
      </div>
    )
  }

  if (selectedCourse) {
    return (
      <div className="app">
        <header className="navbar">
          <a className="brand" href="#" onClick={goHome}>
            <span className="brand-icon">✚</span>
            <span>Study<span className="brand-green">Mate</span></span>
          </a>
          <button className="nav-button" onClick={goHome}>All courses ←</button>
        </header>

        <main className="course-detail">
          <button className="back-link" onClick={goHome}>← Back to all courses</button>

          <div className="course-detail-hero">
            <div className="course-detail-icon">{selectedCourse.icon}</div>
            <div className="eyebrow">{selectedCourse.level}</div>
            <h1>{selectedCourse.title}</h1>
            <p>{selectedCourse.desc}</p>
            <span className="unit-count">{units[selectedCourse.title].length} learning units</span>
          </div>

          <section className="unit-section">
            <div className="eyebrow">YOUR LEARNING PATH</div>
            <h2>Course content</h2>
            <p className="unit-intro">Work through these units systematically, building your knowledge step by step.</p>

            <div className="unit-list">
              {units[selectedCourse.title].map((unit, index) => (
                <button
                  className="unit-card unit-clickable"
                  key={unit}
                  onClick={() => setSelectedUnit(unit)}
                >
                  <div className="unit-number">{String(index + 1).padStart(2, '0')}</div>
                  <div className="unit-info">
                    <h3>{unit}</h3>
                    <p>{lessonContent[unit] ? 'Study notes, clinical applications and practice questions available.' : 'Study notes and revision materials coming soon.'}</p>
                  </div>
                  <span className="unit-arrow">→</span>
                </button>
              ))}
            </div>
          </section>
        </main>

        <footer>
          <a className="brand footer-brand" href="#" onClick={goHome}><span className="brand-icon">✚</span> Study<span className="brand-green">Mate</span></a>
          <p>Supporting nursing education in Kenya.</p>
          <span>© 2026 StudyMate. Learning made easier.</span>
        </footer>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#">
          <span className="brand-icon">✚</span>
          <span>Study<span className="brand-green">Mate</span></span>
        </a>
        <button type="button" className="mobile-menu-toggle"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(open => !open)}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        <nav className={mobileMenuOpen ? 'mobile-open' : ''}>
          <a href="#courses" onClick={() => setMobileMenuOpen(false)}>Courses</a>
          <a href="#examinations" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); setShowExams(true) }}>Examinations</a>
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Study resources</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
        </nav>
        <a className="nav-button" href="#courses">Start learning <span>→</span></a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow"><span></span> BUILT FOR NURSING STUDENTS IN KENYA</div>
            <h1>Your nursing journey.<br /><span>Made easier.</span></h1>
            <p className="hero-text">
              Learn with confidence. Access organised nursing notes,
              practise exam questions and strengthen your clinical knowledge
              — all in one place.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#courses">Explore courses <span>→</span></a>
              <a className="secondary-button" href="#features">Discover resources</a>
            </div>
            <div className="hero-note">
              <span>✓</span> For certificate, diploma and degree nursing students
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card main-card">
              <div className="visual-top"><span>YOUR LEARNING SPACE</span><span className="live-dot"></span></div>
              <div className="visual-symbol">🩺</div>
              <h3>Learn. Practise. Excel.</h3>
              <p>Build knowledge for the classroom and the clinical setting.</p>
              <div className="progress-label"><span>Your learning journey</span><strong>Start today</strong></div>
              <div className="progress-track"><div></div></div>
              <div className="visual-bottom"><span>📚 Study resources</span><span>✍️ Practice quizzes</span></div>
            </div>
            <div className="floating-card float-one">📖 <span><strong>Study notes</strong><small>Learn at your pace</small></span></div>
            <div className="floating-card float-two">🎯 <span><strong>Exam practice</strong><small>Test your knowledge</small></span></div>
            <div className="decor decor-one"></div>
            <div className="decor decor-two"></div>
          </div>
        </section>

        <section className="trust-strip">
          <div><strong>01</strong><span>Learn systematically</span></div>
          <div><strong>02</strong><span>Practise confidently</span></div>
          <div><strong>03</strong><span>Grow clinically</span></div>
        </section>

        <section className="courses-section" id="courses">
          <div className="section-heading">
            <div>
              <div className="eyebrow">YOUR LEARNING STARTS HERE</div>
              <h2>Explore nursing subjects</h2>
              <p>Build a strong foundation across essential areas of nursing.</p>
            </div>
            <a className="text-link" href="#features">Explore resources →</a>
          </div>
          <div className="course-grid">
            {courses.map((course) => (
              <article className="course-card" key={course.title}>
                <div className="course-icon">{course.icon}</div>
                <div className="course-level">{course.level}</div>
                <h3>{course.title}</h3>
                <p>{course.desc}</p>
                <button className="course-open-button" onClick={() => openCourse(course)}>
                  Explore subject <span>→</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="eyebrow">MORE THAN JUST NOTES</div>
          <h2>Everything you need to study smarter.</h2>
          <div className="feature-grid">
            <div className="feature"><span>📚</span><h3>Structured study notes</h3><p>Clear, organised learning materials for your nursing subjects.</p></div>
            <div className="feature"><span>✍️</span><h3>Exam practice</h3><p>Multiple-choice questions, explanations and mock examinations.</p></div>
            <div className="feature"><span>🩹</span><h3>Clinical skills</h3><p>Strengthen your understanding of practical nursing procedures.</p></div>
          </div>
        </section>

        <section className="cta-section" id="about">
          <div>
            <div className="eyebrow">YOUR FUTURE IN NURSING STARTS HERE</div>
            <h2>Learn with purpose.<br />Care with confidence.</h2>
            <p>StudyMate is being built to support the next generation of nursing professionals in Kenya.</p>
          </div>
          <a href="#courses" className="primary-button">Start exploring →</a>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#"><span className="brand-icon">✚</span> Study<span className="brand-green">Mate</span></a>
        <p>Supporting nursing education in Kenya.</p>
        <span>© 2026 StudyMate. Learning made easier.</span>
      </footer>
    </div>
  )
}

export default App
